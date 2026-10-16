import { Request, Response, NextFunction } from 'express';
import { templatesService } from './templates.service';
import { sendSuccess } from '../../shared/utils/response';

export class TemplatesController {
  async getTemplates(_req: Request, res: Response, next: NextFunction) {
    try {
      const list = await templatesService.getTemplates();
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await templatesService.createTemplate(req.body, actor);
      return sendSuccess(res, created, 'Template created successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await templatesService.updateTemplate(req.params.id as string, req.body, actor);
      return sendSuccess(res, updated, 'Template updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      await templatesService.deleteTemplate(req.params.id as string, actor);
      return sendSuccess(res, { success: true }, 'Template removed.');
    } catch (error) {
      next(error);
    }
  }

  async togglePublish(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await templatesService.togglePublish(req.params.id as string, actor);
      return sendSuccess(res, updated, 'Template publication state toggled.');
    } catch (error) {
      next(error);
    }
  }

  async toggleFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await templatesService.toggleFeatured(req.params.id as string, actor);
      return sendSuccess(res, updated, 'Template featured flag toggled.');
    } catch (error) {
      next(error);
    }
  }
}

export const templatesController = new TemplatesController();
