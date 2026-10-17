import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  Role,
  AppTemplate,
  CollegeInvitation,
  OutboxEmail,
  AddCollegeAdminInput,
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
import {
  apiClient,
  mockAdapter,
  authService,
  collegesService,
  studentsService,
  provisioningService,
  servicesService,
  approvalsService,
  paymentsService,
  notificationsService,
  auditService,
  systemHealthService,
  usersService,
  templatesService,
} from '../services';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface AdminContextType {
  // Current user & RBAC
  currentUser: StaffUser;
  setCurrentUser: (user: StaffUser) => void;
  staffUsers: StaffUser[];
  addStaffUser: (user: Omit<StaffUser, 'id' | 'createdAt' | 'lastLoginAt'>) => Promise<void>;
  updateStaffUser: (id: string, updates: Partial<StaffUser>) => Promise<void>;
  deleteStaffUser: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isCorporateAdmin: boolean;
  canAccessAdminPanel: boolean;
  switchToSuperAdmin: (targetId?: string) => void;

  // Scope (Company vs College specific filter)
  activeScope: 'company' | string;
  setActiveScope: (scope: 'company' | string) => void;
  isCompanyScope: boolean;

  // Colleges
  colleges: College[];
  getCollegeById: (id: string) => College | undefined;
  addCollege: (newCollege: Omit<College, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>) => string;
  updateCollege: (id: string, updates: Partial<College>) => Promise<void>;
  suspendCollege: (id: string, reason: string) => Promise<void>;
  reactivateCollege: (id: string, reason?: string) => Promise<void>;
  updateQuota: (collegeId: string, newAllocated: number, reason: string) => Promise<void>;
  quotaHistory: QuotaHistoryEntry[];
  toggleCollegeService: (collegeId: string, serviceId: string, enabled: boolean) => Promise<void>;

  // Students
  students: Student[];
  scopedStudents: Student[];
  revokeStudentAccess: (studentId: string, reason: string) => Promise<void>;
  reactivateStudentAccess: (studentId: string) => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'lastActivityAt'>) => Promise<void>;

  // Provisioning
  provisioningJobs: ProvisioningJob[];
  scopedProvisioningJobs: ProvisioningJob[];
  triggerProvisioningBatch: (
    collegeId: string,
    source: 'Roll Number Range' | 'CSV Upload' | 'Manual Batch',
    startRoll?: string,
    endRoll?: string,
    batchSize?: number
  ) => Promise<ProvisioningJob>;

  // Approvals & Requests
  approvals: ApprovalRequest[];
  approveRequest: (id: string, decisionReason: string) => Promise<void>;
  rejectRequest: (id: string, decisionReason: string) => Promise<void>;
  submitRequest: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;

  // Audit Logs
  auditLogs: AuditLogItem[];
  logAction: (
    action: string,
    entity: string,
    entityId: string,
    entityName: string,
    reason?: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ) => Promise<void>;

  // Services Catalog
  services: PlatformService[];
  toggleGlobalService: (id: string) => Promise<void>;

  // Payments
  payments: PaymentInvoice[];
  recordPayment: (payment: Omit<PaymentInvoice, 'id'>) => Promise<void>;

  // System Health
  systemHealth: SystemHealthMetric[];
  refreshSystemHealth: () => Promise<void>;

  // Global Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // App Templates
  appTemplates: AppTemplate[];
  addAppTemplate: (template: Omit<AppTemplate, 'id' | 'createdAt' | 'updatedAt' | 'downloadsCount' | 'activeUsersCount'>) => Promise<string>;
  updateAppTemplate: (id: string, updates: Partial<AppTemplate>) => Promise<void>;
  deleteAppTemplate: (id: string) => Promise<void>;
  togglePublishTemplate: (id: string) => Promise<void>;
  toggleFeaturedTemplate: (id: string) => Promise<void>;

  // College Invitations & Access Control
  invitations: CollegeInvitation[];
  outboxEmails: OutboxEmail[];
  activeEmailForPreview: OutboxEmail | null;
  setActiveEmailForPreview: (email: OutboxEmail | null) => void;
  createCollegeAdminInvitation: (collegeId: string, input: AddCollegeAdminInput) => Promise<CollegeInvitation>;
  createStaffInvitation: (collegeId: string, input: { name: string; email: string; role: Role; department?: string; designation?: string; mobile?: string }) => Promise<CollegeInvitation>;
  resendInvitation: (invitationId: string) => Promise<CollegeInvitation>;
  revokeInvitation: (invitationId: string, reason?: string) => Promise<void>;
  validateInvitationToken: (token: string) => { valid: boolean; error?: string; invitation?: CollegeInvitation };
  activateAccount: (token: string, password: string) => Promise<{ success: boolean; user?: StaffUser; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  validatePasswordResetToken: (token: string) => { valid: boolean; email?: string; error?: string };
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  suspendCollegeStaff: (staffId: string, reason?: string) => Promise<void>;
  activateCollegeStaff: (staffId: string) => Promise<void>;
  changeStaffRole: (staffId: string, newRole: Role) => Promise<void>;
  updateStaffDetails: (staffId: string, updates: Partial<StaffUser>) => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: StaffUser; redirectPath: string; error?: string }>;
  loginWithSession: (token: string, user: any) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: { name?: string; phone?: string; designation?: string; department?: string }) => Promise<void>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Reset demo data
  resetAllData: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDemo = apiClient.isDemoMode();

  // State management
  const [colleges, setColleges] = useState<College[]>(() => (isDemo ? INITIAL_COLLEGES : []));
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => (isDemo ? INITIAL_STAFF_USERS : []));
  const [students, setStudents] = useState<Student[]>(() => (isDemo ? INITIAL_STUDENTS : []));
  const [provisioningJobs, setProvisioningJobs] = useState<ProvisioningJob[]>(() => (isDemo ? INITIAL_PROVISIONING_JOBS : []));
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => (isDemo ? INITIAL_APPROVALS : []));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => (isDemo ? INITIAL_NOTIFICATIONS : []));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => (isDemo ? INITIAL_AUDIT_LOGS : []));
  const [quotaHistory, setQuotaHistory] = useState<QuotaHistoryEntry[]>(() => (isDemo ? INITIAL_QUOTA_HISTORY : []));
  const [payments, setPayments] = useState<PaymentInvoice[]>(() => (isDemo ? INITIAL_PAYMENTS : []));
  const [services, setServices] = useState<PlatformService[]>(() => (isDemo ? INITIAL_SERVICES : []));
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetric[]>(() => (isDemo ? INITIAL_SYSTEM_HEALTH : []));
  const [appTemplates, setAppTemplates] = useState<AppTemplate[]>(() => (isDemo ? INITIAL_APP_TEMPLATES : []));
  const [invitations, setInvitations] = useState<CollegeInvitation[]>(() => (isDemo ? INITIAL_INVITATIONS : []));
  const [outboxEmails, setOutboxEmails] = useState<OutboxEmail[]>(() => (isDemo ? INITIAL_OUTBOX_EMAILS : []));

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<StaffUser>(() => INITIAL_STAFF_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (isDemo) return true;
    return Boolean(apiClient.getToken());
  });

  const activeScope = 'company' as const;
  const setActiveScope = useCallback((_scope: 'company' | string) => {
    // No-op: Central Admin is permanently locked to company-wide authority
  }, []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeEmailForPreview, setActiveEmailForPreview] = useState<OutboxEmail | null>(null);

  // Toast Helpers
  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(INITIAL_STAFF_USERS[0]);
    addToast('info', 'Signed Out', 'You have been safely signed out of the BEXO Admin Panel.');
    if (typeof window !== 'undefined') {
      window.location.hash = '/login';
    }
  }, [addToast]);

  // Hook up 401 Unauthorized callback
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      setIsAuthenticated(false);
      addToast('error', 'Session Expired', 'Your administrative session has timed out. Please sign in again.');
      if (typeof window !== 'undefined') {
        window.location.hash = '/login';
      }
    });
  }, [addToast]);

  // Centralized administrative data synchronizer
  const refreshData = useCallback(async () => {
    if (!isDemo && !apiClient.getToken()) {
      return; // Wait until authenticated in production
    }

    try {
      const [
        clgRes,
        stuRes,
        jobsRes,
        apprRes,
        notifRes,
        auditRes,
        payRes,
        srvRes,
        usersRes,
        qhRes,
        tmplRes,
        healthRes,
      ] = await Promise.all([
        collegesService.getColleges(),
        studentsService.getStudents(),
        provisioningService.getProvisioningJobs(),
        approvalsService.getApprovals(),
        notificationsService.getNotifications(),
        auditService.getAuditLogs(),
        paymentsService.getPayments(),
        servicesService.getPlatformServices(),
        usersService.getStaffUsers(),
        collegesService.getQuotaHistory(),
        templatesService.getTemplates(),
        systemHealthService.getSystemHealth(),
      ]);

      if (clgRes.data) setColleges(clgRes.data);
      if (stuRes.data) setStudents(stuRes.data);
      if (jobsRes.data) setProvisioningJobs(jobsRes.data);
      if (apprRes.data) setApprovals(apprRes.data);
      if (notifRes.data) setNotifications(notifRes.data);
      if (auditRes.data) setAuditLogs(auditRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (srvRes.data) setServices(srvRes.data);
      if (usersRes.data) setStaffUsers(usersRes.data);
      if (qhRes.data) setQuotaHistory(qhRes.data);
      if (tmplRes.data) setAppTemplates(tmplRes.data);
      if (healthRes.data) setSystemHealth(healthRes.data);
    } catch (err: any) {
      if (!isDemo) {
        addToast('error', 'Backend Synchronization Failed', err.message || 'Could not load administrative data.');
      }
    }
  }, [isDemo, addToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData, isAuthenticated]);

  // Role evaluations
  const isCorporateAdmin =
    Boolean(currentUser) &&
    (currentUser.role === 'super_admin' || currentUser.role === 'admin') &&
    !currentUser.collegeId;

  const canAccessAdminPanel =
    Boolean(currentUser) &&
    ['super_admin', 'admin', 'ops', 'finance', 'support'].includes(currentUser.role) &&
    !currentUser.collegeId;

  const isCompanyScope = true;

  // Central Corporate Scope: Central Admin has full cross-institutional visibility
  const scopedStudents = students;
  const scopedProvisioningJobs = provisioningJobs;

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  // Log action
  const logAction = useCallback(
    async (
      action: string,
      entity: string,
      entityId: string,
      entityName: string,
      reason?: string,
      beforeState?: Record<string, unknown>,
      afterState?: Record<string, unknown>
    ) => {
      const payload = {
        actorStaffId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action,
        entity,
        entityId,
        entityName,
        ip: '127.0.0.1',
        result: 'Success' as const,
        beforeState,
        afterState,
        reason,
      };

      try {
        const res = await auditService.logAction(payload);
        if (res.data) {
          setAuditLogs((prev) => [res.data, ...prev]);
        }
      } catch {
        // Fallback local append
        const item: AuditLogItem = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...payload,
        };
        setAuditLogs((prev) => [item, ...prev]);
      }
    },
    [currentUser]
  );

  // Authentication: Login
  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: StaffUser; redirectPath: string; error?: string }> => {
    try {
      const res = await authService.login(email, password);
      if (!res.success || !res.data) {
        return { success: false, redirectPath: '/login', error: res.message || 'Authentication failed.' };
      }

      const { user, token } = res.data;

      // Disallow non-corporate / college accounts from entering the Admin portal
      if (user.collegeId || user.role.startsWith('college_')) {
        return {
          success: false,
          redirectPath: '/login',
          error:
            'Institutional Access Restricted: This portal is reserved for BEXO Central Administration. College staff must access via the dedicated College Portal.',
        };
      }

      apiClient.setToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setActiveScope('company');
      await refreshData();
      addToast('success', 'Corporate Session Active', `Welcome, ${user.name}`);
      return { success: true, user, redirectPath: '/admin' };
    } catch (err: any) {
      return { success: false, redirectPath: '/login', error: err.message || 'Authentication error.' };
    }
  };

  const loginWithSession = async (token: string, user: any) => {
    apiClient.setToken(token);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveScope('company');
    await refreshData();
    addToast('success', 'Corporate Session Active', `Welcome, ${user.name || 'User'}`);
  };

  const switchToSuperAdmin = (targetId?: string) => {
    const target = staffUsers.find((u) => u.id === targetId) || staffUsers.find((u) => u.role === 'super_admin');
    if (target) {
      setCurrentUser(target);
      setIsAuthenticated(true);
      setActiveScope('company');
      addToast('info', 'Admin Switched', `Active administrator: ${target.name} (${target.role})`);
    }
  };

  // Colleges Operations
  const getCollegeById = (id: string) => colleges.find((c) => c.id === id);

  const addCollege = (newCollegeData: Omit<College, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>): string => {
    const id = `clg-${Date.now().toString(36)}`;
    const newCollege: College = {
      ...newCollegeData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };
    setColleges((prev) => [newCollege, ...prev]);
    collegesService.createCollege(newCollegeData).catch((err) => {
      addToast('error', 'Persistence Error', err.message);
    });
    logAction('CREATE_COLLEGE', 'College', id, newCollege.name, 'Admin created college record').catch(() => {});
    addToast('success', 'College Onboarded', `${newCollege.name} has been added to the registry.`);
    return id;
  };

  const updateCollege = async (id: string, updates: Partial<College>) => {
    const res = await collegesService.updateCollege(id, updates);
    setColleges((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    addToast('success', 'College Updated', 'Changes have been saved successfully.');
  };

  const suspendCollege = async (id: string, reason: string) => {
    const res = await collegesService.suspendCollege(id, reason);
    setColleges((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    await logAction('SUSPEND_COLLEGE', 'College', id, res.data.name, reason);
    addToast('warning', 'College Suspended', `${res.data.name} has been placed under administrative suspension.`);
  };

  const reactivateCollege = async (id: string, reason?: string) => {
    const res = await collegesService.reactivateCollege(id, reason);
    setColleges((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    await logAction('REACTIVATE_COLLEGE', 'College', id, res.data.name, reason || 'Compliance cleared');
    addToast('success', 'College Reactivated', `${res.data.name} institutional access has been restored.`);
  };

  const updateQuota = async (collegeId: string, newAllocated: number, reason: string) => {
    const res = await collegesService.updateQuota(collegeId, newAllocated, reason);
    setColleges((prev) =>
      prev.map((c) => (c.id === collegeId ? { ...c, quota: { ...c.quota, allocated: newAllocated } } : c))
    );
    setQuotaHistory((prev) => [res.data, ...prev]);
    await logAction('UPDATE_QUOTA', 'College', collegeId, `Quota ${newAllocated}`, reason);
    addToast('success', 'Quota Adjusted', `Seat allocation updated to ${newAllocated.toLocaleString()} seats.`);
  };

  const toggleCollegeService = async (collegeId: string, serviceId: string, enabled: boolean) => {
    await collegesService.toggleCollegeService(collegeId, serviceId, enabled);
    setColleges((prev) =>
      prev.map((c) => {
        if (c.id !== collegeId) return c;
        const updatedServices = c.services.map((s) =>
          s.serviceId === serviceId
            ? { ...s, isEnabled: enabled, activatedAt: enabled ? new Date().toISOString() : s.activatedAt }
            : s
        );
        return { ...c, services: updatedServices };
      })
    );
    addToast('info', 'Service State Shifted', `Service entitlement updated.`);
  };

  // Student Operations
  const revokeStudentAccess = async (studentId: string, reason: string) => {
    const res = await studentsService.revokeStudentAccess(studentId, reason);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? res.data : s)));
    await logAction('REVOKE_STUDENT_ACCESS', 'Student', studentId, res.data.name, reason);
    addToast('warning', 'Access Revoked', `Student ${res.data.name} access revoked.`);
  };

  const reactivateStudentAccess = async (studentId: string) => {
    const res = await studentsService.reactivateStudentAccess(studentId);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? res.data : s)));
    await logAction('RESTORE_STUDENT_ACCESS', 'Student', studentId, res.data.name, 'Admin restored access');
    addToast('success', 'Access Restored', `Student ${res.data.name} access restored to Active.`);
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'lastActivityAt'>) => {
    const res = await studentsService.addStudent(studentData);
    setStudents((prev) => [res.data, ...prev]);
    addToast('success', 'Student Enrolled', `${res.data.name} registered.`);
  };

  // Provisioning
  const triggerProvisioningBatch = async (
    collegeId: string,
    source: 'Roll Number Range' | 'CSV Upload' | 'Manual Batch',
    startRoll?: string,
    endRoll?: string,
    batchSize?: number
  ): Promise<ProvisioningJob> => {
    const res = await provisioningService.triggerProvisioningBatch({
      collegeId,
      source,
      startRoll,
      endRoll,
      batchSize,
    });
    setProvisioningJobs((prev) => [res.data, ...prev]);
    addToast('success', 'Batch Job Dispatched', `Job ${res.data.id} initiated for processing.`);
    return res.data;
  };

  // Approvals & Requests
  const approveRequest = async (id: string, decisionReason: string) => {
    const res = await approvalsService.approveRequest(id, decisionReason);
    setApprovals((prev) => prev.map((a) => (a.id === id ? res.data : a)));

    // Execute business effect of approval
    const req = res.data;
    if (req.type === 'Quota Increase' && req.details.requestedValue) {
      await updateQuota(req.collegeId, Number(req.details.requestedValue), `Approved: ${decisionReason}`);
    } else if (req.type === 'Service Activation' && req.details.serviceName) {
      const srv = services.find((s) => s.name === req.details.serviceName);
      if (srv) {
        await toggleCollegeService(req.collegeId, srv.id, true);
      }
    }

    await logAction('APPROVE_REQUEST', 'ApprovalRequest', id, req.details.title, decisionReason);
    addToast('success', 'Request Approved', `Action adjudicated successfully.`);
  };

  const rejectRequest = async (id: string, decisionReason: string) => {
    const res = await approvalsService.rejectRequest(id, decisionReason);
    setApprovals((prev) => prev.map((a) => (a.id === id ? res.data : a)));
    await logAction('REJECT_REQUEST', 'ApprovalRequest', id, res.data.details.title, decisionReason);
    addToast('info', 'Request Rejected', 'The operational request was rejected.');
  };

  const submitRequest = async (requestData: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>) => {
    const res = await approvalsService.submitRequest(requestData);
    setApprovals((prev) => [res.data, ...prev]);
    addToast('success', 'Request Logged', 'Submitted for platform review.');
  };

  // Notifications
  const markNotificationAsRead = async (id: string) => {
    await notificationsService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotification = async (id: string) => {
    await notificationsService.clearNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Platform Services
  const toggleGlobalService = async (id: string) => {
    const res = await servicesService.toggleGlobalService(id);
    setServices((prev) => prev.map((s) => (s.id === id ? res.data : s)));
    addToast('info', 'Platform Catalog Updated', `${res.data.name} status shifted.`);
  };

  // Payments
  const recordPayment = async (paymentData: Omit<PaymentInvoice, 'id'>) => {
    const res = await paymentsService.recordPayment(paymentData);
    setPayments((prev) => [res.data, ...prev]);
    addToast('success', 'Payment Recorded', `Invoice ${res.data.invoiceNumber} logged.`);
  };

  // System Health
  const refreshSystemHealth = async () => {
    const res = await systemHealthService.getSystemHealth();
    setSystemHealth(res.data);
    addToast('info', 'Telemetry Refreshed', 'System latency indicators updated.');
  };

  // App Templates
  const addAppTemplate = async (template: Omit<AppTemplate, 'id' | 'createdAt' | 'updatedAt' | 'downloadsCount' | 'activeUsersCount'>): Promise<string> => {
    const res = await templatesService.createTemplate(template);
    setAppTemplates((prev) => [res.data, ...prev]);
    addToast('success', 'Template Created', `${res.data.name} added to catalog.`);
    return res.data.id;
  };

  const updateAppTemplate = async (id: string, updates: Partial<AppTemplate>) => {
    const res = await templatesService.updateTemplate(id, updates);
    setAppTemplates((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    addToast('success', 'Template Saved', 'Updates recorded.');
  };

  const deleteAppTemplate = async (id: string) => {
    await templatesService.deleteTemplate(id);
    setAppTemplates((prev) => prev.filter((t) => t.id !== id));
    addToast('info', 'Template Removed', 'Item archived from catalog.');
  };

  const togglePublishTemplate = async (id: string) => {
    const res = await templatesService.togglePublish(id);
    setAppTemplates((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    addToast('info', 'Status Updated', `Template ${res.data.name} is now ${res.data.status}.`);
  };

  const toggleFeaturedTemplate = async (id: string) => {
    const res = await templatesService.toggleFeatured(id);
    setAppTemplates((prev) => prev.map((t) => (t.id === id ? res.data : t)));
  };

  // Users & Staff
  const addStaffUser = async (userData: Omit<StaffUser, 'id' | 'createdAt' | 'lastLoginAt'>) => {
    const res = await usersService.addStaffUser(userData);
    setStaffUsers((prev) => [res.data, ...prev]);
    addToast('success', 'User Added', `${res.data.name} provisioned.`);
  };

  const updateStaffUser = async (id: string, updates: Partial<StaffUser>) => {
    const res = await usersService.updateStaffUser(id, updates);
    setStaffUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    addToast('success', 'User Updated', 'Administrative profile saved.');
  };

  const deleteStaffUser = async (id: string) => {
    await usersService.deleteStaffUser(id);
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
    addToast('info', 'User Removed', 'Staff access deleted.');
  };

  const updateStaffDetails = async (staffId: string, updates: Partial<StaffUser>) => {
    await updateStaffUser(staffId, updates);
  };

  const suspendCollegeStaff = async (staffId: string, reason?: string) => {
    await updateStaffUser(staffId, { accountStatus: 'SUSPENDED' });
    await logAction('SUSPEND_STAFF', 'StaffUser', staffId, 'Staff Account', reason);
    addToast('warning', 'Staff Suspended', 'User account deactivated.');
  };

  const activateCollegeStaff = async (staffId: string) => {
    await updateStaffUser(staffId, { accountStatus: 'ACTIVE' });
    await logAction('ACTIVATE_STAFF', 'StaffUser', staffId, 'Staff Account', 'Restored');
    addToast('success', 'Staff Activated', 'User account reinstated.');
  };

  const changeStaffRole = async (staffId: string, newRole: Role) => {
    await updateStaffUser(staffId, { role: newRole });
    await logAction('CHANGE_STAFF_ROLE', 'StaffUser', staffId, newRole);
    addToast('info', 'Role Updated', `Permissions updated to ${newRole}.`);
  };

  // Invitations
  const createCollegeAdminInvitation = async (collegeId: string, input: AddCollegeAdminInput): Promise<CollegeInvitation> => {
    const col = getCollegeById(collegeId);
    const res = await usersService.createInvitation({
      email: input.email,
      fullName: input.name,
      phone: input.mobile,
      designation: input.designation || 'College Administrator',
      collegeId,
      collegeName: col?.name || 'Institution',
      role: input.role || 'college_admin',
    });
    setInvitations((prev) => [res.data, ...prev]);

    // Generate preview email
    const emailContent = generateEmailContent('college_admin_invite', {
      toEmail: input.email,
      recipientName: input.name,
      collegeName: col?.name || 'Institution',
      roleName: 'College Administrator',
      actionUrl: `#/activate-account?token=${res.data.token}`,
    });
    const outbox: OutboxEmail = {
      id: `outbox-${Date.now()}`,
      to: input.email,
      toName: input.name,
      subject: emailContent.subject,
      templateType: 'college_admin_invite',
      collegeName: col?.name,
      actionUrl: `#/activate-account?token=${res.data.token}`,
      actionLabel: 'Activate Institutional Access',
      sentAt: new Date().toISOString(),
      status: 'Delivered',
      bodyHtml: emailContent.html,
      previewSnippet: emailContent.previewSnippet,
    };
    setOutboxEmails((prev) => [outbox, ...prev]);

    addToast('success', 'Invitation Dispatched', `Admin invitation sent to ${input.email}.`);
    return res.data;
  };

  const createStaffInvitation = async (
    collegeId: string,
    input: { name: string; email: string; role: Role; department?: string; designation?: string; mobile?: string }
  ): Promise<CollegeInvitation> => {
    const col = getCollegeById(collegeId);
    const res = await usersService.createInvitation({
      email: input.email,
      fullName: input.name,
      phone: input.mobile,
      designation: input.designation || 'Staff Coordinator',
      collegeId,
      collegeName: col?.name || 'Institution',
      role: input.role,
    });
    setInvitations((prev) => [res.data, ...prev]);
    addToast('success', 'Invitation Created', `Invitation sent to ${input.email}.`);
    return res.data;
  };

  const resendInvitation = async (invitationId: string): Promise<CollegeInvitation> => {
    const res = await usersService.resendInvitation(invitationId);
    addToast('info', 'Invitation Re-sent', 'Fresh activation token dispatched.');
    return res.data;
  };

  const revokeInvitation = async (invitationId: string, reason?: string) => {
    await usersService.revokeInvitation(invitationId, reason);
    setInvitations((prev) =>
      prev.map((i) => (i.id === invitationId ? { ...i, status: 'REVOKED', revokedReason: reason } : i))
    );
    addToast('warning', 'Invitation Revoked', 'Token invalidated.');
  };

  const validateInvitationToken = (token: string): { valid: boolean; error?: string; invitation?: CollegeInvitation } => {
    const invite = invitations.find((i) => i.token === token);
    if (!invite) return { valid: false, error: 'Invitation link does not exist.' };
    if (invite.status !== 'INVITED') return { valid: false, error: `Invitation status is ${invite.status}.` };
    return { valid: true, invitation: invite };
  };

  const activateAccount = async (token: string, password: string): Promise<{ success: boolean; user?: StaffUser; error?: string }> => {
    try {
      const res = await authService.activateAccount(token, password);
      return { success: true, user: res.data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    try {
      const res = await authService.requestPasswordReset(email);
      addToast('success', 'Reset Link Dispatched', `Recovery instructions sent to ${email}.`);
      return { success: true, token: res.data.token };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const validatePasswordResetToken = (token: string): { valid: boolean; email?: string; error?: string } => {
    if (!token) return { valid: false, error: 'Missing token' };
    return { valid: true, email: 'admin@atbexo.com' };
  };

  const resetPasswordWithToken = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.resetPassword(token, newPassword);
      addToast('success', 'Password Updated', 'Your administrative credentials have been updated.');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUserProfile = async (updates: { name?: string; phone?: string; designation?: string; department?: string }) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    addToast('success', 'Profile Saved', 'Your user details were updated.');
  };

  const changeUserPassword = async (_currentPassword: string, _newPassword: string): Promise<{ success: boolean; error?: string }> => {
    addToast('success', 'Password Changed', 'Administrative credential updated successfully.');
    return { success: true };
  };

  // Reset Demo State (In-Memory Only, No localStorage.clear()!)
  const resetAllData = () => {
    mockAdapter.resetDemoData();
    setColleges(INITIAL_COLLEGES);
    setStudents(INITIAL_STUDENTS);
    setProvisioningJobs(INITIAL_PROVISIONING_JOBS);
    setApprovals(INITIAL_APPROVALS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setQuotaHistory(INITIAL_QUOTA_HISTORY);
    setPayments(INITIAL_PAYMENTS);
    setStaffUsers(INITIAL_STAFF_USERS);
    setCurrentUser(INITIAL_STAFF_USERS[0]);
    setAppTemplates(INITIAL_APP_TEMPLATES);
    setInvitations(INITIAL_INVITATIONS);
    setOutboxEmails(INITIAL_OUTBOX_EMAILS);
    setActiveScope('company');
    addToast('info', 'Demo State Restored', 'Demonstration fixtures re-initialized in memory.');
  };

  return (
    <AdminContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        staffUsers,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        isAuthenticated,
        isDemoMode: isDemo,
        isCorporateAdmin,
        canAccessAdminPanel,
        switchToSuperAdmin,
        activeScope,
        setActiveScope,
        isCompanyScope,
        colleges,
        getCollegeById,
        addCollege,
        updateCollege,
        suspendCollege,
        reactivateCollege,
        updateQuota,
        quotaHistory,
        toggleCollegeService,
        students,
        scopedStudents,
        revokeStudentAccess,
        reactivateStudentAccess,
        addStudent,
        provisioningJobs,
        scopedProvisioningJobs,
        triggerProvisioningBatch,
        approvals,
        approveRequest,
        rejectRequest,
        submitRequest,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        auditLogs,
        logAction,
        services,
        toggleGlobalService,
        payments,
        recordPayment,
        systemHealth,
        refreshSystemHealth,
        isSearchOpen,
        setIsSearchOpen,
        toasts,
        addToast,
        removeToast,
        appTemplates,
        addAppTemplate,
        updateAppTemplate,
        deleteAppTemplate,
        togglePublishTemplate,
        toggleFeaturedTemplate,
        invitations,
        outboxEmails,
        activeEmailForPreview,
        setActiveEmailForPreview,
        createCollegeAdminInvitation,
        createStaffInvitation,
        resendInvitation,
        revokeInvitation,
        validateInvitationToken,
        activateAccount,
        requestPasswordReset,
        validatePasswordResetToken,
        resetPasswordWithToken,
        suspendCollegeStaff,
        activateCollegeStaff,
        changeStaffRole,
        updateStaffDetails,
        login,
        loginWithSession,
        logout,
        updateUserProfile,
        changeUserPassword,
        resetAllData,
      }}
    >
      {children}

      {/* Global Interactive Toast Feedback System */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              backgroundColor:
                toast.type === 'success'
                  ? '#059669'
                  : toast.type === 'error'
                  ? '#DC2626'
                  : toast.type === 'warning'
                  ? '#D97706'
                  : '#2563EB',
            }}
          >
            <div style={{ fontWeight: 700 }}>{toast.title}</div>
            {toast.message && <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.9 }}>{toast.message}</div>}
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
