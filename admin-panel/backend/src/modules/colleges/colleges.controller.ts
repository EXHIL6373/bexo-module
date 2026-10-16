import { Request, Response, NextFunction } from 'express';
import { collegesService } from './colleges.service';
import { sendSuccess } from '../../shared/utils/response';

export class CollegesController {
  async getColleges(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, type, page, limit } = req.query as Record<string, string>;
      const list = await collegesService.getColleges({ search, status, type });
      const total = list.length;
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;

      return sendSuccess(res, list, undefined, { total, page: pageNum, limit: limitNum });
    } catch (error) {
      next(error);
    }
  }

  async getCollegeById(req: Request, res: Response, next: NextFunction) {
    try {
      const college = await collegesService.getCollegeById(req.params.id as string);
      return sendSuccess(res, college);
    } catch (error) {
      next(error);
    }
  }

  async createCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await collegesService.createCollege(req.body, actor);
      return sendSuccess(res, created, 'College onboarded successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await collegesService.updateCollege(req.params.id as string, req.body, actor);
      return sendSuccess(res, updated, 'College profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async suspendCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { reason } = req.body;
      const updated = await collegesService.suspendCollege(req.params.id as string, reason, actor);
      return sendSuccess(res, updated, 'College suspended successfully.');
    } catch (error) {
      next(error);
    }
  }

  async reactivateCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { reason } = req.body || {};
      const updated = await collegesService.reactivateCollege(req.params.id as string, reason, actor);
      return sendSuccess(res, updated, 'College reactivated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async updateQuota(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const allocatedVal = req.body.allocated !== undefined ? req.body.allocated : req.body.quotaAllocated;
      const { reason } = req.body;
      const historyEntry = await collegesService.updateQuota(
        req.params.id as string,
        Number(allocatedVal),
        reason,
        actor
      );
      return sendSuccess(res, historyEntry, 'Institutional quota adjusted successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getQuotaHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = (req.params.id as string) || (req.query.collegeId as string);
      const history = await collegesService.getQuotaHistory(collegeId);
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  async toggleService(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { enabled } = req.body;
      const updated = await collegesService.toggleCollegeService(
        req.params.id as string,
        req.params.serviceId as string,
        enabled,
        actor
      );
      return sendSuccess(res, updated, 'Institutional service state updated.');
    } catch (error) {
      next(error);
    }
  }
}

export const collegesController = new CollegesController();
