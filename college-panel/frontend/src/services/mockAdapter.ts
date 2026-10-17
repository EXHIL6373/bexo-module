/**
 * In-Memory Development / Demo Mock Adapter
 * Active exclusively when VITE_DEMO_MODE=true or during offline test execution.
 * Enforces strict multi-tenant boundaries, prevents cross-tenant leaks, and persists zero credentials.
 */

import {
  College,
  Student,
  StaffUser,
  ProvisioningJob,
  ApprovalRequest,
  NotificationItem,
  AuditLogItem,
  PaymentInvoice,
  StudentEntitlement,
  CollegeTask,
  CollegeAnnouncement,
  CollegeInvitation,
  PasswordResetToken,
  OutboxEmail,
  Role,
} from '../types';
import {
  INITIAL_COLLEGES,
  INITIAL_STUDENTS,
  INITIAL_STAFF_USERS,
  INITIAL_PROVISIONING_JOBS,
  INITIAL_APPROVALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PAYMENTS,
  INITIAL_ENTITLEMENTS,
  INITIAL_COLLEGE_TASKS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_INVITATIONS,
  INITIAL_OUTBOX_EMAILS,
} from '../data/mockData';
import { ApiError } from './apiClient';
import { generateEmailContent } from '../lib/emailTemplates';

