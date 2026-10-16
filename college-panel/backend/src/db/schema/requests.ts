import { pgTable, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const approvalRequests = pgTable('approval_requests', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name').notNull(),
  requester: text('requester').notNull(),
  requesterEmail: text('requester_email').notNull(),
  requesterRole: text('requester_role').notNull(),
  details: jsonb('details').notNull(),
  deltaSeats: integer('delta_seats'),
  targetTotal: integer('target_total'),
  priority: text('priority').notNull().default('Medium'),
  status: text('status').notNull().default('Pending'),
  decisionReason: text('decision_reason'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
