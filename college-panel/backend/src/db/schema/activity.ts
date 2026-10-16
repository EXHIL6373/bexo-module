import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  actorStaffId: text('actor_staff_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  entityName: text('entity_name').notNull(),
  ip: text('ip').notNull().default('127.0.0.1'),
  result: text('result').notNull().default('Success'),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  reason: text('reason'),
});
