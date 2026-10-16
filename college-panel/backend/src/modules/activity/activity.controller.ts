import { Request, Response, NextFunction } from 'express';
import { activityService } from './activity.service';
import { sendSuccess } from '../../shared/utils/response';

export class ActivityController {
  async getActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await activityService.getActivityLogs(req.collegeId!);
      return sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const type = (req.query.type as 'students' | 'provisioning' | 'entitlements') || 'students';
      const result = await activityService.exportReport(req.collegeId!, type);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();
