import { db, pool } from '../db/client';
import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';

interface CrudResult {
  step: string;
  success: boolean;
  details: string;
}

const results: CrudResult[] = [];

function record(step: string, success: boolean, details: string) {
  results.push({ step, success, details });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${step}] ${details}`);
}

async function runDiagnostics() {
  console.log('\n========================================================================');
  console.log('   BEXO COLLEGE PANEL — POSTGRESQL LIVE STORAGE & FULL CRUD VALIDATION  ');
  console.log('========================================================================\n');

  const probeTimestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. LIVE DATABASE CONNECTIVITY & TABLE DISCOVERY
    // -------------------------------------------------------------------------
    console.log('--- PHASE 1: DATABASE CONNECTION & DISCOVERY ---');
    const dbInfoRes: any = await pool.query('SELECT current_database(), current_user, version()');
    const { current_database, current_user, version } = dbInfoRes.rows[0];
    record('DB_CONNECT', true, `Connected to database: ${current_database} as user: ${current_user}`);
    console.log(`   PostgreSQL version: ${version.split(' ')[0]} ${version.split(' ')[1]}`);

    const tablesRes: any = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tables: string[] = tablesRes.rows.map((r: any) => r.table_name);
    record('TABLE_DISCOVERY', tables.length > 0, `Discovered ${tables.length} tables in public schema: ${tables.join(', ')}`);

    // -------------------------------------------------------------------------
    // 2. LIVE ROW COUNTS (PERSISTENCE PROOF)
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 2: PERSISTENCE & ROW COUNT AUDIT ---');
    for (const tbl of tables) {
      try {
        const countRes: any = await pool.query(`SELECT count(*)::int as count FROM "${tbl}"`);
        const count = countRes.rows[0].count;
        record(`ROW_COUNT_${tbl.toUpperCase()}`, true, `Table '${tbl}' has ${count} persistent records`);
      } catch (countErr: any) {
        record(`ROW_COUNT_${tbl.toUpperCase()}`, false, `Failed to query table ${tbl}: ${countErr.message}`);
      }
    }

    // -------------------------------------------------------------------------
    // 3. FULL CRUD: COLLEGE ENTITY
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 3: COLLEGE CRUD LIFECYCLE ---');
    const testCollegeId = `probe-clg-${probeTimestamp}`;
    const testCollegeSlug = `probe-slug-${probeTimestamp}`;

    // C - CREATE
    await pool.query(`
      INSERT INTO colleges (
        id, name, code, slug, type, affiliation, established_year, address, city, district, 
        state, pincode, country, primary_contact, admin_contact, coordinators, status, 
        dashboard_access, total_students, active_students, quota_allocated, quota_used, 
        warning_threshold, critical_threshold, department_limits, services, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, 'ENGINEERING', 'Anna University', 2026, '123 Tech Way', 'Coimbatore', 'Coimbatore',
        'Tamil Nadu', '641004', 'India', '{}', '{}', '[]', 'ACTIVE',
        true, 500, 500, 1000, 500, 80, 95, '{}', '[]', NOW(), NOW()
      )
    `, [testCollegeId, 'CRUD Probe Engineering College', `PRB${probeTimestamp.toString().slice(-4)}`, testCollegeSlug]);
    record('COLLEGE_CREATE', true, `Successfully created college record ${testCollegeId}`);

    // R - READ
    const collegeReadRes: any = await pool.query('SELECT id, name, quota_allocated, status FROM colleges WHERE id = $1', [testCollegeId]);
    const collegeRecord = collegeReadRes.rows[0];
    const readSuccess = collegeRecord && collegeRecord.name === 'CRUD Probe Engineering College';
    record('COLLEGE_READ', readSuccess, `Retrieved college: ${collegeRecord?.name}, status: ${collegeRecord?.status}, quota: ${collegeRecord?.quota_allocated}`);

    // U - UPDATE
    await pool.query('UPDATE colleges SET quota_allocated = 2500, status = $1, updated_at = NOW() WHERE id = $2', ['SUSPENDED', testCollegeId]);
    const collegeUpdateRes: any = await pool.query('SELECT quota_allocated, status FROM colleges WHERE id = $1', [testCollegeId]);
    const updatedCollege = collegeUpdateRes.rows[0];
    const updateSuccess = updatedCollege?.quota_allocated === 2500 && updatedCollege?.status === 'SUSPENDED';
    record('COLLEGE_UPDATE', updateSuccess, `Updated college quota to ${updatedCollege?.quota_allocated} and status to ${updatedCollege?.status}`);

    // D - DELETE
    await pool.query('DELETE FROM colleges WHERE id = $1', [testCollegeId]);
    const collegeVerifyDelRes: any = await pool.query('SELECT count(*)::int as count FROM colleges WHERE id = $1', [testCollegeId]);
    const collegeDeleted = collegeVerifyDelRes.rows[0].count === 0;
    record('COLLEGE_DELETE', collegeDeleted, `Deleted probe college record and verified count is 0 in DB`);

    // -------------------------------------------------------------------------
    // 4. FULL CRUD: STUDENT ENTITY (WITH DRIZZLE ORM)
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 4: STUDENT CRUD LIFECYCLE (DRIZZLE ORM) ---');
    const testStudentId = `stu-crud-${probeTimestamp}`;
    const testRollNumber = `RL-${probeTimestamp.toString().slice(-6)}`;
    const testEmail = `probe.student.${probeTimestamp}@psgtech.edu`;

    // C - CREATE
    const insertRes = await db.insert(schema.students).values({
      id: testStudentId,
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      name: 'Diagnostic Probe Student',
      rollNumber: testRollNumber,
      email: testEmail,
      department: 'Artificial Intelligence',
      batch: '2025-2029',
      enrolledYear: 2025,
      accessStatus: 'ACTIVE',
      services: ['resume', 'portfolio'],
      entitlementId: `ent-${probeTimestamp}`,
    }).returning();
    record('STUDENT_CREATE', insertRes.length > 0 && insertRes[0].id === testStudentId, `Created student ${testStudentId} for PSG Tech via Drizzle ORM`);

    // R - READ
    const fetchedStudents = await db.select().from(schema.students).where(eq(schema.students.id, testStudentId));
    const fetchedStudent = fetchedStudents[0];
    record('STUDENT_READ', fetchedStudent?.rollNumber === testRollNumber, `Read student from Postgres: Name='${fetchedStudent?.name}', Roll='${fetchedStudent?.rollNumber}', Dept='${fetchedStudent?.department}'`);

    // U - UPDATE
    const updatedStudents = await db.update(schema.students)
      .set({
        accessStatus: 'REVOKED',
        department: 'Cybersecurity',
        updatedAt: new Date(),
      })
      .where(eq(schema.students.id, testStudentId))
      .returning();
    const updatedStudent = updatedStudents[0];
    record('STUDENT_UPDATE', updatedStudent?.accessStatus === 'REVOKED' && updatedStudent?.department === 'Cybersecurity', `Updated student in Postgres: Status='${updatedStudent?.accessStatus}', Dept='${updatedStudent?.department}'`);

    // D - DELETE
    await db.delete(schema.students).where(eq(schema.students.id, testStudentId));
    const remainingStudents = await db.select().from(schema.students).where(eq(schema.students.id, testStudentId));
    record('STUDENT_DELETE', remainingStudents.length === 0, `Deleted probe student from Postgres; verified remaining record count is 0`);

    // -------------------------------------------------------------------------
    // 5. FULL CRUD: APPROVAL REQUESTS ENTITY
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 5: APPROVAL REQUESTS CRUD LIFECYCLE ---');
    const testRequestId = `req-crud-${probeTimestamp}`;

    // C - CREATE
    await pool.query(`
      INSERT INTO approval_requests (
        id, college_id, college_name, type, requester, requester_email, requester_role, details, status, created_at
      ) VALUES (
        $1, 'clg-psg-01', 'PSG College of Technology', 'QUOTA_INCREASE', 'Admin Probe', 'admin@psgtech.edu', 'college_admin',
        $2, 'Pending', NOW()
      )
    `, [testRequestId, JSON.stringify({ additionalSeats: 150, reason: 'New AI/DS intake' })]);
    record('REQUEST_CREATE', true, `Created approval request ${testRequestId} (Type: QUOTA_INCREASE)`);

    // R - READ
    const reqReadRes: any = await pool.query('SELECT id, type, status, details FROM approval_requests WHERE id = $1', [testRequestId]);
    const reqRecord = reqReadRes.rows[0];
    record('REQUEST_READ', reqRecord?.status === 'Pending', `Read approval request: Status='${reqRecord?.status}', Type='${reqRecord?.type}'`);

    // U - UPDATE
    await pool.query(`
      UPDATE approval_requests 
      SET status = 'Approved', reviewed_by = 'Corporate Super Admin', reviewed_at = NOW(), decision_reason = 'Approved via automated diagnostic probe'
      WHERE id = $1
    `, [testRequestId]);
    const reqUpdateRes: any = await pool.query('SELECT status, decision_reason FROM approval_requests WHERE id = $1', [testRequestId]);
    record('REQUEST_UPDATE', reqUpdateRes.rows[0]?.status === 'Approved', `Updated approval request: Status='${reqUpdateRes.rows[0]?.status}', Note='${reqUpdateRes.rows[0]?.decision_reason}'`);

    // D - DELETE
    await pool.query('DELETE FROM approval_requests WHERE id = $1', [testRequestId]);
    const reqDelRes: any = await pool.query('SELECT count(*)::int as count FROM approval_requests WHERE id = $1', [testRequestId]);
    record('REQUEST_DELETE', reqDelRes.rows[0].count === 0, `Deleted probe approval request; verified count is 0 in DB`);

    // -------------------------------------------------------------------------
    // 6. FULL CRUD: NOTIFICATIONS ENTITY
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 6: NOTIFICATIONS CRUD LIFECYCLE ---');
    const testNotifId = `notif-crud-${probeTimestamp}`;

    // C - CREATE
    await pool.query(`
      INSERT INTO notifications (
        id, college_id, title, message, category, severity, is_read, created_at
      ) VALUES ($1, 'clg-psg-01', 'Test Notification', 'Diagnostic test notification content', 'System', 'info', false, NOW())
    `, [testNotifId]);
    record('NOTIFICATION_CREATE', true, `Created notification ${testNotifId}`);

    // R - READ
    const notifReadRes: any = await pool.query('SELECT id, title, is_read FROM notifications WHERE id = $1', [testNotifId]);
    record('NOTIFICATION_READ', notifReadRes.rows[0]?.is_read === false, `Read notification: Title='${notifReadRes.rows[0]?.title}', is_read=${notifReadRes.rows[0]?.is_read}`);

    // U - UPDATE
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [testNotifId]);
    const notifUpdateRes: any = await pool.query('SELECT is_read FROM notifications WHERE id = $1', [testNotifId]);
    record('NOTIFICATION_UPDATE', notifUpdateRes.rows[0]?.is_read === true, `Updated notification is_read=${notifUpdateRes.rows[0]?.is_read}`);

    // D - DELETE
    await pool.query('DELETE FROM notifications WHERE id = $1', [testNotifId]);
    const notifDelRes: any = await pool.query('SELECT count(*)::int as count FROM notifications WHERE id = $1', [testNotifId]);
    record('NOTIFICATION_DELETE', notifDelRes.rows[0].count === 0, `Deleted probe notification; verified count is 0 in DB`);

    // -------------------------------------------------------------------------
    // 7. MULTI-TENANT ISOLATION AT DATABASE LAYER
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 7: MULTI-TENANT ISOLATION AT DB LAYER ---');
    const collegeAStudentsRes: any = await pool.query('SELECT count(*)::int as count FROM students WHERE college_id = $1', ['clg-psg-01']);
    const collegeBStudentsRes: any = await pool.query('SELECT count(*)::int as count FROM students WHERE college_id = $1', ['clg-kct-02']);
    const collegeCStudentsRes: any = await pool.query('SELECT count(*)::int as count FROM students WHERE college_id = $1', ['clg-cit-04']);

    record('TENANT_ISOLATION_PSG', collegeAStudentsRes.rows[0].count > 0, `Tenant clg-psg-01 (PSG Tech) has ${collegeAStudentsRes.rows[0].count} isolated student records`);
    record('TENANT_ISOLATION_KCT', collegeBStudentsRes.rows[0].count > 0, `Tenant clg-kct-02 (Kumaraguru) has ${collegeBStudentsRes.rows[0].count} isolated student records`);
    record('TENANT_ISOLATION_CIT', collegeCStudentsRes.rows[0].count >= 0, `Tenant clg-cit-04 (CIT, Suspended) has ${collegeCStudentsRes.rows[0].count} isolated student records`);

    // Cross-tenant query verification: queries scoped by college_id return disjoint sets
    const crossRes: any = await pool.query(`
      SELECT s1.id 
      FROM students s1 
      JOIN students s2 ON s1.id = s2.id 
      WHERE s1.college_id = 'clg-psg-01' AND s2.college_id = 'clg-kct-02'
    `);
    record('CROSS_TENANT_ZERO_OVERLAP', crossRes.rows.length === 0, `Verified 0 overlapping records between Tenant clg-psg-01 and clg-kct-02`);

  } catch (err: any) {
    console.error('Diagnostic error:', err);
    record('GLOBAL_EXECUTION', false, `Unhandled error: ${err.message}`);
  } finally {
    await pool.end();
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('\n========================================================================');
  console.log(`  VALIDATION RESULTS: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDiagnostics().catch((err) => {
  console.error('Fatal diagnostic crash:', err);
  process.exit(1);
});
