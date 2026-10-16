export type Role =
  | 'super_admin'
  | 'admin'
  | 'ops'
  | 'finance'
  | 'support'
  | 'college_admin'
  | 'college_staff'
  | 'college_coordinator';

export type UserRoleCategory = 'Company' | 'College';

export type AccountStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  collegeId?: string;
  collegeName?: string;
  department?: string;
  designation?: string;
  isActive: boolean;
  accountStatus: AccountStatus;
  lastLoginAt: string;
  avatarUrl?: string;
  createdAt: string;
  passwordHash?: string;
  invitationId?: string;
}

export type CollegeStatus = 'Active' | 'Pending' | 'Suspended' | 'Expired';

export interface CollegeContact {
  name: string;
  designation: string;
  email: string;
  mobile: string;
  alternateContact?: string;
}

export interface CollegeAdminInfo {
  name: string;
  email: string;
  mobile: string;
}

export interface CoordinatorInfo {
  id: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
}

export interface CollegeServiceConfig {
  serviceId: string;
  name: string;
  isEnabled: boolean;
  activatedAt: string;
  studentsUsing: number;
  planLevel?: 'Basic' | 'Pro' | 'Enterprise';
}

export interface CollegeAgreement {
  agreementNumber: string;
  type: 'Annual MOU' | 'Multi-Year Enterprise' | 'Pilot Contract' | 'Trial Agreement';
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Pending' | 'Active' | 'Expiring Soon' | 'Expired' | 'Suspended' | 'Terminated';
  documentName?: string;
  documentUrl?: string;
  notes?: string;
}

export interface CollegeQuota {
  allocated: number;
  used: number;
  warningThreshold: number; // percentage, e.g. 80
  criticalThreshold: number; // percentage, e.g. 95
  departmentLimits?: Record<string, number>;
}

export interface QuotaHistoryEntry {
  id: string;
  collegeId: string;
  timestamp: string;
  adminName: string;
  previousAllocated: number;
  newAllocated: number;
  reason: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  slug: string;
  type: 'Engineering' | 'Arts & Science' | 'Autonomous University' | 'Polytechnic' | 'Medical' | 'Management' | 'Government Aided';
  affiliation: string;
  establishedYear: number;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
  primaryContact: CollegeContact;
  adminContact: CollegeAdminInfo;
  coordinators: CoordinatorInfo[];
  status: CollegeStatus;
  dashboardAccess: boolean;
  totalStudents: number;
  activeStudents: number;
  quota: CollegeQuota;
  services: CollegeServiceConfig[];
  agreement: CollegeAgreement;
  suspensionReason?: string;
  suspendedAt?: string;
  reactivatedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  collegeId: string;
  collegeName: string;
  department: string;
  course?: string;
  batch?: string;
  email: string;
  phone?: string;
  accessStatus: 'Active' | 'Pending' | 'Revoked' | 'Suspended';
  services: string[];
  entitlementId: string;
  provisioningJobId?: string;
  enrolledYear: number;
  resumeCount: number;
  portfolioSubdomain?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt?: string;
}

export type ProvisioningJobStatus =
  | 'Queued'
  | 'Processing'
  | 'Completed'
  | 'Partially Completed'
  | 'Failed'
  | 'Cancelled';

export interface FailedProvisioningRecord {
  rollNumber: string;
  name: string;
  reason: string;
  status: 'Duplicate Student' | 'Missing Email' | 'Invalid Roll Format' | 'Quota Exceeded' | 'Department Unmapped';
}

export interface ProvisioningJob {
  id: string;
  collegeId: string;
  collegeName: string;
  createdBy: string;
  source: 'Roll Number Range' | 'CSV Upload' | 'XLSX Batch' | 'API Sync' | 'Manual Batch';
  totalRecords: number;
  successful: number;
  failed: number;
  partial: number;
  status: ProvisioningJobStatus;
  failedRecords: FailedProvisioningRecord[];
  createdAt: string;
  completedAt?: string;
}

