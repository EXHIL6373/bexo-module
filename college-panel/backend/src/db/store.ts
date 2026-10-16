import crypto from 'node:crypto';
import { NotFoundError, ConflictError, QuotaExceededError } from '../shared/errors/AppError';
import {
  INITIAL_COLLEGES,
  INITIAL_STAFF_USERS,
  INITIAL_STUDENTS,
  INITIAL_PROVISIONING_JOBS,
  INITIAL_APPROVALS,
  INITIAL_AGREEMENTS,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_APP_TEMPLATES,
  INITIAL_SERVICES,
} from './initialData';

export interface StudentFilters {
  search?: string;
  department?: string;
  status?: string;
  batch?: string;
  page?: number;
  limit?: number;
}

export class MemoryStore {
  public colleges = JSON.parse(JSON.stringify(INITIAL_COLLEGES));
  public staffUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_USERS));
  public students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  public provisioningJobs = JSON.parse(JSON.stringify(INITIAL_PROVISIONING_JOBS));
  public approvals = JSON.parse(JSON.stringify(INITIAL_APPROVALS));
  public agreements = JSON.parse(JSON.stringify(INITIAL_AGREEMENTS));
  public invoices = JSON.parse(JSON.stringify(INITIAL_INVOICES));
  public notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
  public tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
  public announcements = JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
  public invitations: any[] = [];
  public resetTokens: any[] = [];
  public auditLogs: any[] = [];
  public entitlements: any[] = [];
  public quotaHistories: any[] = [];
  public templates: any[] = JSON.parse(JSON.stringify(INITIAL_APP_TEMPLATES));
  public platformServices: any[] = JSON.parse(JSON.stringify(INITIAL_SERVICES));

  constructor() {
    this.initEntitlements();
  }

  private initEntitlements() {
    for (const stu of this.students) {
      if (stu.services && Array.isArray(stu.services)) {
        for (const sName of stu.services) {
          this.entitlements.push({
            id: `ent-${stu.id}-${crypto.randomBytes(4).toString('hex')}`,
            studentId: stu.id,
            studentName: stu.name,
            rollNumber: stu.rollNumber,
            collegeId: stu.collegeId,
            collegeName: stu.collegeName,
            serviceId: 'srv-1',
            serviceName: sName,
            status: 'Active',
            grantedDate: stu.createdAt,
            lastUpdated: stu.updatedAt || stu.createdAt,
          });
        }
      }
    }
  }

  private normalizeCollege(c: any) {
    if (!c) return null;
    const allocated = c.quotaAllocated ?? c.quota?.allocated ?? 0;
    const used = c.quotaUsed ?? c.quota?.used ?? 0;
    const warningThreshold = c.warningThreshold ?? c.quota?.warningThreshold ?? 80;
    const criticalThreshold = c.criticalThreshold ?? c.quota?.criticalThreshold ?? 95;
    const departmentLimits = c.departmentLimits ?? c.quota?.departmentLimits ?? {};

    const agreement = (this.agreements && this.agreements.find((a: any) => a.collegeId === c.id)) || {
      agreementNumber: `MOU-${c.code || c.id}-2025`,
      type: 'Annual MOU',
      startDate: '2025-06-01',
      endDate: '2028-05-31',
      status: 'Active',
      documentName: `${c.code || c.id}_Agreement.pdf`,
      documentUrl: `https://docs.atbexo.com/agreements/${c.slug || c.id}-mou.pdf`,
      notes: 'Institutional MOU and service level agreement',
    };

    const collegeServices = (c.services && c.services.length > 0) ? c.services : [
      { serviceId: 'srv-1', name: 'BEXO Portfolio', isEnabled: true, activatedAt: '2025-06-15', studentsUsing: c.activeStudents || 1200, planLevel: 'Enterprise' },
      { serviceId: 'srv-2', name: 'BEXO Templates', isEnabled: true, activatedAt: '2025-06-15', studentsUsing: c.activeStudents || 1200, planLevel: 'Enterprise' },
      { serviceId: 'srv-3', name: 'ATS Resume Engine', isEnabled: true, activatedAt: '2025-07-01', studentsUsing: Math.floor((c.activeStudents || 1200) * 0.8), planLevel: 'Enterprise' },
    ];

    return {
      ...c,
      emailDomains: c.emailDomains || (c.code === 'PSGCT' ? ['psgtech.edu', 'cse.psgtech.edu'] : [c.slug + '.edu']),
      quotaAllocated: allocated,
      quotaUsed: used,
      agreement,
      services: collegeServices,
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
    const c = this.colleges.find((c: any) => c.id === id) || null;
    return this.normalizeCollege(c);
  }

  async getCollegeBySlug(slug: string) {
    const c = this.colleges.find((c: any) => c.slug === slug) || null;
    return this.normalizeCollege(c);
  }

  async getAllColleges() {
    return this.colleges.map((c: any) => this.normalizeCollege(c));
  }

  async updateCollege(id: string, updates: any) {
    const idx = this.colleges.findIndex((c: any) => c.id === id);
    if (idx === -1) throw new Error('College not found');
    this.colleges[idx] = {
      ...this.colleges[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.normalizeCollege(this.colleges[idx]);
  }

  async updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string) {
    const idx = this.colleges.findIndex((c: any) => c.id === collegeId);
    if (idx === -1) throw new Error('College not found');
    const college = this.colleges[idx];
    const prev = college.quotaAllocated ?? college.quota?.allocated ?? 0;
    college.quotaAllocated = newAllocated;
    if (college.quota) college.quota.allocated = newAllocated;
    college.updatedAt = new Date().toISOString();

    const history = {
      id: `qh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collegeId,
      timestamp: new Date().toISOString(),
      adminName,
      previousAllocated: prev,
      newAllocated,
      reason,
    };
    this.quotaHistories.push(history);
    return this.normalizeCollege(college);
  }

  // --- STAFF USERS ---
  async getStaffByEmail(email: string) {
    const clean = email.trim().toLowerCase();
    return this.staffUsers.find((s: any) => s.email.toLowerCase() === clean) || null;
  }

  async getStaffById(id: string) {
    return this.staffUsers.find((s: any) => s.id === id) || null;
  }

  async getStaffByCollege(collegeId: string) {
    return this.staffUsers.filter((s: any) => s.collegeId === collegeId);
  }

  async createStaff(user: any) {
    this.staffUsers.push(user);
    return user;
  }

  async updateStaff(id: string, updates: any) {
    const idx = this.staffUsers.findIndex((s: any) => s.id === id);
    if (idx === -1) throw new Error('Staff not found');
    this.staffUsers[idx] = {
      ...this.staffUsers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.staffUsers[idx];
  }

  // --- INVITATIONS ---
  async createInvitation(invite: any) {
    this.invitations.push(invite);
    return invite;
  }

  async getInvitationByToken(token: string) {
    return this.invitations.find((i: any) => i.token === token) || null;
  }

  async getInvitationById(id: string) {
    return this.invitations.find((i: any) => i.id === id) || null;
  }

  async updateInvitation(id: string, updates: any) {
    const idx = this.invitations.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error('Invitation not found');
    this.invitations[idx] = { ...this.invitations[idx], ...updates };
    return this.invitations[idx];
  }

  // --- RESET TOKENS ---
  async createResetToken(tokenObj: any) {
    this.resetTokens.push(tokenObj);
    return tokenObj;
  }

  async getResetToken(token: string) {
    return this.resetTokens.find((t: any) => t.token === token && !t.isUsed) || null;
  }

  async markResetTokenUsed(token: string) {
    const t = this.resetTokens.find((x: any) => x.token === token);
    if (t) t.isUsed = true;
  }

  // --- STUDENTS ---
  async getStudentsByCollege(collegeId: string, filters: StudentFilters = {}) {
    let list = this.students.filter((s: any) => s.collegeId === collegeId);

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (s: any) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (filters.department) {
      list = list.filter((s: any) => s.department === filters.department);
    }

    if (filters.status) {
      list = list.filter((s: any) => s.accessStatus.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters.batch) {
      list = list.filter((s: any) => s.batch === filters.batch);
    }

    const total = list.length;
    const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const limit = filters.limit ? Math.max(1, Number(filters.limit)) : list.length;
    const offset = (page - 1) * limit;

    const paged = list.slice(offset, offset + limit);
    return { students: paged, total };
  }

  async getStudentById(id: string, collegeId?: string) {
    const stu = this.students.find((s: any) => s.id === id);
    if (!stu) return null;
    if (collegeId && stu.collegeId !== collegeId) {
      return null; // Scoped access
    }
    return stu;
  }

  async getStudentByRollNumber(collegeId: string, rollNumber: string) {
    return (
      this.students.find(
        (s: any) => s.collegeId === collegeId && s.rollNumber.toUpperCase() === rollNumber.toUpperCase()
      ) || null
    );
  }

  async getStudentByEmail(collegeId: string, email: string) {
    return (
      this.students.find(
        (s: any) => s.collegeId === collegeId && s.email.toLowerCase() === email.toLowerCase()
      ) || null
    );
  }

  async createStudent(student: any) {
    student.normalizedEmail = (student.email || '').trim().toLowerCase();
    this.students.push(student);
    const college = await this.getCollegeById(student.collegeId);
    if (college) {
      college.totalStudents = (college.totalStudents || 0) + 1;
      if (student.accessStatus === 'Active') {
        college.activeStudents = (college.activeStudents || 0) + 1;
      }
    }
    return student;
  }

  async updateStudent(id: string, collegeId: string, updates: any) {
    const idx = this.students.findIndex((s: any) => s.id === id && s.collegeId === collegeId);
    if (idx === -1) throw new Error('Student not found');
    this.students[idx] = {
      ...this.students[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.students[idx];
  }

  async enrollStudentWithQuota(
    studentData: any,
    actor: { userId: string; name: string; role: string; ip: string }
  ) {
    const college = this.colleges.find((c: any) => c.id === studentData.collegeId);
    if (!college) throw new NotFoundError(`College '${studentData.collegeId}' does not exist.`);
    if (college.status !== 'Active' && college.status !== 'ACTIVE') {
      throw new ConflictError(`Cannot enroll student: College ${college.name} is currently ${college.status}.`);
    }

    const allocated = college.quotaAllocated ?? college.quota?.allocated ?? 0;
    const used = college.quotaUsed ?? college.quota?.used ?? 0;
    if (allocated > 0 && used >= allocated) {
      throw new QuotaExceededError(
        `Institutional seat quota limit reached (${used}/${allocated}) for ${college.name}. Request a quota expansion.`
      );
    }

    const roll = (studentData.rollNumber || '').trim().toUpperCase();
    const existingRoll = this.students.find(
      (s: any) => s.collegeId === studentData.collegeId && s.rollNumber.toUpperCase() === roll
    );
    if (existingRoll) {
      throw new ConflictError(`Roll number ${studentData.rollNumber} is already enrolled in this institution.`, {
        rollNumber: ['Roll number already enrolled in this institution.'],
      });
    }

    const cleanEmail = (studentData.email || '').trim().toLowerCase();
    if (cleanEmail) {
      const existingEmail = this.students.find(
        (s: any) => s.collegeId === studentData.collegeId && (s.email || '').toLowerCase() === cleanEmail
      );
      if (existingEmail) {
        throw new ConflictError(`Email ${studentData.email} is already enrolled in this institution.`, {
          email: ['Email already enrolled in this institution.'],
        });
      }
    }

    const studentId = studentData.id || `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStudent = {
      ...studentData,
      id: studentId,
      collegeName: college.name,
      rollNumber: roll,
      normalizedEmail: cleanEmail,
      accessStatus: studentData.accessStatus || 'Active',
      entitlementId: studentData.entitlementId || `ent-${studentId}`,
      enrolledYear: studentData.enrolledYear || new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    this.students.push(newStudent);
    college.quotaUsed = used + 1;
    if (college.quota) college.quota.used = used + 1;
    college.totalStudents = (college.totalStudents || 0) + 1;
    if (newStudent.accessStatus === 'Active') {
      college.activeStudents = (college.activeStudents || 0) + 1;
    }

    this.auditLogs.push({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collegeId: college.id,
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ENROLL_STUDENT',
      entity: 'Student',
      entityId: studentId,
      entityName: newStudent.name,
      ip: actor.ip || '127.0.0.1',
      result: 'Success',
      reason: 'Student enrolled with atomic quota reservation',
    });

    return newStudent;
  }

  async provisionBatchWithQuota(collegeId: string, studentIds: string[], services: string[], actor: any) {
    const college = this.colleges.find((c: any) => c.id === collegeId);
    if (!college) throw new NotFoundError('College not found.');
    const allocated = college.quotaAllocated ?? college.quota?.allocated ?? 0;
    const used = college.quotaUsed ?? college.quota?.used ?? 0;
    const availableSeats = allocated - used;

    if (allocated > 0 && studentIds.length > availableSeats) {
      throw new QuotaExceededError(
        `Insufficient quota: Request requires ${studentIds.length} seats, but only ${availableSeats} available (${used}/${allocated} used).`
      );
    }

    for (const sid of studentIds) {
      const stu = this.students.find((s: any) => s.id === sid);
      if (stu) {
        stu.services = Array.from(new Set([...(stu.services || []), ...services]));
        stu.updatedAt = new Date().toISOString();
      }
    }

    college.quotaUsed = used + studentIds.length;
    if (college.quota) college.quota.used = used + studentIds.length;

    const job = {
      id: `job-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    this.provisioningJobs.unshift(job);
    return { job, successful: studentIds.length };
  }

  async bulkImportStudentsWithQuota(collegeId: string, rawStudents: any[], actor: any) {
    const college = this.colleges.find((c: any) => c.id === collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const errors: Array<{ rollNumber: string; reason: string }> = [];
    const insertedStudents: any[] = [];
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();

    const allocated = college.quotaAllocated ?? college.quota?.allocated ?? 0;
    let currentUsed = college.quotaUsed ?? college.quota?.used ?? 0;

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

      const existingInCollege = this.students.find(
        (s: any) => s.collegeId === collegeId && s.rollNumber.toUpperCase() === roll
      );
      if (existingInCollege) {
        errors.push({ rollNumber: roll, reason: 'Roll number already enrolled in this institution' });
        continue;
      }

      const existingEmailInCollege = this.students.find(
        (s: any) => s.collegeId === collegeId && (s.email || '').toLowerCase() === cleanEmail
      );
      if (existingEmailInCollege) {
        errors.push({ rollNumber: roll, reason: 'Email already enrolled in this institution' });
        continue;
      }

      if (allocated > 0 && currentUsed >= allocated) {
        errors.push({ rollNumber: roll, reason: 'Institutional quota exhausted; seat limit reached' });
        continue;
      }

      const id = `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newStudent = {
        id,
        name: item.name,
        rollNumber: roll,
        collegeId,
        collegeName: college.name,
        department: item.department || 'General',
        course: item.course || 'Undergraduate',
        batch: item.batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
        email: cleanEmail,
        phone: item.phone,
        accessStatus: 'Active',
        services: ['BEXO Portfolio', 'BEXO Templates'],
        entitlementId: `ent-${id}`,
        enrolledYear: new Date().getFullYear(),
        resumeCount: 0,
        portfolioSubdomain: item.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        lastActivityAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.students.push(newStudent);
      insertedStudents.push(newStudent);
      currentUsed++;
    }

    college.quotaUsed = currentUsed;
    if (college.quota) college.quota.used = currentUsed;
    college.totalStudents = (college.totalStudents || 0) + insertedStudents.length;
    college.activeStudents = (college.activeStudents || 0) + insertedStudents.length;

    let jobStatus = 'Completed';
    if (insertedStudents.length === 0 && errors.length > 0) {
      jobStatus = 'Failed';
    } else if (errors.length > 0) {
      jobStatus = 'Partially Completed';
    }

    const job = {
      id: `job-${Date.now()}`,
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
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    this.provisioningJobs.unshift(job);
    return { job, insertedStudents, errors };
  }

  // --- ENTITLEMENTS ---
  async getEntitlementsByCollege(collegeId: string) {
    return this.entitlements.filter((e: any) => e.collegeId === collegeId);
  }

  async createEntitlement(entitlement: any) {
    this.entitlements.push(entitlement);
    return entitlement;
  }

  // --- PROVISIONING JOBS ---
  async getProvisioningJobsByCollege(collegeId: string) {
    return this.provisioningJobs.filter((j: any) => j.collegeId === collegeId);
  }

  async getProvisioningJobById(id: string, collegeId: string) {
    return this.provisioningJobs.find((j: any) => j.id === id && j.collegeId === collegeId) || null;
  }

  async createProvisioningJob(job: any) {
    this.provisioningJobs.push(job);
    return job;
  }

  async updateProvisioningJob(id: string, updates: any) {
    const idx = this.provisioningJobs.findIndex((j: any) => j.id === id);
    if (idx === -1) throw new Error('Job not found');
    this.provisioningJobs[idx] = { ...this.provisioningJobs[idx], ...updates };
    return this.provisioningJobs[idx];
  }

  // --- REQUESTS ---
  async getRequestsByCollege(collegeId: string) {
    return this.approvals.filter((r: any) => r.collegeId === collegeId);
  }

  async getRequestById(id: string) {
    return this.approvals.find((r: any) => r.id === id) || null;
  }

  async createRequest(req: any) {
    this.approvals.push(req);
    return req;
  }

  async updateRequest(id: string, updates: any) {
    const idx = this.approvals.findIndex((r: any) => r.id === id);
    if (idx === -1) throw new Error('Request not found');
    this.approvals[idx] = { ...this.approvals[idx], ...updates };
    return this.approvals[idx];
  }

  // --- AGREEMENTS & INVOICES ---
  async getAgreementByCollege(collegeId: string) {
    return this.agreements.find((a: any) => a.collegeId === collegeId) || null;
  }

  async getInvoicesByCollege(collegeId: string) {
    return this.invoices.filter((i: any) => i.collegeId === collegeId);
  }

  // --- NOTIFICATIONS, ANNOUNCEMENTS, TASKS ---
  async getNotificationsByCollege(collegeId: string) {
    return this.notifications.filter((n: any) => n.collegeId === collegeId);
  }

  async markNotificationRead(id: string, collegeId: string) {
    const n = this.notifications.find((x: any) => x.id === id && x.collegeId === collegeId);
    if (n) n.isRead = true;
  }

  async markAllNotificationsRead(collegeId: string) {
    for (const n of this.notifications) {
      if (n.collegeId === collegeId) n.isRead = true;
    }
  }

  async createNotification(notif: any) {
    this.notifications.unshift(notif);
    return notif;
  }

  async getAnnouncementsForCollege(collegeId: string) {
    return this.announcements.filter((a: any) => !a.collegeId || a.collegeId === collegeId);
  }

  async getTasksByCollege(collegeId: string) {
    return this.tasks.filter((t: any) => t.collegeId === collegeId);
  }

  async toggleTask(id: string, collegeId: string) {
    const t = this.tasks.find((x: any) => x.id === id && x.collegeId === collegeId);
    if (!t) throw new Error('Task not found');
    t.status = t.status === 'Completed' ? 'In Progress' : 'Completed';
    return t;
  }

  async revokeEntitlement(id: string, collegeId: string, reason?: string) {
    const e = this.entitlements.find((x: any) => x.id === id && x.collegeId === collegeId);
    if (!e) throw new Error('Entitlement not found');
    e.status = 'Revoked';
    e.revokeReason = reason;
    e.lastUpdated = new Date().toISOString();
    return e;
  }

  async reactivateEntitlement(id: string, collegeId: string) {
    const e = this.entitlements.find((x: any) => x.id === id && x.collegeId === collegeId);
    if (!e) throw new Error('Entitlement not found');
    e.status = 'Active';
    e.revokeReason = null;
    e.lastUpdated = new Date().toISOString();
    return e;
  }

  // --- AUDIT LOGS ---
  async getAuditLogsByCollege(collegeId: string) {
    return this.auditLogs.filter((a: any) => a.collegeId === collegeId);
  }


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
      quotaAllocated: collegeData.quotaAllocated ?? collegeData.quota?.allocated ?? 1000,
      quotaUsed: 0,
      warningThreshold: 80,
      criticalThreshold: 95,
      departmentLimits: collegeData.departmentLimits || {},
      services: collegeData.services || [
        { serviceId: 'srv-1', name: 'BEXO Portfolio', isEnabled: true, activatedAt: new Date().toISOString(), studentsUsing: 0, planLevel: 'Enterprise' },
        { serviceId: 'srv-2', name: 'BEXO Templates', isEnabled: true, activatedAt: new Date().toISOString(), studentsUsing: 0, planLevel: 'Enterprise' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.colleges.push(newCollege);

    // Initial quota history
    this.quotaHistories.push({
      id: `qh-${Date.now()}`,
      collegeId: id,
      timestamp: new Date().toISOString(),
      adminName: 'Corporate Admin',
      previousAllocated: 0,
      newAllocated: newCollege.quotaAllocated,
      reason: 'Initial institutional provisioning quota',
    });

    return this.normalizeCollege(newCollege);
  }

  async getQuotaHistory(collegeId?: string) {
    if (collegeId) {
      return this.quotaHistories.filter((h: any) => h.collegeId === collegeId);
    }
    return [...this.quotaHistories];
  }

  async toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean) {
    const idx = this.colleges.findIndex((c: any) => c.id === collegeId);
    if (idx === -1) throw new Error('College not found');
    const college = this.colleges[idx];
    const services = college.services || [];
    const sIdx = services.findIndex((s: any) => s.serviceId === serviceId);
    if (sIdx !== -1) {
      services[sIdx].isEnabled = enabled;
      if (enabled) services[sIdx].activatedAt = new Date().toISOString();
    } else {
      services.push({
        serviceId,
        name: serviceId,
        isEnabled: enabled,
        activatedAt: new Date().toISOString(),
        studentsUsing: 0,
        planLevel: 'Enterprise',
      });
    }
    college.services = services;
    college.updatedAt = new Date().toISOString();
    return this.normalizeCollege(college);
  }

  async getAllStudents(filters: { collegeId?: string; department?: string; status?: string; search?: string; page?: number; limit?: number } = {}) {
    let list = [...this.students];
    if (filters.collegeId) {
      list = list.filter((s: any) => s.collegeId === filters.collegeId);
    }
    if (filters.department) {
      list = list.filter((s: any) => s.department === filters.department);
    }
    if (filters.status) {
      list = list.filter((s: any) => (s.accessStatus || s.status) === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((s: any) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async revokeStudent(studentId: string, reason?: string) {
    const idx = this.students.findIndex((s: any) => s.id === studentId);
    if (idx === -1) throw new Error('Student not found');
    this.students[idx].accessStatus = 'Revoked';
    this.students[idx].updatedAt = new Date().toISOString();
    return this.students[idx];
  }

  async reactivateStudent(studentId: string) {
    const idx = this.students.findIndex((s: any) => s.id === studentId);
    if (idx === -1) throw new Error('Student not found');
    this.students[idx].accessStatus = 'Active';
    this.students[idx].updatedAt = new Date().toISOString();
    return this.students[idx];
  }

  async getAllProvisioningJobs(collegeId?: string) {
    if (collegeId) {
      return this.provisioningJobs.filter((j: any) => j.collegeId === collegeId);
    }
    return [...this.provisioningJobs];
  }

  async createProvisioningBatch(payload: any, createdBy: string) {
    const college = await this.getCollegeById(payload.collegeId);
    const count = payload.batchSize || (payload.startRoll && payload.endRoll ? 50 : 25);
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
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    this.provisioningJobs.unshift(newJob);
    return newJob;
  }

  async getAllApprovals(status?: string) {
    if (status) {
      return this.approvals.filter((a: any) => a.status === status);
    }
    return [...this.approvals];
  }

  async approveRequest(id: string, decisionReason: string, reviewer: string) {
    const idx = this.approvals.findIndex((a: any) => a.id === id);
    if (idx === -1) throw new Error('Request not found');
    const req = this.approvals[idx];
    req.status = 'Approved';
    req.decisionReason = decisionReason;
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();

    if (req.type === 'Quota Increase') {
      const targetVal = req.details?.requestedValue ? Number(req.details.requestedValue) : null;
      const clg = this.colleges.find((c: any) => c.id === req.collegeId);
      const newQuota = targetVal !== null 
        ? targetVal 
        : ((clg?.quotaAllocated || 5000) + (req.deltaSeats ?? (req.targetTotal ? (req.targetTotal - 5000) : 500)));
      console.log('[DEBUG_APPROVE] targetVal:', targetVal, 'newQuota:', newQuota, 'clg exists:', !!clg);
      if (clg) {
        await this.updateQuota(req.collegeId, newQuota, `Approved request ${id}: ${decisionReason}`, reviewer);
      }
    }
    return req;
  }

  async rejectRequest(id: string, decisionReason: string, reviewer: string) {
    const idx = this.approvals.findIndex((a: any) => a.id === id);
    if (idx === -1) throw new Error('Request not found');
    const req = this.approvals[idx];
    req.status = 'Rejected';
    req.decisionReason = decisionReason;
    req.reviewedBy = reviewer;
    req.reviewedAt = new Date().toISOString();
    return req;
  }

  async getAllServices() {
    return [...this.platformServices];
  }

  async togglePlatformServiceGlobal(serviceId: string) {
    const s = this.platformServices.find((ps: any) => ps.id === serviceId);
    if (!s) throw new Error('Service not found');
    s.isGlobalActive = !s.isGlobalActive;
    return s;
  }

  async getAllInvoices(collegeId?: string) {
    if (collegeId) {
      return this.invoices.filter((i: any) => i.collegeId === collegeId);
    }
    return [...this.invoices];
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
      createdAt: new Date().toISOString(),
    };
    this.invoices.unshift(invoice);
    return invoice;
  }

  async getAllAdminNotifications() {
    return [...this.notifications];
  }

  async deleteNotification(id: string) {
    const idx = this.notifications.findIndex((n: any) => n.id === id);
    if (idx !== -1) {
      this.notifications.splice(idx, 1);
      return true;
    }
    return false;
  }

  async getAllAuditLogs(entity?: string, page: number = 1, limit: number = 50) {
    let logs = [...this.auditLogs];
    if (entity) {
      logs = logs.filter((l: any) => l.entity === entity);
    }
    return logs;
  }

  async getAllStaffUsers(collegeId?: string) {
    if (collegeId) {
      return this.staffUsers.filter((u: any) => u.collegeId === collegeId);
    }
    return this.staffUsers.map((u: any) => {
      const safe = { ...u };
      delete safe.passwordHash;
      return safe;
    });
  }

  async createStaffUser(payload: any) {
    const id = payload.id || `usr-${Date.now().toString(36)}`;
    const newStaff = {
      id,
      name: payload.name,
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone,
      role: payload.role,
      collegeId: payload.collegeId || null,
      collegeName: payload.collegeName,
      department: payload.department,
      designation: payload.designation,
      isActive: payload.isActive ?? true,
      accountStatus: payload.accountStatus || 'ACTIVE',
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.staffUsers.push(newStaff);
    return newStaff;
  }

  async updateStaffUser(id: string, updates: any) {
    const idx = this.staffUsers.findIndex((u: any) => u.id === id);
    if (idx === -1) throw new Error('Staff user not found');
    this.staffUsers[idx] = {
      ...this.staffUsers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const safe = { ...this.staffUsers[idx] };
    delete safe.passwordHash;
    return safe;
  }

  async deleteStaffUser(id: string) {
    const idx = this.staffUsers.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      this.staffUsers[idx].isActive = false;
      this.staffUsers[idx].accountStatus = 'REVOKED';
      this.staffUsers[idx].sessionVersion = (this.staffUsers[idx].sessionVersion || 1) + 1;
      return true;
    }
    return false;
  }

  async getAllTemplates() {
    return [...this.templates];
  }

  async getTemplateById(id: string) {
    return this.templates.find((t: any) => t.id === id) || null;
  }

  async createTemplate(payload: any) {
    const id = payload.id || `tmpl-${Date.now().toString(36)}`;
    const newTmpl = {
      id,
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: payload.category || 'portfolio',
      description: payload.description || '',
      version: payload.version || '1.0.0',
      thumbnailColor: payload.thumbnailColor || 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
      previewUrl: payload.previewUrl,
      tier: payload.tier || 'Free',
      status: payload.status || 'Published',
      isFeatured: payload.isFeatured ?? false,
      downloadsCount: 0,
      activeUsersCount: 0,
      tags: payload.tags || ['portfolio'],
      sourceBundle: payload.sourceBundle,
      compatibleAppVersion: payload.compatibleAppVersion || '>= 2.0.0',
      author: payload.author || 'BEXO Design Team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.unshift(newTmpl);
    return newTmpl;
  }

  async updateTemplate(id: string, updates: any) {
    const idx = this.templates.findIndex((t: any) => t.id === id);
    if (idx === -1) throw new Error('Template not found');
    this.templates[idx] = {
      ...this.templates[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.templates[idx];
  }

  async deleteTemplate(id: string) {
    const idx = this.templates.findIndex((t: any) => t.id === id);
    if (idx !== -1) {
      this.templates.splice(idx, 1);
      return true;
    }
    return false;
  }

  async toggleTemplatePublish(id: string) {
    const t = await this.getTemplateById(id);
    if (!t) throw new Error('Template not found');
    t.status = t.status === 'Published' ? 'Draft' : 'Published';
    t.updatedAt = new Date().toISOString();
    return t;
  }

  async toggleTemplateFeatured(id: string) {
    const t = await this.getTemplateById(id);
    if (!t) throw new Error('Template not found');
    t.isFeatured = !t.isFeatured;
    t.updatedAt = new Date().toISOString();
    return t;
  }

  async getSystemHealth() {
    return [
      {
        name: 'PostgreSQL Primary Cluster',
        status: 'Healthy',
        latencyMs: 1.8,
        uptimePct: 99.98,
        details: 'Active connection pool: 8/32 connections. Zero replication lag.',
      },
      {
        name: 'Redis In-Memory Session Cache',
        status: 'Healthy',
        latencyMs: 0.4,
        uptimePct: 100.0,
        details: 'Memory utilization 14.2MB of 512MB quota. Hit ratio: 98.4%.',
      },
      {
        name: 'MSG91 OTP & Telephony Gateway',
        status: 'Healthy',
        latencyMs: 145.0,
        uptimePct: 99.94,
        details: 'Primary DLT pipeline operational. SMS OTP delivery latency < 4.2s.',
      },
      {
        name: 'Cloudflare Edge CDN & DNS Proxy',
        status: 'Healthy',
        latencyMs: 12.0,
        uptimePct: 100.0,
        details: 'Portfolio wildcard subdomains active across edge routing.',
      },
      {
        name: 'Student Provisioning Worker',
        status: 'Healthy',
        latencyMs: 45.0,
        uptimePct: 99.95,
        details: 'Async batch worker queue empty. All roster imports reconciled.',
      },
    ];
  }

  // --- MOBILE IDENTITY LINKAGE (Phase 5) ---
  async linkMobileStudent(mobileUserId: string, email: string, phone?: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    // Normalize gmail
    let normalized = cleanEmail;
    if (cleanEmail.endsWith('@gmail.com') || cleanEmail.endsWith('@googlemail.com')) {
      const parts = cleanEmail.split('@');
      const userPart = parts[0].replace(/\./g, '').split('+')[0];
      normalized = `${userPart}@${parts[1]}`;
    }

    const student = this.students.find((s: any) => {
      const sEmail = (s.email || '').trim().toLowerCase();
      let sNorm = sEmail;
      if (sEmail.endsWith('@gmail.com') || sEmail.endsWith('@googlemail.com')) {
        const parts = sEmail.split('@');
        sNorm = `${parts[0].replace(/\./g, '').split('+')[0]}@${parts[1]}`;
      }
      return sNorm === normalized || s.normalizedEmail === normalized || sEmail === cleanEmail;
    });

    if (!student) {
      return { linked: false, message: 'No student match in active college roster.' };
    }

    const college = await this.getCollegeById(student.collegeId);
    if (!college || college.status === 'Suspended') {
      return { linked: false, message: 'Institutional college is currently suspended or inactive.' };
    }

    student.userId = mobileUserId;
    student.phone = phone || student.phone;
    student.linkedAt = new Date().toISOString();
    student.updatedAt = new Date().toISOString();

    await this.createAuditLog({
      id: `aud-link-${Date.now()}`,
      collegeId: student.collegeId,
      actorStaffId: 'system-m2m-mobile',
      actorName: 'Mobile Link Gateway',
      actorRole: 'system',
      action: 'LINK_MOBILE_STUDENT',
      entity: 'Student',
      entityId: student.id,
      entityName: student.name,
      ip: '127.0.0.1',
      result: 'Success',
      reason: `Linked mobile user ${mobileUserId} with student ${student.rollNumber}`,
    });

    return {
      linked: true,
      student: {
        id: student.id,
        collegeId: student.collegeId,
        collegeName: student.collegeName,
        rollNumber: student.rollNumber,
        department: student.department,
        services: student.services,
      },
    };
  }

  async getMobileStudentEntitlements(userId: string) {
    const student = this.students.find((s: any) => s.userId === userId);
    if (!student) {
      return { isLinked: false, message: 'User not linked to an institutional student.' };
    }

    const college = await this.getCollegeById(student.collegeId);
    return {
      isLinked: true,
      student: {
        id: student.id,
        collegeId: student.collegeId,
        collegeName: student.collegeName,
        rollNumber: student.rollNumber,
        department: student.department,
        accessStatus: student.accessStatus || 'Active',
      },
      collegeStatus: college ? college.status : 'Unknown',
      dashboardAccess: college ? college.dashboardAccess : false,
      entitlements: (student.services || []).map((s: string, idx: number) => ({
        serviceId: `srv-${idx + 1}`,
        serviceName: s,
        status: (college && college.status === 'Suspended') ? 'Suspended' : (student.accessStatus === 'Revoked' ? 'Revoked' : 'Active'),
      })),
    };
  }

  async createAuditLog(log: any) {
    this.auditLogs.unshift(log);
    return log;
  }
}

export interface Repository {
  getCollegeById(id: string): Promise<any>;
  getCollegeBySlug(slug: string): Promise<any>;
  getAllColleges(): Promise<any[]>;
  updateCollege(id: string, updates: any): Promise<any>;
  updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string): Promise<any>;
  getStaffByEmail(email: string): Promise<any>;
  getStaffById(id: string): Promise<any>;
  getStaffByCollege(collegeId: string): Promise<any[]>;
  createStaff(user: any): Promise<any>;
  updateStaff(id: string, updates: any): Promise<any>;
  createInvitation(invite: any): Promise<any>;
  getInvitationByToken(token: string): Promise<any>;
  getInvitationById(id: string): Promise<any>;
  updateInvitation(id: string, updates: any): Promise<any>;
  createResetToken(tokenObj: any): Promise<any>;
  getResetToken(token: string): Promise<any>;
  markResetTokenUsed(token: string): Promise<void>;
  getStudentsByCollege(collegeId: string, filters?: StudentFilters): Promise<{ students: any[]; total: number }>;
  getStudentById(id: string, collegeId?: string): Promise<any>;
  getStudentByRollNumber(collegeId: string, rollNumber: string): Promise<any>;
  getStudentByEmail(collegeId: string, email: string): Promise<any>;
  createStudent(student: any): Promise<any>;
  updateStudent(id: string, collegeId: string, updates: any): Promise<any>;
  enrollStudentWithQuota(studentData: any, actor: { userId: string; name: string; role: string; ip: string }): Promise<any>;
  provisionBatchWithQuota(collegeId: string, studentIds: string[], services: string[], actor: any): Promise<any>;
  bulkImportStudentsWithQuota(collegeId: string, rawStudents: any[], actor: any): Promise<any>;
  getEntitlementsByCollege(collegeId: string): Promise<any[]>;
  createEntitlement(entitlement: any): Promise<any>;
  revokeEntitlement(id: string, collegeId: string, reason?: string): Promise<any>;
  reactivateEntitlement(id: string, collegeId: string): Promise<any>;
  getProvisioningJobsByCollege(collegeId: string): Promise<any[]>;
  getProvisioningJobById(id: string, collegeId: string): Promise<any>;
  createProvisioningJob(job: any): Promise<any>;
  updateProvisioningJob(id: string, arg2: any, arg3?: any): Promise<any>;
  getRequestsByCollege(collegeId: string): Promise<any[]>;
  getRequestById(id: string): Promise<any>;
  createRequest(req: any): Promise<any>;
  updateRequest(id: string, updates: any): Promise<any>;
  getAgreementByCollege(collegeId: string): Promise<any>;
  getInvoicesByCollege(collegeId: string): Promise<any[]>;
  getNotificationsByCollege(collegeId: string): Promise<any[]>;
  markNotificationRead(id: string, collegeId: string): Promise<void>;
  markAllNotificationsRead(collegeId: string): Promise<void>;
  createNotification(notif: any): Promise<any>;
  getAnnouncementsForCollege(collegeId: string): Promise<any[]>;
  getTasksByCollege(collegeId: string): Promise<any[]>;
  toggleTask(id: string, collegeId: string): Promise<any>;
  getAuditLogsByCollege(collegeId: string): Promise<any[]>;
  createAuditLog(log: any): Promise<any>;
  createCollege(collegeData: any): Promise<any>;
  getQuotaHistory(collegeId?: string): Promise<any[]>;
  toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean): Promise<any>;
  getAllStudents(filters?: any): Promise<any[]>;
  revokeStudent(studentId: string, reason?: string): Promise<any>;
  reactivateStudent(studentId: string): Promise<any>;
  getAllProvisioningJobs(collegeId?: string): Promise<any[]>;
  createProvisioningBatch(payload: any, createdBy: string): Promise<any>;
  getAllApprovals(status?: string): Promise<any[]>;
  approveRequest(id: string, decisionReason: string, reviewer: string): Promise<any>;
  rejectRequest(id: string, decisionReason: string, reviewer: string): Promise<any>;
  getAllServices(): Promise<any[]>;
  togglePlatformServiceGlobal(serviceId: string): Promise<any>;
  getAllInvoices(collegeId?: string): Promise<any[]>;
  createPaymentInvoice(payload: any): Promise<any>;
  getAllAdminNotifications(): Promise<any[]>;
  deleteNotification(id: string): Promise<boolean>;
  getAllAuditLogs(entity?: string, page?: number, limit?: number): Promise<any[]>;
  getAllStaffUsers(collegeId?: string): Promise<any[]>;
  createStaffUser(payload: any): Promise<any>;
  updateStaffUser(id: string, updates: any): Promise<any>;
  deleteStaffUser(id: string): Promise<boolean>;
  getAllTemplates(): Promise<any[]>;
  getTemplateById(id: string): Promise<any>;
  createTemplate(payload: any): Promise<any>;
  updateTemplate(id: string, updates: any): Promise<any>;
  deleteTemplate(id: string): Promise<boolean>;
  toggleTemplatePublish(id: string): Promise<any>;
  toggleTemplateFeatured(id: string): Promise<any>;
  getSystemHealth(): Promise<any[]>;
  linkMobileStudent(mobileUserId: string, email: string, phone?: string): Promise<any>;
  getMobileStudentEntitlements(userId: string): Promise<any>;

}

import { DrizzlePostgresRepository } from './postgresRepository';
import { env } from '../config/env';

export class StoreDelegate implements Repository {
  private activeStore: Repository;
  private storeKind: 'postgres' | 'memory';

  constructor() {
    const isHardened = env.NODE_ENV === 'production' || env.NODE_ENV === 'staging';
    const forcePostgres = env.USE_POSTGRES_STORE || process.env.USE_POSTGRES_STORE === 'true';

    if (isHardened || forcePostgres) {
      this.activeStore = new DrizzlePostgresRepository();
      this.storeKind = 'postgres';
    } else {
      this.activeStore = new MemoryStore();
      this.storeKind = 'memory';
    }
  }

  get kind(): 'postgres' | 'memory' {
    return this.storeKind;
  }

  setStore(newStore: Repository, kind: 'postgres' | 'memory' = 'memory') {
    this.activeStore = newStore;
    this.storeKind = kind;
  }

  get active(): Repository {
    return this.activeStore;
  }

  getCollegeById(id: string) { return this.activeStore.getCollegeById(id); }
  getCollegeBySlug(slug: string) { return this.activeStore.getCollegeBySlug(slug); }
  getAllColleges() { return this.activeStore.getAllColleges(); }
  updateCollege(id: string, updates: any) { return this.activeStore.updateCollege(id, updates); }
  updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string) {
    return this.activeStore.updateQuota(collegeId, newAllocated, reason, adminName);
  }
  getStaffByEmail(email: string) { return this.activeStore.getStaffByEmail(email); }
  getStaffById(id: string) { return this.activeStore.getStaffById(id); }
  getStaffByCollege(collegeId: string) { return this.activeStore.getStaffByCollege(collegeId); }
  createStaff(user: any) { return this.activeStore.createStaff(user); }
  updateStaff(id: string, updates: any) { return this.activeStore.updateStaff(id, updates); }
  createInvitation(invite: any) { return this.activeStore.createInvitation(invite); }
  getInvitationByToken(token: string) { return this.activeStore.getInvitationByToken(token); }
  getInvitationById(id: string) { return this.activeStore.getInvitationById(id); }
  updateInvitation(id: string, updates: any) { return this.activeStore.updateInvitation(id, updates); }
  createResetToken(tokenObj: any) { return this.activeStore.createResetToken(tokenObj); }
  getResetToken(token: string) { return this.activeStore.getResetToken(token); }
  markResetTokenUsed(token: string) { return this.activeStore.markResetTokenUsed(token); }
  getStudentsByCollege(collegeId: string, filters?: StudentFilters) {
    return this.activeStore.getStudentsByCollege(collegeId, filters);
  }
  getStudentById(id: string, collegeId?: string) { return this.activeStore.getStudentById(id, collegeId); }
  getStudentByRollNumber(collegeId: string, rollNumber: string) {
    return this.activeStore.getStudentByRollNumber(collegeId, rollNumber);
  }
  getStudentByEmail(collegeId: string, email: string) {
    return this.activeStore.getStudentByEmail(collegeId, email);
  }
  createStudent(student: any) { return this.activeStore.createStudent(student); }
  updateStudent(id: string, collegeId: string, updates: any) {
    return this.activeStore.updateStudent(id, collegeId, updates);
  }
  enrollStudentWithQuota(studentData: any, actor: any) {
    return this.activeStore.enrollStudentWithQuota(studentData, actor);
  }
  provisionBatchWithQuota(collegeId: string, studentIds: string[], services: string[], actor: any) {
    return this.activeStore.provisionBatchWithQuota(collegeId, studentIds, services, actor);
  }
  bulkImportStudentsWithQuota(collegeId: string, rawStudents: any[], actor: any) {
    return this.activeStore.bulkImportStudentsWithQuota(collegeId, rawStudents, actor);
  }
  getEntitlementsByCollege(collegeId: string) { return this.activeStore.getEntitlementsByCollege(collegeId); }
  createEntitlement(entitlement: any) { return this.activeStore.createEntitlement(entitlement); }
  revokeEntitlement(id: string, collegeId: string, reason?: string) {
    return this.activeStore.revokeEntitlement(id, collegeId, reason);
  }
  reactivateEntitlement(id: string, collegeId: string) {
    return this.activeStore.reactivateEntitlement(id, collegeId);
  }
  getProvisioningJobsByCollege(collegeId: string) { return this.activeStore.getProvisioningJobsByCollege(collegeId); }
  getProvisioningJobById(id: string, collegeId: string) { return this.activeStore.getProvisioningJobById(id, collegeId); }
  createProvisioningJob(job: any) { return this.activeStore.createProvisioningJob(job); }
  updateProvisioningJob(id: string, arg2: any, arg3?: any) {
    return this.activeStore.updateProvisioningJob(id, arg2, arg3);
  }
  getRequestsByCollege(collegeId: string) { return this.activeStore.getRequestsByCollege(collegeId); }
  getRequestById(id: string) { return this.activeStore.getRequestById(id); }
  createRequest(req: any) { return this.activeStore.createRequest(req); }
  updateRequest(id: string, updates: any) { return this.activeStore.updateRequest(id, updates); }
  getAgreementByCollege(collegeId: string) { return this.activeStore.getAgreementByCollege(collegeId); }
  getInvoicesByCollege(collegeId: string) { return this.activeStore.getInvoicesByCollege(collegeId); }
  getNotificationsByCollege(collegeId: string) { return this.activeStore.getNotificationsByCollege(collegeId); }
  markNotificationRead(id: string, collegeId: string) { return this.activeStore.markNotificationRead(id, collegeId); }
  markAllNotificationsRead(collegeId: string) { return this.activeStore.markAllNotificationsRead(collegeId); }
  createNotification(notif: any) { return this.activeStore.createNotification(notif); }
  getAnnouncementsForCollege(collegeId: string) { return this.activeStore.getAnnouncementsForCollege(collegeId); }
  getTasksByCollege(collegeId: string) { return this.activeStore.getTasksByCollege(collegeId); }
  toggleTask(id: string, collegeId: string) { return this.activeStore.toggleTask(id, collegeId); }
  getAuditLogsByCollege(collegeId: string) { return this.activeStore.getAuditLogsByCollege(collegeId); }
  createAuditLog(log: any) { return this.activeStore.createAuditLog(log); }
  createCollege(data: any) { return this.activeStore.createCollege(data); }
  getQuotaHistory(collegeId?: string) { return this.activeStore.getQuotaHistory(collegeId); }
  toggleCollegeService(collegeId: string, serviceKey: string, enabled: boolean) { return this.activeStore.toggleCollegeService(collegeId, serviceKey, enabled); }
  getAllStudents(filters?: any) { return this.activeStore.getAllStudents(filters); }
  revokeStudent(studentId: string, reason?: string) { return this.activeStore.revokeStudent(studentId, reason); }
  reactivateStudent(studentId: string) { return this.activeStore.reactivateStudent(studentId); }
  getAllProvisioningJobs(filters?: any) { return this.activeStore.getAllProvisioningJobs(filters); }
  createProvisioningBatch(payload: any, createdBy: string) { return this.activeStore.createProvisioningBatch(payload, createdBy); }
  getAllApprovals(filters?: any) { return this.activeStore.getAllApprovals(filters); }
  approveRequest(id: string, decisionReason: string, reviewer: string) { return this.activeStore.approveRequest(id, decisionReason, reviewer); }
  rejectRequest(id: string, decisionReason: string, reviewer: string) { return this.activeStore.rejectRequest(id, decisionReason, reviewer); }
  getAllServices() { return this.activeStore.getAllServices(); }
  togglePlatformServiceGlobal(serviceId: string) { return this.activeStore.togglePlatformServiceGlobal(serviceId); }
  getAllInvoices(filters?: any) { return this.activeStore.getAllInvoices(filters); }
  createPaymentInvoice(data: any) { return this.activeStore.createPaymentInvoice(data); }
  getAllAdminNotifications() { return this.activeStore.getAllAdminNotifications(); }
  deleteNotification(id: string) { return this.activeStore.deleteNotification(id); }
  getAllAuditLogs(entity?: string, page?: number, limit?: number) { return this.activeStore.getAllAuditLogs(entity, page, limit); }
  getAllStaffUsers(filters?: any) { return this.activeStore.getAllStaffUsers(filters); }
  createStaffUser(data: any) { return this.activeStore.createStaffUser(data); }
  updateStaffUser(id: string, updates: any) { return this.activeStore.updateStaffUser(id, updates); }
  deleteStaffUser(id: string) { return this.activeStore.deleteStaffUser(id); }
  getAllTemplates() { return this.activeStore.getAllTemplates(); }
  getTemplateById(id: string) { return this.activeStore.getTemplateById(id); }
  createTemplate(data: any) { return this.activeStore.createTemplate(data); }
  updateTemplate(id: string, updates: any) { return this.activeStore.updateTemplate(id, updates); }
  deleteTemplate(id: string) { return this.activeStore.deleteTemplate(id); }
  toggleTemplatePublish(id: string) { return this.activeStore.toggleTemplatePublish(id); }
  toggleTemplateFeatured(id: string) { return this.activeStore.toggleTemplateFeatured(id); }
  getSystemHealth() { return this.activeStore.getSystemHealth(); }
  linkMobileStudent(studentId: string, mobileUserId: string, authProvider: string) { return this.activeStore.linkMobileStudent(studentId, mobileUserId, authProvider); }
  getMobileStudentEntitlements(mobileUserId: string) { return this.activeStore.getMobileStudentEntitlements(mobileUserId); }
}

export const store = new StoreDelegate();

