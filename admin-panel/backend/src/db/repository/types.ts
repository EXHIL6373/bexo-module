export interface StudentFilters {
  collegeId?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CollegeFilters {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface AdminRepository {
  // Staff Users
  getStaffByEmail(email: string): Promise<any | null>;
  getStaffById(id: string): Promise<any | null>;
  getAllStaffUsers(collegeId?: string): Promise<any[]>;
  createStaffUser(user: any): Promise<any>;
  updateStaffUser(id: string, updates: any): Promise<any>;
  deleteStaffUser(id: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  bumpSessionVersion(userId: string): Promise<number>;

  // Sessions
  createSession(session: any): Promise<void>;
  getSessionByTokenHash(tokenHash: string): Promise<any | null>;
  revokeSession(tokenHash: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;

  // Invitations
  getInvitationById(id: string): Promise<any | null>;
  getInvitationByTokenHash(tokenHash: string): Promise<any | null>;
  createInvitation(invite: any): Promise<any>;
  updateInvitation(id: string, updates: any): Promise<any>;
  consumeInvitationAndActivateUser(tokenHash: string, passwordHash: string): Promise<{ user: any }>;

  // Password Resets
  createPasswordResetToken(reset: any): Promise<any>;
  getResetTokenByHash(tokenHash: string): Promise<any | null>;
  markResetTokenUsed(id: string): Promise<void>;
  consumeResetTokenAndSetPassword(tokenHash: string, newPasswordHash: string): Promise<{ success: boolean; email: string }>;

  // Colleges
  getAllColleges(filters?: CollegeFilters): Promise<any[]>;
  getCollegeById(id: string): Promise<any | null>;
  getCollegeByCode(code: string): Promise<any | null>;
  getCollegeBySlug(slug: string): Promise<any | null>;
  createCollege(college: any): Promise<any>;
  updateCollege(id: string, updates: any): Promise<any>;
  suspendCollege(id: string, reason: string): Promise<any>;
  reactivateCollege(id: string, reason?: string): Promise<any>;
  updateQuota(collegeId: string, newAllocated: number, reason: string, adminName: string): Promise<any>;
  getQuotaHistory(collegeId?: string): Promise<any[]>;
  toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean): Promise<any>;

  // Students
  getAllStudents(filters?: StudentFilters): Promise<any[]>;
  getStudentById(id: string): Promise<any | null>;
  getStudentByRoll(collegeId: string, rollNumber: string): Promise<any | null>;
  createStudent(student: any): Promise<any>;
  enrollStudentWithQuota(studentData: any, actor: { userId: string; name: string; role: string; ip: string }): Promise<any>;
  revokeStudentAccess(id: string, reason: string): Promise<any>;
  reactivateStudentAccess(id: string): Promise<any>;

  // Provisioning
  getAllProvisioningJobs(collegeId?: string): Promise<any[]>;
  getProvisioningJobById(id: string): Promise<any | null>;
  createProvisioningJob(job: any): Promise<any>;
  updateProvisioningJob(id: string, updates: any): Promise<any>;

  // Approvals
  getAllApprovals(status?: string): Promise<any[]>;
  getApprovalById(id: string): Promise<any | null>;
  createApproval(approval: any): Promise<any>;
  updateApprovalDecision(
    id: string,
    status: 'Approved' | 'Rejected',
    decisionReason: string,
    reviewedBy: string
  ): Promise<any>;

  // Services
  getAllServices(): Promise<any[]>;
  getServiceById(id: string): Promise<any | null>;
  toggleGlobalService(id: string): Promise<any>;

  // Payments
  getAllPayments(collegeId?: string): Promise<any[]>;
  createPayment(payment: any): Promise<any>;

  // Notifications
  getAllNotifications(): Promise<any[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  createNotification(notif: any): Promise<any>;

  // Audit Logs
  getAllAuditLogs(entity?: string, page?: number, limit?: number): Promise<any[]>;
  createAuditLog(log: any): Promise<any>;

  // Templates
  getAllTemplates(): Promise<any[]>;
  getTemplateById(id: string): Promise<any | null>;
  createTemplate(tmpl: any): Promise<any>;
  updateTemplate(id: string, updates: any): Promise<any>;
  deleteTemplate(id: string): Promise<void>;
  togglePublishTemplate(id: string): Promise<any>;
  toggleFeaturedTemplate(id: string): Promise<any>;

  // System Health
  getSystemHealth(): Promise<any[]>;

  // Lifecycle Outbox
  createOutboxEvent(event: any, tx?: any): Promise<any>;
  getPendingOutboxEvents(): Promise<any[]>;
  updateOutboxEvent(id: string, updates: any): Promise<any>;
  getOutboxEventsByCollege(collegeId: string): Promise<any[]>;
}

