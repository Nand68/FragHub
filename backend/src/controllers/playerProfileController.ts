import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import PlayerProfile from '../models/PlayerProfile';
import Organization from '../models/Organization';
import Notification from '../models/Notification';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../socket';

export const getPlayerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findById(req.params.profileId)
      .populate('currentOrganization', 'organization_name');
    if (!profile) return next(new AppError('Player profile not found', 404));
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/** GET /player-profile/my-organization
 *  Returns { organization, teammates } for the logged-in player. */
export const getMyOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (!profile || !profile.currentOrganization) {
      return res.status(200).json({ success: true, data: null });
    }

    const organization = await Organization.findById(profile.currentOrganization);
    if (!organization) return res.status(200).json({ success: true, data: null });

    // All players in the same org (including self)
    const teammates = await PlayerProfile.find({ currentOrganization: organization._id });

    res.status(200).json({ success: true, data: { organization, teammates } });
  } catch (error) {
    next(error);
  }
};

/** DELETE /player-profile/my-organization
 *  Player voluntarily leaves their current organization. */
export const leaveOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (!profile) return next(new AppError('Player profile not found', 404));
    if (!profile.currentOrganization) return next(new AppError('You are not part of any organization', 400));

    const org = await Organization.findById(profile.currentOrganization);
    profile.currentOrganization = undefined;
    await profile.save();

    if (org) {
      const notification = await Notification.create({
        userId: org.userId,
        type: 'PLAYER_REMOVED',
        message: `A player has left your organization`,
        relatedId: profile._id,
      });
      // Notify org's dashboard live
      emitToUser(String(org.userId), 'roster:updated', { action: 'remove', playerId: String(profile._id) });
      emitToUser(String(org.userId), 'notification:new', notification.toObject());
    }

    res.status(200).json({ success: true, message: 'You have left the organization' });
  } catch (error) {
    next(error);
  }
};


export const createProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existingProfile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (existingProfile) return next(new AppError('Profile already exists', 400));

    const profile = await PlayerProfile.create({ userId: req.user!.id, ...req.body, profile_completed: true });
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id }).populate('currentOrganization', 'organization_name');
    if (!profile) return next(new AppError('Profile not found', 404));
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (!profile) return next(new AppError('Profile not found', 404));
    if (profile.currentOrganization) return next(new AppError('Cannot update profile while in an organization', 400));

    Object.assign(profile, req.body);
    await profile.save();
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await PlayerProfile.findOne({ userId: req.user!.id });
    if (!profile) return next(new AppError('Profile not found', 404));
    if (profile.currentOrganization) return next(new AppError('Cannot delete profile while in an organization', 400));

    await PlayerProfile.deleteOne({ userId: req.user!.id });
    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    next(error);
  }
};
