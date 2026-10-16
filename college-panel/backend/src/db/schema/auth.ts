import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const collegeInvitations = pgTable('college_invitations', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  designation: text('designation').notNull(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name').notNull(),
  role: text('role').notNull(),
  invitedBy: text('invited_by').notNull(),
  invitedByRole: text('invited_by_role').notNull(),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  status: text('status').notNull().default('INVITED'),
  acceptedAt: timestamp('accepted_at'),
  revokedAt: timestamp('revoked_at'),
  revokedReason: text('revoked_reason'),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').notNull().default(false),
});