class MockAdapter {
  private colleges: College[] = JSON.parse(JSON.stringify(INITIAL_COLLEGES));
  private students: Student[] = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  private staffUsers: StaffUser[] = JSON.parse(JSON.stringify(INITIAL_STAFF_USERS));
  private provisioningJobs: ProvisioningJob[] = JSON.parse(JSON.stringify(INITIAL_PROVISIONING_JOBS));
  private approvals: ApprovalRequest[] = JSON.parse(JSON.stringify(INITIAL_APPROVALS));
  private notifications: NotificationItem[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
  private auditLogs: AuditLogItem[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  private payments: PaymentInvoice[] = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
  private entitlements: StudentEntitlement[] = JSON.parse(JSON.stringify(INITIAL_ENTITLEMENTS));
  private tasks: CollegeTask[] = JSON.parse(JSON.stringify(INITIAL_COLLEGE_TASKS));
  private announcements: CollegeAnnouncement[] = JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
  private invitations: CollegeInvitation[] = JSON.parse(JSON.stringify(INITIAL_INVITATIONS));
  private outboxEmails: OutboxEmail[] = JSON.parse(JSON.stringify(INITIAL_OUTBOX_EMAILS));
  private resetTokens: PasswordResetToken[] = [];

  // Active mock session
  private activeToken: string | null = null;
  private activeUser: StaffUser | null = null;

  private delay(ms = 80): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public setSession(token: string | null, user: StaffUser | null) {
    this.activeToken = token;
    this.activeUser = user ? JSON.parse(JSON.stringify(user)) : null;
  }

  public getSession(): { token: string | null; user: StaffUser | null } {
    return { token: this.activeToken, user: this.activeUser };
  }

  private requireActiveCollege(): { user: StaffUser; college: College } {
    if (!this.activeUser) {
      throw new ApiError('Authentication required. Please sign in.', 401);
    }
    if (!this.activeUser.collegeId) {
      throw new ApiError('403 Forbidden: User is not assigned to an authorized academic institution.', 403);
    }
    const college = this.colleges.find((c) => c.id === this.activeUser!.collegeId);
    if (!college) {
      throw new ApiError('404 Not Found: Institutional entity could not be verified.', 404);
    }
    return { user: this.activeUser, college };
  }

  private logAudit(action: string, entity: string, entityId: string, entityName: string, reason?: string) {
    const actor = this.activeUser || { id: 'sys-auth', name: 'Auth Gateway', role: 'college_admin' };
    const log: AuditLogItem = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actorStaffId: actor.id,
      actorName: actor.name,
      actorRole: actor.role.replace('_', ' ').toUpperCase(),
      action,
      entity,
      entityId,
      entityName,
      ip: '127.0.0.1',
      result: 'Success',
      reason: reason || 'Operation executed',
    };
    this.auditLogs.unshift(log);
  }

  // --- AUTH SERVICE MOCK ---

  public async login(email: string, _password?: string): Promise<{ token: string; user: StaffUser; college: College }> {
    const trimmed = email.trim().toLowerCase();
    const user = this.staffUsers.find((u) => u.email.toLowerCase() === trimmed);

    if (!user) {
      throw new ApiError('No account registered with this email address.', 401);
    }

    // Reject Corporate Admin login attempts to College Portal
    if (['super_admin', 'admin', 'ops', 'finance', 'support'].includes(user.role) && !user.collegeId) {
      this.logAudit('CORPORATE_ADMIN_LOGIN_REJECTED', 'SecurityGateway', user.id, user.name, 'Corporate user attempted to log into College Portal');
      throw new ApiError(
        'Institutional Access Restricted: This portal is exclusively for authorized college staff. Corporate administrators must sign in at the BEXO Corporate Admin Console.',
        403
      );
    }

    if (!user.collegeId) {
      throw new ApiError('No institutional college assignment linked to this account.', 403);
    }

    const college = this.colleges.find((c) => c.id === user.collegeId);
    if (!college) {
      throw new ApiError('Assigned institutional record not found.', 404);
    }

    if (college.status === 'Suspended' || !college.dashboardAccess) {
      this.logAudit('SUSPENDED_COLLEGE_LOGIN_BLOCKED', 'College', college.id, college.name, `Login rejected: College suspended (${college.suspensionReason})`);
      throw new ApiError(
        `Institutional Access Suspended: ${college.name} is currently suspended by BEXO Administration. Reason: "${college.suspensionReason || 'Compliance Hold'}".`,
        403
      );
    }

    if (college.status === 'Pending') {
      throw new ApiError(
        `Institutional Access Pending: ${college.name} onboarding is awaiting administrative approval.`,
        403
      );
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError('Your institutional account has been suspended by administration.', 403);
    }

    if (user.accountStatus === 'REVOKED') {
      throw new ApiError('Your account access has been revoked.', 403);
    }

    if (user.accountStatus === 'INVITED') {
      throw new ApiError('Your invitation has not yet been activated. Please check your email for the activation link.', 403);
    }

    const now = new Date().toISOString();
    const updatedUser: StaffUser = { ...user, lastLoginAt: now };
    this.staffUsers = this.staffUsers.map((u) => (u.id === user.id ? updatedUser : u));

    const token = `clg_tok_${user.collegeId}_${Date.now()}`;
    this.setSession(token, updatedUser);

    this.logAudit('COLLEGE_LOGIN_SUCCESS', 'StaffUser', user.id, user.name, `Authenticated to ${college.name}`);
    return { token, user: updatedUser, college };
  }

  public async getMe(): Promise<{ user: StaffUser; college: College }> {
    const { user, college } = this.requireActiveCollege();
    return { user, college };
  }

  public async logout(): Promise<void> {
    if (this.activeUser) {
      this.logAudit('COLLEGE_LOGOUT', 'StaffUser', this.activeUser.id, this.activeUser.name, 'Signed out of College Portal');
    }
    this.setSession(null, null);
  }

  public async validateInvitation(token: string): Promise<{ valid: boolean; error?: string; invitation?: CollegeInvitation }> {
    const invite = this.invitations.find((i) => i.token === token);
    if (!invite) return { valid: false, error: 'Invalid or expired invitation token.' };
    if (invite.status === 'ACTIVE') return { valid: false, error: 'This invitation has already been redeemed.' };
    if (invite.status === 'REVOKED') return { valid: false, error: 'This invitation has been revoked.' };
    if (new Date(invite.expiresAt) < new Date()) return { valid: false, error: 'This invitation token has expired.' };
    return { valid: true, invitation: invite };
  }

  public async activateAccount(token: string, _password: string): Promise<{ user: StaffUser; college: College }> {
    const check = await this.validateInvitation(token);
    if (!check.valid || !check.invitation) {
      throw new ApiError(check.error || 'Token validation failure.', 400);
    }

    const invite = check.invitation;
    const now = new Date().toISOString();

    this.invitations = this.invitations.map((i) => (i.id === invite.id ? { ...i, status: 'ACTIVE', acceptedAt: now } : i));

    let activatedUser = this.staffUsers.find((u) => u.invitationId === invite.id || u.email.toLowerCase() === invite.email.toLowerCase());
    if (activatedUser) {
      activatedUser = { ...activatedUser, isActive: true, accountStatus: 'ACTIVE', lastLoginAt: now };
      this.staffUsers = this.staffUsers.map((u) => (u.id === activatedUser!.id ? activatedUser! : u));
    } else {
      activatedUser = {
        id: `usr-clg-${Date.now()}`,
        name: invite.fullName,
        email: invite.email,
        phone: invite.phone,
        role: invite.role,
        collegeId: invite.collegeId,
        collegeName: invite.collegeName,
        designation: invite.designation,
        isActive: true,
        accountStatus: 'ACTIVE',
        invitationId: invite.id,
        lastLoginAt: now,
        createdAt: now,
      };
      this.staffUsers.unshift(activatedUser);
    }

    const college = this.colleges.find((c) => c.id === invite.collegeId)!;
    const sessionToken = `clg_tok_${invite.collegeId}_${Date.now()}`;
    this.setSession(sessionToken, activatedUser);

    this.logAudit('INVITATION_ACTIVATED', 'StaffUser', activatedUser.id, activatedUser.name, 'Account credentials set & activated');
    return { user: activatedUser, college };
  }

  public async requestPasswordReset(email: string): Promise<{ success: boolean; token: string }> {
    const trimmed = email.trim().toLowerCase();
    const user = this.staffUsers.find((u) => u.email.toLowerCase() === trimmed);
    if (!user) {
      throw new ApiError('No account associated with this email address was found.', 404);
    }

    const token = `rst_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const entry: PasswordResetToken = {
      id: `rst-${Date.now()}`,
      token,
      email: trimmed,
      userId: user.id,
      createdAt: now,
      expiresAt,
      isUsed: false,
    };
    this.resetTokens.unshift(entry);

    // Send email to outbox
    const emailContent = generateEmailContent('password_reset', {
      toEmail: user.email,
      recipientName: user.name,
      collegeName: user.collegeName,
      actionUrl: `#/reset-password?token=${token}`,
    });
    this.outboxEmails.unshift({
      id: `eml-${Date.now()}`,
      to: user.email,
      toName: user.name,
      subject: emailContent.subject,
      templateType: 'password_reset',
      collegeName: user.collegeName,
      actionUrl: `#/reset-password?token=${token}`,
      actionLabel: emailContent.actionLabel,
      sentAt: now,
      status: 'Delivered',
      bodyHtml: emailContent.html,
      previewSnippet: emailContent.previewSnippet,
    });

