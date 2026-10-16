import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const colleges = pgTable('colleges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull(),
  affiliation: text('affiliation').notNull(),
  establishedYear: integer('established_year').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  country: text('country').notNull().default('India'),
  primaryContact: jsonb('primary_contact').notNull(),
  adminContact: jsonb('admin_contact').notNull(),
  coordinators: jsonb('coordinators').notNull().default([]),
  emailDomains: jsonb('email_domains').notNull().default([]),
  status: text('status').notNull().default('Active'), // 'Active' | 'Pending' | 'Suspended' | 'Expired'
  dashboardAccess: boolean('dashboard_access').notNull().default(true),
  totalStudents: integer('total_students').notNull().default(0),
  activeStudents: integer('active_students').notNull().default(0),
  quotaAllocated: integer('quota_allocated').notNull().default(0),
  quotaUsed: integer('quota_used').notNull().default(0),
  warningThreshold: integer('warning_threshold').notNull().default(80),
  criticalThreshold: integer('critical_threshold').notNull().default(95),
  departmentLimits: jsonb('department_limits').default({}),
  services: jsonb('services').notNull().default([]),
  suspensionReason: text('suspension_reason'),
  suspendedAt: timestamp('suspended_at'),
  reactivatedAt: timestamp('reactivated_at'),
  lifecycleVersion: integer('lifecycle_version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
});

export const quotaHistory = pgTable('quota_history', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  adminName: text('admin_name').notNull(),
  previousAllocated: integer('previous_allocated').notNull(),
  newAllocated: integer('new_allocated').notNull(),
  reason: text('reason').notNull(),
});

export const platformServices = pgTable('platform_services', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  isGlobalActive: boolean('is_global_active').notNull().default(true),
  totalCollegeAdoption: integer('total_college_adoption').notNull().default(0),
  totalStudentsEnrolled: integer('total_students_enrolled').notNull().default(0),
});
