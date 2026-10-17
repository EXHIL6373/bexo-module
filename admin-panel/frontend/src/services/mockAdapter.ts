/**
 * In-Memory Demo Adapter for BEXO Admin Frontend
 * Used exclusively when VITE_DEMO_MODE=true is enabled.
 * Keeps demo state strictly isolated in-memory and prevents sensitive data leaks or localStorage pollution.
 */

import {
  College,
  Student,
  ProvisioningJob,
  ApprovalRequest,
  NotificationItem,
  AuditLogItem,
  PaymentInvoice,
  SystemHealthMetric,
  PlatformService,
  StaffUser,
  QuotaHistoryEntry,
  AppTemplate,
  CollegeInvitation,
  OutboxEmail,
} from '../types';
import {
  INITIAL_COLLEGES,
  INITIAL_STUDENTS,
  INITIAL_PROVISIONING_JOBS,
  INITIAL_APPROVALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PAYMENTS,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_SERVICES,
  INITIAL_STAFF_USERS,
  INITIAL_QUOTA_HISTORY,
  INITIAL_APP_TEMPLATES,
  INITIAL_INVITATIONS,
  INITIAL_OUTBOX_EMAILS,
} from '../data/mockData';
import { generateEmailContent } from '../lib/emailTemplates';
import { ApiResponse, ApiError } from './apiClient';

class MockAdapter {
  private colleges: College[] = JSON.parse(JSON.stringify(INITIAL_COLLEGES));
  private students: Student[] = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  private provisioningJobs: ProvisioningJob[] = JSON.parse(JSON.stringify(INITIAL_PROVISIONING_JOBS));
  private approvals: ApprovalRequest[] = JSON.parse(JSON.stringify(INITIAL_APPROVALS));
  private notifications: NotificationItem[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
  private auditLogs: AuditLogItem[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  private payments: PaymentInvoice[] = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
  private services: PlatformService[] = JSON.parse(JSON.stringify(INITIAL_SERVICES));
  private staffUsers: StaffUser[] = JSON.parse(JSON.stringify(INITIAL_STAFF_USERS));
  private quotaHistory: QuotaHistoryEntry[] = JSON.parse(JSON.stringify(INITIAL_QUOTA_HISTORY));
  private appTemplates: AppTemplate[] = JSON.parse(JSON.stringify(INITIAL_APP_TEMPLATES));
  private invitations: CollegeInvitation[] = JSON.parse(JSON.stringify(INITIAL_INVITATIONS));
  private outboxEmails: OutboxEmail[] = JSON.parse(JSON.stringify(INITIAL_OUTBOX_EMAILS));
  private resetTokens: Array<{ token: string; email: string; expiresAt: string }> = [];

  private delay(ms = 80): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Auth Operations
  public async login(email: string, password?: string): Promise<ApiResponse<{ token: string; user: StaffUser }>> {
    await this.delay(120);
    const trimmed = email.trim().toLowerCase();
    const user = this.staffUsers.find((u) => u.email.toLowerCase() === trimmed);

    if (!user) {
      throw new ApiError('No account registered with this email address.', 401);
    }

    // Role check: Only corporate admins allowed in bexo-admin
    if (user.collegeId || user.role.startsWith('college_')) {
      throw new ApiError(
        'Institutional Access Restricted: This portal is reserved for central BEXO corporate administrators. College staff must access via the dedicated College Portal.',
        403
      );
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new ApiError('Your administrative account is suspended. Please contact platform security.', 403);
    }
    if (user.accountStatus === 'REVOKED') {
      throw new ApiError('Your account access has been revoked.', 403);
    }
    if (user.accountStatus === 'INVITED') {
      throw new ApiError('Account invitation pending activation. Please check your email for the activation link.', 400);
    }

    // Mock password verification in demo mode
    if (password && password.length < 6) {
      throw new ApiError('Invalid password credentials provided.', 401);
    }

    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        token: `mock_jwt_${user.id}_${Date.now()}`,
        user: updatedUser,
      },
      message: 'Authentication successful',
    };
  }

  public async getProfile(userId: string): Promise<ApiResponse<StaffUser>> {
    await this.delay(50);
    const user = this.staffUsers.find((u) => u.id === userId);
    if (!user) throw new ApiError('User profile not found', 404);
    return { success: true, data: user };
  }

