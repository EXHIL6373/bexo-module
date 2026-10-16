import { AdminRepository, CollegeFilters, StudentFilters } from './types';
import { NotFoundError, ConflictError, QuotaExceededError, ValidationError } from '../../shared/errors/AppError';
import {
  SEED_STAFF_USERS,
  SEED_SERVICES,
  SEED_COLLEGES,
  SEED_STUDENTS,
  SEED_PROVISIONING_JOBS,
  SEED_APPROVALS,
  SEED_PAYMENTS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
  SEED_TEMPLATES,
} from '../seedData';

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

export class MemoryRepository implements AdminRepository {
  public staffUsers: any[] = clone(SEED_STAFF_USERS);
  public colleges: any[] = clone(SEED_COLLEGES);
  public students: any[] = clone(SEED_STUDENTS);
  public provisioningJobs: any[] = clone(SEED_PROVISIONING_JOBS);
  public approvals: any[] = clone(SEED_APPROVALS);
  public services: any[] = clone(SEED_SERVICES);
  public payments: any[] = clone(SEED_PAYMENTS);
  public notifications: any[] = clone(SEED_NOTIFICATIONS);
  public auditLogs: any[] = clone(SEED_AUDIT_LOGS);
  public templates: any[] = clone(SEED_TEMPLATES);
  public invitations: any[] = [];
  public resetTokens: any[] = [];
  public sessions: any[] = [];
  public outboxEvents: any[] = [];
  public quotaHistoryList: any[] = [
    {
      id: 'qh-seed-01',
      collegeId: 'clg-psg-01',
      timestamp: new Date('2025-06-01T00:00:00Z').toISOString(),
      adminName: 'Central Admin Team',
      previousAllocated: 0,
      newAllocated: 5000,
      reason: 'Initial institutional enterprise onboarding quota allocation',
    },
  ];

  private normalizeCollege(c: any) {
    if (!c) return null;
    const allocated = c.quotaAllocated ?? c.quota?.allocated ?? 1000;
    const used = c.quotaUsed ?? c.quota?.used ?? 0;
    const warning = c.warningThreshold ?? c.quota?.warningThreshold ?? 80;
    const critical = c.criticalThreshold ?? c.quota?.criticalThreshold ?? 95;
    const deptLimits = c.departmentLimits ?? c.quota?.departmentLimits ?? {};

    return {
      ...c,
      quotaAllocated: allocated,
      quotaUsed: used,
      warningThreshold: warning,
      criticalThreshold: critical,
      departmentLimits: deptLimits,
      quota: {
        allocated,
        used,
        warningThreshold: warning,
        criticalThreshold: critical,
        departmentLimits: deptLimits,
      },
      services: c.services || [],
      agreement: c.agreement || {},
    };
  }

  // --- STAFF USERS ---
  async getStaffByEmail(email: string) {
    const found = this.staffUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    return found ? clone(found) : null;
  }

  async getStaffById(id: string) {
    const found = this.staffUsers.find((u) => u.id === id);
    return found ? clone(found) : null;
  }

  async getAllStaffUsers(collegeId?: string) {
    let list = this.staffUsers;
    if (collegeId) {
      list = list.filter((u) => u.collegeId === collegeId);
    }
    return clone(list);
  }

  async createStaffUser(user: any) {
    const id = user.id || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...user,
      id,
      email: user.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.staffUsers.push(record);
    return clone(record);
  }

