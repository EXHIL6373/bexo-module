import { Request, Response, NextFunction } from 'express';
import { systemService } from './system.service';
import { sendSuccess } from '../../shared/utils/response';

export class SystemController {
  async getSystemHealth(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await systemService.getSystemHealthMetrics();
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  async getLiveness(_req: Request, res: Response, next: NextFunction) {
    try {
      const liveness = await systemService.getLivenessStatus();
      const statusCode = liveness.status === 'pass' ? 200 : 503;
      return res.status(statusCode).json(liveness);
    } catch (error) {
      next(error);
    }
  }
}

export const systemController = new SystemController();
