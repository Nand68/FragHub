import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Organization from '../models/Organization';
import PlayerProfile from '../models/PlayerProfile';
import Notification from '../models/Notification';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../socket';

export const createOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existingOrg = await Organization.findOne({ userId: req.user!.id });
    if (existingOrg) return next(new AppError('Organization already exists', 400));

    const organization = await Organization.create({ userId: req.user!.id, ...req.body });
    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const getOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization not found', 404));
    res.status(200).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization not found', 404));

    Object.assign(organization, req.body);
    await organization.save();
    res.status(200).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
};

export const getRoster = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization not found', 404));

    const players = await PlayerProfile.find({ currentOrganization: organization._id }).populate('userId', 'email');
    res.status(200).json({ success: true, data: players });
  } catch (error) {
    next(error);
  }
};

export const removePlayer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organization = await Organization.findOne({ userId: req.user!.id });
    if (!organization) return next(new AppError('Organization not found', 404));

    const player = await PlayerProfile.findOne({ _id: req.params.playerId, currentOrganization: organization._id });
    if (!player) return next(new AppError('Player not found in your roster', 404));

    player.currentOrganization = undefined;
    await player.save();

    const notification = await Notification.create({
      userId: player.userId,
      type: 'PLAYER_REMOVED',
      message: 'You have been removed from the organization',
      relatedId: organization._id,
    });

    // Emit to the player so their UI updates live
    emitToUser(String(player.userId), 'roster:updated', { action: 'remove', playerId: String(player._id) });
    emitToUser(String(player.userId), 'notification:new', notification);

    res.status(200).json({ success: true, message: 'Player removed successfully' });
  } catch (error) {
    next(error);
  }
};
