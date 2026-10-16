import { repository } from '../../db/repository';
import { NotFoundError } from '../../shared/errors/AppError';
import { StudentFilters } from '../../db/repository/types';
import { mobileAppClient } from '../../integrations/mobileAppClient';
import { logger } from '../../shared/utils/logger';

export class StudentsService {
  async getStudents(filters?: StudentFilters) {
    return await repository.getAllStudents(filters);
  }

  async getStudentById(id: string) {
    const student = await repository.getStudentById(id);
    if (!student) throw new NotFoundError('Student not found.');
    return student;
  }

  async addStudent(studentData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    // Atomically check quota, check uniqueness, insert student, and update college quota in a single transaction
    const created = await repository.enrollStudentWithQuota(studentData, actor);

    // Trigger downstream Mobile App integration synchronization asynchronously
    mobileAppClient
      .syncStudentEntitlement({
        studentId: created.id,
        collegeId: created.collegeId,
        rollNumber: created.rollNumber,
        email: created.email,
        status: 'Active',
        modules: created.services || [],
      })
      .catch((err) => {
        logger.warn({ err: err.message, studentId: created.id }, 'Non-blocking downstream student sync notice');
      });

    return created;
  }

  async revokeAccess(id: string, reason: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const student = await repository.getStudentById(id);
    if (!student) throw new NotFoundError('Student not found.');

    const updated = await repository.revokeStudentAccess(id, reason);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REVOKE_STUDENT_ACCESS',
      entity: 'Student',
      entityId: student.id,
      entityName: student.name,
      ip: actor.ip,
      result: 'Success',
      reason,
      beforeState: { accessStatus: student.accessStatus },
      afterState: { accessStatus: 'Revoked' },
    });

    mobileAppClient
      .syncStudentEntitlement({
        studentId: student.id,
        collegeId: student.collegeId,
        rollNumber: student.rollNumber,
        email: student.email,
        status: 'Revoked',
        modules: [],
      })
      .catch((err) => {
        logger.warn({ err: err.message, studentId: student.id }, 'Non-blocking downstream student revocation notice');
      });

    return updated;
  }

  async reactivateAccess(id: string, actor: { userId: string; name: string; role: string; ip: string }) {
    const student = await repository.getStudentById(id);
    if (!student) throw new NotFoundError('Student not found.');

    const updated = await repository.reactivateStudentAccess(id);

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REACTIVATE_STUDENT_ACCESS',
      entity: 'Student',
      entityId: student.id,
      entityName: student.name,
      ip: actor.ip,
      result: 'Success',
      reason: 'Reactivated student access via corporate console',
      beforeState: { accessStatus: student.accessStatus },
      afterState: { accessStatus: 'Active' },
    });

    mobileAppClient
      .syncStudentEntitlement({
        studentId: student.id,
        collegeId: student.collegeId,
        rollNumber: student.rollNumber,
        email: student.email,
        status: 'Active',
        modules: student.services || [],
      })
      .catch((err) => {
        logger.warn({ err: err.message, studentId: student.id }, 'Non-blocking downstream student reactivation notice');
      });

    return updated;
  }
}

export const studentsService = new StudentsService();
