import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  category: text('category').notNull(),
  severity: text('severity').notNull().default('info'),
  relatedEntity: jsonb('related_entity'),
  isRead: boolean('is_read').notNull().default(false),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const collegeTasks = pgTable('college_tasks', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  dueDate: text('due_date').notNull(),
  priority: text('priority').notNull().default('Medium'),
  status: text('status').notNull().default('Pending'),
  category: text('category').notNull(),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const collegeAnnouncements = pgTable('college_announcements', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').references(() => colleges.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  author: text('author').notNull(),
  priority: text('priority').notNull().default('Normal'),
  targetAudience: text('target_audience').notNull().default('All Institutions'),
  readByColleges: jsonb('read_by_colleges').notNull().default([]),
});
