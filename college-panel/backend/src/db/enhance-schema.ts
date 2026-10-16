import { pool } from './client';
import { logger } from '../shared/utils/logger';

async function runEnhancements() {
  logger.info('🚀 Applying HTML Spec v2.4.0 Harmonization Schema Enhancements to Neon DB...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Colleges: add email_domains
    await client.query(`
      ALTER TABLE colleges 
      ADD COLUMN IF NOT EXISTS email_domains JSONB DEFAULT '[]'::jsonb;
    `);

    // 2. Students: add normalized_email, user_id, linked_at
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS normalized_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(64),
      ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP WITH TIME ZONE;
    `);

    // Backfill normalized_email for existing students
    await client.query(`
      UPDATE students 
      SET normalized_email = LOWER(TRIM(email)) 
      WHERE normalized_email IS NULL;
    `);

    // 3. Student Entitlements: add revoke_reason
    await client.query(`
      ALTER TABLE student_entitlements 
      ADD COLUMN IF NOT EXISTS revoke_reason TEXT;
    `);

    // 4. Staff Users: add session_version
    await client.query(`
      ALTER TABLE staff_users 
      ADD COLUMN IF NOT EXISTS session_version INT DEFAULT 1;
    `);

    // 5. Approval Requests: add delta_seats and target_total
    await client.query(`
      ALTER TABLE approval_requests 
      ADD COLUMN IF NOT EXISTS delta_seats INT,
      ADD COLUMN IF NOT EXISTS target_total INT;
    `);

    // Populate initial email domains for known test colleges
    await client.query(`
      UPDATE colleges 
      SET email_domains = '["psgtech.edu", "cse.psgtech.edu"]'::jsonb
      WHERE id = 'clg-psg-01';

      UPDATE colleges 
      SET email_domains = '["kct.ac.in"]'::jsonb
      WHERE id = 'clg-kct-02';

      UPDATE colleges 
      SET email_domains = '["cit.edu.in"]'::jsonb
      WHERE id = 'clg-cit-04';
    `);

    await client.query('COMMIT');
    logger.info('✅ Harmonization enhancements applied successfully to Neon PostgreSQL database.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, '❌ Failed to apply harmonization enhancements.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runEnhancements().catch((err) => {
  console.error(err);
  process.exit(1);
});
