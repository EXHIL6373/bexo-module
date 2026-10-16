import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// =========================================================================
// 1. STAFF USERS & SESSIONS
// =========================================================================
export const staffUsers = pgTable(
  'staff_users',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    role: varchar('role', { length: 64 }).notNull(),
    collegeId: varchar('college_id', { length: 128 }),
    collegeName: varchar('college_name', { length: 255 }),
    department: varchar('department', { length: 128 }),
    designation: varchar('designation', { length: 128 }),
    isActive: boolean('is_active').notNull().default(true),
    accountStatus: varchar('account_status', { length: 32 }).notNull().default('ACTIVE'),
    sessionVersion: integer('session_version').notNull().default(1),
    avatarUrl: text('avatar_url'),
    invitationId: varchar('invitation_id', { length: 128 }),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('staff_role_idx').on(table.role),
    index('staff_college_idx').on(table.collegeId),
  ]
);

export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => staffUsers.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    sessionVersion: integer('session_version').notNull().default(1),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    isRevoked: boolean('is_revoked').notNull().default(false),
  },
  (table) => [
    index('session_user_idx').on(table.userId),
    index('session_token_idx').on(table.tokenHash),
  ]
);

// =========================================================================
// 2. INVITATIONS & PASSWORD RESETS
// =========================================================================
export const invitations = pgTable(
  'invitations',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    designation: varchar('designation', { length: 128 }).notNull(),
    collegeId: varchar('college_id', { length: 128 }),
    collegeName: varchar('college_name', { length: 255 }),
    role: varchar('role', { length: 64 }).notNull(),
    invitedBy: varchar('invited_by', { length: 255 }).notNull(),
    invitedByRole: varchar('invited_by_role', { length: 64 }).notNull(),
    invitedAt: timestamp('invited_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('INVITED'),
    acceptedAt: timestamp('accepted_at'),
    revokedAt: timestamp('revoked_at'),
    revokedReason: text('revoked_reason'),
  },
  (table) => [
    index('invitation_email_idx').on(table.email),
    index('invitation_token_hash_idx').on(table.tokenHash),
  ]
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 128 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    isUsed: boolean('is_used').notNull().default(false),
  },
  (table) => [
    index('reset_token_email_idx').on(table.email),
    index('reset_token_hash_idx').on(table.tokenHash),
  ]
);

// =========================================================================
// 3. COLLEGES & QUOTA
// =========================================================================
export const colleges = pgTable(
  'colleges',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }).notNull().unique(),
    slug: varchar('slug', { length: 128 }).notNull().unique(),
    type: varchar('type', { length: 64 }).notNull(),
    affiliation: varchar('affiliation', { length: 255 }),
    establishedYear: integer('established_year'),
    address: text('address'),
    city: varchar('city', { length: 128 }),
    district: varchar('district', { length: 128 }),
    state: varchar('state', { length: 128 }),
    pincode: varchar('pincode', { length: 32 }),
    country: varchar('country', { length: 64 }).default('India'),
    primaryContact: jsonb('primary_contact'),
    adminContact: jsonb('admin_contact'),
    coordinators: jsonb('coordinators').default('[]'),
    status: varchar('status', { length: 32 }).notNull().default('Active'),
    dashboardAccess: boolean('dashboard_access').notNull().default(true),
    totalStudents: integer('total_students').default(0),
    activeStudents: integer('active_students').default(0),
    quotaAllocated: integer('quota_allocated').notNull().default(1000),
    quotaUsed: integer('quota_used').notNull().default(0),
    warningThreshold: integer('warning_threshold').default(80),
    criticalThreshold: integer('critical_threshold').default(95),
    departmentLimits: jsonb('department_limits').default('{}'),
    services: jsonb('services').default('[]'),
    agreement: jsonb('agreement').default('{}'),
    suspensionReason: text('suspension_reason'),
    suspendedAt: timestamp('suspended_at'),
    reactivatedAt: timestamp('reactivated_at'),
    lifecycleVersion: integer('lifecycle_version').notNull().default(1),
    syncStatus: varchar('sync_status', { length: 32 }).notNull().default('SYNCED'),
    lastActivityAt: timestamp('last_activity_at').defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('college_status_idx').on(table.status),
    uniqueIndex('college_code_uniq_idx').on(table.code),
    uniqueIndex('college_slug_uniq_idx').on(table.slug),
  ]
);

