import { Request, Response, NextFunction } from 'express';
import { studentsService } from './students.service';
import { sendSuccess } from '../../shared/utils/response';

export class StudentsController {
  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { students, total } = await studentsService.getStudents(req.collegeId!, req.query);
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : students.length;
      return sendSuccess(res, students, undefined, { total, page, limit });
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentsService.getStudentById(req.params.id as string, req.collegeId!);
      return sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async addStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await studentsService.addStudent(req.collegeId!, req.body, req.user!);
      return sendSuccess(res, student, 'Student enrolled successfully.', undefined, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await studentsService.updateStudent(
        req.params.id as string,
        req.collegeId!,
        req.body,
        req.user!
      );
      return sendSuccess(res, updated, 'Student updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async revokeAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const updated = await studentsService.revokeAccess(
        req.params.id as string,
        req.collegeId!,
        reason,
        req.user!
      );
      return sendSuccess(res, updated, 'Student service access revoked.');
    } catch (error) {
      next(error);
    }
  }

  async reactivateAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await studentsService.reactivateAccess(
        req.params.id as string,
        req.collegeId!,
        req.user!
      );
      return sendSuccess(res, updated, 'Student service access restored.');
    } catch (error) {
      next(error);
    }
  }

  async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await studentsService.bulkImport(req.collegeId!, req.body.students, req.user!);
      return sendSuccess(res, result, 'Bulk student import processed.');
    } catch (error) {
      next(error);
    }
  }
}

export const studentsController = new StudentsController();
