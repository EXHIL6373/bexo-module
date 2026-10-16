import { db, closePool, checkDatabaseConnection } from './client';
import { env } from '../config/env';
import * as schema from './schema';
import {
  SEED_STAFF_USERS,
  SEED_SERVICES,
  SEED_COLLEGES,
  SEED_STUDENTS,
  SEED_PROVISIONING_JOBS,
  SEED_APPROVALS,
  SEED_PAYMENTS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
  SEED_TEMPLATES,
} from './seedData';
import { logger } from '../shared/utils/logger';

export async function runSeed() {
  // UNCONDITIONAL PRODUCTION GUARD
  if (env.NODE_ENV === 'production') {
    logger.error('CRITICAL: Attempted to run development seed in PRODUCTION. Execution aborted.');
    throw new Error('Database seeding is strictly prohibited in production environments.');
  }

  logger.info({ nodeEnv: env.NODE_ENV }, 'Running development database seeding...');

  const isConnected = await checkDatabaseConnection(10000);
  if (!isConnected) {
    throw new Error('Database connection failed. Cannot execute seed.');
  }

  // Seed Services
  logger.info('Seeding platform services...');
  for (const s of SEED_SERVICES) {
    await db
      .insert(schema.platformServices)
      .values(s)
      .onConflictDoNothing({ target: schema.platformServices.code });
  }

  // Seed Staff Users
  logger.info('Seeding corporate staff users...');
  for (const u of SEED_STAFF_USERS) {
    await db
      .insert(schema.staffUsers)
      .values(u)
      .onConflictDoNothing({ target: schema.staffUsers.email });
  }

  // Seed Colleges
  logger.info('Seeding colleges...');
  for (const c of SEED_COLLEGES) {
    await db
      .insert(schema.colleges)
      .values(c)
      .onConflictDoNothing({ target: schema.colleges.code });
  }

  // Seed Students
  logger.info('Seeding students...');
  for (const stu of SEED_STUDENTS) {
    await db
      .insert(schema.students)
      .values(stu)
      .onConflictDoNothing({ target: [schema.students.collegeId, schema.students.rollNumber] });
  }

  // Seed Jobs
  logger.info('Seeding provisioning jobs...');
  for (const job of SEED_PROVISIONING_JOBS) {
    await db
      .insert(schema.provisioningJobs)
      .values(job)
      .onConflictDoNothing({ target: schema.provisioningJobs.id });
  }

  // Seed Approvals
  logger.info('Seeding approvals...');
  for (const appr of SEED_APPROVALS) {
    await db
      .insert(schema.approvalRequests)
      .values(appr)
      .onConflictDoNothing({ target: schema.approvalRequests.id });
  }

  // Seed Payments
  logger.info('Seeding payment invoices...');
  for (const inv of SEED_PAYMENTS) {
    await db
      .insert(schema.paymentInvoices)
      .values(inv)
      .onConflictDoNothing({ target: schema.paymentInvoices.invoiceNumber });
  }

  // Seed Notifications
  logger.info('Seeding notifications...');
  for (const notif of SEED_NOTIFICATIONS) {
    await db
      .insert(schema.notifications)
      .values(notif)
      .onConflictDoNothing({ target: schema.notifications.id });
  }

  // Seed Templates
  logger.info('Seeding app templates...');
  for (const tmpl of SEED_TEMPLATES) {
    await db
      .insert(schema.appTemplates)
      .values(tmpl)
      .onConflictDoNothing({ target: schema.appTemplates.slug });
  }

  // Seed Audit
  logger.info('Seeding audit logs...');
  for (const aud of SEED_AUDIT_LOGS) {
    await db
      .insert(schema.auditLogs)
      .values(aud)
      .onConflictDoNothing({ target: schema.auditLogs.id });
  }

  logger.info('Development database seeding finished successfully.');
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runSeed()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err: err.message }, 'Seed execution failed');
      await closePool();
      process.exit(1);
    });
}
