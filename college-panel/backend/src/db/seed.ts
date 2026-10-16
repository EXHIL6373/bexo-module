import { pool } from './client';
import { logger } from '../shared/utils/logger';
import {
  INITIAL_SERVICES,
  INITIAL_COLLEGES,
  INITIAL_STAFF_USERS,
  INITIAL_STUDENTS,
  INITIAL_PROVISIONING_JOBS,
  INITIAL_APPROVALS,
  INITIAL_AGREEMENTS,
  INITIAL_INVOICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_ANNOUNCEMENTS,
} from './initialData';

async function seed() {
  const isProd = process.env.NODE_ENV === 'production';
  const isStaging = process.env.NODE_ENV === 'staging';

  // 1. Strict production prohibition: Never allow synthetic seeding on production databases
  if (isProd) {
    logger.error('❌ FATAL: Seeding synthetic test fixtures is STRICTLY PROHIBITED in production environments. Startup aborted.');
    process.exit(1);
  }

  // 2. Production URL pattern guard: Prevent accidental execution against production DB via inherited env vars
  const dbUrl = process.env.DATABASE_URL || '';
  if (/prod(uction)?/i.test(dbUrl) && !/staging/i.test(dbUrl)) {
    logger.error('❌ FATAL: Target DATABASE_URL appears to reference a production database. Seeding aborted for safety.');
    process.exit(1);
  }

  // 3. Staging guard: Require explicit confirmation variable
  const hasStagingConsent = process.env.ALLOW_STAGING_SEED === 'true' || process.env.ALLOW_PRODUCTION_SEED === 'true';
  if (isStaging && !hasStagingConsent) {
    logger.error('❌ Refusing to run seed script in staging environment without ALLOW_STAGING_SEED=true.');
    process.exit(1);
  }

  logger.info('🌱 Seeding initial synthetic datasets into PostgreSQL database...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Platform Services
    for (const s of INITIAL_SERVICES) {
      await client.query(
        `INSERT INTO platform_services (id, code, name, category, description, is_global_active, total_college_adoption, total_students_enrolled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO NOTHING`,
        [s.id, s.code, s.name, s.category, s.description, s.isGlobalActive, s.totalCollegeAdoption, s.totalStudentsEnrolled]
      );
    }

    // 2. Seed Colleges (Do not overwrite quota, status, or credentials on existing colleges)
    for (const c of INITIAL_COLLEGES) {
      await client.query(
        `INSERT INTO colleges (id, name, code, slug, type, affiliation, established_year, address, city, district, state, pincode, country, primary_contact, admin_contact, coordinators, status, dashboard_access, total_students, active_students, quota_allocated, quota_used, warning_threshold, critical_threshold, department_limits, services, suspension_reason, suspended_at, reactivated_at, created_at, updated_at, last_activity_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id, c.name, c.code, c.slug, c.type, c.affiliation, c.establishedYear,
          c.address, c.city, c.district, c.state, c.pincode, c.country,
          JSON.stringify(c.primaryContact), JSON.stringify(c.adminContact), JSON.stringify(c.coordinators),
          c.status, c.dashboardAccess, c.totalStudents, c.activeStudents,
          c.quotaAllocated, c.quotaUsed, c.warningThreshold, c.criticalThreshold,
          JSON.stringify(c.departmentLimits), JSON.stringify(c.services),
          c.suspensionReason || null, c.suspendedAt || null, null,
          c.createdAt, c.updatedAt, c.lastActivityAt
        ]
      );
    }

    // 3. Seed Staff Users (Do not reset passwords or silently reactivate suspended accounts)
    for (const u of INITIAL_STAFF_USERS) {
      await client.query(
        `INSERT INTO staff_users (id, college_id, college_name, name, email, phone, role, department, designation, is_active, account_status, password_hash, last_login_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (email) DO NOTHING`,
        [
          u.id, u.collegeId || null, u.collegeName || null, u.name, u.email, u.phone || null,
          u.role, u.department || null, u.designation || null, u.isActive, u.accountStatus,
          u.passwordHash, u.lastLoginAt, u.createdAt, u.updatedAt
        ]
      );
    }

    // 4. Seed Students
    for (const s of INITIAL_STUDENTS) {
      await client.query(
        `INSERT INTO students (id, college_id, college_name, name, roll_number, email, phone, department, course, batch, access_status, services, entitlement_id, provisioning_job_id, enrolled_year, resume_count, portfolio_subdomain, last_activity_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (id) DO NOTHING`,
        [
          s.id, s.collegeId, s.collegeName, s.name, s.rollNumber, s.email, s.phone || null,
          s.department, s.course || null, s.batch || null, s.accessStatus,
          JSON.stringify(s.services), s.entitlementId, s.provisioningJobId || null,
          s.enrolledYear, s.resumeCount, s.portfolioSubdomain || null,
          s.lastActivityAt, s.createdAt, s.updatedAt
        ]
      );
    }

    // 5. Seed Provisioning Jobs
    for (const j of INITIAL_PROVISIONING_JOBS) {
      await client.query(
        `INSERT INTO provisioning_jobs (id, college_id, college_name, created_by, source, total_records, successful, failed, partial, status, failed_records, created_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          j.id, j.collegeId, j.collegeName, j.createdBy, j.source, j.totalRecords,
          j.successful, j.failed, j.partial, j.status, JSON.stringify(j.failedRecords),
          j.createdAt, j.completedAt
        ]
      );
    }

    // 6. Seed Approvals
    for (const a of INITIAL_APPROVALS) {
      await client.query(
        `INSERT INTO approval_requests (id, type, college_id, college_name, requester, requester_email, requester_role, details, priority, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          a.id, a.type, a.collegeId, a.collegeName, a.requester, a.requesterEmail,
          a.requesterRole, JSON.stringify(a.details), a.priority, a.status, a.createdAt
        ]
      );
    }

    // 7. Seed Agreements
    for (const ag of INITIAL_AGREEMENTS) {
      await client.query(
        `INSERT INTO college_agreements (id, college_id, agreement_number, type, start_date, end_date, status, document_name, document_url, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          ag.id, ag.collegeId, ag.agreementNumber, ag.type, ag.startDate, ag.endDate,
          ag.status, ag.documentName || null, ag.documentUrl || null, ag.notes || null, ag.createdAt
        ]
      );
    }

    // 8. Seed Invoices
    for (const inv of INITIAL_INVOICES) {
      await client.query(
        `INSERT INTO payment_invoices (id, college_id, college_name, invoice_number, amount, status, date, due_date, payment_method, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          inv.id, inv.collegeId, inv.collegeName, inv.invoiceNumber, inv.amount,
          inv.status, inv.date, inv.dueDate, inv.paymentMethod, inv.description, inv.createdAt
        ]
      );
    }

    // 9. Seed Notifications
    for (const n of INITIAL_NOTIFICATIONS) {
      await client.query(
        `INSERT INTO notifications (id, college_id, title, message, category, severity, related_entity, is_read, action_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          n.id, n.collegeId, n.title, n.message, n.category, n.severity,
          JSON.stringify(n.relatedEntity), n.isRead, n.actionUrl || null, n.createdAt
        ]
      );
    }

    // 10. Seed Tasks
    for (const t of INITIAL_TASKS) {
      await client.query(
        `INSERT INTO college_tasks (id, college_id, title, description, due_date, priority, status, category, action_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          t.id, t.collegeId, t.title, t.description, t.dueDate, t.priority,
          t.status, t.category, t.actionUrl || null, t.createdAt
        ]
      );
    }

    // 11. Seed Announcements
    for (const an of INITIAL_ANNOUNCEMENTS) {
      await client.query(
        `INSERT INTO college_announcements (id, college_id, title, content, published_at, author, priority, target_audience, read_by_colleges)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          an.id, an.collegeId || null, an.title, an.content, an.publishedAt,
          an.author, an.priority, an.targetAudience, JSON.stringify(an.readByColleges || [])
        ]
      );
    }

    await client.query('COMMIT');
    logger.info('✅ Successfully seeded all institutional fixtures into Neon PostgreSQL database.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, '❌ Seeding failed.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
