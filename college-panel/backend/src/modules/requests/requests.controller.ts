import { Request, Response, NextFunction } from 'express';
import { requestsService } from './requests.service';
import { sendSuccess } from '../../shared/utils/response';

export class RequestsController {
  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await requestsService.getRequests(req.collegeId!);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async submitRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await requestsService.submitRequest(req.collegeId!, req.body, req.user!);
      return sendSuccess(res, created, 'Operational request submitted to BEXO Administration.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const requestsController = new RequestsController();