  public async requestPasswordReset(email: string): Promise<ApiResponse<{ token: string }>> {
    await this.delay(100);
    const trimmed = email.trim().toLowerCase();
    const user = this.staffUsers.find((u) => u.email.toLowerCase() === trimmed);
    if (!user) {
      throw new ApiError('No account found with this email address.', 404);
    }

    const token = `rst_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    this.resetTokens.push({ token, email: user.email, expiresAt });

    const emailContent = generateEmailContent('password_reset', {
      toEmail: user.email,
      recipientName: user.name,
      actionUrl: `#/reset-password?token=${token}`,
    });

    const newEmail: OutboxEmail = {
      id: `outbox-${Date.now()}`,
      to: user.email,
      toName: user.name,
      subject: emailContent.subject,
      templateType: 'password_reset',
      actionUrl: `#/reset-password?token=${token}`,
      actionLabel: 'Reset Password',
      sentAt: new Date().toISOString(),
      status: 'Delivered',
      bodyHtml: emailContent.html,
      previewSnippet: emailContent.previewSnippet,
    };
    this.outboxEmails.unshift(newEmail);

    return { success: true, data: { token }, message: 'Password reset link generated' };
  }

  public async validateResetToken(token: string): Promise<ApiResponse<{ valid: boolean; email?: string }>> {
    await this.delay(50);
    const record = this.resetTokens.find((r) => r.token === token);
    if (!record) return { success: true, data: { valid: false } };
    const expired = new Date(record.expiresAt) < new Date();
    return { success: true, data: { valid: !expired, email: record.email } };
  }

  public async resetPassword(token: string, _newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    await this.delay(100);
    const record = this.resetTokens.find((r) => r.token === token);
    if (!record) throw new ApiError('Invalid or expired reset token.', 400);
    return { success: true, data: { success: true }, message: 'Password updated successfully' };
  }

  public async validateInviteToken(token: string): Promise<ApiResponse<{ valid: boolean; invitation?: CollegeInvitation }>> {
    await this.delay(50);
    const invite = this.invitations.find((i) => i.token === token);
    if (!invite) return { success: true, data: { valid: false } };
    if (invite.status !== 'INVITED') return { success: true, data: { valid: false } };
    return { success: true, data: { valid: true, invitation: invite } };
  }

  public async activateAccount(token: string, _password: string): Promise<ApiResponse<{ user: StaffUser }>> {
    await this.delay(120);
    const invite = this.invitations.find((i) => i.token === token);
    if (!invite) throw new ApiError('Invalid invitation token.', 400);

    invite.status = 'ACTIVE';
    invite.acceptedAt = new Date().toISOString();

    const user: StaffUser = {
      id: `usr-act-${Date.now()}`,
      name: invite.fullName,
      email: invite.email,
      phone: invite.phone,
      role: invite.role,
      collegeId: invite.collegeId,
      collegeName: invite.collegeName,
      designation: invite.designation,
      isActive: true,
      accountStatus: 'ACTIVE',
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      invitationId: invite.id,
    };
    this.staffUsers.unshift(user);

    return { success: true, data: { user }, message: 'Account successfully activated' };
  }

  // Colleges
  public async getColleges(): Promise<ApiResponse<College[]>> {
    await this.delay();
    return { success: true, data: [...this.colleges] };
  }

  public async getCollegeById(id: string): Promise<ApiResponse<College>> {
    await this.delay();
    const college = this.colleges.find((c) => c.id === id);
    if (!college) throw new ApiError(`College with ID ${id} not found`, 404);
    return { success: true, data: college };
  }

  public async createCollege(newCollegeData: any): Promise<ApiResponse<College>> {
    await this.delay(100);
    const newCollege: College = {
      ...newCollegeData,
      id: `clg-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.colleges.unshift(newCollege);
    return { success: true, data: newCollege, message: 'College registered successfully' };
  }

  public async updateCollege(id: string, updates: Partial<College>): Promise<ApiResponse<College>> {
    await this.delay(80);
    const index = this.colleges.findIndex((c) => c.id === id);
    if (index === -1) throw new ApiError(`College ${id} not found`, 404);
    this.colleges[index] = {
      ...this.colleges[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.colleges[index] };
  }

  public async suspendCollege(id: string, reason: string): Promise<ApiResponse<College>> {
    await this.delay(100);
    const index = this.colleges.findIndex((c) => c.id === id);
    if (index === -1) throw new ApiError(`College ${id} not found`, 404);
    this.colleges[index] = {
      ...this.colleges[index],
      status: 'Suspended',
      dashboardAccess: false,
      suspensionReason: reason,
      suspendedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.colleges[index], message: 'College suspended' };
  }

  public async reactivateCollege(id: string): Promise<ApiResponse<College>> {
    await this.delay(100);
    const index = this.colleges.findIndex((c) => c.id === id);
    if (index === -1) throw new ApiError(`College ${id} not found`, 404);
    this.colleges[index] = {
      ...this.colleges[index],
      status: 'Active',
      dashboardAccess: true,
      suspensionReason: undefined,
      suspendedAt: undefined,
      reactivatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: this.colleges[index], message: 'College reactivated' };
  }

  public async updateQuota(collegeId: string, newAllocated: number, reason: string, adminName = 'System Admin'): Promise<ApiResponse<QuotaHistoryEntry>> {
    await this.delay(100);
    const college = this.colleges.find((c) => c.id === collegeId);
    if (!college) throw new ApiError(`College ${collegeId} not found`, 404);
    const prev = college.quota.allocated;
    college.quota.allocated = newAllocated;

    const entry: QuotaHistoryEntry = {
      id: `qh-${Date.now()}`,
      collegeId,
      timestamp: new Date().toISOString(),
      adminName,
      previousAllocated: prev,
      newAllocated,
      reason,
    };
    this.quotaHistory.unshift(entry);
    return { success: true, data: entry, message: 'Quota successfully updated' };
  }

  public async getQuotaHistory(collegeId?: string): Promise<ApiResponse<QuotaHistoryEntry[]>> {
    await this.delay();
    const list = collegeId ? this.quotaHistory.filter((q) => q.collegeId === collegeId) : this.quotaHistory;
    return { success: true, data: list };
  }

  // Students
  public async getStudents(): Promise<ApiResponse<Student[]>> {
    await this.delay();
    return { success: true, data: [...this.students] };
  }

  public async addStudent(studentData: any): Promise<ApiResponse<Student>> {
    await this.delay(80);
    const student: Student = {
      ...studentData,
      id: `stu-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    this.students.unshift(student);
    return { success: true, data: student };
  }

  public async revokeStudentAccess(studentId: string, _reason: string): Promise<ApiResponse<Student>> {
    await this.delay(80);
    const student = this.students.find((s) => s.id === studentId);
    if (!student) throw new ApiError('Student not found', 404);
    student.accessStatus = 'Revoked';
    student.updatedAt = new Date().toISOString();
    return { success: true, data: student };
  }

  public async reactivateStudentAccess(studentId: string): Promise<ApiResponse<Student>> {
    await this.delay(80);
    const student = this.students.find((s) => s.id === studentId);
    if (!student) throw new ApiError('Student not found', 404);
    student.accessStatus = 'Active';
    student.updatedAt = new Date().toISOString();
    return { success: true, data: student };
  }

  // Provisioning
  public async getProvisioningJobs(): Promise<ApiResponse<ProvisioningJob[]>> {
    await this.delay();
    return { success: true, data: [...this.provisioningJobs] };
  }

  public async triggerProvisioningBatch(
    collegeId: string,
    source: 'Roll Number Range' | 'CSV Upload' | 'Manual Batch',
    totalRecords = 50
  ): Promise<ApiResponse<ProvisioningJob>> {
    await this.delay(200);
    const college = this.colleges.find((c) => c.id === collegeId);
    const newJob: ProvisioningJob = {
      id: `job-${Date.now().toString(36)}`,
      collegeId,
      collegeName: college?.name || 'Institution',
      createdBy: 'Company Administrator',
      source,
      totalRecords,
      successful: totalRecords,
      failed: 0,
      partial: 0,
      status: 'Completed',
      failedRecords: [],
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    this.provisioningJobs.unshift(newJob);
    return { success: true, data: newJob };
  }

  // Approvals & Requests
  public async getApprovals(): Promise<ApiResponse<ApprovalRequest[]>> {
    await this.delay();
    return { success: true, data: [...this.approvals] };
  }

  public async approveRequest(id: string, decisionReason: string, reviewerName = 'Company Admin'): Promise<ApiResponse<ApprovalRequest>> {
    await this.delay(100);
    const req = this.approvals.find((a) => a.id === id);
    if (!req) throw new ApiError('Approval request not found', 404);
    req.status = 'Approved';
    req.decisionReason = decisionReason;
    req.reviewedBy = reviewerName;
    req.reviewedAt = new Date().toISOString();
    return { success: true, data: req };
  }

  public async rejectRequest(id: string, decisionReason: string, reviewerName = 'Company Admin'): Promise<ApiResponse<ApprovalRequest>> {
    await this.delay(100);
    const req = this.approvals.find((a) => a.id === id);
    if (!req) throw new ApiError('Approval request not found', 404);
    req.status = 'Rejected';
    req.decisionReason = decisionReason;
    req.reviewedBy = reviewerName;
    req.reviewedAt = new Date().toISOString();
    return { success: true, data: req };
  }

  public async submitRequest(requestData: any): Promise<ApiResponse<ApprovalRequest>> {
    await this.delay(100);
    const newReq: ApprovalRequest = {
      ...requestData,
      id: `req-${Date.now().toString(36)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    this.approvals.unshift(newReq);
    return { success: true, data: newReq };
  }

  // Payments
  public async getPayments(): Promise<ApiResponse<PaymentInvoice[]>> {
    await this.delay();
    return { success: true, data: [...this.payments] };
  }

  public async recordPayment(paymentData: any): Promise<ApiResponse<PaymentInvoice>> {
    await this.delay(100);
    const inv: PaymentInvoice = {
      ...paymentData,
      id: `inv-${Date.now().toString(36)}`,
    };
    this.payments.unshift(inv);
    return { success: true, data: inv };
  }

  // Services
  public async getServices(): Promise<ApiResponse<PlatformService[]>> {
    await this.delay();
    return { success: true, data: [...this.services] };
  }

  public async toggleGlobalService(id: string): Promise<ApiResponse<PlatformService>> {
    await this.delay(60);
    const s = this.services.find((srv) => srv.id === id);
    if (!s) throw new ApiError('Service not found', 404);
    s.isGlobalActive = !s.isGlobalActive;
    return { success: true, data: s };
  }

  // Notifications
  public async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    await this.delay();
    return { success: true, data: [...this.notifications] };
  }

  public async markNotificationAsRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await this.delay(40);
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) n.isRead = true;
    return { success: true, data: { success: true } };
  }

  public async markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    await this.delay(40);
    this.notifications.forEach((n) => (n.isRead = true));
    return { success: true, data: { success: true } };
  }

  // Audit Logs
  public async getAuditLogs(): Promise<ApiResponse<AuditLogItem[]>> {
    await this.delay();
    return { success: true, data: [...this.auditLogs] };
  }

  public async logAction(logData: any): Promise<ApiResponse<AuditLogItem>> {
    const item: AuditLogItem = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...logData,
    };
    this.auditLogs.unshift(item);
    return { success: true, data: item };
  }

  // System Health
  public async getSystemHealth(): Promise<ApiResponse<SystemHealthMetric[]>> {
    await this.delay();
    return { success: true, data: [...INITIAL_SYSTEM_HEALTH] };
  }

  // Users & Staff
  public async getStaffUsers(): Promise<ApiResponse<StaffUser[]>> {
    await this.delay();
    return { success: true, data: [...this.staffUsers] };
  }

  public async addStaffUser(userData: any): Promise<ApiResponse<StaffUser>> {
    await this.delay(80);
    const user: StaffUser = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: 'Never',
    };
    this.staffUsers.unshift(user);
    return { success: true, data: user };
  }

  public async updateStaffUser(id: string, updates: Partial<StaffUser>): Promise<ApiResponse<StaffUser>> {
    await this.delay(80);
    const user = this.staffUsers.find((u) => u.id === id);
    if (!user) throw new ApiError('Staff user not found', 404);
    Object.assign(user, updates);
    return { success: true, data: user };
  }

  public async deleteStaffUser(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await this.delay(80);
    this.staffUsers = this.staffUsers.filter((u) => u.id !== id);
    return { success: true, data: { success: true } };
  }

  // App Templates
  public async getTemplates(): Promise<ApiResponse<AppTemplate[]>> {
    await this.delay();
    return { success: true, data: [...this.appTemplates] };
  }

  public async createTemplate(tmplData: any): Promise<ApiResponse<AppTemplate>> {
    await this.delay(80);
    const tmpl: AppTemplate = {
      ...tmplData,
      id: `tmpl-${Date.now().toString(36)}`,
      downloadsCount: 0,
      activeUsersCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.appTemplates.unshift(tmpl);
    return { success: true, data: tmpl };
  }

  public async updateTemplate(id: string, updates: Partial<AppTemplate>): Promise<ApiResponse<AppTemplate>> {
    await this.delay(80);
    const tmpl = this.appTemplates.find((t) => t.id === id);
    if (!tmpl) throw new ApiError('Template not found', 404);
    Object.assign(tmpl, updates, { updatedAt: new Date().toISOString() });
    return { success: true, data: tmpl };
  }

  public async deleteTemplate(id: string): Promise<ApiResponse<{ success: boolean }>> {
    await this.delay(80);
    this.appTemplates = this.appTemplates.filter((t) => t.id !== id);
    return { success: true, data: { success: true } };
  }

  // Mock OTP, Role Discovery & Google Auth
  public async requestOtp(phoneNumber: string, _purpose = 'login'): Promise<ApiResponse<any>> {
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

  public async verifyOtp(challengeId: string, otp: string): Promise<ApiResponse<any>> {
    await this.delay(120);
    if (otp !== '123456') {
      throw new ApiError('Invalid OTP verification code. 2 attempts remaining.', 401);
    }

    // If challengeId indicates multi-role or test scenario
    if (challengeId.includes('multi')) {
      return {
        success: true,
        data: {
          requiresRoleSelection: true,
          preAuthToken: `mock-preauth-${Date.now()}`,
          availableRoles: [
            {
              id: 'role-super-admin',
              role: 'super_admin',
              portal: 'admin',
              label: 'Corporate Administrator (BEXO Headquarters)',
              isDefault: true,
            },
            {
              id: 'role-college-admin',
              role: 'college_admin',
              portal: 'college',
              label: 'Dean of Technology (PSG Tech)',
              collegeId: 'clg-psg-01',
              collegeName: 'PSG College of Technology',
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

    // Default corporate admin sign-in in demo mode
    const adminUser = this.staffUsers[0] || INITIAL_STAFF_USERS[0];
    return {
      success: true,
      data: {
        token: `mock-jwt-admin-${Date.now()}`,
        user: adminUser,
        requiresRoleSelection: false,
      },
    };
  }

  public async selectRole(preAuthToken: string, selectedRoleId: string): Promise<ApiResponse<any>> {
    await this.delay(100);
    const adminUser = this.staffUsers[0] || INITIAL_STAFF_USERS[0];
    return {
      success: true,
      data: {
        token: `mock-jwt-selected-${Date.now()}`,
        user: { ...adminUser, role: selectedRoleId.includes('college') ? 'college_admin' : 'super_admin' },
      },
    };
  }

  public async verifyGoogle(idToken: string): Promise<ApiResponse<any>> {
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

    const adminUser = this.staffUsers[0] || INITIAL_STAFF_USERS[0];
    return {
      success: true,
      data: {
        isLinked: true,
        token: `mock-jwt-google-${Date.now()}`,
        user: adminUser,
      },
    };
  }

  public async linkAccount(phoneNumber: string, idToken: string): Promise<ApiResponse<any>> {
    await this.delay(100);
    return {
      success: true,
      data: {
        success: true,
        message: `Account linked to phone ${phoneNumber}`,
      },
    };
  }

  public async completeGoogleLink(preLinkToken: string, phoneNumber: string): Promise<ApiResponse<any>> {
    await this.delay(120);
    const adminUser = this.staffUsers[0] || INITIAL_STAFF_USERS[0];
    return {
      success: true,
      data: {
        token: `mock-jwt-linked-${Date.now()}`,
        user: adminUser,
        phoneNumber,
      },
    };
  }

  // Reset Demo State (In memory only)
  public resetDemoData(): void {
    this.colleges = JSON.parse(JSON.stringify(INITIAL_COLLEGES));
    this.students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    this.provisioningJobs = JSON.parse(JSON.stringify(INITIAL_PROVISIONING_JOBS));
    this.approvals = JSON.parse(JSON.stringify(INITIAL_APPROVALS));
    this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
    this.services = JSON.parse(JSON.stringify(INITIAL_SERVICES));
    this.staffUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_USERS));
    this.quotaHistory = JSON.parse(JSON.stringify(INITIAL_QUOTA_HISTORY));
    this.appTemplates = JSON.parse(JSON.stringify(INITIAL_APP_TEMPLATES));
    this.invitations = JSON.parse(JSON.stringify(INITIAL_INVITATIONS));
    this.outboxEmails = JSON.parse(JSON.stringify(INITIAL_OUTBOX_EMAILS));
    this.resetTokens = [];
  }
}

export const mockAdapter = new MockAdapter();