  async updateStaffUser(id: string, updates: any) {
    const index = this.staffUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundError('Staff user not found.');
    this.staffUsers[index] = {
      ...this.staffUsers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return clone(this.staffUsers[index]);
  }

  async deleteStaffUser(id: string) {
    const index = this.staffUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundError('Staff user not found.');
    this.staffUsers.splice(index, 1);
  }

  async updateLastLogin(userId: string) {
    const user = this.staffUsers.find((u) => u.id === userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
    }
  }

  async bumpSessionVersion(userId: string): Promise<number> {
    const user = this.staffUsers.find((u) => u.id === userId);
    if (!user) throw new NotFoundError('User not found.');
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    user.updatedAt = new Date().toISOString();
    return user.sessionVersion;
  }

  // --- SESSIONS ---
  async createSession(session: any) {
    this.sessions.push({
      ...session,
      id: session.id || `sess-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRevoked: false,
    });
  }

  async getSessionByTokenHash(tokenHash: string) {
    const found = this.sessions.find((s) => s.tokenHash === tokenHash && !s.isRevoked);
    return found ? clone(found) : null;
  }

  async revokeSession(tokenHash: string) {
    const session = this.sessions.find((s) => s.tokenHash === tokenHash);
    if (session) {
      session.isRevoked = true;
    }
  }

  async revokeAllUserSessions(userId: string) {
    for (const s of this.sessions) {
      if (s.userId === userId) {
        s.isRevoked = true;
      }
    }
  }

  // --- INVITATIONS ---
  async getInvitationById(id: string) {
    const found = this.invitations.find((i) => i.id === id);
    return found ? clone(found) : null;
  }

  async getInvitationByTokenHash(tokenHash: string) {
    const found = this.invitations.find((i) => i.tokenHash === tokenHash);
    return found ? clone(found) : null;
  }

  async createInvitation(invite: any) {
    const id = invite.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...invite,
      id,
      invitedAt: invite.invitedAt || new Date().toISOString(),
      expiresAt: invite.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: invite.status || 'INVITED',
    };
    this.invitations.push(record);
    return clone(record);
  }

  async updateInvitation(id: string, updates: any) {
    const index = this.invitations.findIndex((i) => i.id === id);
    if (index === -1) throw new NotFoundError('Invitation not found.');
    this.invitations[index] = { ...this.invitations[index], ...updates };
    return clone(this.invitations[index]);
  }

  async consumeInvitationAndActivateUser(tokenHash: string, passwordHash: string): Promise<{ user: any }> {
    const invite = this.invitations.find((i) => i.tokenHash === tokenHash);
    if (!invite || invite.status !== 'INVITED') {
      throw new ValidationError('Invalid, expired, or already consumed invitation token.');
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      throw new ValidationError('Invitation token has expired.');
    }

    invite.status = 'ACTIVE';
    invite.acceptedAt = new Date().toISOString();

    let user = this.staffUsers.find((u) => u.email.toLowerCase() === invite.email.toLowerCase());
    if (user) {
      user.passwordHash = passwordHash;
      user.isActive = true;
      user.accountStatus = 'ACTIVE';
      user.name = invite.fullName || user.name;
      user.role = invite.role || user.role;
      user.designation = invite.designation || user.designation;
      user.sessionVersion = (user.sessionVersion || 1) + 1;
      user.updatedAt = new Date().toISOString();
    } else {
      const id = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      user = {
        id,
        name: invite.fullName,
        email: invite.email.toLowerCase(),
        phone: invite.phone,
        role: invite.role,
        collegeId: invite.collegeId || null,
        collegeName: invite.collegeName || null,
        designation: invite.designation,
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
        sessionVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.staffUsers.push(user);
    }

    const { passwordHash: _, ...safeUser } = user;
    return { user: clone(safeUser) };
  }

  // --- PASSWORD RESETS ---
  async createPasswordResetToken(reset: any) {
    const id = reset.id || `prt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...reset,
      id,
      createdAt: new Date().toISOString(),
      expiresAt: reset.expiresAt || new Date(Date.now() + 3600000).toISOString(),
      isUsed: false,
    };
    this.resetTokens.push(record);
    return clone(record);
  }

  async getResetTokenByHash(tokenHash: string) {
    const found = this.resetTokens.find((r) => r.tokenHash === tokenHash);
    return found ? clone(found) : null;
  }

  async markResetTokenUsed(id: string) {
    const token = this.resetTokens.find((r) => r.id === id);
    if (token) {
      token.isUsed = true;
    }
  }

  async consumeResetTokenAndSetPassword(tokenHash: string, newPasswordHash: string): Promise<{ success: boolean; email: string }> {
    const record = this.resetTokens.find((r) => r.tokenHash === tokenHash);
    if (!record || record.isUsed) {
      throw new ValidationError('Invalid, expired, or already used password reset token.');
    }
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      throw new ValidationError('Password reset token has expired.');
    }

    record.isUsed = true;

    const user = this.staffUsers.find((u) => u.id === record.userId);
    if (!user) {
      throw new NotFoundError('Associated staff user not found.');
    }

    user.passwordHash = newPasswordHash;
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    user.updatedAt = new Date().toISOString();

    await this.revokeAllUserSessions(user.id);
    return { success: true, email: user.email };
  }

  // --- COLLEGES ---
  async getAllColleges(filters?: CollegeFilters) {
    let list = this.colleges.map((c) => this.normalizeCollege(c));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }
    if (filters?.status) {
      list = list.filter((c) => c.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.type) {
      list = list.filter((c) => c.type.toLowerCase() === filters.type!.toLowerCase());
    }
    return clone(list);
  }

  async getCollegeById(id: string) {
    const found = this.colleges.find((c) => c.id === id);
    return found ? this.normalizeCollege(clone(found)) : null;
  }

  async getCollegeByCode(code: string) {
    const found = this.colleges.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    return found ? this.normalizeCollege(clone(found)) : null;
  }

  async getCollegeBySlug(slug: string) {
    const found = this.colleges.find((c) => c.slug.toLowerCase() === slug.trim().toLowerCase());
    return found ? this.normalizeCollege(clone(found)) : null;
  }

  async createCollege(college: any) {
    const id = college.id || `clg-${Date.now().toString(36)}`;
    const allocated = college.quota?.allocated ?? college.quotaAllocated ?? 1000;
    const used = college.quota?.used ?? college.quotaUsed ?? 0;
    const warning = college.quota?.warningThreshold ?? college.warningThreshold ?? 80;
    const critical = college.quota?.criticalThreshold ?? college.criticalThreshold ?? 95;
    const deptLimits = college.quota?.departmentLimits ?? college.departmentLimits ?? {};

    const record = {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.colleges.unshift(record);
    return this.normalizeCollege(clone(record));
  }

  async updateCollege(id: string, updates: any) {
    const index = this.colleges.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundError('College not found.');

    const values = { ...updates };
    if (values.quota) {
      if (values.quota.allocated !== undefined) values.quotaAllocated = values.quota.allocated;
      if (values.quota.used !== undefined) values.quotaUsed = values.quota.used;
      if (values.quota.warningThreshold !== undefined) values.warningThreshold = values.quota.warningThreshold;
      if (values.quota.criticalThreshold !== undefined) values.criticalThreshold = values.quota.criticalThreshold;
      if (values.quota.departmentLimits !== undefined) values.departmentLimits = values.quota.departmentLimits;
      delete values.quota;
    }

    this.colleges[index] = {
      ...this.colleges[index],
      ...values,
      updatedAt: new Date().toISOString(),
    };
    return this.normalizeCollege(clone(this.colleges[index]));
  }

  async suspendCollege(id: string, reason: string) {
    return await this.updateCollege(id, {
      status: 'Suspended',
      dashboardAccess: false,
      suspensionReason: reason,
      suspendedAt: new Date().toISOString(),
    });
  }

  async reactivateCollege(id: string, reason?: string) {
    return await this.updateCollege(id, {
      status: 'Active',
      dashboardAccess: true,
      suspensionReason: null,
      reactivatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });
  }

  async updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string) {
    const college = this.colleges.find((c) => c.id === collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const currentUsed = college.quotaUsed ?? college.quota?.used ?? 0;
    if (newAllocated < currentUsed) {
      throw new ValidationError(
        `New quota (${newAllocated}) cannot be lower than currently utilized quota (${currentUsed}).`
      );
    }

    const prev = college.quotaAllocated ?? college.quota?.allocated ?? 0;
    college.quotaAllocated = newAllocated;
    if (college.quota) college.quota.allocated = newAllocated;
    college.updatedAt = new Date().toISOString();

    const historyEntry = {
      id: `qh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collegeId,
      timestamp: new Date().toISOString(),
      adminName,
      previousAllocated: prev,
      newAllocated,
      reason,
    };
    this.quotaHistoryList.unshift(historyEntry);
    return clone(historyEntry);
  }

  async getQuotaHistory(collegeId?: string) {
    let list = this.quotaHistoryList;
    if (collegeId) {
      list = list.filter((q) => q.collegeId === collegeId);
    }
    return clone(list);
  }

  async toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean) {
    const college = this.colleges.find((c) => c.id === collegeId);
    if (!college) throw new NotFoundError('College not found.');

    const services = college.services || [];
    const existingIndex = services.findIndex((s: any) => s.serviceId === serviceId);

    if (existingIndex >= 0) {
      services[existingIndex].isEnabled = enabled;
      if (enabled) services[existingIndex].activatedAt = new Date().toISOString();
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
    return this.normalizeCollege(clone(college));
  }

  // --- STUDENTS ---
  async getAllStudents(filters?: StudentFilters) {
    let list = this.students;
    if (filters?.collegeId) {
      list = list.filter((s) => s.collegeId === filters.collegeId);
    }
    if (filters?.department) {
      list = list.filter((s) => s.department.toLowerCase() === filters.department!.toLowerCase());
    }
    if (filters?.status) {
      list = list.filter((s) => s.accessStatus.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return clone(list);
  }

  async getStudentById(id: string) {
    const found = this.students.find((s) => s.id === id);
    return found ? clone(found) : null;
  }

  async getStudentByRoll(collegeId: string, rollNumber: string) {
    const found = this.students.find(
      (s) => s.collegeId === collegeId && s.rollNumber.toUpperCase() === rollNumber.trim().toUpperCase()
    );
    return found ? clone(found) : null;
  }

  async createStudent(student: any) {
    const id = student.id || `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...student,
      id,
      rollNumber: student.rollNumber.trim().toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.students.unshift(record);
    return clone(record);
  }

  async enrollStudentWithQuota(
    studentData: any,
    actor: { userId: string; name: string; role: string; ip: string }
  ) {
    const college = this.colleges.find((c) => c.id === studentData.collegeId);
    if (!college) {
      throw new NotFoundError(`College '${studentData.collegeId}' does not exist.`);
    }
    if (college.status !== 'Active') {
      throw new ConflictError(`Cannot enroll student: College ${college.name} is currently ${college.status}.`);
    }

    const allocated = college.quotaAllocated ?? college.quota?.allocated ?? 0;
    const used = college.quotaUsed ?? college.quota?.used ?? 0;
    if (used >= allocated) {
      throw new QuotaExceededError(
        `Institutional seat quota limit reached (${used}/${allocated}) for ${college.name}. Request a quota expansion.`
      );
    }

    const existing = this.students.find(
      (s) =>
        s.collegeId === studentData.collegeId &&
        s.rollNumber.toUpperCase() === studentData.rollNumber.trim().toUpperCase()
    );
    if (existing) {
      throw new ConflictError(
        `Student with roll number '${studentData.rollNumber}' is already registered in ${college.name}.`
      );
    }

    const id = studentData.id || `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const created = {
      ...studentData,
      id,
      collegeName: college.name,
      rollNumber: studentData.rollNumber.trim().toUpperCase(),
      accessStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.students.unshift(created);

    college.quotaUsed = used + 1;
    if (college.quota) college.quota.used = used + 1;
    college.totalStudents = (college.totalStudents || 0) + 1;
    college.activeStudents = (college.activeStudents || 0) + 1;

    const auditId = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.auditLogs.unshift({
      id: auditId,
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ADD_STUDENT',
      entity: 'Student',
      entityId: created.id,
      entityName: created.name,
      ip: actor.ip,
      result: 'Success',
      reason: `Enrolled student ${created.rollNumber} under ${college.name}`,
      details: { collegeId: college.id, rollNumber: created.rollNumber, email: created.email },
      timestamp: new Date().toISOString(),
    });

    return clone(created);
  }

  async revokeStudentAccess(id: string, _reason: string) {
    const student = this.students.find((s) => s.id === id);
    if (!student) throw new NotFoundError('Student not found.');
    student.accessStatus = 'Revoked';
    student.updatedAt = new Date().toISOString();
    student.lastActivityAt = new Date().toISOString();
    return clone(student);
  }

  async reactivateStudentAccess(id: string) {
    const student = this.students.find((s) => s.id === id);
    if (!student) throw new NotFoundError('Student not found.');
    student.accessStatus = 'Active';
    student.updatedAt = new Date().toISOString();
    student.lastActivityAt = new Date().toISOString();
    return clone(student);
  }

  // --- PROVISIONING ---
  async getAllProvisioningJobs(collegeId?: string) {
    let list = this.provisioningJobs;
    if (collegeId) {
      list = list.filter((j) => j.collegeId === collegeId);
    }
    return clone(list);
  }

  async getProvisioningJobById(id: string) {
    const found = this.provisioningJobs.find((j) => j.id === id);
    return found ? clone(found) : null;
  }

  async createProvisioningJob(job: any) {
    const id = job.id || `job-prov-${Date.now()}`;
    const record = {
      ...job,
      id,
      createdAt: new Date().toISOString(),
    };
    this.provisioningJobs.unshift(record);
    return clone(record);
  }

  async updateProvisioningJob(id: string, updates: any) {
    const index = this.provisioningJobs.findIndex((j) => j.id === id);
    if (index === -1) throw new NotFoundError('Provisioning job not found.');
    this.provisioningJobs[index] = { ...this.provisioningJobs[index], ...updates };
    return clone(this.provisioningJobs[index]);
  }

  // --- APPROVALS ---
  async getAllApprovals(status?: string) {
    let list = this.approvals;
    if (status) {
      list = list.filter((a) => a.status.toLowerCase() === status.toLowerCase());
    }
    return clone(list);
  }

  async getApprovalById(id: string) {
    const found = this.approvals.find((a) => a.id === id);
    return found ? clone(found) : null;
  }

  async createApproval(approval: any) {
    const id = approval.id || `req-appr-${Date.now()}`;
    const record = {
      ...approval,
      id,
      status: approval.status || 'Pending',
      createdAt: new Date().toISOString(),
    };
    this.approvals.unshift(record);
    return clone(record);
  }

  async updateApprovalDecision(
    id: string,
    status: 'Approved' | 'Rejected',
    decisionReason: string,
    reviewedBy: string
  ) {
    const req = this.approvals.find((a) => a.id === id);
    if (!req) throw new NotFoundError('Approval request not found.');

    if (req.status !== 'Pending') {
      throw new ConflictError(`Request is already '${req.status}' and cannot be reviewed again.`);
    }

    if (status === 'Approved' && req.type === 'Quota Increase' && req.collegeId) {
      const details = typeof req.details === 'object' ? req.details : {};
      const requestedValue = Number(details.requestedValue) || parseInt(req.details || '500', 10);
      if (requestedValue && !isNaN(requestedValue)) {
        await this.updateQuota(req.collegeId, requestedValue, decisionReason, reviewedBy);
      }
    }

    req.status = status;
    req.decisionReason = decisionReason;
    req.reviewedBy = reviewedBy;
    req.reviewedAt = new Date().toISOString();

    return clone(req);
  }

  // --- SERVICES ---
  async getAllServices() {
    return clone(this.services);
  }

  async getServiceById(id: string) {
    const found = this.services.find((s) => s.id === id);
    return found ? clone(found) : null;
  }

  async toggleGlobalService(id: string) {
    const svc = this.services.find((s) => s.id === id);
    if (!svc) throw new NotFoundError('Service not found.');
    svc.isGlobalActive = !svc.isGlobalActive;
    svc.updatedAt = new Date().toISOString();
    return clone(svc);
  }

  // --- PAYMENTS ---
  async getAllPayments(collegeId?: string) {
    let list = this.payments;
    if (collegeId) {
      list = list.filter((p) => p.collegeId === collegeId);
    }
    return clone(list);
  }

  async createPayment(payment: any) {
    const existing = this.payments.find((p) => p.invoiceNumber === payment.invoiceNumber);
    if (existing) {
      throw new ConflictError(`Invoice number '${payment.invoiceNumber}' already exists.`);
    }

    const id = payment.id || `inv-pay-${Date.now()}`;
    const record = {
      ...payment,
      id,
      createdAt: new Date().toISOString(),
    };
    this.payments.unshift(record);
    return clone(record);
  }

  // --- NOTIFICATIONS ---
  async getAllNotifications() {
    return clone(this.notifications);
  }

  async markNotificationRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) throw new NotFoundError('Notification not found.');
    notif.isRead = true;
  }

  async markAllNotificationsRead() {
    for (const n of this.notifications) {
      n.isRead = true;
    }
  }

  async deleteNotification(id: string) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) throw new NotFoundError('Notification not found.');
    this.notifications.splice(index, 1);
  }

  async createNotification(notif: any) {
    const id = notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...notif,
      id,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(record);
    return clone(record);
  }

  // --- AUDIT LOGS ---
  async getAllAuditLogs(entity?: string, page = 1, limit = 50) {
    let list = this.auditLogs;
    if (entity) {
      list = list.filter((l) => l.entity === entity);
    }
    const start = (page - 1) * limit;
    return clone(list.slice(start, start + limit));
  }

  async createAuditLog(log: any) {
    const id = log.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...log,
      id,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(record);
    return clone(record);
  }

  // --- TEMPLATES ---
  async getAllTemplates() {
    return clone(this.templates);
  }

  async getTemplateById(id: string) {
    const found = this.templates.find((t) => t.id === id);
    return found ? clone(found) : null;
  }

  async createTemplate(tmpl: any) {
    const id = tmpl.id || `tmpl-${Date.now().toString(36)}`;
    const record = {
      ...tmpl,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.unshift(record);
    return clone(record);
  }

  async updateTemplate(id: string, updates: any) {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) throw new NotFoundError('Template not found.');
    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return clone(this.templates[index]);
  }

  async deleteTemplate(id: string) {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) throw new NotFoundError('Template not found.');
    this.templates.splice(index, 1);
  }

  async togglePublishTemplate(id: string) {
    const tmpl = this.templates.find((t) => t.id === id);
    if (!tmpl) throw new NotFoundError('Template not found.');
    tmpl.status = tmpl.status === 'Published' ? 'Draft' : 'Published';
    tmpl.updatedAt = new Date().toISOString();
    return clone(tmpl);
  }

  async toggleFeaturedTemplate(id: string) {
    const tmpl = this.templates.find((t) => t.id === id);
    if (!tmpl) throw new NotFoundError('Template not found.');
    tmpl.isFeatured = !tmpl.isFeatured;
    tmpl.updatedAt = new Date().toISOString();
    return clone(tmpl);
  }

  // --- SYSTEM HEALTH ---
  async getSystemHealth() {
    return this.services.map((s) => ({
      name: s.name,
      status: s.isGlobalActive ? 'Healthy' : 'Degraded',
      latencyMs: 15,
      uptime: '99.98%',
      lastCheckedAt: new Date().toISOString(),
    }));
  }

  // --- LIFECYCLE OUTBOX ---
  async createOutboxEvent(event: any) {
    const id = event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      ...event,
      id,
      status: event.status || 'PENDING',
      attempts: event.attempts || 0,
      maxAttempts: event.maxAttempts || 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.outboxEvents.unshift(record);
    return clone(record);
  }

  async getPendingOutboxEvents() {
    return this.outboxEvents
      .filter((e) => e.status === 'PENDING' && (e.attempts || 0) < (e.maxAttempts || 3))
      .map(clone);
  }

  async updateOutboxEvent(id: string, updates: any) {
    const idx = this.outboxEvents.findIndex((e) => e.id === id);
    if (idx === -1) throw new NotFoundError('Outbox event not found.');
    this.outboxEvents[idx] = {
      ...this.outboxEvents[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return clone(this.outboxEvents[idx]);
  }

  async getOutboxEventsByCollege(collegeId: string) {
    return this.outboxEvents.filter((e) => e.collegeId === collegeId).map(clone);
  }
}

