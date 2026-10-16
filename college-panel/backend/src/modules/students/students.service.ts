import crypto from 'node:crypto';
import { store, StudentFilters } from '../../db/store';
import { ForbiddenError, NotFoundError, ConflictError } from '../../shared/errors/AppError';

export class StudentsService {
  async getStudents(collegeId: string, filters: StudentFilters) {
    return store.getStudentsByCollege(collegeId, filters);
  }

  async getStudentById(id: string, collegeId: string) {
    // Check if student exists globally
    const student = await store.getStudentById(id);
    if (!student) {
      throw new NotFoundError('Student not found.');
    }

    // Principle 2: Cross-tenant isolation gate
    if (student.collegeId !== collegeId) {
      await store.createAuditLog({
        id: `aud-${Date.now()}`,
        collegeId,
        actorStaffId: 'sys-sec',
        actorName: 'Security Gate',
        actorRole: 'TENANT_ISOLATION',
        action: 'CROSS_TENANT_INSPECTION_ATTEMPT',
        entity: 'Student',
        entityId: id,
        entityName: student.name,
        ip: '127.0.0.1',
        result: 'Denied',
        reason: `College ${collegeId} attempted to access student of ${student.collegeId}`,
      });
      throw new ForbiddenError(
        '403 Forbidden: Institutional Access Denied or Cross-Tenant Boundary Violation.'
      );
    }

    return student;
  }

  async addStudent(collegeId: string, input: any, actor: any) {
    const college = await store.getCollegeById(collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const id = `stu-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const newStudent = {
      id,
      name: input.name,
      rollNumber: (input.rollNumber || '').trim().toUpperCase(),
      collegeId, // Overwritten by verified server identity
      collegeName: college.name,
      department: input.department,
      course: input.course || `${input.department} Program`,
      batch: input.batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
      email: (input.email || '').trim().toLowerCase(),
      phone: input.phone,
      accessStatus: input.accessStatus || 'Active',
      services: input.services || ['BEXO Portfolio', 'BEXO Templates'],
      entitlementId: `ent-${id}`,
      enrolledYear: input.enrolledYear || new Date().getFullYear(),
      resumeCount: 0,
      portfolioSubdomain: (input.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const actorInfo = {
      userId: actor?.userId || actor?.id || 'sys-actor',
      name: actor?.name || actor?.email || 'Institutional Staff',
      role: actor?.role || 'COLLEGE_STAFF',
      ip: actor?.ip || '127.0.0.1',
    };

    const created = await store.enrollStudentWithQuota(newStudent, actorInfo);
    return created;
  }

  async updateStudent(id: string, collegeId: string, updates: any, actor: any) {
    const student = await this.getStudentById(id, collegeId);

    const updated = await store.updateStudent(id, collegeId, updates);

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'UPDATE_STUDENT_PROFILE',
      entity: 'Student',
      entityId: id,
      entityName: student.name,
      ip: '127.0.0.1',
      result: 'Success',
      beforeState: student,
      afterState: updates,
    });

    return updated;
  }

  async revokeAccess(id: string, collegeId: string, reason: string, actor: any) {
    const student = await this.getStudentById(id, collegeId);

    const updated = await store.updateStudent(id, collegeId, { accessStatus: 'Revoked' });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'REVOKE_STUDENT_ACCESS',
      entity: 'Student',
      entityId: id,
      entityName: student.name,
      ip: '127.0.0.1',
      result: 'Success',
      reason,
    });

    return updated;
  }

  async reactivateAccess(id: string, collegeId: string, actor: any) {
    const student = await this.getStudentById(id, collegeId);

    const updated = await store.updateStudent(id, collegeId, { accessStatus: 'Active' });

    await store.createAuditLog({
      id: `aud-${Date.now()}`,
      collegeId,
      actorStaffId: actor.userId,
      actorName: actor.name || actor.email,
      actorRole: actor.role,
      action: 'REACTIVATE_STUDENT_ACCESS',
      entity: 'Student',
      entityId: id,
      entityName: student.name,
      ip: '127.0.0.1',
      result: 'Success',
    });

    return updated;
  }

  async bulkImport(collegeId: string, rawStudents: any[], actor: any) {
    const actorInfo = {
      userId: actor?.userId || actor?.id || 'sys-actor',
      name: actor?.name || actor?.email || 'Institutional Staff',
      role: actor?.role || 'COLLEGE_STAFF',
      ip: actor?.ip || '127.0.0.1',
    };

    const result = await store.bulkImportStudentsWithQuota(collegeId, rawStudents, actorInfo);

    return {
      importedCount: result.insertedStudents.length,
      skippedCount: result.errors.length,
      errors: result.errors,
      job: result.job,
    };
  }
}

export const studentsService = new StudentsService();
