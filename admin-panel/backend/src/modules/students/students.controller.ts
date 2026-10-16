import { Request, Response, NextFunction } from 'express';
import { studentsService } from './students.service';
import { sendSuccess } from '../../shared/utils/response';

export class StudentsController {
  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { collegeId, department, status, search, page, limit } = req.query as Record<string, string>;
      const list = await studentsService.getStudents({ collegeId, department, status, search });
      const total = list.length;
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;

      return sendSuccess(res, list, undefined, { total, page: pageNum, limit: limitNum });
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentsService.getStudentById(req.params.id as string);
      return sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async addStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const created = await studentsService.addStudent(req.body, actor);
      return sendSuccess(res, created, 'Student registered successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async revokeAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const { reason } = req.body;
      const updated = await studentsService.revokeAccess(req.params.id as string, reason, actor);
      return sendSuccess(res, updated, 'Student platform access revoked.');
    } catch (error) {
      next(error);
    }
  }

  async reactivateAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = {
        userId: req.user!.userId,
        name: req.user!.name || req.user!.email,
        role: req.user!.role,
        ip: req.ip || '127.0.0.1',
      };
      const updated = await studentsService.reactivateAccess(req.params.id as string, actor);
      return sendSuccess(res, updated, 'Student platform access reactivated.');
    } catch (error) {
      next(error);
    }
  }
}

export const studentsController = new StudentsController();
