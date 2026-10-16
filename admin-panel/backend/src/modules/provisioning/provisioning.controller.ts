import { Request, Response, NextFunction } from 'express';
import { provisioningService } from './provisioning.service';
import { sendSuccess } from '../../shared/utils/response';

export class ProvisioningController {
  async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.collegeId as string | undefined;
      const list = await provisioningService.getJobs(collegeId);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await provisioningService.getJobById(req.params.id as string);
      return sendSuccess(res, job);
    } catch (error) {
      next(error);
    }
  }

  async triggerBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await provisioningService.triggerBatch(req.body, actor);
      return sendSuccess(res, created, 'Batch provisioning job triggered successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const provisioningController = new ProvisioningController();
