import { Request, Response, NextFunction } from 'express';
import { servicesService } from './services.service';
import { sendSuccess } from '../../shared/utils/response';

export class ServicesController {
  async getServices(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await servicesService.getServices();
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async toggleGlobalService(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await servicesService.toggleGlobalService(req.params.id as string, actor);
      return sendSuccess(res, updated, 'Global service status toggled.');
    } catch (error) {
      next(error);
    }
  }
}

export const servicesController = new ServicesController();
