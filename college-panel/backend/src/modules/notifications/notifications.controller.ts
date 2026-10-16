import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../shared/utils/response';

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await notificationsService.getNotifications(req.collegeId!);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAsRead(req.params.id as string, req.collegeId!);
      return sendSuccess(res, { read: true }, 'Notification marked as read.');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAllAsRead(req.collegeId!);
      return sendSuccess(res, { readAll: true }, 'All notifications marked as read.');
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await notificationsService.getAnnouncements(req.collegeId!);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await notificationsService.getTasks(req.collegeId!);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async toggleTask(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await notificationsService.toggleTask(req.params.id as string, req.collegeId!);
      return sendSuccess(res, updated, 'Task status updated.');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
