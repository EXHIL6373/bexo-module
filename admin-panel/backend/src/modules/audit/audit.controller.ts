import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { sendSuccess } from '../../shared/utils/response';

export class AuditController {
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { entity, page, limit } = req.query as Record<string, string>;
      const list = await auditService.getAuditLogs(entity, Number(page) || 1, Number(limit) || 50);
      return sendSuccess(res, list, undefined, {
        total: list.length,
        page: Number(page) || 1,
        limit: Number(limit) || 50,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordLog(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await auditService.recordLog(req.body, actor);
      return sendSuccess(res, created, 'Audit record persisted successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
