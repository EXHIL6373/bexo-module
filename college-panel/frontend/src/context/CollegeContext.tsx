import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  College,
  Student,
  ProvisioningJob,
  ApprovalRequest,
  NotificationItem,
  AuditLogItem,
  PaymentInvoice,
  StaffUser,
  CollegeInvitation,
  StudentEntitlement,
  CollegeTask,
  CollegeAnnouncement,
  OutboxEmail,
  Role,
  PlatformService,
} from '../types';
import {
  apiClient,
  authService,
  collegeService,
  studentsService,
  provisioningService,
  staffService,
  requestsService,
  notificationsService,
  activityService,
  mockAdapter,
} from '../services';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface CollegeContextType {
  // Session & Authentication
  currentUser: StaffUser;
  currentCollege: College | undefined;
  colleges: College[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isCorporateAdmin: boolean;
  canAccessAdminPanel: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: StaffUser; redirectPath: string; error?: string }>;
  logout: () => Promise<void>;

  // Data sets & Scoped Queries
  students: Student[];
  getScopedStudentsForCollege: (collegeId?: string) => Student[];
  getStudentById: (studentId: string) => { student?: Student; isTenantViolation: boolean };
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'lastActivityAt'> & { collegeId?: string; collegeName?: string }) => Promise<Student>;
  updateStudent: (studentId: string, updates: Partial<Student>) => Promise<Student>;
  revokeStudentAccess: (studentId: string, reason: string) => Promise<void>;
  reactivateStudentAccess: (studentId: string) => Promise<void>;
  bulkImportStudents: (
    arg1: string | Array<{
      name: string;
      rollNumber: string;
      email: string;
      department?: string;
      course?: string;
      batch?: string;
      phone?: string;
    }>,
    arg2?: Array<{
      name: string;
      rollNumber: string;
      email: string;
      department?: string;
      course?: string;
      batch?: string;
      phone?: string;
    }>
  ) => Promise<{ importedCount: number; skippedCount: number; errors: Array<{ rollNumber: string; reason: string }> }>;

  // Provisioning & Entitlements
  provisioningJobs: ProvisioningJob[];
  getScopedProvisioningJobsForCollege: (collegeId?: string) => ProvisioningJob[];
  provisionStudentAccess: (
    collegeId: string,
    studentIds: string[],
    serviceName: string
  ) => Promise<{ job: ProvisioningJob; successful: number; failed: number; skipped: number }>;
  retryFailedProvisioningRecords: (jobId: string) => Promise<{ success: boolean; retriedCount: number }>;
  studentEntitlements: StudentEntitlement[];
  getScopedEntitlementsForCollege: (collegeId?: string) => StudentEntitlement[];
  requestStudentRevocation: (studentId: string, serviceName: string, reason: string) => void;

  // Staff & Team Management
  staffUsers: StaffUser[];
  getScopedStaffForCollege: (collegeId?: string) => StaffUser[];
  invitations: CollegeInvitation[];
  createStaffInvitation: (
    collegeId: string,
    input: { name: string; email: string; role: Role; department?: string; designation?: string; mobile?: string }
  ) => Promise<CollegeInvitation>;
  resendInvitation: (invitationId: string) => Promise<CollegeInvitation>;
  revokeInvitation: (invitationId: string, reason?: string) => Promise<void>;
  suspendCollegeStaff: (staffId: string, reason?: string) => Promise<void>;
  activateCollegeStaff: (staffId: string) => Promise<void>;
  changeStaffRole: (staffId: string, newRole: Role) => Promise<void>;
  updateStaffDetails: (staffId: string, updates: Partial<StaffUser>) => Promise<void>;
  updateUserProfile: (updates: { name?: string; phone?: string; designation?: string; department?: string }) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };

  // Institutional Requests & Approvals
  approvals: ApprovalRequest[];
  getScopedApprovalsForCollege: (collegeId?: string) => ApprovalRequest[];
  submitRequest: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status' | 'collegeId' | 'collegeName'> & { collegeId?: string; collegeName?: string }) => void;

  // Notifications & Announcements
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  getScopedNotificationsForCollege: (collegeId?: string) => NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  collegeAnnouncements: CollegeAnnouncement[];
  getScopedAnnouncementsForCollege: (collegeId?: string) => CollegeAnnouncement[];
  collegeTasks: CollegeTask[];
  getScopedTasksForCollege: (collegeId?: string) => CollegeTask[];
  toggleTaskComplete: (taskId: string) => void;

  // Activity & Audit
  auditLogs: AuditLogItem[];
  getScopedAuditLogsForCollege: (collegeId?: string) => AuditLogItem[];
  logAction: (action: string, entity: string, entityId: string, entityName: string, reason?: string) => void;

  // Billing
  payments: PaymentInvoice[];
  getScopedPaymentsForCollege: (collegeId?: string) => PaymentInvoice[];

  // Services Catalog Visibility
  services: PlatformService[];

  // Settings & College
  getCollegeById: (id: string) => College | undefined;
  updateCollegeSettings: (collegeId: string, updates: Partial<College>) => Promise<void>;
  enforceCollegeScope: (targetCollegeId: string) => boolean;
  getEffectiveCollegeId: (requestedCollegeId?: string) => string | undefined;

  // Invitations & Password Recovery
  outboxEmails: OutboxEmail[];
  activeEmailForPreview: OutboxEmail | null;
  setActiveEmailForPreview: (email: OutboxEmail | null) => void;
  validateInvitationToken: (token: string) => { valid: boolean; error?: string; invitation?: CollegeInvitation };
  activateAccount: (token: string, password: string) => Promise<{ success: boolean; user?: StaffUser; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  validatePasswordResetToken: (token: string) => { valid: boolean; email?: string; error?: string };
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // State Refresh & Demo Reset
  refreshCollegeData: () => Promise<void>;
  resetAllData: () => void;
}

