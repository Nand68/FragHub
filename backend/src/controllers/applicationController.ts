import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Application, { ApplicationStatus } from '../models/Application';
import PlayerProfile from '../models/PlayerProfile';
import Scouting, { ScoutingStatus } from '../models/Scouting';
import Notification from '../models/Notification';
import Organization from '../models/Organization';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../socket';
import { producer } from '../kafka/kafkaProducer';

export const applyToScouting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user?.id });
    if (!profile) return next(new AppError('Player profile not found', 404));
    if (!profile.profile_completed) return next(new AppError('Complete your profile first', 400));
    if (profile.currentOrganization) return next(new AppError('You are already part of an organization', 400));

    await producer.send({
      topic: 'scouting-applications',
      messages: [
        {
          key: profile._id.toString(),
          value: JSON.stringify({
            scoutingId: req.params.scoutingId,
            playerId: profile._id,
          }),
        },
      ],
    });

    res.status(202).json({ success: true, message: 'Your application is being processed' });
  } catch (err) {
    next(err);
  }
};

export const withdrawApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (!profile) return next(new AppError('Player profile not found', 404));

    const application = await Application.findOne({ _id: req.params.applicationId, playerId: profile._id });
    if (!application) return next(new AppError('Application not found', 404));
    if (application.status !== ApplicationStatus.PENDING) return next(new AppError('Cannot withdraw this application', 400));

    application.status = ApplicationStatus.WITHDRAWN;
    await application.save();

    // Emit to org so their Applicants screen removes / updates the card
    const withdrawnScouting = await Scouting.findById(application.scoutingId);
    if (withdrawnScouting) {
      const org = await Organization.findById(withdrawnScouting.organizationId);
      if (org) emitToUser(String(org.userId), 'applicant:withdrawn', { applicationId: String(application._id) });
    }

    res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (!profile) return next(new AppError('Player profile not found', 404));

    const applications = await Application.find({ playerId: profile._id })
      .populate('scoutingId')
      .populate('organizationId', 'organization_name')
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

export const getScoutingApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scouting = await Scouting.findById(req.params.scoutingId);
    if (!scouting) return next(new AppError('Scouting not found', 404));

    const applications = await Application.find({ scoutingId: req.params.scoutingId })
      .populate({ path: 'playerId', populate: { path: 'userId', select: 'email' } })
      .sort({ appliedAt: -1 });

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

export const selectPlayer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const application = await Application.findById(req.params.applicationId).populate('scoutingId');
    if (!application) return next(new AppError('Application not found', 404));

    const scouting = application.scoutingId as any;
    if (scouting.selected_count >= scouting.players_required) return next(new AppError('All positions have been filled', 400));
    if (application.status !== ApplicationStatus.PENDING) return next(new AppError('This application cannot be selected', 400));

    const profile = await PlayerProfile.findById(application.playerId);
    if (!profile) return next(new AppError('Player profile not found', 404));
    if (profile.currentOrganization) return next(new AppError('Player is already part of another organization', 400));

    application.status = ApplicationStatus.SELECTED;
    await application.save();

    profile.currentOrganization = scouting.organizationId;
    await profile.save();

    scouting.selected_count += 1;
    if (scouting.selected_count >= scouting.players_required) scouting.scouting_status = ScoutingStatus.COMPLETED;
    await scouting.save();

    const notification = await Notification.create({
      userId: profile.userId,
      type: 'APPLICATION_SELECTED',
      message: 'Congratulations! You have been selected',
      relatedId: application._id,
    });

    // Emit to player: update their application card + notification + roster
    emitToUser(String(profile.userId), 'application:updated', {
      applicationId: String(application._id),
      status: 'SELECTED',
    });
    emitToUser(String(profile.userId), 'notification:new', notification);
    emitToUser(String(profile.userId), 'roster:updated', { action: 'add', player: profile });

    res.status(200).json({ success: true, message: 'Player selected successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectPlayer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return next(new AppError('Application not found', 404));
    if (application.status !== ApplicationStatus.PENDING) return next(new AppError('This application cannot be rejected', 400));

    application.status = ApplicationStatus.REJECTED;
    await application.save();

    const profile = await PlayerProfile.findById(application.playerId);
    if (profile) {
      const notification = await Notification.create({
        userId: profile.userId,
        type: 'APPLICATION_REJECTED',
        message: 'Your application has been rejected',
        relatedId: application._id,
      });
      // Emit to player: update their application card + notification
      emitToUser(String(profile.userId), 'application:updated', {
        applicationId: String(application._id),
        status: 'REJECTED',
      });
      emitToUser(String(profile.userId), 'notification:new', notification);
    }

    res.status(200).json({ success: true, message: 'Application rejected successfully' });
  } catch (error) {
    next(error);
  }
};
