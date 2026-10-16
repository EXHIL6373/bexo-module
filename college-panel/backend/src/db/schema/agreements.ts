import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { colleges } from './colleges';

export const collegeAgreements = pgTable('college_agreements', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  agreementNumber: text('agreement_number').notNull(),
  type: text('type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull().default('Active'),
  documentName: text('document_name'),
  documentUrl: text('document_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const paymentInvoices = pgTable('payment_invoices', {
  id: text('id').primaryKey(),
  collegeId: text('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  collegeName: text('college_name').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('Paid'),
  date: text('date').notNull(),
  dueDate: text('due_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
