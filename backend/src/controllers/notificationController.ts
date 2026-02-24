import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.notificationId, userId: req.user!.id });
    if (!notification) {
      return res.status(200).json({ success: true, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany({ userId: req.user!.id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findOneAndDelete({ 
      _id: req.params.notificationId, 
      userId: req.user!.id 
    });

    if (!notification) {
      return res.status(200).json({ success: true, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getNotificationDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      userId: req.user!.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