const CollegeContext = createContext<CollegeContextType | undefined>(undefined);

export const CollegeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser>(() => {
    // If in demo mode, default to College A primary admin
    if (apiClient.isDemoMode()) {
      const demoUser = mockAdapter.getSession().user;
      if (demoUser) return demoUser;
    }
    // Default institutional user for display before active login
    return {
      id: 'usr-clg-default',
      name: 'College Administrator',
      email: 'venkatesh.r@psgtech.edu',
      role: 'college_admin',
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      isActive: true,
      accountStatus: 'ACTIVE',
      lastLoginAt: 'Never',
      createdAt: new Date().toISOString(),
    };
  });

  const [currentCollege, setCurrentCollege] = useState<College | undefined>(undefined);
  const [colleges, setColleges] = useState<College[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [provisioningJobs, setProvisioningJobs] = useState<ProvisioningJob[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [payments, setPayments] = useState<PaymentInvoice[]>([]);
  const [studentEntitlements, setStudentEntitlements] = useState<StudentEntitlement[]>([]);
  const [collegeTasks, setCollegeTasks] = useState<CollegeTask[]>([]);
  const [collegeAnnouncements, setCollegeAnnouncements] = useState<CollegeAnnouncement[]>([]);
  const [invitations, setInvitations] = useState<CollegeInvitation[]>([]);
  const [outboxEmails, setOutboxEmails] = useState<OutboxEmail[]>([]);
  const [activeEmailForPreview, setActiveEmailForPreview] = useState<OutboxEmail | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(apiClient.getToken());
  });

  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Centralized data synchronizer
  const refreshCollegeData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (apiClient.isDemoMode()) {
        const { user, college } = await mockAdapter.getMe().catch(async () => {
          return mockAdapter.login('venkatesh.r@psgtech.edu');
        });
        setCurrentUser(user);
        setCurrentCollege(college);
        setColleges([college]);
        setIsAuthenticated(true);

        const [stus, stf, jobs, apps, notifs, logs, pays, ents, tsks, anns] = await Promise.all([
          mockAdapter.getStudents(),
          mockAdapter.getStaff(),
          mockAdapter.getProvisioningJobs(),
          mockAdapter.getRequests(),
          mockAdapter.getNotifications(),
          mockAdapter.getActivityLogs(),
          mockAdapter.getBilling(),
          mockAdapter.getEntitlements(),
          mockAdapter.getTasks(),
          mockAdapter.getAnnouncements(),
        ]);

        setStudents(stus);
        setStaffUsers(stf);
        setProvisioningJobs(jobs);
        setApprovals(apps);
        setNotifications(notifs);
        setAuditLogs(logs);
        setPayments(pays);
        setStudentEntitlements(ents);
        setCollegeTasks(tsks);
        setCollegeAnnouncements(anns);
        setOutboxEmails(mockAdapter.getOutboxEmails());
      } else {
        // Real Backend Sync
        if (!apiClient.getToken()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const me = await authService.getMe();
        setCurrentUser(me.user);
        setCurrentCollege(me.college);
        setColleges([me.college]);
        setIsAuthenticated(true);

        const [stus, stf, jobs, apps, notifs, logs, pays, ents, tsks, anns] = await Promise.all([
          studentsService.getStudents().catch(() => []),
          staffService.getStaff().catch(() => []),
          provisioningService.getJobs().catch(() => []),
          requestsService.getRequests().catch(() => []),
          notificationsService.getNotifications().catch(() => []),
          activityService.getActivityLogs().catch(() => []),
          collegeService.getBilling().catch(() => []),
          provisioningService.getEntitlements().catch(() => []),
          notificationsService.getTasks().catch(() => []),
          notificationsService.getAnnouncements().catch(() => []),
        ]);

        setStudents(stus);
        setStaffUsers(stf);
        setProvisioningJobs(jobs);
        setApprovals(apps);
        setNotifications(notifs);
        setAuditLogs(logs);
        setPayments(pays);
        setStudentEntitlements(ents);
        setCollegeTasks(tsks);
        setCollegeAnnouncements(anns);
      }
    } catch (err: any) {
      if (err.statusCode === 401) {
        setIsAuthenticated(false);
        apiClient.clearToken();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      setIsAuthenticated(false);
      addToast('error', 'Session Expired', 'Please sign in to continue.');
    });

    refreshCollegeData();
  }, [refreshCollegeData, addToast]);

  // Log action
  const logAction = useCallback(
    (action: string, entity: string, entityId: string, entityName: string, reason?: string) => {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorStaffId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role.replace('_', ' ').toUpperCase(),
        action,
        entity,
        entityId,
        entityName,
        ip: '127.0.0.1',
        result: 'Success',
        reason: reason || 'College portal action',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  // Authentication & Access Controls
  const login = async (email: string, password?: string) => {
    try {
      const res = await authService.login(email, password);
      setCurrentUser(res.user);
      setCurrentCollege(res.college);
      setColleges([res.college]);
      setIsAuthenticated(true);
      await refreshCollegeData();
      addToast('success', 'Session Active', `Logged in as ${res.user.name} (${res.college.name})`);
      return { success: true, user: res.user, redirectPath: '/college/dashboard' };
    } catch (err: any) {
      return { success: false, redirectPath: '/login', error: err.message || 'Authentication failure.' };
    }
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    apiClient.clearToken();
    addToast('info', 'Signed Out', 'You have been securely signed out of BEXO College Portal.');
  };

  // Multi-Tenant Isolation Enforcement
  const getEffectiveCollegeId = useCallback(
    (requestedCollegeId?: string): string | undefined => {
      if (!currentUser.collegeId) return undefined;
      if (requestedCollegeId && requestedCollegeId !== currentUser.collegeId) {
        logAction(
          'CROSS_TENANT_TAMPER_DETECTED',
          'SecurityGateway',
          currentUser.id,
          currentUser.name,
          `Multi-Tenant Isolation: Requested foreign collegeId "${requestedCollegeId}" sanitized to "${currentUser.collegeId}".`
        );
      }
      return currentUser.collegeId;
    },
    [currentUser, logAction]
  );

  const enforceCollegeScope = useCallback(
    (targetCollegeId: string): boolean => {
      return Boolean(currentUser.collegeId && currentUser.collegeId === targetCollegeId);
    },
    [currentUser]
  );

  const getCollegeById = useCallback(
    (id: string): College | undefined => {
      if (!currentUser.collegeId || id !== currentUser.collegeId) {
        logAction(
          'CROSS_TENANT_INSPECTION_BLOCKED',
          'College',
          id,
          'Unauthorized College Query',
          `User ${currentUser.name} attempted cross-tenant inspection of college "${id}".`
        );
        return undefined;
      }
      return currentCollege;
    },
    [currentUser, currentCollege, logAction]
  );

  // Scoped Getters
  const getScopedStudentsForCollege = useCallback(() => {
    return students;
  }, [students]);

  const getScopedStaffForCollege = useCallback(() => {
    return staffUsers;
  }, [staffUsers]);

  const getScopedProvisioningJobsForCollege = useCallback(() => {
    return provisioningJobs;
  }, [provisioningJobs]);

  const getScopedApprovalsForCollege = useCallback(() => {
    return approvals;
  }, [approvals]);

  const getScopedNotificationsForCollege = useCallback(() => {
    return notifications;
  }, [notifications]);

  const getScopedAuditLogsForCollege = useCallback(() => {
    return auditLogs;
  }, [auditLogs]);

  const getScopedPaymentsForCollege = useCallback(() => {
    return payments;
  }, [payments]);

  const getScopedEntitlementsForCollege = useCallback(() => {
    return studentEntitlements;
  }, [studentEntitlements]);

  const getScopedTasksForCollege = useCallback(() => {
    return collegeTasks;
  }, [collegeTasks]);

  const getScopedAnnouncementsForCollege = useCallback(() => {
    return collegeAnnouncements;
  }, [collegeAnnouncements]);

  // Student Actions
  const getStudentById = useCallback(
    (studentId: string): { student?: Student; isTenantViolation: boolean } => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return { isTenantViolation: false, student: undefined };
      if (currentUser.collegeId && student.collegeId !== currentUser.collegeId) {
        logAction(
          'TENANT_ISOLATION_BLOCKED',
          'Student',
          studentId,
          student.name,
          `User attempted to inspect student ${studentId} from foreign college ${student.collegeId}`
        );
        return { isTenantViolation: true, student: undefined };
      }
      return { isTenantViolation: false, student };
    },
    [students, currentUser, logAction]
  );

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'lastActivityAt'> & { collegeId?: string; collegeName?: string }): Promise<Student> => {
    if (!apiClient.isDemoMode()) {
      const created = await studentsService.addStudent({
        name: studentData.name,
        rollNumber: studentData.rollNumber,
        email: studentData.email,
        phone: studentData.phone || undefined,
        department: studentData.department,
        course: studentData.course,
        batch: studentData.batch,
        enrolledYear: studentData.enrolledYear,
        accessStatus: studentData.accessStatus || 'Active',
        services: studentData.services || [],
        entitlementId: studentData.entitlementId,
        resumeCount: studentData.resumeCount,
      });
      setStudents((prev) => [created, ...prev]);
      if (currentCollege) {
        setCurrentCollege({ ...currentCollege, totalStudents: currentCollege.totalStudents + 1 });
      }
      addToast('success', 'Student Enrolled', `${created.name} (${created.rollNumber}) registered.`);
      return created;
    }

    const now = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collegeId: currentUser.collegeId || studentData.collegeId || 'clg-psg-01',
      collegeName: currentCollege?.name || studentData.collegeName || 'PSG College of Technology',
      createdAt: now,
      lastActivityAt: now,
      updatedAt: now,
    };
    setStudents((prev) => [newStudent, ...prev]);
    if (currentCollege) {
      setCurrentCollege({ ...currentCollege, totalStudents: currentCollege.totalStudents + 1 });
    }
    addToast('success', 'Student Enrolled', `${newStudent.name} (${newStudent.rollNumber}) registered.`);
    return newStudent;
  };

  const updateStudent = async (studentId: string, updates: Partial<Student>) => {
    const updated = await studentsService.updateStudent(studentId, updates);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    addToast('success', 'Student Updated', `Record for ${updated.name} updated.`);
    return updated;
  };

  const revokeStudentAccess = async (studentId: string, reason: string) => {
    const updated = await studentsService.revokeStudentAccess(studentId, reason);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    addToast('warning', 'Access Revoked', `Student access revoked.`);
  };

  const reactivateStudentAccess = async (studentId: string) => {
    const updated = await studentsService.reactivateStudentAccess(studentId);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    addToast('success', 'Access Restored', `Student access restored to Active.`);
  };

  const bulkImportStudents = async (
    arg1: string | Array<{ name: string; rollNumber: string; email: string; department?: string; course?: string; batch?: string; phone?: string }>,
    arg2?: Array<{ name: string; rollNumber: string; email: string; department?: string; course?: string; batch?: string; phone?: string }>
  ): Promise<{ importedCount: number; skippedCount: number; errors: Array<{ rollNumber: string; reason: string }> }> => {
    const studentList = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
    const collegeId = typeof arg1 === 'string' ? arg1 : (currentUser.collegeId || 'clg-psg-01');

    if (!apiClient.isDemoMode()) {
      const res = await studentsService.bulkImportStudents(studentList);
      await refreshCollegeData();
      addToast('success', 'Import Completed', `${res.importedCount} students enrolled. ${res.skippedCount} skipped.`);
      return res;
    }

    const now = new Date().toISOString();
    const existingRolls = new Set(students.map((s) => s.rollNumber.toLowerCase()));
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
        errors.push({ rollNumber: rollClean, reason: `Roll number already enrolled in this college` });
        return;
      }

      validNewStudents.push({
        id: `stu-imp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: row.name.trim(),
        rollNumber: rollClean,
        collegeId,
        collegeName: currentCollege?.name || 'College',
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
      setStudents((prev) => [...validNewStudents, ...prev]);
      if (currentCollege) {
        setCurrentCollege((c) => c ? { ...c, totalStudents: c.totalStudents + validNewStudents.length } : c);
      }
      addToast('success', 'Import Completed', `${validNewStudents.length} students enrolled. ${errors.length} skipped.`);
    }

    return { importedCount: validNewStudents.length, skippedCount: errors.length, errors };
  };

  // Provisioning
  const provisionStudentAccess = async (_collegeId: string, studentIds: string[], serviceName: string) => {
    const res = await provisioningService.triggerProvisioning(studentIds, serviceName);
    await refreshCollegeData();
    addToast('success', 'Provisioning Completed', `${res.successful} student entitlements provisioned.`);
    return res;
  };

  const retryFailedProvisioningRecords = async (jobId: string) => {
    const res = await provisioningService.retryJob(jobId);
    await refreshCollegeData();
    addToast('success', 'Records Retried', `${res.retriedCount} records provisioned successfully.`);
    return res;
  };

  const requestStudentRevocation = async (studentId: string, serviceName: string, reason: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || !currentCollege) return;
    submitRequest({
      type: 'Access Request' as any,
      requester: currentUser.name,
      requesterEmail: currentUser.email,
      requesterRole: currentUser.role,
      details: {
        title: `Revoke ${serviceName} for ${student.name} (${student.rollNumber})`,
        description: `Revocation Request: ${reason}`,
        serviceName,
      },
      priority: 'Medium',
    });
    addToast('info', 'Revocation Requested', 'Request submitted for review.');
  };

  // Staff Management
  const createStaffInvitation = async (
    _collegeId: string,
    input: { name: string; email: string; role: Role; department?: string; designation?: string; mobile?: string }
  ) => {
    const invite = await staffService.inviteStaff(input);
    setInvitations((prev) => [invite, ...prev]);
    await refreshCollegeData();
    addToast('success', 'Staff Invited', `Invitation sent to ${invite.email}`);
    return invite;
  };

  const resendInvitation = async (invitationId: string) => {
    const invite = await staffService.resendInvite(invitationId);
    addToast('info', 'Invitation Resent', `Sent to ${invite.email}`);
    return invite;
  };

  const revokeInvitation = async (invitationId: string, reason?: string) => {
    await staffService.revokeInvite(invitationId, reason);
    setInvitations((prev) => prev.map((i) => (i.id === invitationId ? { ...i, status: 'REVOKED' } : i)));
    addToast('warning', 'Invitation Revoked', 'Token invalidated.');
  };

  const suspendCollegeStaff = async (staffId: string, reason?: string) => {
    const updated = await staffService.suspendStaff(staffId, reason);
    setStaffUsers((prev) => prev.map((u) => (u.id === staffId ? updated : u)));
    addToast('warning', 'Staff Suspended', `${updated.name} has been suspended.`);
  };

  const activateCollegeStaff = async (staffId: string) => {
    const updated = await staffService.activateStaff(staffId);
    setStaffUsers((prev) => prev.map((u) => (u.id === staffId ? updated : u)));
    addToast('success', 'Staff Activated', `${updated.name} is now active.`);
  };

  const changeStaffRole = async (staffId: string, newRole: Role) => {
    const updated = await staffService.updateStaffRole(staffId, newRole);
    setStaffUsers((prev) => prev.map((u) => (u.id === staffId ? updated : u)));
    addToast('info', 'Role Updated', `${updated.name} role changed to ${newRole}.`);
  };

  const updateStaffDetails = async (staffId: string, updates: Partial<StaffUser>) => {
    setStaffUsers((prev) => prev.map((u) => (u.id === staffId ? { ...u, ...updates } : u)));
    addToast('success', 'Staff Updated', 'Account details saved.');
  };

  const updateUserProfile = async (updates: { name?: string; phone?: string; designation?: string; department?: string }) => {
    const updated = await staffService.updateProfile(updates);
    setCurrentUser(updated);
    addToast('success', 'Profile Updated', 'Your profile details have been saved.');
  };

  const changeUserPassword = (currentPassword: string, newPassword: string) => {
    if (!currentPassword || !newPassword) {
      return { success: false, error: 'Current and new password are required.' };
    }
    staffService.changePassword(currentPassword, newPassword).catch(() => {});
    addToast('success', 'Password Changed', 'Your password has been updated.');
    return { success: true };
  };

  // Requests
  const submitRequest = (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status' | 'collegeId' | 'collegeName'> & { collegeId?: string; collegeName?: string }) => {
    const created: ApprovalRequest = {
      ...request,
      id: `appr-${Date.now()}`,
      collegeId: currentUser.collegeId || request.collegeId || 'clg-psg-01',
      collegeName: currentCollege?.name || request.collegeName || 'College',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setApprovals((prev) => [created, ...prev]);
    requestsService.submitRequest(request as any).catch(() => {});
    addToast('success', 'Request Submitted', `${request.type} submitted for BEXO Administration review.`);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    notificationsService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    notificationsService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleTaskComplete = (taskId: string) => {
    notificationsService.toggleTask(taskId);
    setCollegeTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t))
    );
  };

  // Settings
  const updateCollegeSettings = async (_collegeId: string, updates: Partial<College>) => {
    const updated = await collegeService.updateSettings(updates);
    setCurrentCollege(updated);
    setColleges([updated]);
    addToast('success', 'Settings Saved', 'Institutional settings updated.');
  };

  // Auth helper methods
  const validateInvitationToken = (token: string) => {
    const invite = invitations.find((i) => i.token === token);
    if (!invite) return { valid: false, error: 'Invalid or missing invitation link.' };
    if (invite.status === 'ACTIVE') return { valid: false, error: 'This invitation has already been redeemed.', invitation: invite };
    if (invite.status === 'REVOKED') return { valid: false, error: 'This invitation has been revoked.', invitation: invite };
    if (new Date(invite.expiresAt) < new Date()) return { valid: false, error: 'This invitation token has expired.', invitation: invite };
    return { valid: true, invitation: invite };
  };

  const activateAccount = async (token: string, password: string) => {
    try {
      const res = await authService.activateAccount(token, password);
      setCurrentUser(res.user);
      setCurrentCollege(res.college);
      setColleges([res.college]);
      setIsAuthenticated(true);
      await refreshCollegeData();
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await authService.requestPasswordReset(email);
      return { success: true, token: res.token };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const validatePasswordResetToken = (token: string) => {
    if (!token || !token.startsWith('rst_')) {
      return { valid: false, error: 'Invalid or missing password reset link.' };
    }
    const matched = outboxEmails.find((e) => e.actionUrl?.includes(token));
    return { valid: true, email: matched?.to || 'admin@college.edu' };
  };

  const resetPasswordWithToken = async (token: string, newPassword: string) => {
    try {
      await authService.resetPassword(token, newPassword);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Demo reset without destructive localStorage.clear()
  const resetAllData = () => {
    if (apiClient.isDemoMode()) {
      refreshCollegeData();
      addToast('info', 'Data Restored', 'In-memory demonstration workspace restored.');
    }
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Read-only catalog of platform services for visibility
  const services: PlatformService[] = useMemo(() => {
    return [
      {
        id: 'srv-portfolio',
        code: 'SRV-PORTFOLIO',
        name: 'BEXO Portfolio Builder',
        slug: 'portfolio-builder',
        category: 'Career & Digital Identity',
        description: 'Interactive portfolio websites with verified projects, skill badges, and custom subdomain hosting.',
        version: 'v3.2',
        isGlobalActive: true,
        totalCollegeAdoption: 12,
        totalStudentsEnrolled: 8500,
        icon: 'Layout',
        features: ['Responsive Showcase', 'GitHub Integration', 'Custom Subdomain', 'Analytics'],
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'srv-resume',
        code: 'SRV-RESUME',
        name: 'ATS Smart Resume Builder',
        slug: 'ats-resume-builder',
        category: 'Career & Digital Identity',
        description: 'AI-assisted ATS resume builder with real-time scoring, recruiter keyword targeting, and multi-format export.',
        version: 'v2.8',
        isGlobalActive: true,
        totalCollegeAdoption: 10,
        totalStudentsEnrolled: 7200,
        icon: 'FileText',
        features: ['ATS Keyword Score', 'Multi-Template Export', 'PDF / Word Sync', 'Recruiter Proofing'],
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
  }, []);

  return (
    <CollegeContext.Provider
      value={{
        currentUser,
        currentCollege,
        colleges,
        isAuthenticated,
        isLoading,
        isCorporateAdmin: false,
        canAccessAdminPanel: false,
        login,
        logout,
        students,
        getScopedStudentsForCollege,
        getStudentById,
        addStudent,
        updateStudent,
        revokeStudentAccess,
        reactivateStudentAccess,
        bulkImportStudents,
        provisioningJobs,
        getScopedProvisioningJobsForCollege,
        provisionStudentAccess,
        retryFailedProvisioningRecords,
        studentEntitlements,
        getScopedEntitlementsForCollege,
        requestStudentRevocation,
        staffUsers,
        getScopedStaffForCollege,
        invitations,
        createStaffInvitation,
        resendInvitation,
        revokeInvitation,
        suspendCollegeStaff,
        activateCollegeStaff,
        changeStaffRole,
        updateStaffDetails,
        updateUserProfile,
        changeUserPassword,
        approvals,
        getScopedApprovalsForCollege,
        submitRequest,
        notifications,
        unreadNotificationCount,
        getScopedNotificationsForCollege,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        collegeAnnouncements,
        getScopedAnnouncementsForCollege,
        collegeTasks,
        getScopedTasksForCollege,
        toggleTaskComplete,
        auditLogs,
        getScopedAuditLogsForCollege,
        logAction,
        payments,
        getScopedPaymentsForCollege,
        services,
        getCollegeById,
        updateCollegeSettings,
        enforceCollegeScope,
        getEffectiveCollegeId,
        outboxEmails,
        activeEmailForPreview,
        setActiveEmailForPreview,
        validateInvitationToken,
        activateAccount,
        requestPasswordReset,
        validatePasswordResetToken,
        resetPasswordWithToken,
        toasts,
        addToast,
        removeToast,
        refreshCollegeData,
        resetAllData,
      }}
    >
      {children}
    </CollegeContext.Provider>
  );
};

export const useCollege = () => {
  const context = useContext(CollegeContext);
  if (!context) {
    throw new Error('useCollege must be used within a CollegeProvider');
  }
  return context;
};

// Backward-compatible alias for useAdmin across existing components
export const useAdmin = useCollege;
