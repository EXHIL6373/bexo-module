import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../shared/utils/response';

export class UsersController {
  async getStaffUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const collegeId = req.query.collegeId as string | undefined;
      const list = await usersService.getStaffUsers(collegeId);
      return sendSuccess(res, list);
    } catch (error) {
      next(error);
    }
  }

  async addStaffUser(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await usersService.addStaffUser(req.body, actor);
      return sendSuccess(res, created, 'Staff user created successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStaffUser(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await usersService.updateStaffUser(req.params.id as string, req.body, actor);
      return sendSuccess(res, updated, 'Staff user profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteStaffUser(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      await usersService.deleteStaffUser(req.params.id as string, actor);
      return sendSuccess(res, { success: true }, 'Staff user revoked.');
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
