import { Request, Response, NextFunction } from 'express';
import { approvalsService } from './approvals.service';
import { sendSuccess } from '../../shared/utils/response';

export class ApprovalsController {
  async getApprovals(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const list = await approvalsService.getApprovals(status);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async submitRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await approvalsService.submitRequest(req.body, actor);
      return sendSuccess(res, created, 'Operational request submitted successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async approveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { decisionReason } = req.body;
      const updated = await approvalsService.approveRequest(req.params.id as string, decisionReason, actor);
      return sendSuccess(res, updated, 'Operational request approved.');
    } catch (error) {
      next(error);
    }
  }

  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { decisionReason } = req.body;
      const updated = await approvalsService.rejectRequest(req.params.id as string, decisionReason, actor);
      return sendSuccess(res, updated, 'Operational request rejected.');
    } catch (error) {
      next(error);
    }
  }
}

export const approvalsController = new ApprovalsController();