export const quotaHistory = pgTable(
  'quota_history',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    collegeId: varchar('college_id', { length: 128 })
      .notNull()
      .references(() => colleges.id, { onDelete: 'cascade' }),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    adminName: varchar('admin_name', { length: 255 }).notNull(),
    previousAllocated: integer('previous_allocated').notNull(),
    newAllocated: integer('new_allocated').notNull(),
    reason: text('reason').notNull(),
  },
  (table) => [index('quota_college_idx').on(table.collegeId)]
);

// =========================================================================
// 4. STUDENTS & ENTITLEMENTS
// =========================================================================
export const students = pgTable(
  'students',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    rollNumber: varchar('roll_number', { length: 64 }).notNull(),
    collegeId: varchar('college_id', { length: 128 })
      .notNull()
      .references(() => colleges.id, { onDelete: 'cascade' }),
    collegeName: varchar('college_name', { length: 255 }).notNull(),
    department: varchar('department', { length: 128 }).notNull(),
    course: varchar('course', { length: 128 }),
    batch: varchar('batch', { length: 32 }),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    accessStatus: varchar('access_status', { length: 32 }).notNull().default('Active'),
    services: jsonb('services').default('[]'),
    entitlementId: varchar('entitlement_id', { length: 128 }),
    provisioningJobId: varchar('provisioning_job_id', { length: 128 }),
    enrolledYear: integer('enrolled_year'),
    resumeCount: integer('resume_count').default(0),
    portfolioSubdomain: varchar('portfolio_subdomain', { length: 128 }),
    lastActivityAt: timestamp('last_activity_at').defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('student_college_idx').on(table.collegeId),
    index('student_email_idx').on(table.email),
    uniqueIndex('student_college_roll_uniq_idx').on(table.collegeId, table.rollNumber),
  ]
);

export const studentEntitlements = pgTable(
  'student_entitlements',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    studentId: varchar('student_id', { length: 128 })
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    studentName: varchar('student_name', { length: 255 }).notNull(),
    rollNumber: varchar('roll_number', { length: 64 }).notNull(),
    collegeId: varchar('college_id', { length: 128 }).notNull(),
    collegeName: varchar('college_name', { length: 255 }).notNull(),
    serviceId: varchar('service_id', { length: 128 }).notNull(),
    serviceName: varchar('service_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('Active'),
    grantedDate: timestamp('granted_date').notNull().defaultNow(),
    expiryDate: timestamp('expiry_date'),
    lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  },
  (table) => [
    index('entitlement_student_idx').on(table.studentId),
    index('entitlement_college_idx').on(table.collegeId),
  ]
);

// =========================================================================
// 5. PROVISIONING JOBS
// =========================================================================
export const provisioningJobs = pgTable(
  'provisioning_jobs',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    collegeId: varchar('college_id', { length: 128 })
      .notNull()
      .references(() => colleges.id, { onDelete: 'cascade' }),
    collegeName: varchar('college_name', { length: 255 }).notNull(),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    source: varchar('source', { length: 64 }).notNull(),
    totalRecords: integer('total_records').notNull().default(0),
    successful: integer('successful').notNull().default(0),
    failed: integer('failed').notNull().default(0),
    partial: integer('partial').notNull().default(0),
    status: varchar('status', { length: 32 }).notNull().default('Queued'),
    failedRecords: jsonb('failed_records').default('[]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [index('job_college_idx').on(table.collegeId)]
);

// =========================================================================
// 6. APPROVALS & REQUESTS
// =========================================================================
export const approvalRequests = pgTable(
  'approval_requests',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    type: varchar('type', { length: 64 }).notNull(),
    collegeId: varchar('college_id', { length: 128 }).notNull(),
    collegeName: varchar('college_name', { length: 255 }).notNull(),
    requester: varchar('requester', { length: 255 }).notNull(),
    requesterEmail: varchar('requester_email', { length: 255 }).notNull(),
    requesterRole: varchar('requester_role', { length: 64 }).notNull(),
    details: jsonb('details').notNull().default('{}'),
    priority: varchar('priority', { length: 32 }).notNull().default('Medium'),
    status: varchar('status', { length: 32 }).notNull().default('Pending'),
    decisionReason: text('decision_reason'),
    reviewedBy: varchar('reviewed_by', { length: 255 }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('approval_status_idx').on(table.status),
    index('approval_college_idx').on(table.collegeId),
  ]
);

// =========================================================================
// 7. PLATFORM SERVICES
// =========================================================================
export const platformServices = pgTable(
  'platform_services',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    code: varchar('code', { length: 64 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 128 }).notNull(),
    description: text('description'),
    isGlobalActive: boolean('is_global_active').notNull().default(true),
    totalCollegeAdoption: integer('total_college_adoption').default(0),
    totalStudentsEnrolled: integer('total_students_enrolled').default(0),
  },
  (table) => [uniqueIndex('service_code_uniq_idx').on(table.code)]
);

