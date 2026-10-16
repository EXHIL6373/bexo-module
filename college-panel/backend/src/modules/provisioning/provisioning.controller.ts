import { Request, Response, NextFunction } from 'express';
import { provisioningService } from './provisioning.service';
import { sendSuccess } from '../../shared/utils/response';

export class ProvisioningController {
  async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const jobs = await provisioningService.getJobs(req.collegeId!);
      return sendSuccess(res, jobs);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await provisioningService.getJobById(req.params.id as string, req.collegeId!);
      return sendSuccess(res, job);
    } catch (error) {
      next(error);
    }
  }

  async triggerProvisioning(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentIds, serviceName } = req.body;
      const result = await provisioningService.triggerProvisioning(
        req.collegeId!,
        studentIds,
        serviceName,
        req.user!
      );
      return sendSuccess(res, result, 'Student provisioning executed.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async retryJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await provisioningService.retryJob(
        req.params.id as string,
        req.collegeId!,
        req.user!
      );
      return sendSuccess(res, result, 'Failed records retried.');
    } catch (error) {
      next(error);
    }
  }

  async getEntitlements(req: Request, res: Response, next: NextFunction) {
    try {
      const entitlements = await provisioningService.getEntitlements(req.collegeId!);
      return sendSuccess(res, entitlements);
    } catch (error) {
      next(error);
    }
  }
}

export const provisioningController = new ProvisioningController();
