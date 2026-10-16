import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const provisioningJobs = pgTable('provisioning_jobs', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name').notNull(),
  createdBy: text('created_by').notNull(),
  source: text('source').notNull(),
  totalRecords: integer('total_records').notNull().default(0),
  successful: integer('successful').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  partial: integer('partial').notNull().default(0),
  status: text('status').notNull().default('Completed'),
  failedRecords: jsonb('failed_records').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});