    this.logAudit('PASSWORD_RESET_REQUESTED', 'StaffUser', user.id, user.name, `Reset token dispatched to ${user.email}`);
    return { success: true, token };
  }

  public async validateResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    const entry = this.resetTokens.find((r) => r.token === token);
    if (!entry) return { valid: false, error: 'Invalid or missing password reset link.' };
    if (entry.isUsed) return { valid: false, error: 'This password reset link has already been used.' };
    if (new Date(entry.expiresAt) < new Date()) return { valid: false, error: 'This password reset link has expired.' };
    return { valid: true, email: entry.email };
  }

  public async resetPassword(token: string, _newPassword: string): Promise<void> {
    const check = await this.validateResetToken(token);
    if (!check.valid || !check.email) {
      throw new ApiError(check.error || 'Invalid reset token.', 400);
    }

    this.resetTokens = this.resetTokens.map((r) => (r.token === token ? { ...r, isUsed: true } : r));
    const user = this.staffUsers.find((u) => u.email.toLowerCase() === check.email!.toLowerCase());
    if (user) {
      this.logAudit('PASSWORD_RESET_COMPLETED', 'StaffUser', user.id, user.name, 'Password successfully reset');
    }
  }

  // --- COLLEGE PROFILE & SETTINGS ---

  public async getMyCollege(): Promise<College> {
    const { college } = this.requireActiveCollege();
    return college;
  }

  public async updateCollegeSettings(updates: Partial<College>): Promise<College> {
    const { user, college } = this.requireActiveCollege();
    if (user.role === 'college_staff' || user.role === 'college_coordinator') {
      throw new ApiError('Permission Denied: Only College Administrator can modify institutional profile settings.', 403);
    }
    const sanitized: Partial<College> = {
      address: updates.address ?? college.address,
      city: updates.city ?? college.city,
      district: updates.district ?? college.district,
      state: updates.state ?? college.state,
      pincode: updates.pincode ?? college.pincode,
      primaryContact: updates.primaryContact ?? college.primaryContact,
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    const updatedCollege: College = { ...college, ...sanitized };
    this.colleges = this.colleges.map((c) => (c.id === college.id ? updatedCollege : c));
    this.logAudit('COLLEGE_SETTINGS_UPDATED', 'College', college.id, college.name, 'Profile information updated');
    return updatedCollege;
  }

  // --- STUDENTS & ONBOARDING ---

  public async getStudents(params?: { search?: string; department?: string; status?: string; batch?: string }): Promise<Student[]> {
    const { college } = this.requireActiveCollege();
    let list = this.students.filter((s) => s.collegeId === college.id);

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    if (params?.department && params.department !== 'ALL') {
      list = list.filter((s) => s.department === params.department);
    }
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((s) => s.accessStatus === params.status);
    }
    if (params?.batch && params.batch !== 'ALL') {
      list = list.filter((s) => s.batch === params.batch);
    }
    return list;
  }

  public async getStudentById(studentId: string): Promise<Student> {
    const { college } = this.requireActiveCollege();
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      throw new ApiError('Student record not found.', 404);
    }
    // Strict Tenant Boundary Enforcement: Cannot read student belonging to other college
    if (student.collegeId !== college.id) {
      this.logAudit(
        'TENANT_ISOLATION_VIOLATION_BLOCKED',
        'Student',
        studentId,
        student.name,
        `User from ${college.name} attempted cross-tenant inspection of student from ${student.collegeId}`
      );
      throw new ApiError('403 Forbidden: Tenant Isolation Boundary Active. Cross-institutional record inspection is prohibited.', 403);
    }
    return student;
  }

  public async addStudent(studentData: Omit<Student, 'id' | 'collegeId' | 'collegeName' | 'createdAt' | 'lastActivityAt'> & { collegeId?: string }): Promise<Student> {
    const { college } = this.requireActiveCollege();
    if (college.status === 'Suspended') {
      throw new ApiError(`Cannot add student: ${college.name} is currently suspended.`, 403);
    }

    // Tamper resistance: Always bind to authenticated college
    if (studentData.collegeId && studentData.collegeId !== college.id) {
      this.logAudit('CROSS_TENANT_TAMPER_DETECTED', 'Student', studentData.rollNumber, studentData.name, `Supplied foreign collegeId overridden to ${college.id}`);
    }

    const cleanRoll = studentData.rollNumber.trim().toUpperCase();
    const duplicate = this.students.find((s) => s.collegeId === college.id && s.rollNumber.toLowerCase() === cleanRoll.toLowerCase());
    if (duplicate) {
      throw new ApiError(`Student with roll number "${cleanRoll}" is already registered in this institution.`, 409);
    }

    const now = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rollNumber: cleanRoll,
      collegeId: college.id,
      collegeName: college.name,
      email: studentData.email.trim().toLowerCase(),
      createdAt: now,
      lastActivityAt: now,
      updatedAt: now,
    };

    this.students.unshift(newStudent);
    this.colleges = this.colleges.map((c) => (c.id === college.id ? { ...c, totalStudents: c.totalStudents + 1, lastActivityAt: now } : c));
    this.logAudit('STUDENT_ENROLLED', 'Student', newStudent.id, `${newStudent.name} (${newStudent.rollNumber})`);
    return newStudent;
  }

  public async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    const student = await this.getStudentById(studentId); // Re-uses isolation check
    const now = new Date().toISOString();
    const updated: Student = { ...student, ...updates, updatedAt: now };
    this.students = this.students.map((s) => (s.id === studentId ? updated : s));
    this.logAudit('STUDENT_UPDATED', 'Student', studentId, student.name);
    return updated;
  }

  public async revokeStudentAccess(studentId: string, reason: string): Promise<Student> {
    const student = await this.getStudentById(studentId);
    const updated: Student = { ...student, accessStatus: 'Revoked', updatedAt: new Date().toISOString() };
    this.students = this.students.map((s) => (s.id === studentId ? updated : s));
    this.logAudit('STUDENT_ACCESS_REVOKED', 'Student', studentId, student.name, reason);
    return updated;
  }

  public async reactivateStudentAccess(studentId: string): Promise<Student> {
    const student = await this.getStudentById(studentId);
    const updated: Student = { ...student, accessStatus: 'Active', updatedAt: new Date().toISOString() };
    this.students = this.students.map((s) => (s.id === studentId ? updated : s));
    this.logAudit('STUDENT_ACCESS_RESTORED', 'Student', studentId, student.name);
    return updated;
  }

  public async bulkImportStudents(studentList: Array<{ name: string; rollNumber: string; email: string; department?: string; course?: string; batch?: string; phone?: string }>): Promise<{ importedCount: number; skippedCount: number; errors: Array<{ rollNumber: string; reason: string }> }> {
    const { college } = this.requireActiveCollege();
    if (college.status === 'Suspended') {
      throw new ApiError(`Cannot import: ${college.name} is currently suspended.`, 403);
    }

    const now = new Date().toISOString();
    const existingRolls = new Set(this.students.filter((s) => s.collegeId === college.id).map((s) => s.rollNumber.toLowerCase()));
    const validNewStudents: Student[] = [];
    const errors: Array<{ rollNumber: string; reason: string }> = [];
    const seenInFile = new Set<string>();

    studentList.forEach((row, idx) => {
      const rollClean = (row.rollNumber || '').trim().toUpperCase();
      const emailClean = (row.email || '').trim().toLowerCase();

      if (!row.name || !rollClean || !emailClean) {
        errors.push({ rollNumber: rollClean || `Row ${idx + 1}`, reason: 'Missing mandatory fields (Name, Roll No, or Email)' });
        return;
      }
      if (seenInFile.has(rollClean.toLowerCase())) {
        errors.push({ rollNumber: rollClean, reason: 'Duplicate roll number in uploaded batch file' });
        return;
      }
      seenInFile.add(rollClean.toLowerCase());

      if (existingRolls.has(rollClean.toLowerCase())) {
        errors.push({ rollNumber: rollClean, reason: `Roll number already enrolled in ${college.name}` });
        return;
      }

      validNewStudents.push({
        id: `stu-imp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: row.name.trim(),
        rollNumber: rollClean,
        collegeId: college.id,
        collegeName: college.name,
        department: row.department || 'General Engineering',
        course: row.course || 'B.Tech',
        batch: row.batch || '2024 - 2028',
        email: emailClean,
        phone: row.phone?.trim(),
        accessStatus: 'Pending',
        services: [],
        entitlementId: '',
        enrolledYear: new Date().getFullYear(),
        resumeCount: 0,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    if (validNewStudents.length > 0) {
      this.students = [...validNewStudents, ...this.students];
      this.colleges = this.colleges.map((c) => (c.id === college.id ? { ...c, totalStudents: c.totalStudents + validNewStudents.length, lastActivityAt: now } : c));
      this.logAudit('BULK_STUDENT_IMPORT', 'Student', `import-${Date.now()}`, `${college.name} Batch (${validNewStudents.length} imported)`);
    }

    return { importedCount: validNewStudents.length, skippedCount: errors.length, errors };
  }

  // --- PROVISIONING & ENTITLEMENTS ---

  public async getProvisioningJobs(): Promise<ProvisioningJob[]> {
    const { college } = this.requireActiveCollege();
    return this.provisioningJobs.filter((j) => j.collegeId === college.id);
  }

  public async triggerProvisioning(studentIds: string[], serviceName: string): Promise<{ job: ProvisioningJob; successful: number; failed: number; skipped: number }> {
    const { user, college } = this.requireActiveCollege();
    if (college.status === 'Suspended') {
      throw new ApiError(`Operation locked: ${college.name} is currently suspended.`, 403);
    }
    if (user.role === 'college_staff') {
      throw new ApiError('Permission Denied: College Staff cannot trigger student provisioning.', 403);
    }

    const availableQuota = Math.max(0, college.quota.allocated - college.quota.used);
    const targetStudents = this.students.filter((s) => s.collegeId === college.id && studentIds.includes(s.id));

    let successfulCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const failedRecords: any[] = [];
    const now = new Date().toISOString();
    const jobId = `JOB-2026-${Math.floor(100 + Math.random() * 900)}`;

    for (const student of targetStudents) {
      if (student.services.includes(serviceName)) {
        skippedCount++;
        continue;
      }
      if (successfulCount >= availableQuota) {
        failedCount++;
        failedRecords.push({
          rollNumber: student.rollNumber,
          name: student.name,
          reason: 'Institutional seat quota limit reached. Quota expansion required.',
          status: 'Quota Exceeded',
        });
        continue;
      }

      successfulCount++;
      student.services.push(serviceName);
      student.accessStatus = 'Active';
      student.entitlementId = `ent-${Date.now()}-${student.id}`;
      student.lastActivityAt = now;

      this.entitlements.unshift({
        id: student.entitlementId,
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        collegeId: college.id,
        collegeName: college.name,
        serviceId: 'srv-portfolio',
        serviceName,
        status: 'Active',
        grantedDate: now,
        lastUpdated: now,
        expiryDate: '2027-05-31',
      });
    }

    const jobStatus = failedCount === 0 ? 'Completed' : successfulCount > 0 ? 'Partially Completed' : 'Failed';
    const newJob: ProvisioningJob = {
      id: jobId,
      collegeId: college.id,
      collegeName: college.name,
      source: 'Manual Batch',
      status: jobStatus,
      totalRecords: targetStudents.length,
      successful: successfulCount,
      failed: failedCount,
      partial: 0,
      failedRecords,
      createdAt: now,
      completedAt: now,
      createdBy: `${user.name} (${user.role.replace('_', ' ')})`,
    };

    this.provisioningJobs.unshift(newJob);

    // Update college used quota
    this.colleges = this.colleges.map((c) =>
      c.id === college.id
        ? {
            ...c,
            quota: { ...c.quota, used: c.quota.used + successfulCount },
            activeStudents: c.activeStudents + successfulCount,
            lastActivityAt: now,
          }
        : c
    );

    this.logAudit('PROVISIONING_BATCH_EXECUTED', 'ProvisioningJob', jobId, college.name, `${successfulCount} granted, ${failedCount} failed`);
    return { job: newJob, successful: successfulCount, failed: failedCount, skipped: skippedCount };
  }

  public async retryProvisioningJob(jobId: string): Promise<{ success: boolean; retriedCount: number }> {
    const { college } = this.requireActiveCollege();
    const job = this.provisioningJobs.find((j) => j.id === jobId);
    if (!job) throw new ApiError('Provisioning job not found.', 404);

    if (job.collegeId !== college.id) {
      throw new ApiError('403 Forbidden: Tenant Isolation Boundary. Cross-college job retry prohibited.', 403);
    }
    if (college.status === 'Suspended') {
      throw new ApiError('Cannot retry: College is currently suspended.', 403);
    }

    const availableQuota = Math.max(0, college.quota.allocated - college.quota.used);
    if (availableQuota <= 0) {
      throw new ApiError('Insufficient quota remaining to retry failed records. Please request a quota expansion.', 422);
    }

    const retriedCount = Math.min(job.failed, availableQuota);
    this.provisioningJobs = this.provisioningJobs.map((j) => {
      if (j.id === jobId) {
        const remainingFailed = j.failed - retriedCount;
        return {
          ...j,
          successful: j.successful + retriedCount,
          failed: remainingFailed,
          status: remainingFailed === 0 ? 'Completed' : 'Partially Completed',
          failedRecords: j.failedRecords.slice(retriedCount),
        };
      }
      return j;
    });

    this.colleges = this.colleges.map((c) =>
      c.id === college.id
        ? { ...c, quota: { ...c.quota, used: c.quota.used + retriedCount }, activeStudents: c.activeStudents + retriedCount }
        : c
    );

    this.logAudit('RETRY_PROVISIONING', 'ProvisioningJob', jobId, job.collegeName, `${retriedCount} records retried successfully`);
    return { success: true, retriedCount };
  }

  public async getEntitlements(): Promise<StudentEntitlement[]> {
    const { college } = this.requireActiveCollege();
    return this.entitlements.filter((e) => e.collegeId === college.id);
  }

  // --- STAFF & ROLE MANAGEMENT ---

  public async getStaff(): Promise<StaffUser[]> {
    const { college } = this.requireActiveCollege();
    return this.staffUsers.filter((u) => u.collegeId === college.id);
  }

  public async inviteStaff(input: { name: string; email: string; role: Role; department?: string; designation?: string; mobile?: string }): Promise<CollegeInvitation> {
    const { user, college } = this.requireActiveCollege();
    if (user.role === 'college_staff') {
      throw new ApiError('Permission Denied: College Staff cannot invite new team members.', 403);
    }

    // Role escalation prevention
    if (['super_admin', 'admin', 'ops', 'finance', 'support'].includes(input.role)) {
      this.logAudit('ROLE_ESCALATION_ATTEMPT_BLOCKED', 'StaffUser', input.email, input.name, `Attempted escalation to corporate role: ${input.role}`);
      throw new ApiError('Forbidden: Institutional administrators cannot assign corporate administrative roles.', 403);
    }

    const token = `tok_staff_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const inviteId = `inv-${Date.now()}`;

    const newInvite: CollegeInvitation = {
      id: inviteId,
      token,
      email: input.email.trim().toLowerCase(),
      fullName: input.name.trim(),
      phone: input.mobile?.trim(),
      designation: input.designation?.trim() || 'College Staff',
      collegeId: college.id,
      collegeName: college.name,
      role: input.role,
      invitedBy: user.name,
      invitedByRole: user.role,
      invitedAt: now,
      expiresAt,
      status: 'INVITED',
    };

    const newStaffUser: StaffUser = {
      id: `usr-clg-${Date.now()}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.mobile?.trim(),
      role: input.role,
      collegeId: college.id,
      collegeName: college.name,
      department: input.department?.trim() || 'Academic Operations',
      designation: input.designation?.trim() || 'Staff Coordinator',
      isActive: false,
      accountStatus: 'INVITED',
      invitationId: inviteId,
      lastLoginAt: 'Never',
      createdAt: now,
    };

    this.invitations.unshift(newInvite);
    this.staffUsers.unshift(newStaffUser);

    this.logAudit('STAFF_INVITED', 'StaffUser', newStaffUser.id, newStaffUser.name, `Invited as ${input.role}`);
    return newInvite;
  }

  public async updateStaffRole(staffId: string, newRole: Role): Promise<StaffUser> {
    const { user, college } = this.requireActiveCollege();
    if (user.role !== 'college_admin') {
      throw new ApiError('Permission Denied: Only College Admin can modify staff roles.', 403);
    }

    // Role escalation prevention
    if (['super_admin', 'admin', 'ops', 'finance', 'support'].includes(newRole)) {
      this.logAudit('ROLE_ESCALATION_BLOCKED', 'StaffUser', staffId, newRole, 'Attempted to escalate staff to central admin');
      throw new ApiError('Forbidden: Institutional administrators cannot assign corporate administrative roles.', 403);
    }

    const targetStaff = this.staffUsers.find((u) => u.id === staffId);
    if (!targetStaff) throw new ApiError('Staff user not found.', 404);
    if (targetStaff.collegeId !== college.id) {
      throw new ApiError('403 Forbidden: Tenant Isolation Boundary.', 403);
    }

    const updated: StaffUser = { ...targetStaff, role: newRole };
    this.staffUsers = this.staffUsers.map((u) => (u.id === staffId ? updated : u));
    this.logAudit('STAFF_ROLE_CHANGED', 'StaffUser', staffId, targetStaff.name, `Role changed to ${newRole}`);
    return updated;
  }

  public async suspendStaff(staffId: string, reason?: string): Promise<StaffUser> {
    const { user, college } = this.requireActiveCollege();
    if (user.role !== 'college_admin') {
      throw new ApiError('Permission Denied: Only College Admin can suspend staff accounts.', 403);
    }
    const targetStaff = this.staffUsers.find((u) => u.id === staffId);
    if (!targetStaff) throw new ApiError('Staff member not found.', 404);
    if (targetStaff.collegeId !== college.id) throw new ApiError('403 Forbidden: Tenant Isolation Boundary.', 403);

    const updated: StaffUser = { ...targetStaff, isActive: false, accountStatus: 'SUSPENDED' };
    this.staffUsers = this.staffUsers.map((u) => (u.id === staffId ? updated : u));
    this.logAudit('STAFF_SUSPENDED', 'StaffUser', staffId, targetStaff.name, reason);
    return updated;
  }

  public async activateStaff(staffId: string): Promise<StaffUser> {
    const { user, college } = this.requireActiveCollege();
    if (user.role !== 'college_admin') throw new ApiError('Permission Denied: Only College Admin can activate staff.', 403);
    const targetStaff = this.staffUsers.find((u) => u.id === staffId);
    if (!targetStaff) throw new ApiError('Staff member not found.', 404);
    if (targetStaff.collegeId !== college.id) throw new ApiError('403 Forbidden: Tenant Isolation Boundary.', 403);

    const updated: StaffUser = { ...targetStaff, isActive: true, accountStatus: 'ACTIVE' };
    this.staffUsers = this.staffUsers.map((u) => (u.id === staffId ? updated : u));
    this.logAudit('STAFF_ACTIVATED', 'StaffUser', staffId, targetStaff.name);
    return updated;
  }

  // --- REQUESTS & DESK ---

  public async getRequests(): Promise<ApprovalRequest[]> {
    const { college } = this.requireActiveCollege();
    return this.approvals.filter((a) => a.collegeId === college.id);
  }

  public async submitRequest(requestData: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status' | 'collegeId' | 'collegeName'>): Promise<ApprovalRequest> {
    const { user, college } = this.requireActiveCollege();
    const now = new Date().toISOString();
    const newReq: ApprovalRequest = {
      ...requestData,
      id: `appr-${Date.now()}`,
      collegeId: college.id,
      collegeName: college.name,
      status: 'Pending',
      createdAt: now,
    };
    this.approvals.unshift(newReq);
    this.logAudit('REQUEST_SUBMITTED', 'ApprovalRequest', newReq.id, newReq.type, `Submitted by ${user.name}`);
    return newReq;
  }

  // --- NOTIFICATIONS, ANNOUNCEMENTS, TASKS ---

  public async getNotifications(): Promise<NotificationItem[]> {
    const { college } = this.requireActiveCollege();
    return this.notifications.filter((n) => {
      if (n.relatedEntity?.id === college.id) return true;
      if (n.relatedEntity?.name && n.relatedEntity.name.toLowerCase().includes(college.name.toLowerCase())) return true;
      return !n.relatedEntity || n.relatedEntity.type === 'college' || n.relatedEntity.type === 'job';
    });
  }

  public async markNotificationRead(id: string): Promise<void> {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  }

  public async markAllNotificationsRead(): Promise<void> {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
  }

  public async getAnnouncements(): Promise<CollegeAnnouncement[]> {
    const { college } = this.requireActiveCollege();
    return this.announcements.filter((a) => !a.collegeId || a.collegeId === 'ALL' || a.collegeId === college.id);
  }

  public async getTasks(): Promise<CollegeTask[]> {
    const { college } = this.requireActiveCollege();
    return this.tasks.filter((t) => !t.collegeId || t.collegeId === 'ALL' || t.collegeId === college.id);
  }

  public async toggleTask(id: string): Promise<CollegeTask> {
    const target = this.tasks.find((t) => t.id === id);
    if (!target) throw new ApiError('Task not found.', 404);
    const updated: CollegeTask = {
      ...target,
      status: target.status === 'Completed' ? 'Pending' : 'Completed',
    };
    this.tasks = this.tasks.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  // --- ACTIVITY & AUDIT ---

  public async getActivityLogs(): Promise<AuditLogItem[]> {
    const { college } = this.requireActiveCollege();
    const collegeStudentIds = new Set(this.students.filter((s) => s.collegeId === college.id).map((s) => s.id));
    const collegeStaffIds = new Set(this.staffUsers.filter((u) => u.collegeId === college.id).map((u) => u.id));

    return this.auditLogs.filter((l) => {
      if (l.entityId === college.id) return true;
      if (l.entityName && l.entityName.toLowerCase().includes(college.name.toLowerCase())) return true;
      if (collegeStudentIds.has(l.entityId)) return true;
      if (collegeStaffIds.has(l.entityId)) return true;
      if (l.actorStaffId && collegeStaffIds.has(l.actorStaffId)) return true;
      return false;
    });
  }

  public async getBilling(): Promise<PaymentInvoice[]> {
    const { college } = this.requireActiveCollege();
    return this.payments.filter((p) => p.collegeId === college.id);
  }

  public getOutboxEmails(): OutboxEmail[] {
    return this.outboxEmails;
  }

  // --- PHONE OTP, ROLE DISCOVERY & GOOGLE AUTH ---

  public async requestOtp(phoneNumber: string, _purpose = 'login'): Promise<any> {
    await this.delay(100);
    const clean = phoneNumber.trim();
    const masked = clean.length >= 8 ? `${clean.slice(0, 4)} ****** ${clean.slice(-4)}` : clean;
    return {
      success: true,
      data: {
        challengeId: `challenge-${Date.now()}`,
        phoneNumber: clean,
        maskedPhoneNumber: masked,
        expiresInSeconds: 300,
        debugOtp: '123456',
      },
    };
  }

  public async verifyOtp(challengeId: string, otp: string): Promise<any> {
    await this.delay(120);
    if (otp !== '123456') {
      throw new ApiError('Invalid OTP verification code. 2 attempts remaining.', 401);
    }

    if (challengeId.includes('multi')) {
      return {
        success: true,
        data: {
          requiresRoleSelection: true,
          preAuthToken: `mock-preauth-${Date.now()}`,
          availableRoles: [
            {
              id: 'role-college-admin',
              role: 'college_admin',
              portal: 'college',
              label: 'Dean of Technology (PSG Tech)',
              collegeId: 'clg-psg-01',
              collegeName: 'PSG College of Technology',
              isDefault: true,
            },
            {
              id: 'role-normal-user',
              role: 'normal_user',
              portal: 'user',
              label: 'Consumer Account',
            },
          ],
        },
      };
    }

    const { user, college } = this.requireActiveCollege();
    return {
      success: true,
      data: {
        token: `mock-jwt-college-${Date.now()}`,
        user,
        college,
        requiresRoleSelection: false,
      },
    };
  }

  public async selectRole(preAuthToken: string, selectedRoleId: string): Promise<any> {
    await this.delay(100);
    const { user, college } = this.requireActiveCollege();
    return {
      success: true,
      data: {
        token: `mock-jwt-selected-${Date.now()}`,
        user: { ...user, role: selectedRoleId.includes('admin') ? 'college_admin' : 'normal_user' },
        college,
      },
    };
  }

  public async verifyGoogle(idToken: string): Promise<any> {
    await this.delay(150);
    if (idToken.includes('unlinked')) {
      return {
        success: true,
        data: {
          isLinked: false,
          requiresPhoneVerification: true,
          preLinkToken: `mock-prelink-${Date.now()}`,
        },
      };
    }

    const { user, college } = this.requireActiveCollege();
    return {
      success: true,
      data: {
        isLinked: true,
        token: `mock-jwt-google-${Date.now()}`,
        user,
        college,
      },
    };
  }

  public async linkAccount(phoneNumber: string, idToken: string): Promise<any> {
    await this.delay(100);
    return {
      success: true,
      data: {
        success: true,
        message: `Account linked to phone ${phoneNumber}`,
      },
    };
  }

  public async completeGoogleLink(preLinkToken: string, phoneNumber: string): Promise<any> {
    await this.delay(120);
    const { user, college } = this.requireActiveCollege();
    return {
      success: true,
      data: {
        token: `mock-jwt-linked-${Date.now()}`,
        user,
        college,
        phoneNumber,
      },
    };
  }
}

export const mockAdapter = new MockAdapter();

