import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Scouting, { ScoutingStatus } from '../models/Scouting';
import Organization from '../models/Organization';
import PlayerProfile from '../models/PlayerProfile';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../socket';

export const createScouting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization profile not found', 404));

    const activeScouting = await Scouting.findOne({ organizationId: organization._id, scouting_status: ScoutingStatus.ACTIVE });
    if (activeScouting) return next(new AppError('You already have an active scouting', 400));

    const scouting = await Scouting.create({ organizationId: organization._id, ...req.body });

    // Fan-out: emit scouting:new to all player users (background, non-blocking)
    // Do NOT populate - p.userId must stay as raw ObjectId so String(p.userId) gives the correct room ID
    PlayerProfile.find({}, 'userId').then((players) => {
      const payload = { ...scouting.toObject(), organizationId: { _id: organization._id, organization_name: organization.organization_name, country: organization.country } };
      players.forEach((p) => {
        emitToUser(String(p.userId), 'scouting:new', payload);
      });
    }).catch(() => {/* ignore fan-out errors */ });

    res.status(201).json({ success: true, data: scouting });
  } catch (error) {
    next(error);
  }
};

export const getScouting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scouting = await Scouting.findById(req.params.scoutingId).populate('organizationId', 'organization_name country');
    if (!scouting) return next(new AppError('Scouting not found', 404));
    res.status(200).json({ success: true, data: scouting });
  } catch (error) {
    next(error);
  }
};

export const getMyActiveScouting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization profile not found', 404));

    const scouting = await Scouting.findOne({ organizationId: organization._id, scouting_status: ScoutingStatus.ACTIVE });
    res.status(200).json({ success: true, data: scouting });
  } catch (error) {
    next(error);
  }
};

export const updateScouting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization profile not found', 404));

    const scouting = await Scouting.findOne({ _id: req.params.scoutingId, organizationId: organization._id });
    if (!scouting) return next(new AppError('Scouting not found', 404));
    if (scouting.scouting_status !== ScoutingStatus.ACTIVE) return next(new AppError('Cannot update inactive scouting', 400));

    Object.assign(scouting, req.body);
    await scouting.save();
    res.status(200).json({ success: true, data: scouting });
  } catch (error) {
    next(error);
  }
};

export const cancelScouting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization profile not found', 404));

    const scouting = await Scouting.findOne({ _id: req.params.scoutingId, organizationId: organization._id });
    if (!scouting) return next(new AppError('Scouting not found', 404));

    scouting.scouting_status = ScoutingStatus.CANCELLED;
    await scouting.save();
    res.status(200).json({ success: true, message: 'Scouting cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

export const listActiveScoutings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query: any = { scouting_status: ScoutingStatus.ACTIVE };
    if (req.query.country) query.country = req.query.country;
    if (req.query.salary_type) query.salary_type = req.query.salary_type;

    const scoutings = await Scouting.find(query).populate('organizationId', 'organization_name country').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: scoutings });
  } catch (error) {
    next(error);
  }
};
