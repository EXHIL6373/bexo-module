import { Request, Response, NextFunction } from 'express';
import { collegeService } from './college.service';
import { sendSuccess } from '../../shared/utils/response';

export class CollegeController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const college = await collegeService.getMyCollege(req.collegeId!);
      return sendSuccess(res, college);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await collegeService.updateSettings(req.collegeId!, req.body, req.user!);
      return sendSuccess(res, updated, 'College settings updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getAgreement(req: Request, res: Response, next: NextFunction) {
    try {
      const agreement = await collegeService.getAgreement(req.collegeId!);
      return sendSuccess(res, agreement);
    } catch (error) {
      next(error);
    }
  }

  async getBilling(req: Request, res: Response, next: NextFunction) {
    try {
      const billing = await collegeService.getBilling(req.collegeId!);
      return sendSuccess(res, billing);
    } catch (error) {
      next(error);
    }
  }
}

export const collegeController = new CollegeController();
