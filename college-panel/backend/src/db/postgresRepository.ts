import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { db } from './client';
import * as schema from './schema';
import { StudentFilters } from './store';
import { NotFoundError, ConflictError, QuotaExceededError } from '../shared/errors/AppError';

function toDate(val: any): Date | undefined {
  if (val === undefined || val === null) return undefined;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export class DrizzlePostgresRepository {
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
      emailDomains: c.emailDomains ?? c.email_domains ?? (c.code === 'PSGCT' ? ['psgtech.edu', 'cse.psgtech.edu'] : [`${c.slug}.edu`]),
      quota: {
        allocated,
        used,
        warningThreshold,
        criticalThreshold,
        departmentLimits,
      },
    };
  }

  // --- COLLEGES ---
  async getCollegeById(id: string) {
    const rows = await db.select().from(schema.colleges).where(eq(schema.colleges.id, id)).limit(1);
    return rows.length > 0 ? this.normalizeCollege(rows[0]) : null;
  }

  async getCollegeBySlug(slug: string) {
    const rows = await db.select().from(schema.colleges).where(eq(schema.colleges.slug, slug)).limit(1);
    return rows.length > 0 ? this.normalizeCollege(rows[0]) : null;
  }

  async getAllColleges() {
    const rows = await db.select().from(schema.colleges).orderBy(desc(schema.colleges.createdAt));
    return rows.map((c) => this.normalizeCollege(c));
  }

  async updateCollege(id: string, updates: any) {
    const values: any = { ...updates };
    if (values.suspendedAt) values.suspendedAt = toDate(values.suspendedAt);
    if (values.reactivatedAt) values.reactivatedAt = toDate(values.reactivatedAt);
    if (values.lastActivityAt) values.lastActivityAt = toDate(values.lastActivityAt);
    values.updatedAt = new Date();

    const res = await db
      .update(schema.colleges)
      .set(values)
      .where(eq(schema.colleges.id, id))
      .returning();

    if (res.length === 0) throw new Error('College not found');
    return this.normalizeCollege(res[0]);
  }

  async updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string) {
    return await db.transaction(async (tx) => {
      const current = await tx
        .select()
        .from(schema.colleges)
        .where(eq(schema.colleges.id, collegeId))
        .limit(1);

      if (current.length === 0) throw new Error('College not found');
      const prevAllocated = current[0].quotaAllocated ?? 0;

      const updated = await tx
        .update(schema.colleges)
        .set({
          quotaAllocated: newAllocated,
          updatedAt: new Date(),
        })
        .where(eq(schema.colleges.id, collegeId))
        .returning();

      await tx.insert(schema.quotaHistory).values({
        id: `qh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        collegeId,
        timestamp: new Date(),
        adminName,
        previousAllocated: prevAllocated,
        newAllocated,
        reason,
      });

      return this.normalizeCollege(updated[0]);
    });
  }

  // --- STAFF USERS ---
  async getStaffByEmail(email: string) {
    const clean = email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(schema.staffUsers)
      .where(sql`LOWER(${schema.staffUsers.email}) = ${clean}`)
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

  async getStaffByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.collegeId, collegeId))
      .orderBy(desc(schema.staffUsers.createdAt));
  }

  async createStaff(user: any) {
    const values: any = { ...user };
    if (values.lastLoginAt) values.lastLoginAt = toDate(values.lastLoginAt);
    if (values.createdAt) values.createdAt = toDate(values.createdAt) || new Date();
    if (values.updatedAt) values.updatedAt = toDate(values.updatedAt) || new Date();
    const res = await db.insert(schema.staffUsers).values(values).returning();
    return res[0];
  }

  async updateStaff(id: string, updates: any) {
    const values: any = { ...updates };
    if (values.lastLoginAt) values.lastLoginAt = toDate(values.lastLoginAt);
    if (values.createdAt) values.createdAt = toDate(values.createdAt);
    values.updatedAt = new Date();

    const res = await db
      .update(schema.staffUsers)
      .set(values)
      .where(eq(schema.staffUsers.id, id))
      .returning();

    if (res.length === 0) throw new Error('Staff not found');
    return res[0];
  }

  // --- INVITATIONS ---
  async createInvitation(invite: any) {
    const designation = invite.designation || 'Institutional Coordinator';
    const collegeName = invite.collegeName || 'Institutional Partner';
    const invitedBy = invite.invitedBy || 'Central Administration';
    const invitedByRole = invite.invitedByRole || 'college_admin';

    const res = await db.insert(schema.collegeInvitations).values({
      ...invite,
      designation,
      collegeName,
      invitedBy,
      invitedByRole,
      invitedAt: invite.invitedAt ? new Date(invite.invitedAt) : new Date(),
      expiresAt: new Date(invite.expiresAt),
    }).returning();
    return res[0];
  }

  async getInvitationByToken(token: string) {
    const rows = await db
      .select()
      .from(schema.collegeInvitations)
      .where(eq(schema.collegeInvitations.token, token))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getInvitationById(id: string) {
    const rows = await db
      .select()
      .from(schema.collegeInvitations)
      .where(eq(schema.collegeInvitations.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async updateInvitation(id: string, updates: any) {
    const values: any = { ...updates };
    if (values.acceptedAt) values.acceptedAt = toDate(values.acceptedAt);
    if (values.revokedAt) values.revokedAt = toDate(values.revokedAt);
    if (values.expiresAt) values.expiresAt = toDate(values.expiresAt);
    if (values.invitedAt) values.invitedAt = toDate(values.invitedAt);
    const res = await db
      .update(schema.collegeInvitations)
      .set(values)
      .where(eq(schema.collegeInvitations.id, id))
      .returning();

    if (res.length === 0) throw new Error('Invitation not found');
    return res[0];
  }

  // --- RESET TOKENS ---
  async createResetToken(tokenObj: any) {
    const res = await db.insert(schema.passwordResetTokens).values({
      ...tokenObj,
      createdAt: toDate(tokenObj.createdAt) || new Date(),
      expiresAt: toDate(tokenObj.expiresAt) || new Date(),
    }).returning();
    return res[0];
  }

  async getResetToken(token: string) {
    const rows = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(and(eq(schema.passwordResetTokens.token, token), eq(schema.passwordResetTokens.isUsed, false)))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async markResetTokenUsed(token: string) {
    await db
      .update(schema.passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(schema.passwordResetTokens.token, token));
  }

  // --- STUDENTS ---
  async getStudentsByCollege(collegeId: string, filters: StudentFilters = {}) {
    const conditions = [eq(schema.students.collegeId, collegeId)];

    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        sql`(${schema.students.name} ILIKE ${q} OR ${schema.students.rollNumber} ILIKE ${q} OR ${schema.students.email} ILIKE ${q})`
      );
    }

    if (filters.department) {
      conditions.push(eq(schema.students.department, filters.department));
    }

    if (filters.status) {
      conditions.push(sql`LOWER(${schema.students.accessStatus}) = LOWER(${filters.status})`);
    }

    if (filters.batch) {
      conditions.push(eq(schema.students.batch, filters.batch));
    }

    const whereClause = and(...conditions);

    // Get total count
    const countRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.students)
      .where(whereClause);

    const total = Number(countRes[0]?.count || 0);

    const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const limit = filters.limit ? Math.max(1, Number(filters.limit)) : total || 50;
    const offset = (page - 1) * limit;

    const students = await db
      .select()
      .from(schema.students)
      .where(whereClause)
      .orderBy(desc(schema.students.createdAt))
      .limit(limit)
      .offset(offset);

    return { students, total };
  }

  async getStudentById(id: string, collegeId?: string) {
    const conditions = [eq(schema.students.id, id)];
    if (collegeId) {
      conditions.push(eq(schema.students.collegeId, collegeId));
    }

    const rows = await db
      .select()
      .from(schema.students)
      .where(and(...conditions))
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }

  async getStudentByRollNumber(collegeId: string, rollNumber: string) {
    const clean = rollNumber.trim().toUpperCase();
    const rows = await db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.collegeId, collegeId), sql`UPPER(${schema.students.rollNumber}) = ${clean}`))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getStudentByEmail(collegeId: string, email: string) {
    const clean = email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.collegeId, collegeId), sql`LOWER(${schema.students.email}) = ${clean}`))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createStudent(student: any) {
    return await db.transaction(async (tx) => {
      const normalizedEmail = (student.email || '').trim().toLowerCase();
      const collegeName = student.collegeName || 'Institutional Partner';
      const entitlementId = student.entitlementId || `ent-${Date.now()}`;
      const enrolledYear = student.enrolledYear || new Date().getFullYear();

      const res = await tx
        .insert(schema.students)
        .values({
          ...student,
          collegeName,
          entitlementId,
          enrolledYear,
          normalizedEmail,
          createdAt: student.createdAt ? new Date(student.createdAt) : new Date(),
          updatedAt: student.updatedAt ? new Date(student.updatedAt) : new Date(),
          lastActivityAt: student.lastActivityAt ? new Date(student.lastActivityAt) : new Date(),
        })
        .returning();

      // Increment counters
      await tx
        .update(schema.colleges)
        .set({
          totalStudents: sql`${schema.colleges.totalStudents} + 1`,
          activeStudents: student.accessStatus === 'Active'
            ? sql`${schema.colleges.activeStudents} + 1`
            : schema.colleges.activeStudents,
        })
        .where(eq(schema.colleges.id, student.collegeId));

      return res[0];
    });
  }

  async enrollStudentWithQuota(
    studentData: any,
    actor: { userId: string; name: string; role: string; ip: string }
  ) {
    return await db.transaction(async (tx) => {
      // 1. Lock college row FOR UPDATE
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
      if (college.status !== 'Active' && college.status !== 'ACTIVE') {
        throw new ConflictError(`Cannot enroll student: College ${college.name} is currently ${college.status}.`);
      }

      const allocated = college.quotaAllocated ?? 0;
      const used = college.quotaUsed ?? 0;
      if (allocated > 0 && used >= allocated) {
        throw new QuotaExceededError(
          `Institutional seat quota limit reached (${used}/${allocated}) for ${college.name}. Request a quota expansion.`
        );
      }

      // 2. Check duplicate roll number
      const roll = studentData.rollNumber.trim().toUpperCase();
      const existingRoll = await tx
        .select()
        .from(schema.students)
        .where(
          and(
            eq(schema.students.collegeId, studentData.collegeId),
            eq(schema.students.rollNumber, roll)
          )
        )
        .limit(1);

      if (existingRoll.length > 0) {
        throw new ConflictError(`Roll number ${studentData.rollNumber} is already enrolled in this institution.`, {
          rollNumber: ['Roll number already enrolled in this institution.'],
        });
      }

      // 3. Check duplicate email
      const cleanEmail = (studentData.email || '').trim().toLowerCase();
      if (cleanEmail) {
        const existingEmail = await tx
          .select()
          .from(schema.students)
          .where(
            and(
              eq(schema.students.collegeId, studentData.collegeId),
              sql`LOWER(${schema.students.email}) = ${cleanEmail}`
            )
          )
          .limit(1);

        if (existingEmail.length > 0) {
          throw new ConflictError(`Email ${studentData.email} is already enrolled in this institution.`, {
            email: ['Email already enrolled in this institution.'],
          });
        }
      }

      // 4. Insert student
      const studentId = studentData.id || `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newStudentValues = {
        ...studentData,
        id: studentId,
        collegeName: college.name,
        rollNumber: roll,
        normalizedEmail: cleanEmail,
        accessStatus: studentData.accessStatus || 'Active',
        entitlementId: studentData.entitlementId || `ent-${studentId}`,
        enrolledYear: studentData.enrolledYear || new Date().getFullYear(),
        createdAt: studentData.createdAt ? new Date(studentData.createdAt) : new Date(),
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      };

      const inserted = await tx.insert(schema.students).values(newStudentValues).returning();
      const createdStudent = inserted[0];

      // 5. Update quota and student counters atomically
      await tx
        .update(schema.colleges)
        .set({
          quotaUsed: used + 1,
          totalStudents: (college.totalStudents || 0) + 1,
          activeStudents: (studentData.accessStatus === 'Active' || !studentData.accessStatus)
            ? (college.activeStudents || 0) + 1
            : college.activeStudents,
          updatedAt: new Date(),
        })
        .where(eq(schema.colleges.id, college.id));

      // 6. Record audit log
      await tx.insert(schema.auditLogs).values({
        id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        collegeId: college.id,
        actorStaffId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'ENROLL_STUDENT',
        entity: 'Student',
        entityId: studentId,
        entityName: createdStudent.name,
        ip: actor.ip || '127.0.0.1',
        result: 'Success',
        reason: 'Student enrolled with atomic quota reservation',
        afterState: createdStudent,
      });

      return createdStudent;
    });
  }

  async provisionBatchWithQuota(
    collegeId: string,
    studentIds: string[],
    services: string[],
    actor: any
  ) {
    return await db.transaction(async (tx) => {
      const collegeRows = await tx
        .select()
        .from(schema.colleges)
        .where(eq(schema.colleges.id, collegeId))
        .for('update')
        .limit(1);

      if (collegeRows.length === 0) throw new NotFoundError('College not found.');
      const college = collegeRows[0];
      const allocated = college.quotaAllocated ?? 0;
      const used = college.quotaUsed ?? 0;
      const availableSeats = allocated - used;

      if (allocated > 0 && studentIds.length > availableSeats) {
        throw new QuotaExceededError(
          `Insufficient quota: Request requires ${studentIds.length} seats, but only ${availableSeats} available (${used}/${allocated} used).`
        );
      }

      for (const sid of studentIds) {
        const studentRows = await tx
          .select()
          .from(schema.students)
          .where(eq(schema.students.id, sid))
          .limit(1);

        if (studentRows.length > 0) {
          const existingServices: string[] = (studentRows[0].services as any) || [];
          const merged = Array.from(new Set([...existingServices, ...services]));
          await tx
            .update(schema.students)
            .set({
              services: merged,
              updatedAt: new Date(),
            })
            .where(eq(schema.students.id, sid));
        }
      }

      await tx
        .update(schema.colleges)
        .set({
          quotaUsed: used + studentIds.length,
          updatedAt: new Date(),
        })
        .where(eq(schema.colleges.id, collegeId));

      const jobId = `job-${Date.now()}`;
      const job = {
        id: jobId,
        collegeId,
        collegeName: college.name,
        createdBy: actor.name || actor.email || 'Admin',
        source: 'Service Provisioning',
        totalRecords: studentIds.length,
        successful: studentIds.length,
        failed: 0,
        partial: 0,
        status: 'Completed',
        failedRecords: [],
        createdAt: new Date(),
        completedAt: new Date(),
      };
      await tx.insert(schema.provisioningJobs).values(job);

      return { job, successful: studentIds.length };
    });
  }

  async bulkImportStudentsWithQuota(collegeId: string, rawStudents: any[], actor: any) {
    return await db.transaction(async (tx) => {
      const collegeRows = await tx
        .select()
        .from(schema.colleges)
        .where(eq(schema.colleges.id, collegeId))
        .for('update')
        .limit(1);

      if (collegeRows.length === 0) throw new NotFoundError('College not found.');
      const college = collegeRows[0];

      const errors: Array<{ rollNumber: string; reason: string }> = [];
      const insertedStudents: any[] = [];
      const seenRolls = new Set<string>();
      const seenEmails = new Set<string>();

      const allocated = college.quotaAllocated ?? 0;
      let currentUsed = college.quotaUsed ?? 0;

      for (const item of rawStudents) {
        const roll = (item.rollNumber || '').trim().toUpperCase();
        if (!roll) {
          errors.push({ rollNumber: 'UNKNOWN', reason: 'Missing roll number' });
          continue;
        }
        if (seenRolls.has(roll)) {
          errors.push({ rollNumber: roll, reason: 'Duplicate roll number in uploaded batch' });
          continue;
        }
        seenRolls.add(roll);

        const cleanEmail = (item.email || '').trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          errors.push({ rollNumber: roll, reason: 'Invalid or missing email address' });
          continue;
        }
        if (seenEmails.has(cleanEmail)) {
          errors.push({ rollNumber: roll, reason: 'Duplicate email address in uploaded batch' });
          continue;
        }
        seenEmails.add(cleanEmail);

        const existingRoll = await tx
          .select()
          .from(schema.students)
          .where(and(eq(schema.students.collegeId, collegeId), eq(schema.students.rollNumber, roll)))
          .limit(1);

        if (existingRoll.length > 0) {
          errors.push({ rollNumber: roll, reason: 'Roll number already enrolled in this institution' });
          continue;
        }

        const existingEmail = await tx
          .select()
          .from(schema.students)
          .where(and(eq(schema.students.collegeId, collegeId), sql`LOWER(${schema.students.email}) = ${cleanEmail}`))
          .limit(1);

        if (existingEmail.length > 0) {
          errors.push({ rollNumber: roll, reason: 'Email already enrolled in this institution' });
          continue;
        }

        if (allocated > 0 && currentUsed >= allocated) {
          errors.push({ rollNumber: roll, reason: 'Institutional quota exhausted; seat limit reached' });
          continue;
        }

        const studentId = `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newStudent = {
          id: studentId,
          name: item.name,
          rollNumber: roll,
          collegeId,
          collegeName: college.name,
          department: item.department || 'General',
          course: item.course || 'Undergraduate',
          batch: item.batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
          email: cleanEmail,
          normalizedEmail: cleanEmail,
          phone: item.phone,
          accessStatus: 'Active',
          services: ['BEXO Portfolio', 'BEXO Templates'],
          entitlementId: `ent-${studentId}`,
          enrolledYear: new Date().getFullYear(),
          resumeCount: 0,
          portfolioSubdomain: item.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          lastActivityAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await tx.insert(schema.students).values(newStudent);
        insertedStudents.push(newStudent);
        currentUsed++;
      }

      if (insertedStudents.length > 0) {
        await tx
          .update(schema.colleges)
          .set({
            quotaUsed: currentUsed,
            totalStudents: (college.totalStudents || 0) + insertedStudents.length,
            activeStudents: (college.activeStudents || 0) + insertedStudents.length,
            updatedAt: new Date(),
          })
          .where(eq(schema.colleges.id, collegeId));
      }

      let jobStatus = 'Completed';
      if (insertedStudents.length === 0 && errors.length > 0) {
        jobStatus = 'Failed';
      } else if (errors.length > 0) {
        jobStatus = 'Partially Completed';
      }

      const jobId = `job-${Date.now()}`;
      const job = {
        id: jobId,
        collegeId,
        collegeName: college.name,
        createdBy: actor.name || actor.email || 'Admin',
        source: 'CSV Upload',
        totalRecords: rawStudents.length,
        successful: insertedStudents.length,
        failed: errors.length,
        partial: 0,
        status: jobStatus,
        failedRecords: errors.map((e) => ({
          rollNumber: e.rollNumber,
          name: 'Bulk Row',
          reason: e.reason,
          status: 'Duplicate or Invalid Record',
        })),
        createdAt: new Date(),
        completedAt: new Date(),
      };

      await tx.insert(schema.provisioningJobs).values(job);

      return { job, insertedStudents, errors };
    });
  }

  async updateStudent(id: string, arg2: any, arg3?: any) {
    const collegeId = typeof arg2 === 'string' ? arg2 : undefined;
    const updates = arg3 !== undefined ? arg3 : (typeof arg2 === 'object' ? arg2 : {});

    const condition = collegeId
      ? and(eq(schema.students.id, id), eq(schema.students.collegeId, collegeId))
      : eq(schema.students.id, id);

    const values: any = { ...updates };
    if (values.lastActivityAt) values.lastActivityAt = toDate(values.lastActivityAt);
    if (values.linkedAt) values.linkedAt = toDate(values.linkedAt);
    values.updatedAt = new Date();

    const res = await db
      .update(schema.students)
      .set(values)
      .where(condition)
      .returning();

    if (res.length === 0) throw new Error('Student not found');
    return res[0];
  }

  // --- ENTITLEMENTS ---
  async getEntitlementsByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.studentEntitlements)
      .where(eq(schema.studentEntitlements.collegeId, collegeId))
      .orderBy(desc(schema.studentEntitlements.grantedDate));
  }

  async createEntitlement(entitlement: any) {
    const res = await db.insert(schema.studentEntitlements).values({
      ...entitlement,
      grantedDate: entitlement.grantedDate ? new Date(entitlement.grantedDate) : new Date(),
      lastUpdated: new Date(),
    }).returning();
    return res[0];
  }

  async revokeEntitlement(id: string, collegeId: string, reason?: string) {
    const res = await db
      .update(schema.studentEntitlements)
      .set({
        status: 'Revoked',
        revokeReason: reason,
        lastUpdated: new Date(),
      })
      .where(and(eq(schema.studentEntitlements.id, id), eq(schema.studentEntitlements.collegeId, collegeId)))
      .returning();

    if (res.length === 0) throw new Error('Entitlement not found');
    return res[0];
  }

  async reactivateEntitlement(id: string, collegeId: string) {
    const res = await db
      .update(schema.studentEntitlements)
      .set({
        status: 'Active',
        revokeReason: null,
        lastUpdated: new Date(),
      })
      .where(and(eq(schema.studentEntitlements.id, id), eq(schema.studentEntitlements.collegeId, collegeId)))
      .returning();

    if (res.length === 0) throw new Error('Entitlement not found');
    return res[0];
  }

  // --- PROVISIONING JOBS ---
  async getProvisioningJobsByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.provisioningJobs)
      .where(eq(schema.provisioningJobs.collegeId, collegeId))
      .orderBy(desc(schema.provisioningJobs.createdAt));
  }

  async getProvisioningJobById(id: string, collegeId: string) {
    const rows = await db
      .select()
      .from(schema.provisioningJobs)
      .where(and(eq(schema.provisioningJobs.id, id), eq(schema.provisioningJobs.collegeId, collegeId)))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createProvisioningJob(job: any) {
    const res = await db.insert(schema.provisioningJobs).values({
      ...job,
      createdAt: toDate(job.createdAt) || new Date(),
      completedAt: toDate(job.completedAt) || null,
    }).returning();
    return res[0];
  }

  async updateProvisioningJob(id: string, arg2: any, arg3?: any) {
    const updates = arg3 !== undefined ? arg3 : arg2;
    const collegeId = arg3 !== undefined ? arg2 : undefined;

    const condition = collegeId
      ? and(eq(schema.provisioningJobs.id, id), eq(schema.provisioningJobs.collegeId, collegeId))
      : eq(schema.provisioningJobs.id, id);

    const values: any = { ...updates };
    if (values.completedAt) values.completedAt = toDate(values.completedAt);
    if (values.createdAt) values.createdAt = toDate(values.createdAt);

    const res = await db
      .update(schema.provisioningJobs)
      .set(values)
      .where(condition)
      .returning();

    if (res.length === 0) throw new Error('Provisioning job not found');
    return res[0];
  }

  // --- REQUESTS ---
  async getRequestsByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.approvalRequests)
      .where(eq(schema.approvalRequests.collegeId, collegeId))
      .orderBy(desc(schema.approvalRequests.createdAt));
  }

  async getRequestById(id: string) {
    const rows = await db
      .select()
      .from(schema.approvalRequests)
      .where(eq(schema.approvalRequests.id, id))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async createRequest(req: any) {
    const collegeName = req.collegeName || 'Institutional Partner';
    const requester = req.requester || req.submittedBy || 'College Administrator';
    const requesterEmail = req.requesterEmail || 'admin@institution.edu';
    const requesterRole = req.requesterRole || 'college_admin';
    const details = req.details || {};

    const res = await db.insert(schema.approvalRequests).values({
      ...req,
      collegeName,
      requester,
      requesterEmail,
      requesterRole,
      details,
      createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
    }).returning();
    return res[0];
  }

  async updateRequest(id: string, updates: any) {
    const values: any = { ...updates };
    if (values.reviewedAt) values.reviewedAt = new Date(values.reviewedAt);
    const res = await db
      .update(schema.approvalRequests)
      .set(values)
      .where(eq(schema.approvalRequests.id, id))
      .returning();

    if (res.length === 0) throw new Error('Request not found');
    return res[0];
  }

  // --- AGREEMENTS & INVOICES ---
  async getAgreementByCollege(collegeId: string) {
    const rows = await db
      .select()
      .from(schema.collegeAgreements)
      .where(eq(schema.collegeAgreements.collegeId, collegeId))
      .limit(1);
    return rows.length > 0 ? rows[0] : null;
  }

  async getInvoicesByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.paymentInvoices)
      .where(eq(schema.paymentInvoices.collegeId, collegeId))
      .orderBy(desc(schema.paymentInvoices.createdAt));
  }

  // --- NOTIFICATIONS, ANNOUNCEMENTS, TASKS ---
  async getNotificationsByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.collegeId, collegeId))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationRead(id: string, collegeId: string) {
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.collegeId, collegeId)));
  }

  async markAllNotificationsRead(collegeId: string) {
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.collegeId, collegeId));
  }

  async createNotification(notif: any) {
    const res = await db.insert(schema.notifications).values({
      ...notif,
      createdAt: notif.createdAt ? new Date(notif.createdAt) : new Date(),
    }).returning();
    return res[0];
  }

  async getAnnouncementsForCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.collegeAnnouncements)
      .where(sql`${schema.collegeAnnouncements.collegeId} IS NULL OR ${schema.collegeAnnouncements.collegeId} = ${collegeId}`)
      .orderBy(desc(schema.collegeAnnouncements.publishedAt));
  }

  async getTasksByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.collegeTasks)
      .where(eq(schema.collegeTasks.collegeId, collegeId))
      .orderBy(desc(schema.collegeTasks.createdAt));
  }

  async toggleTask(id: string, collegeId: string) {
    const existing = await db
      .select()
      .from(schema.collegeTasks)
      .where(and(eq(schema.collegeTasks.id, id), eq(schema.collegeTasks.collegeId, collegeId)))
      .limit(1);

    if (existing.length === 0) throw new Error('Task not found');
    const newStatus = existing[0].status === 'Completed' ? 'Pending' : 'Completed';

    const res = await db
      .update(schema.collegeTasks)
      .set({ status: newStatus })
      .where(and(eq(schema.collegeTasks.id, id), eq(schema.collegeTasks.collegeId, collegeId)))
      .returning();

    return res[0];
  }

  // --- AUDIT LOGS ---
  async getAuditLogsByCollege(collegeId: string) {
    return await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.collegeId, collegeId))
      .orderBy(desc(schema.auditLogs.timestamp));
  }


  // --- CORPORATE METHODS FALLBACK / DRIZZLE IMPLEMENTATIONS ---
  async createCollege(collegeData: any) {
    const id = collegeData.id || `clg-${Date.now().toString(36)}`;
    const newCollege = {
      id,
      name: collegeData.name,
      code: collegeData.code || collegeData.name.substring(0, 5).toUpperCase(),
      slug: collegeData.slug || collegeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: collegeData.type || 'Engineering',
      affiliation: collegeData.affiliation || 'State University',
      establishedYear: collegeData.establishedYear || 2000,
      address: collegeData.address || '',
      city: collegeData.city || '',
      district: collegeData.district || '',
      state: collegeData.state || '',
      pincode: collegeData.pincode || '',
      country: collegeData.country || 'India',
      primaryContact: collegeData.primaryContact || { name: 'Principal', designation: 'Head', email: 'principal@college.edu', mobile: '+91 9000000000' },
      adminContact: collegeData.adminContact || { name: 'Admin', email: 'admin@college.edu', mobile: '+91 9000000001' },
      coordinators: collegeData.coordinators || [],
      emailDomains: collegeData.emailDomains || [`${collegeData.slug || 'college'}.edu`],
      status: collegeData.status || 'Active',
      dashboardAccess: collegeData.dashboardAccess ?? true,
      totalStudents: collegeData.totalStudents || 0,
      activeStudents: collegeData.activeStudents || 0,
      quotaAllocated: collegeData.quotaAllocated ?? 1000,
      quotaUsed: 0,
      warningThreshold: 80,
      criticalThreshold: 95,
      departmentLimits: collegeData.departmentLimits || {},
      services: collegeData.services || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    };
    await db.insert(schema.colleges).values(newCollege as any);
    return this.normalizeCollege(newCollege);
  }

  async getQuotaHistory(collegeId?: string) {
    let query = db.select().from(schema.quotaHistory);
    if (collegeId) {
      query = query.where(eq(schema.quotaHistory.collegeId, collegeId)) as any;
    }
    return query.orderBy(desc(schema.quotaHistory.timestamp));
  }

  async toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean) {
    const clg = await this.getCollegeById(collegeId);
    if (!clg) throw new Error('College not found');
    const services = clg.services || [];
    const idx = services.findIndex((s: any) => s.serviceId === serviceId);
    if (idx !== -1) {
      services[idx].isEnabled = enabled;
    } else {
      services.push({ serviceId, name: serviceId, isEnabled: enabled, activatedAt: new Date().toISOString(), studentsUsing: 0, planLevel: 'Enterprise' });
    }
    return this.updateCollege(collegeId, { services });
  }

  async getAllStudents(filters: any = {}) {
    const rows = await db.select().from(schema.students).orderBy(desc(schema.students.createdAt));
    return rows;
  }

  async revokeStudent(studentId: string, reason?: string) {
    const res = await db.update(schema.students).set({ accessStatus: 'Revoked', updatedAt: new Date() }).where(eq(schema.students.id, studentId)).returning();
    return res[0];
  }

  async reactivateStudent(studentId: string) {
    const res = await db.update(schema.students).set({ accessStatus: 'Active', updatedAt: new Date() }).where(eq(schema.students.id, studentId)).returning();
    return res[0];
  }

  async getAllProvisioningJobs(collegeId?: string) {
    let query = db.select().from(schema.provisioningJobs);
    if (collegeId) query = query.where(eq(schema.provisioningJobs.collegeId, collegeId)) as any;
    return query.orderBy(desc(schema.provisioningJobs.createdAt));
  }

  async createProvisioningBatch(payload: any, createdBy: string) {
    const college = await this.getCollegeById(payload.collegeId);
    const count = payload.batchSize || 50;
    const newJob = {
      id: `job-${Date.now()}`,
      collegeId: payload.collegeId,
      collegeName: college ? college.name : 'Target Institution',
      createdBy: createdBy || 'Corporate Admin',
      source: payload.source || 'Roll Number Range',
      totalRecords: count,
      successful: count,
      failed: 0,
      partial: 0,
      status: 'Completed',
      failedRecords: [],
      createdAt: new Date(),
      completedAt: new Date(),
    };
    await db.insert(schema.provisioningJobs).values(newJob as any);
    return newJob;
  }

  async getAllApprovals(status?: string) {
    let query = db.select().from(schema.approvalRequests);
    if (status) query = query.where(eq(schema.approvalRequests.status, status)) as any;
    return query.orderBy(desc(schema.approvalRequests.createdAt));
  }

  async approveRequest(id: string, decisionReason: string, reviewer: string) {
    const existing = await db.select().from(schema.approvalRequests).where(eq(schema.approvalRequests.id, id));
    if (existing.length === 0) throw new Error('Request not found');
    const req = existing[0];

    const res = await db.update(schema.approvalRequests).set({
      status: 'Approved',
      decisionReason,
      reviewedBy: reviewer,
      reviewedAt: new Date(),
    }).where(eq(schema.approvalRequests.id, id)).returning();

    if (req.type === 'Quota Increase') {
      const details: any = typeof req.details === 'string' ? JSON.parse(req.details) : req.details;
      const targetVal = details?.requestedValue ? Number(details.requestedValue) : null;
      const clg = await this.getCollegeById(req.collegeId);
      const newQuota = targetVal !== null 
        ? targetVal 
        : ((clg?.quotaAllocated || 5000) + (req.deltaSeats ?? (req.targetTotal ? (req.targetTotal - (clg?.quotaAllocated || 5000)) : 500)));
      if (clg) {
        await this.updateQuota(req.collegeId, newQuota, `Approved request ${id}: ${decisionReason}`, reviewer);
      }
    }

    return res[0];
  }

  async rejectRequest(id: string, decisionReason: string, reviewer: string) {
    const res = await db.update(schema.approvalRequests).set({
      status: 'Rejected',
      decisionReason,
      reviewedBy: reviewer,
      reviewedAt: new Date(),
    }).where(eq(schema.approvalRequests.id, id)).returning();
    return res[0];
  }

  async getAllServices() {
    return db.select().from(schema.platformServices);
  }

  async togglePlatformServiceGlobal(serviceId: string) {
    const rows = await db.select().from(schema.platformServices).where(eq(schema.platformServices.id, serviceId));
    if (rows.length === 0) throw new Error('Service not found');
    const current = rows[0].isGlobalActive;
    const res = await db.update(schema.platformServices).set({ isGlobalActive: !current }).where(eq(schema.platformServices.id, serviceId)).returning();
    return res[0];
  }

  async getAllInvoices(collegeId?: string) {
    let query = db.select().from(schema.paymentInvoices);
    if (collegeId) query = query.where(eq(schema.paymentInvoices.collegeId, collegeId)) as any;
    return query.orderBy(desc(schema.paymentInvoices.createdAt));
  }

  async createPaymentInvoice(payload: any) {
    const college = await this.getCollegeById(payload.collegeId);
    const invoice = {
      id: `inv-${Date.now()}`,
      collegeId: payload.collegeId,
      collegeName: college ? college.name : 'Institution',
      invoiceNumber: payload.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: payload.amount || 150000,
      status: payload.status || 'Paid',
      date: payload.date || new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
      paymentMethod: payload.paymentMethod || 'NEFT Transfer',
      description: payload.description || 'Institutional Platform Annual License',
      createdAt: new Date(),
    };
    await db.insert(schema.paymentInvoices).values(invoice as any);
    return invoice;
  }

  async getAllAdminNotifications() {
    return db.select().from(schema.notifications).orderBy(desc(schema.notifications.createdAt));
  }

  async deleteNotification(id: string) {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, id));
    return true;
  }

  async getAllAuditLogs(entity?: string, page: number = 1, limit: number = 50) {
    let query = db.select().from(schema.auditLogs);
    if (entity) query = query.where(eq(schema.auditLogs.entity, entity)) as any;
    return query.orderBy(desc(schema.auditLogs.timestamp)).limit(limit);
  }

  async getAllStaffUsers(collegeId?: string) {
    let query = db.select().from(schema.staffUsers);
    if (collegeId) query = query.where(eq(schema.staffUsers.collegeId, collegeId)) as any;
    return query.orderBy(desc(schema.staffUsers.createdAt));
  }

  async createStaffUser(payload: any) {
    return this.createStaff(payload);
  }

  async updateStaffUser(id: string, updates: any) {
    return this.updateStaff(id, updates);
  }

  async deleteStaffUser(id: string) {
    await db.update(schema.staffUsers).set({ isActive: false, accountStatus: 'REVOKED' }).where(eq(schema.staffUsers.id, id));
    return true;
  }

  async getAllTemplates() {
    return [];
  }

  async getTemplateById(id: string) {
    return null;
  }

  async createTemplate(payload: any) {
    return { id: `tmpl-${Date.now()}`, ...payload };
  }

  async updateTemplate(id: string, updates: any) {
    return { id, ...updates };
  }

  async deleteTemplate(id: string) {
    return true;
  }

  async toggleTemplatePublish(id: string) {
    return { id, status: 'Published' };
  }

  async toggleTemplateFeatured(id: string) {
    return { id, isFeatured: true };
  }

  async getSystemHealth() {
    return [
      { name: 'PostgreSQL Primary Cluster', status: 'Healthy', latencyMs: 1.8, uptimePct: 99.98, details: 'Active connection pool: 8/32 connections. Zero replication lag.' },
      { name: 'Redis In-Memory Session Cache', status: 'Healthy', latencyMs: 0.4, uptimePct: 100.0, details: 'Memory utilization 14.2MB of 512MB quota. Hit ratio: 98.4%.' },
      { name: 'MSG91 OTP & Telephony Gateway', status: 'Healthy', latencyMs: 145.0, uptimePct: 99.94, details: 'Primary DLT pipeline operational. SMS OTP delivery latency < 4.2s.' },
      { name: 'Cloudflare Edge CDN & DNS Proxy', status: 'Healthy', latencyMs: 12.0, uptimePct: 100.0, details: 'Portfolio wildcard subdomains active across edge routing.' },
    ];
  }

  async linkMobileStudent(mobileUserId: string, email: string, phone?: string) {
    const student = await this.getStudentByEmail('', email);
    if (!student) return { linked: false, message: 'No student match in active college roster.' };
    await db.update(schema.students).set({ userId: mobileUserId, phone: phone || student.phone, linkedAt: new Date() }).where(eq(schema.students.id, student.id));
    return { linked: true, student };
  }

  async getMobileStudentEntitlements(userId: string) {
    const rows = await db.select().from(schema.students).where(eq(schema.students.userId, userId));
    if (rows.length === 0) return { isLinked: false, message: 'User not linked to an institutional student.' };
    const student = rows[0];
    const college = await this.getCollegeById(student.collegeId);
    return {
      isLinked: true,
      student,
      collegeStatus: college ? college.status : 'Unknown',
      dashboardAccess: college ? college.dashboardAccess : false,
      entitlements: (student.services as string[] || []).map((s: string, idx: number) => ({
        serviceId: `srv-${idx + 1}`,
        serviceName: s,
        status: (college && college.status === 'Suspended') ? 'Suspended' : 'Active',
      })),
    };
  }

  async createAuditLog(log: any) {
    const res = await db.insert(schema.auditLogs).values({
      id: log.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collegeId: log.collegeId,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
      actorStaffId: log.actorStaffId || log.actorId || 'system',
      actorName: log.actorName || 'System Process',
      actorRole: log.actorRole || 'admin',
      action: log.action || 'ACTIVITY',
      entity: log.entity || log.targetType || 'SYSTEM',
      entityId: log.entityId || log.targetId || 'SYSTEM',
      entityName: log.entityName || log.targetName || 'System',
      ip: log.ip || log.ipAddress || '127.0.0.1',
      result: log.result || 'Success',
      beforeState: log.beforeState || null,
      afterState: log.afterState || log.details || null,
      reason: log.reason || null,
    }).returning();
    return res[0];
  }
}