export type ApprovalType =
  | 'New College'
  | 'Quota Increase'
  | 'Service Activation'
  | 'Access Request'
  | 'Agreement Request'
  | 'Other Operational Request';

export type ApprovalPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  collegeId: string;
  collegeName: string;
  requester: string;
  requesterEmail: string;
  requesterRole: string;
  details: {
    title: string;
    description: string;
    currentValue?: string | number;
    requestedValue?: string | number;
    urgency?: string;
    supportingDoc?: string;
    serviceName?: string;
  };
  priority: ApprovalPriority;
  status: ApprovalStatus;
  decisionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'Provisioning' | 'Quota' | 'Agreement' | 'College' | 'Student' | 'Security' | 'System';
  severity: 'info' | 'success' | 'warning' | 'error';
  relatedEntity?: {
    type: 'college' | 'student' | 'job' | 'agreement' | 'approval';
    id: string;
    name: string;
  };
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorStaffId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  entityName: string;
  ip: string;
  result: 'Success' | 'Denied' | 'Failed';
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  reason?: string;
}

export interface PaymentInvoice {
  id: string;
  invoiceNumber: string;
  collegeId: string;
  collegeName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
  dueDate: string;
  paymentMethod: string;
  description: string;
}

export interface SystemHealthMetric {
  name: string;
  status: 'Healthy' | 'Warning' | 'Critical';
  latencyMs: number;
  uptimePct: number;
  lastIncident?: string;
  details: string;
}

export interface PlatformService {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  isGlobalActive: boolean;
  totalCollegeAdoption: number;
  totalStudentsEnrolled: number;
}

export type TemplateCategory = 'portfolio' | 'resume' | 'biolink' | 'showcase';
export type TemplateTier = 'Free' | 'Pro' | 'Institutional';
export type TemplateStatus = 'Published' | 'Draft' | 'Archived';

export interface AppTemplate {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string;
  version: string;
  thumbnailColor: string;
  previewUrl?: string;
  tier: TemplateTier;
  status: TemplateStatus;
  isFeatured: boolean;
  downloadsCount: number;
  activeUsersCount: number;
  tags: string[];
  sourceBundle?: string;
  compatibleAppVersion: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollegeInvitation {
  id: string;
  token: string;
  email: string;
  fullName: string;
  phone?: string;
  designation: string;
  collegeId: string;
  collegeName: string;
  role: Role; // 'college_admin' | 'college_coordinator' | 'college_staff'
  invitedBy: string; // Actor Name
  invitedByRole: Role;
  invitedAt: string;
  expiresAt: string;
  status: AccountStatus; // 'INVITED' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'
  acceptedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  email: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}

export type EmailTemplateType =
  | 'college_admin_invite'
  | 'staff_invite'
  | 'invite_reminder'
  | 'invite_expired'
  | 'password_reset'
  | 'account_activated'
  | 'college_suspended'
  | 'college_reactivated';

export interface OutboxEmail {
  id: string;
  to: string;
  toName: string;
  subject: string;
  templateType: EmailTemplateType;
  collegeName?: string;
  roleName?: string;
  actionUrl: string;
  actionLabel: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Failed';
  bodyHtml: string;
  previewSnippet: string;
}

export interface AddCollegeAdminInput {
  name: string;
  email: string;
  mobile?: string;
  designation?: string;
  role?: Role;
}

export interface StudentEntitlement {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  collegeId: string;
  collegeName: string;
  serviceId: string;
  serviceName: string;
  status: 'Active' | 'Pending' | 'Suspended' | 'Revoked' | 'Expired';
  grantedDate: string;
  expiryDate?: string;
  lastUpdated: string;
}

export interface CollegeTask {
  id: string;
  collegeId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  category: string;
  actionUrl?: string;
}

export interface CollegeAnnouncement {
  id: string;
  collegeId?: string;
  title: string;
  content: string;
  publishedAt: string;
  author: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  targetAudience: string;
  readByColleges?: string[];
}

