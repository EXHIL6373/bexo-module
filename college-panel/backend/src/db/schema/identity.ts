import { pgTable, text, boolean, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const otpChallenges = pgTable(
  'otp_challenges',
  {
    id: text('id').primaryKey(),
    phoneNumber: text('phone_number').notNull(),
    otpHash: text('otp_hash').notNull(),
    purpose: text('purpose').notNull().default('login'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    expiresAt: timestamp('expires_at').notNull(),
    isConsumed: boolean('is_consumed').notNull().default(false),
    consumedAt: timestamp('consumed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('otp_phone_idx').on(table.phoneNumber),
    index('otp_expires_idx').on(table.expiresAt),
  ]
);

export const userIdentities = pgTable(
  'user_identities',
  {
    id: text('id').primaryKey(),
    phoneNumber: text('phone_number').notNull().unique(),
    phoneVerifiedAt: timestamp('phone_verified_at').notNull().defaultNow(),
    googleSub: text('google_sub').unique(),
    googleEmail: text('google_email'),
    googleVerifiedAt: timestamp('google_verified_at'),
    displayName: text('display_name'),
    primaryRole: text('primary_role').notNull().default('normal_user'),
    status: text('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('identity_phone_uniq_idx').on(table.phoneNumber),
    uniqueIndex('identity_google_sub_uniq_idx').on(table.googleSub),
  ]
);

export const identityRoleAssignments = pgTable(
  'identity_role_assignments',
  {
    id: text('id').primaryKey(),
    identityId: text('identity_id')
      .notNull()
      .references(() => userIdentities.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    collegeId: text('college_id'),
    collegeName: text('college_name'),
    entityId: text('entity_id'),
    entityType: text('entity_type').notNull().default('consumer'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('asgn_identity_idx').on(table.identityId),
    index('asgn_role_idx').on(table.role),
    index('asgn_college_idx').on(table.collegeId),
  ]
);
