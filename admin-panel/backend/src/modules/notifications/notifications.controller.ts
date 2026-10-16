import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../shared/utils/response';

export class NotificationsController {
  async getNotifications(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await notificationsService.getNotifications();
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAsRead(req.params.id as string);
      return sendSuccess(res, result, 'Notification marked as read.');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAllAsRead();
      return sendSuccess(res, result, 'All notifications marked as read.');
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.deleteNotification(req.params.id as string);
      return sendSuccess(res, result, 'Notification dismissed.');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