// =========================================================================
// 8. PAYMENTS & FINANCE
// =========================================================================
export const paymentInvoices = pgTable(
  'payment_invoices',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    invoiceNumber: varchar('invoice_number', { length: 64 }).notNull().unique(),
    collegeId: varchar('college_id', { length: 128 })
      .notNull()
      .references(() => colleges.id, { onDelete: 'cascade' }),
    collegeName: varchar('college_name', { length: 255 }).notNull(),
    amount: integer('amount').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('Paid'),
    date: varchar('date', { length: 32 }).notNull(),
    dueDate: varchar('due_date', { length: 32 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 64 }).notNull(),
    description: text('description'),
  },
  (table) => [
    index('invoice_college_idx').on(table.collegeId),
    uniqueIndex('invoice_num_uniq_idx').on(table.invoiceNumber),
  ]
);

// =========================================================================
// 9. NOTIFICATIONS
// =========================================================================
export const notifications = pgTable(
  'notifications',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    severity: varchar('severity', { length: 32 }).notNull().default('info'),
    relatedEntity: jsonb('related_entity'),
    isRead: boolean('is_read').notNull().default(false),
    actionUrl: text('action_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('notif_read_idx').on(table.isRead)]
);

// =========================================================================
// 10. AUDIT LEDGER (TAMPER-RESISTANT)
// =========================================================================
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    timestamp: timestamp('timestamp').notNull().defaultNow(),
    actorStaffId: varchar('actor_staff_id', { length: 128 }).notNull(),
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    actorRole: varchar('actor_role', { length: 64 }).notNull(),
    action: varchar('action', { length: 128 }).notNull(),
    entity: varchar('entity', { length: 128 }).notNull(),
    entityId: varchar('entity_id', { length: 128 }).notNull(),
    entityName: varchar('entity_name', { length: 255 }).notNull(),
    ip: varchar('ip', { length: 64 }).notNull().default('127.0.0.1'),
    result: varchar('result', { length: 32 }).notNull().default('Success'),
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
    reason: text('reason'),
  },
  (table) => [
    index('audit_entity_idx').on(table.entity, table.entityId),
    index('audit_actor_idx').on(table.actorStaffId),
    index('audit_timestamp_idx').on(table.timestamp),
  ]
);

// =========================================================================
// 11. APP TEMPLATES CATALOG
// =========================================================================
export const appTemplates = pgTable(
  'app_templates',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull().unique(),
    category: varchar('category', { length: 64 }).notNull(),
    description: text('description'),
    version: varchar('version', { length: 32 }).notNull().default('1.0.0'),
    thumbnailColor: varchar('thumbnail_color', { length: 64 }).default('#3b82f6'),
    previewUrl: text('preview_url'),
    tier: varchar('tier', { length: 32 }).notNull().default('Free'),
    status: varchar('status', { length: 32 }).notNull().default('Published'),
    isFeatured: boolean('is_featured').notNull().default(false),
    downloadsCount: integer('downloads_count').notNull().default(0),
    activeUsersCount: integer('active_users_count').notNull().default(0),
    tags: jsonb('tags').notNull().default('[]'),
    sourceBundle: text('source_bundle'),
    compatibleAppVersion: varchar('compatible_app_version', { length: 32 }).default('>=1.0.0'),
    author: varchar('author', { length: 255 }).default('BEXO Studio'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('template_slug_uniq_idx').on(table.slug),
    index('template_category_idx').on(table.category),
    index('template_status_idx').on(table.status),
  ]
);

// =========================================================================
// 12. TRANSACTIONAL LIFECYCLE OUTBOX
// =========================================================================
export const lifecycleOutbox = pgTable(
  'lifecycle_outbox',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    collegeId: varchar('college_id', { length: 128 })
      .notNull()
      .references(() => colleges.id, { onDelete: 'cascade' }),
    lifecycleVersion: integer('lifecycle_version').notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 32 }).notNull().default('PENDING'), // 'PENDING' | 'SYNCED' | 'FAILED'
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    lastAttemptAt: timestamp('last_attempt_at'),
    nextAttemptAt: timestamp('next_attempt_at'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('outbox_status_idx').on(table.status),
    index('outbox_college_idx').on(table.collegeId),
  ]
);

