import { pgTable, text, integer, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name').notNull(),
  name: text('name').notNull(),
  rollNumber: text('roll_number').notNull(),
  email: text('email').notNull(),
  normalizedEmail: text('normalized_email'),
  userId: text('user_id'),
  phone: text('phone'),
  department: text('department').notNull(),
  course: text('course'),
  batch: text('batch'),
  accessStatus: text('access_status').notNull().default('Active'),
  services: jsonb('services').notNull().default([]),
  entitlementId: text('entitlement_id').notNull(),
  provisioningJobId: text('provisioning_job_id'),
  enrolledYear: integer('enrolled_year').notNull(),
  resumeCount: integer('resume_count').notNull().default(0),
  portfolioSubdomain: text('portfolio_subdomain'),
  linkedAt: timestamp('linked_at'),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('college_roll_number_idx').on(table.collegeId, table.rollNumber),
  uniqueIndex('college_student_email_idx').on(table.collegeId, table.email),
]);

export const studentEntitlements = pgTable('student_entitlements', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  studentName: text('student_name').notNull(),
  rollNumber: text('roll_number').notNull(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name').notNull(),
  serviceId: text('service_id').notNull(),
  serviceName: text('service_name').notNull(),
  status: text('status').notNull().default('Active'),
  revokeReason: text('revoke_reason'),
  grantedDate: timestamp('granted_date').notNull().defaultNow(),
  expiryDate: timestamp('expiry_date'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
});
