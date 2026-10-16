import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../shared/utils/response';

export class PaymentsController {
  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.collegeId as string | undefined;
      const list = await paymentsService.getPayments(collegeId);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await paymentsService.recordPayment(req.body, actor);
      return sendSuccess(res, created, 'Payment transaction recorded successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
