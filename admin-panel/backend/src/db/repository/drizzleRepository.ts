import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../client';
import * as schema from '../schema';
import { AdminRepository, CollegeFilters, StudentFilters } from './types';
import { NotFoundError, ConflictError, QuotaExceededError, ValidationError } from '../../shared/errors/AppError';

function toDate(val: any): Date | undefined {
  if (val === undefined || val === null) return undefined;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export class DrizzleRepository implements AdminRepository {
  private normalizeCollege(c: any) {
    if (!c) return null;
    const allocated = c.quotaAllocated ?? c.quota_allocated ?? c.quota?.allocated ?? 0;
    const used = c.quotaUsed ?? c.quota_used ?? c.quota?.used ?? 0;
    const warningThreshold = c.warningThreshold ?? c.warning_threshold ?? c.quota?.warningThreshold ?? 80;
    const criticalThreshold = c.criticalThreshold ?? c.critical_threshold ?? c.quota?.criticalThreshold ?? 95;
    const departmentLimits = c.departmentLimits ?? c.department_limits ?? c.quota?.departmentLimits ?? {};

    return {
      ...c,
      quotaAllocated: allocated,
      quotaUsed: used,
      warningThreshold,
      criticalThreshold,
      departmentLimits,
      quota: {
        allocated,
        used,
        warningThreshold,
        criticalThreshold,
        departmentLimits,
      },
      services: c.services || [],
      agreement: c.agreement || {},
    };
  }

  // --- STAFF USERS ---
  async getStaffByEmail(email: string) {
    const rows = await db
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.email, email.trim().toLowerCase()))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getStaffById(id: string) {
    const rows = await db
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getAllStaffUsers(collegeId?: string) {
    let query = db.select().from(schema.staffUsers);
    if (collegeId) {
      return await query
        .where(eq(schema.staffUsers.collegeId, collegeId))
        .orderBy(desc(schema.staffUsers.createdAt));
    }
    return await query.orderBy(desc(schema.staffUsers.createdAt));
  }

  async createStaffUser(user: any) {
    const values = {
      ...user,
      id: user.id || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: user.email.trim().toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.insert(schema.staffUsers).values(values).returning();
    return res[0];
  }

  async updateStaffUser(id: string, updates: any) {
    const values: any = { ...updates, updatedAt: new Date() };
    const res = await db
      .update(schema.staffUsers)
      .set(values)
      .where(eq(schema.staffUsers.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Staff user not found.');
    return res[0];
  }

  async deleteStaffUser(id: string) {
    const res = await db.delete(schema.staffUsers).where(eq(schema.staffUsers.id, id)).returning();
    if (res.length === 0) throw new NotFoundError('Staff user not found.');
  }

  async updateLastLogin(userId: string) {
    await db
      .update(schema.staffUsers)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.staffUsers.id, userId));
  }

  async bumpSessionVersion(userId: string): Promise<number> {
    const current = await this.getStaffById(userId);
    if (!current) throw new NotFoundError('User not found.');
    const nextVersion = (current.sessionVersion || 1) + 1;
    await db
      .update(schema.staffUsers)
      .set({ sessionVersion: nextVersion, updatedAt: new Date() })
      .where(eq(schema.staffUsers.id, userId));
    return nextVersion;
  }

  // --- SESSIONS ---
  async createSession(session: any) {
    await db.insert(schema.sessions).values({
      ...session,
      id: session.id || `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
    });
  }

  async getSessionByTokenHash(tokenHash: string) {
    const rows = await db
      .select()
      .from(schema.sessions)
      .where(and(eq(schema.sessions.tokenHash, tokenHash), eq(schema.sessions.isRevoked, false)))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async revokeSession(tokenHash: string) {
    await db
      .update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.tokenHash, tokenHash));
  }

  async revokeAllUserSessions(userId: string) {
    await db
      .update(schema.sessions)
      .set({ isRevoked: true })
      .where(eq(schema.sessions.userId, userId));
  }

  // --- INVITATIONS ---
  async getInvitationById(id: string) {
    const rows = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getInvitationByTokenHash(tokenHash: string) {
    const rows = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.tokenHash, tokenHash))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createInvitation(invite: any) {
    const values = {
      ...invite,
      id: invite.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invitedAt: toDate(invite.invitedAt) || new Date(),
      expiresAt: toDate(invite.expiresAt) || new Date(Date.now() + 7 * 86400000),
    };
    const res = await db.insert(schema.invitations).values(values).returning();
    return res[0];
  }

  async updateInvitation(id: string, updates: any) {
    const values: any = { ...updates };
    if (values.expiresAt) values.expiresAt = toDate(values.expiresAt);
    if (values.acceptedAt) values.acceptedAt = toDate(values.acceptedAt);
    if (values.revokedAt) values.revokedAt = toDate(values.revokedAt);

    const res = await db
      .update(schema.invitations)
      .set(values)
      .where(eq(schema.invitations.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Invitation not found.');
    return res[0];
  }

  async consumeInvitationAndActivateUser(tokenHash: string, passwordHash: string): Promise<{ user: any }> {
    return await db.transaction(async (tx) => {
      const invites = await tx
        .select()
        .from(schema.invitations)
        .where(
          and(
            eq(schema.invitations.tokenHash, tokenHash),
            eq(schema.invitations.status, 'INVITED')
          )
        )
        .for('update')
        .limit(1);

      if (invites.length === 0) {
        throw new ValidationError('Invalid, expired, or already consumed invitation token.');
      }

      const invite = invites[0];
      if (new Date(invite.expiresAt).getTime() < Date.now()) {
        throw new ValidationError('Invitation token has expired.');
      }

      await tx
        .update(schema.invitations)
        .set({ status: 'ACTIVE', acceptedAt: new Date() })
        .where(eq(schema.invitations.id, invite.id));

      const existingUsers = await tx
        .select()
        .from(schema.staffUsers)
        .where(eq(schema.staffUsers.email, invite.email.trim().toLowerCase()))
        .for('update')
        .limit(1);

      let user: any;
      if (existingUsers.length > 0) {
        const u = existingUsers[0];
        const nextVer = (u.sessionVersion || 1) + 1;
        const updated = await tx
          .update(schema.staffUsers)
          .set({
            passwordHash,
            isActive: true,
            accountStatus: 'ACTIVE',
            name: invite.fullName || u.name,
            role: invite.role || u.role,
            designation: invite.designation || u.designation,
            sessionVersion: nextVer,
            updatedAt: new Date(),
          })
          .where(eq(schema.staffUsers.id, u.id))
          .returning();
        user = updated[0];
      } else {
        const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const created = await tx
          .insert(schema.staffUsers)
          .values({
            id: userId,
            name: invite.fullName,
            email: invite.email.trim().toLowerCase(),
            phone: invite.phone,
            role: invite.role,
            collegeId: invite.collegeId || null,
            collegeName: invite.collegeName || null,
            designation: invite.designation,
            passwordHash,
            isActive: true,
            accountStatus: 'ACTIVE',
            sessionVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        user = created[0];
      }

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser };
    });
  }

  // --- PASSWORD RESETS ---
  async createPasswordResetToken(reset: any) {
    const values = {
      ...reset,
      id: reset.id || `prt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      expiresAt: toDate(reset.expiresAt) || new Date(Date.now() + 3600000),
    };
    const res = await db.insert(schema.passwordResetTokens).values(values).returning();
    return res[0];
  }

  async getResetTokenByHash(tokenHash: string) {
    const rows = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.tokenHash, tokenHash))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async markResetTokenUsed(id: string) {
    await db
      .update(schema.passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(schema.passwordResetTokens.id, id));
  }

  async consumeResetTokenAndSetPassword(tokenHash: string, newPasswordHash: string): Promise<{ success: boolean; email: string }> {
    return await db.transaction(async (tx) => {
      const tokens = await tx
        .select()
        .from(schema.passwordResetTokens)
        .where(
          and(
            eq(schema.passwordResetTokens.tokenHash, tokenHash),
            eq(schema.passwordResetTokens.isUsed, false)
          )
        )
        .for('update')
        .limit(1);

      if (tokens.length === 0) {
        throw new ValidationError('Invalid, expired, or already used password reset token.');
      }

      const record = tokens[0];
      if (new Date(record.expiresAt).getTime() < Date.now()) {
        throw new ValidationError('Password reset token has expired.');
      }

      await tx
        .update(schema.passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(schema.passwordResetTokens.id, record.id));

      const userRows = await tx
        .select()
        .from(schema.staffUsers)
        .where(eq(schema.staffUsers.id, record.userId))
        .for('update')
        .limit(1);

      if (userRows.length === 0) {
        throw new NotFoundError('Associated staff user not found.');
      }

      const user = userRows[0];
      const nextVersion = (user.sessionVersion || 1) + 1;

      await tx
        .update(schema.staffUsers)
        .set({
          passwordHash: newPasswordHash,
          sessionVersion: nextVersion,
          updatedAt: new Date(),
        })
        .where(eq(schema.staffUsers.id, user.id));

      await tx
        .update(schema.sessions)
        .set({ isRevoked: true })
        .where(eq(schema.sessions.userId, user.id));

      return { success: true, email: user.email };
    });
  }

  // --- COLLEGES ---
  async getAllColleges(filters?: CollegeFilters) {
    const conditions: any[] = [];
    if (filters?.search) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          ilike(schema.colleges.name, term),
          ilike(schema.colleges.code, term),
          ilike(schema.colleges.city, term)
        )
      );
    }
    if (filters?.status) {
      conditions.push(eq(schema.colleges.status, filters.status));
    }
    if (filters?.type) {
      conditions.push(eq(schema.colleges.type, filters.type));
    }

    let query: any = db.select().from(schema.colleges);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(schema.colleges.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.page && filters?.limit) {
      query = query.offset((filters.page - 1) * filters.limit);
    }

    const rows = await query;
    return rows.map((c: any) => this.normalizeCollege(c));
  }

  async getCollegeById(id: string) {
    const rows = await db.select().from(schema.colleges).where(eq(schema.colleges.id, id)).limit(1);
    return rows.length > 0 ? this.normalizeCollege(rows[0]) : null;
  }

  async getCollegeByCode(code: string) {
    const rows = await db
      .select()
      .from(schema.colleges)
      .where(eq(schema.colleges.code, code.trim().toUpperCase()))
      .limit(1);
    return rows.length > 0 ? this.normalizeCollege(rows[0]) : null;
  }

  async getCollegeBySlug(slug: string) {
    const rows = await db
      .select()
      .from(schema.colleges)
      .where(eq(schema.colleges.slug, slug.trim().toLowerCase()))
      .limit(1);
    return rows.length > 0 ? this.normalizeCollege(rows[0]) : null;
  }

  async createCollege(college: any) {
    const id = college.id || `clg-${Date.now().toString(36)}`;
    const allocated = college.quota?.allocated ?? college.quotaAllocated ?? 1000;
    const used = college.quota?.used ?? college.quotaUsed ?? 0;
    const warning = college.quota?.warningThreshold ?? college.warningThreshold ?? 80;
    const critical = college.quota?.criticalThreshold ?? college.criticalThreshold ?? 95;
    const deptLimits = college.quota?.departmentLimits ?? college.departmentLimits ?? {};

    const values = {
      ...college,
      id,
      code: college.code.trim().toUpperCase(),
      slug: college.slug ? college.slug.trim().toLowerCase() : id,
      quotaAllocated: allocated,
      quotaUsed: used,
      warningThreshold: warning,
      criticalThreshold: critical,
      departmentLimits: deptLimits,
      status: college.status || 'Active',
      dashboardAccess: college.dashboardAccess ?? true,
      services: college.services || [],
      agreement: college.agreement || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    };

    const res = await db.insert(schema.colleges).values(values).returning();
    return this.normalizeCollege(res[0]);
  }

  async updateCollege(id: string, updates: any) {
    const values: any = { ...updates, updatedAt: new Date() };
    if (values.quota) {
      if (values.quota.allocated !== undefined) values.quotaAllocated = values.quota.allocated;
      if (values.quota.used !== undefined) values.quotaUsed = values.quota.used;
      if (values.quota.warningThreshold !== undefined) values.warningThreshold = values.quota.warningThreshold;
      if (values.quota.criticalThreshold !== undefined) values.criticalThreshold = values.quota.criticalThreshold;
      if (values.quota.departmentLimits !== undefined) values.departmentLimits = values.quota.departmentLimits;
      delete values.quota;
    }
    if (values.suspendedAt) values.suspendedAt = toDate(values.suspendedAt);
    if (values.reactivatedAt) values.reactivatedAt = toDate(values.reactivatedAt);
    if (values.lastActivityAt) values.lastActivityAt = toDate(values.lastActivityAt);

    const res = await db
      .update(schema.colleges)
      .set(values)
      .where(eq(schema.colleges.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('College not found.');
    return this.normalizeCollege(res[0]);
  }

  async suspendCollege(id: string, reason: string) {
    return await this.updateCollege(id, {
      status: 'Suspended',
      dashboardAccess: false,
      suspensionReason: reason,
      suspendedAt: new Date(),
    });
  }

  async reactivateCollege(id: string, reason?: string) {
    return await this.updateCollege(id, {
      status: 'Active',
      dashboardAccess: true,
      suspensionReason: null,
      reactivatedAt: new Date(),
      lastActivityAt: new Date(),
    });
  }

  async updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string) {
    return await db.transaction(async (tx) => {
      const current = await tx
        .select()
        .from(schema.colleges)
        .where(eq(schema.colleges.id, collegeId))
        .for('update')
        .limit(1);

      if (current.length === 0) throw new NotFoundError('College not found.');
      const college = current[0];
      const prevAllocated = college.quotaAllocated ?? 0;
      const currentUsed = college.quotaUsed ?? 0;

      if (newAllocated < currentUsed) {
        throw new ValidationError(
          `New quota (${newAllocated}) cannot be lower than currently utilized quota (${currentUsed}).`
        );
      }

      await tx
        .update(schema.colleges)
        .set({ quotaAllocated: newAllocated, updatedAt: new Date() })
        .where(eq(schema.colleges.id, collegeId));

      const entryId = `qh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const historyRes = await tx
        .insert(schema.quotaHistory)
        .values({
          id: entryId,
          collegeId,
          timestamp: new Date(),
          adminName,
          previousAllocated: prevAllocated,
          newAllocated,
          reason,
        })
        .returning();

      return historyRes[0];
    });
  }

  async getQuotaHistory(collegeId?: string) {
    let query = db.select().from(schema.quotaHistory);
    if (collegeId) {
      return await query
        .where(eq(schema.quotaHistory.collegeId, collegeId))
        .orderBy(desc(schema.quotaHistory.timestamp));
    }
    return await query.orderBy(desc(schema.quotaHistory.timestamp));
  }

  async toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean) {
    const college = await this.getCollegeById(collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const currentServices: any[] = college.services || [];
    const existingIndex = currentServices.findIndex((s) => s.serviceId === serviceId);

    let updatedServices: any[];
    if (existingIndex >= 0) {
      updatedServices = currentServices.map((s, idx) =>
        idx === existingIndex
          ? {
              ...s,
              isEnabled: enabled,
              activatedAt: enabled ? new Date().toISOString() : s.activatedAt,
            }
          : s
      );
    } else {
      updatedServices = [
        ...currentServices,
        {
          serviceId,
          name: serviceId,
          isEnabled: enabled,
          activatedAt: new Date().toISOString(),
          studentsUsing: 0,
          planLevel: 'Enterprise',
        },
      ];
    }

    return await this.updateCollege(collegeId, { services: updatedServices });
  }

  // --- STUDENTS ---
  async getAllStudents(filters?: StudentFilters) {
    const conditions: any[] = [];
    if (filters?.collegeId) {
      conditions.push(eq(schema.students.collegeId, filters.collegeId));
    }
    if (filters?.department) {
      conditions.push(ilike(schema.students.department, filters.department.trim()));
    }
    if (filters?.status) {
      conditions.push(eq(schema.students.accessStatus, filters.status));
    }
    if (filters?.search) {
      const term = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        or(
          ilike(schema.students.name, term),
          ilike(schema.students.rollNumber, term),
          ilike(schema.students.email, term)
        )
      );
    }

    let query: any = db.select().from(schema.students);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    query = query.orderBy(desc(schema.students.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.page && filters?.limit) {
      query = query.offset((filters.page - 1) * filters.limit);
    }

    return await query;
  }

  async getStudentById(id: string) {
    const rows = await db.select().from(schema.students).where(eq(schema.students.id, id)).limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getStudentByRoll(collegeId: string, rollNumber: string) {
    const rows = await db
      .select()
      .from(schema.students)
      .where(
        and(
          eq(schema.students.collegeId, collegeId),
          eq(schema.students.rollNumber, rollNumber.trim().toUpperCase())
        )
      )
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createStudent(student: any) {
    const id = student.id || `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const values = {
      ...student,
      id,
      rollNumber: student.rollNumber.trim().toUpperCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    };
    const res = await db.insert(schema.students).values(values).returning();
    return res[0];
  }

  async enrollStudentWithQuota(
    studentData: any,
    actor: { userId: string; name: string; role: string; ip: string }
  ) {
    return await db.transaction(async (tx) => {
      const collegeRows = await tx
        .select()
        .from(schema.colleges)
        .where(eq(schema.colleges.id, studentData.collegeId))
        .for('update')
        .limit(1);

      if (collegeRows.length === 0) {
        throw new NotFoundError(`College '${studentData.collegeId}' does not exist.`);
      }

      const college = collegeRows[0];
      if (college.status !== 'Active') {
        throw new ConflictError(`Cannot enroll student: College ${college.name} is currently ${college.status}.`);
      }

      const allocated = college.quotaAllocated ?? 0;
      const used = college.quotaUsed ?? 0;
      if (used >= allocated) {
        throw new QuotaExceededError(
          `Institutional seat quota limit reached (${used}/${allocated}) for ${college.name}. Request a quota expansion.`
        );
      }

      const existingStudent = await tx
        .select()
        .from(schema.students)
        .where(
          and(
            eq(schema.students.collegeId, studentData.collegeId),
            eq(schema.students.rollNumber, studentData.rollNumber.trim().toUpperCase())
          )
        )
        .limit(1);

      if (existingStudent.length > 0) {
        throw new ConflictError(
          `Student with roll number '${studentData.rollNumber}' is already registered in ${college.name}.`
        );
      }

      const studentId = studentData.id || `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const studentValues = {
        ...studentData,
        id: studentId,
        collegeName: college.name,
        rollNumber: studentData.rollNumber.trim().toUpperCase(),
        accessStatus: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      };
      const insertedStudents = await tx.insert(schema.students).values(studentValues).returning();
      const createdStudent = insertedStudents[0];

      await tx
        .update(schema.colleges)
        .set({
          quotaUsed: used + 1,
          totalStudents: (college.totalStudents || 0) + 1,
          activeStudents: (college.activeStudents || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(schema.colleges.id, college.id));

      const auditId = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.insert(schema.auditLogs).values({
        id: auditId,
        actorStaffId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'ADD_STUDENT',
        entity: 'Student',
        entityId: createdStudent.id,
        entityName: createdStudent.name,
        ip: actor.ip,
        result: 'Success',
        reason: `Enrolled student ${createdStudent.rollNumber} under ${college.name}`,
        afterState: { collegeId: college.id, rollNumber: createdStudent.rollNumber, email: createdStudent.email },
        timestamp: new Date(),
      });

      return createdStudent;
    });
  }

  async revokeStudentAccess(id: string, _reason: string) {
    const res = await db
      .update(schema.students)
      .set({ accessStatus: 'Revoked', updatedAt: new Date(), lastActivityAt: new Date() })
      .where(eq(schema.students.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Student not found.');
    return res[0];
  }

  async reactivateStudentAccess(id: string) {
    const res = await db
      .update(schema.students)
      .set({ accessStatus: 'Active', updatedAt: new Date(), lastActivityAt: new Date() })
      .where(eq(schema.students.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Student not found.');
    return res[0];
  }

  // --- PROVISIONING ---
  async getAllProvisioningJobs(collegeId?: string) {
    let query = db.select().from(schema.provisioningJobs);
    if (collegeId) {
      return await query
        .where(eq(schema.provisioningJobs.collegeId, collegeId))
        .orderBy(desc(schema.provisioningJobs.createdAt));
    }
    return await query.orderBy(desc(schema.provisioningJobs.createdAt));
  }

  async getProvisioningJobById(id: string) {
    const rows = await db
      .select()
      .from(schema.provisioningJobs)
      .where(eq(schema.provisioningJobs.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createProvisioningJob(job: any) {
    const values = {
      ...job,
      id: job.id || `job-prov-${Date.now()}`,
      createdAt: new Date(),
    };
    const res = await db.insert(schema.provisioningJobs).values(values).returning();
    return res[0];
  }

  async updateProvisioningJob(id: string, updates: any) {
    const values: any = { ...updates };
    if (values.completedAt) values.completedAt = toDate(values.completedAt);
    const res = await db
      .update(schema.provisioningJobs)
      .set(values)
      .where(eq(schema.provisioningJobs.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Provisioning job not found.');
    return res[0];
  }

  // --- APPROVALS ---
  async getAllApprovals(status?: string) {
    let query = db.select().from(schema.approvalRequests);
    if (status) {
      return await query
        .where(eq(schema.approvalRequests.status, status))
        .orderBy(desc(schema.approvalRequests.createdAt));
    }
    return await query.orderBy(desc(schema.approvalRequests.createdAt));
  }

  async getApprovalById(id: string) {
    const rows = await db
      .select()
      .from(schema.approvalRequests)
      .where(eq(schema.approvalRequests.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createApproval(approval: any) {
    const values = {
      ...approval,
      id: approval.id || `req-appr-${Date.now()}`,
      status: approval.status || 'Pending',
      createdAt: new Date(),
    };
    const res = await db.insert(schema.approvalRequests).values(values).returning();
    return res[0];
  }

  async updateApprovalDecision(
    id: string,
    status: 'Approved' | 'Rejected',
    decisionReason: string,
    reviewedBy: string
  ) {
    return await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(schema.approvalRequests)
        .where(eq(schema.approvalRequests.id, id))
        .for('update')
        .limit(1);

      if (rows.length === 0) throw new NotFoundError('Approval request not found.');
      const req = rows[0];

      if (req.status !== 'Pending') {
        throw new ConflictError(`Approval request has already been ${req.status.toLowerCase()}.`);
      }

      const res = await tx
        .update(schema.approvalRequests)
        .set({
          status,
          decisionReason,
          reviewedBy,
          reviewedAt: new Date(),
        })
        .where(eq(schema.approvalRequests.id, id))
        .returning();

      // If Quota Increase is approved, atomically expand college quota
      if (status === 'Approved' && req.type === 'Quota Increase' && req.collegeId) {
        const collegeRows = await tx
          .select()
          .from(schema.colleges)
          .where(eq(schema.colleges.id, req.collegeId))
          .for('update')
          .limit(1);

        if (collegeRows.length > 0) {
          const college = collegeRows[0];
          const details = typeof req.details === 'object' && req.details !== null ? (req.details as any) : {};
          const increaseAmount = Number(details.requestedValue) || Number(details.requestedQuota) || 500;
          const currentAllocated = college.quotaAllocated ?? 0;
          const newAllocated = currentAllocated + increaseAmount;

          await tx
            .update(schema.colleges)
            .set({ quotaAllocated: newAllocated, updatedAt: new Date() })
            .where(eq(schema.colleges.id, req.collegeId));

          await tx.insert(schema.quotaHistory).values({
            id: `qh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            collegeId: req.collegeId,
            timestamp: new Date(),
            adminName: reviewedBy,
            previousAllocated: currentAllocated,
            newAllocated,
            reason: `Approved request ${id}: ${decisionReason}`,
          });
        }
      }

      return res[0];
    });
  }

  // --- SERVICES ---
  async getAllServices() {
    return await db.select().from(schema.platformServices).orderBy(schema.platformServices.name);
  }

  async getServiceById(id: string) {
    const rows = await db
      .select()
      .from(schema.platformServices)
      .where(eq(schema.platformServices.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async toggleGlobalService(id: string) {
    const svc = await this.getServiceById(id);
    if (!svc) throw new NotFoundError('Service not found.');

    const res = await db
      .update(schema.platformServices)
      .set({ isGlobalActive: !svc.isGlobalActive })
      .where(eq(schema.platformServices.id, id))
      .returning();
    return res[0];
  }

  // --- PAYMENTS ---
  async getAllPayments(collegeId?: string) {
    let query = db.select().from(schema.paymentInvoices);
    if (collegeId) {
      return await query
        .where(eq(schema.paymentInvoices.collegeId, collegeId))
        .orderBy(desc(schema.paymentInvoices.date));
    }
    return await query.orderBy(desc(schema.paymentInvoices.date));
  }

  async createPayment(payment: any) {
    const values = {
      id: payment.id || `inv-pay-${Date.now()}`,
      invoiceNumber: payment.invoiceNumber,
      collegeId: payment.collegeId,
      collegeName: payment.collegeName,
      amount: payment.amount,
      status: payment.status || 'Paid',
      date: payment.date || new Date().toISOString().split('T')[0],
      dueDate: payment.dueDate || new Date().toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod || 'Corporate Wire',
      description: payment.description || null,
    };
    const res = await db.insert(schema.paymentInvoices).values(values).returning();
    return res[0];
  }

  // --- NOTIFICATIONS ---
  async getAllNotifications() {
    return await db.select().from(schema.notifications).orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationRead(id: string) {
    const res = await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Notification not found.');
  }

  async markAllNotificationsRead() {
    await db.update(schema.notifications).set({ isRead: true });
  }

  async deleteNotification(id: string) {
    const res = await db.delete(schema.notifications).where(eq(schema.notifications.id, id)).returning();
    if (res.length === 0) throw new NotFoundError('Notification not found.');
  }

  async createNotification(notif: any) {
    const values = {
      ...notif,
      id: notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
    };
    const res = await db.insert(schema.notifications).values(values).returning();
    return res[0];
  }

  // --- AUDIT LOGS ---
  async getAllAuditLogs(entity?: string, page = 1, limit = 50) {
    let query = db.select().from(schema.auditLogs);
    if (entity) {
      return await query
        .where(eq(schema.auditLogs.entity, entity))
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(limit)
        .offset((page - 1) * limit);
    }
    return await query
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async createAuditLog(log: any) {
    const values = {
      ...log,
      id: log.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
    };
    const res = await db.insert(schema.auditLogs).values(values).returning();
    return res[0];
  }

  // --- TEMPLATES ---
  async getAllTemplates() {
    return await db.select().from(schema.appTemplates).orderBy(desc(schema.appTemplates.createdAt));
  }

  async getTemplateById(id: string) {
    const rows = await db
      .select()
      .from(schema.appTemplates)
      .where(eq(schema.appTemplates.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createTemplate(tmpl: any) {
    const values = {
      ...tmpl,
      id: tmpl.id || `tmpl-${Date.now().toString(36)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await db.insert(schema.appTemplates).values(values).returning();
    return res[0];
  }

  async updateTemplate(id: string, updates: any) {
    const values: any = { ...updates, updatedAt: new Date() };
    const res = await db
      .update(schema.appTemplates)
      .set(values)
      .where(eq(schema.appTemplates.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Template not found.');
    return res[0];
  }

  async deleteTemplate(id: string) {
    const res = await db.delete(schema.appTemplates).where(eq(schema.appTemplates.id, id)).returning();
    if (res.length === 0) throw new NotFoundError('Template not found.');
  }

  async togglePublishTemplate(id: string) {
    const tmpl = await this.getTemplateById(id);
    if (!tmpl) throw new NotFoundError('Template not found.');
    const nextStatus = tmpl.status === 'Published' ? 'Draft' : 'Published';
    return await this.updateTemplate(id, { status: nextStatus });
  }

  async toggleFeaturedTemplate(id: string) {
    const tmpl = await this.getTemplateById(id);
    if (!tmpl) throw new NotFoundError('Template not found.');
    return await this.updateTemplate(id, { isFeatured: !tmpl.isFeatured });
  }

  // --- SYSTEM HEALTH ---
  async getSystemHealth() {
    const services = await this.getAllServices();
    return services.map((s) => ({
      name: s.name,
      status: s.isGlobalActive ? 'Healthy' : 'Degraded',
      latencyMs: 15,
      uptime: '99.98%',
      lastCheckedAt: new Date().toISOString(),
    }));
  }

  // --- LIFECYCLE OUTBOX ---
  async createOutboxEvent(event: any, tx?: any) {
    const client = tx || db;
    const values = {
      ...event,
      id: event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: event.status || 'PENDING',
      attempts: event.attempts || 0,
      maxAttempts: event.maxAttempts || 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await client.insert(schema.lifecycleOutbox).values(values).returning();
    return res[0];
  }

  async getPendingOutboxEvents() {
    return await db
      .select()
      .from(schema.lifecycleOutbox)
      .where(
        and(
          eq(schema.lifecycleOutbox.status, 'PENDING'),
          sql`${schema.lifecycleOutbox.attempts} < ${schema.lifecycleOutbox.maxAttempts}`
        )
      )
      .orderBy(asc(schema.lifecycleOutbox.createdAt));
  }

  async updateOutboxEvent(id: string, updates: any) {
    const values: any = { ...updates, updatedAt: new Date() };
    const res = await db
      .update(schema.lifecycleOutbox)
      .set(values)
      .where(eq(schema.lifecycleOutbox.id, id))
      .returning();
    if (res.length === 0) throw new NotFoundError('Outbox event not found.');
    return res[0];
  }

  async getOutboxEventsByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.lifecycleOutbox)
      .where(eq(schema.lifecycleOutbox.collegeId, collegeId))
      .orderBy(desc(schema.lifecycleOutbox.createdAt));
  }
}

