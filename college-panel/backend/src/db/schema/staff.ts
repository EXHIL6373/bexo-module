import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const staffUsers = pgTable('staff_users', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: text('role').notNull(),
  department: text('department'),
  designation: text('designation'),
  isActive: boolean('is_active').notNull().default(true),
  accountStatus: text('account_status').notNull().default('ACTIVE'),
  passwordHash: text('password_hash'),
  invitationId: text('invitation_id'),
  sessionVersion: integer('session_version').notNull().default(1),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
