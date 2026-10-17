import pg from 'pg';
import { signToken } from '../shared/security/tokens';
import { env } from '../config/env';

const { Pool } = pg;

interface TestResult {
  step: string;
  status: 'PASSED' | 'FAILED';
  details: string;
  timingMs: number;
}

const results: TestResult[] = [];

async function record(step: string, fn: () => Promise<string>) {
  const start = Date.now();
  console.log(`\n======================================================`);
  console.log(`▶ RUNNING: ${step}`);
  console.log(`======================================================`);
  try {
    const details = await fn();
    const timingMs = Date.now() - start;
    console.log(`✅ [PASSED] ${step} (${timingMs}ms)`);
    console.log(`   ${details}`);
    results.push({ step, status: 'PASSED', details, timingMs });
  } catch (err: any) {
    const timingMs = Date.now() - start;
    console.error(`❌ [FAILED] ${step} (${timingMs}ms)`);
    console.error(`   Error: ${err.message}`);
    results.push({ step, status: 'FAILED', details: err.message, timingMs });
    throw err;
  }
}

async function runAudit() {
  const baseUrl = `http://localhost:${env.PORT}${env.API_PREFIX}`;
  console.log(`Target Backend Base URL: ${baseUrl}`);

  // Create isolated pg pool for direct DB queries
  const pool = new Pool({
    connectionString: env.DATABASE_URL.replace(/([&?])channel_binding=[^&]+(&|$)/g, '$1').replace(/\?&/, '?').replace(/[?&]$/, ''),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  // Verify DB connectivity
  const dbCheckStart = Date.now();
  const dbClient = await pool.connect();
  console.log(`Direct PostgreSQL probe connected in ${Date.now() - dbCheckStart}ms`);
  dbClient.release();

  // Baseline student count
  const baselineCountRes = await pool.query('SELECT count(*)::int as cnt FROM students');
  const baselineCount = baselineCountRes.rows[0].cnt;
  console.log(`Initial Student Records in PostgreSQL: ${baselineCount}`);

  // Generate tokens
  const psgAdminToken = signToken({
    userId: 'usr-psg-admin-alias',
    email: 'venkatesh@psgtech.edu',
    role: 'college_admin',
    collegeId: 'clg-psg-01',
    collegeName: 'PSG College of Technology',
    sessionVersion: 1,
  });

  const kctAdminToken = signToken({
    userId: 'usr-kct-admin-alias',
    email: 'preetha@kct.ac.in',
    role: 'college_admin',
    collegeId: 'clg-kct-02',
    collegeName: 'Kumaraguru College of Technology',
    sessionVersion: 1,
  });

  const timestamp = Date.now();
  const testRollNumber = `SYN-AUDIT-${timestamp}`;
  const testEmail = `audit.student.${timestamp}@psgtech.edu`;
  let createdStudentId = '';

  const bulkRoll1 = `SYN-BULK-A-${timestamp}`;
  const bulkRoll2 = `SYN-BULK-B-${timestamp}`;
  const bulkEmail1 = `bulk.student.a.${timestamp}@psgtech.edu`;
  const bulkEmail2 = `bulk.student.b.${timestamp}@psgtech.edu`;

  try {
    // 1. Single student creation
    await record('Phase 7.A: Single Student Creation API (POST /students)', async () => {
      const payload = {
        name: 'Synthetic Audit Student',
        rollNumber: testRollNumber,
        email: testEmail,
        department: 'Artificial Intelligence & Data Science',
        course: 'B.Tech AI & DS',
        batch: '2024-2028',
        enrolledYear: 2024,
      };

      const res = await fetch(`${baseUrl}/college/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${psgAdminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (res.status !== 201 || !json.data?.id) {
        throw new Error(`Expected HTTP 201, got ${res.status}: ${JSON.stringify(json)}`);
      }

      createdStudentId = json.data.id;
      return `Created student ID: ${createdStudentId}, roll: ${testRollNumber}, status: ${res.status}`;
    });

    // 2. Direct PostgreSQL query to verify immediate persistence
    await record('Phase 7.B: Direct PostgreSQL Row Verification', async () => {
      const queryRes = await pool.query('SELECT * FROM students WHERE id = $1', [createdStudentId]);
      if (queryRes.rows.length !== 1) {
        throw new Error(`Expected 1 row in PostgreSQL for id ${createdStudentId}, found ${queryRes.rows.length}`);
      }

      const row = queryRes.rows[0];
      if (row.roll_number !== testRollNumber) {
        throw new Error(`DB roll_number mismatch: expected ${testRollNumber}, got ${row.roll_number}`);
      }
      if (row.email !== testEmail) {
        throw new Error(`DB email mismatch: expected ${testEmail}, got ${row.email}`);
      }
      if (row.college_id !== 'clg-psg-01') {
        throw new Error(`DB college_id mismatch: expected clg-psg-01, got ${row.college_id}`);
      }

      // Also verify student_entitlements
      const entRes = await pool.query('SELECT * FROM student_entitlements WHERE student_id = $1', [createdStudentId]);
      return `PostgreSQL verified committed row: id=${row.id}, roll_number=${row.roll_number}, email=${row.email}, entitlementsCount=${entRes.rows.length}`;
    });

    // 3. Page Refresh Simulation: Fetch via API
    await record('Phase 7.C: Page Refresh Simulation (GET /students & GET /students/:id)', async () => {
      // 1. Check list
      const listRes = await fetch(`${baseUrl}/college/students?search=${testRollNumber}`, {
        headers: { Authorization: `Bearer ${psgAdminToken}` },
      });
      const listJson = (await listRes.json()) as any;
      if (listRes.status !== 200 || !Array.isArray(listJson.data)) {
        throw new Error(`Expected HTTP 200 from list query with data array, got status=${listRes.status}`);
      }

      const foundInList = listJson.data.find((s: any) => s.id === createdStudentId);
      if (!foundInList) {
        throw new Error(`Newly created student ${createdStudentId} not found in student directory list (found ${listJson.data.length} matches)`);
      }

      // 2. Check detail
      const detailRes = await fetch(`${baseUrl}/college/students/${createdStudentId}`, {
        headers: { Authorization: `Bearer ${psgAdminToken}` },
      });
      const detailJson = (await detailRes.json()) as any;
      if (detailRes.status !== 200 || detailJson.data?.id !== createdStudentId) {
        throw new Error(`Expected HTTP 200 from detail query, got ${detailRes.status}`);
      }

      return `Student directory returned student in list (filtered count: ${listJson.data.length}, total: ${listJson.meta?.total}) and detail API matched: ${detailJson.data.name} (${detailJson.data.rollNumber})`;
    });

    // 4. Duplicate Prevention Test
    await record('Phase 7.D: Duplicate Roll Number Prevention (HTTP 409 Conflict)', async () => {
      const dupPayload = {
        name: 'Duplicate Student Tamper',
        rollNumber: testRollNumber,
        email: `another.${timestamp}@psgtech.edu`,
        department: 'Artificial Intelligence',
        course: 'B.Tech AI',
        batch: '2024-2028',
        enrolledYear: 2024,
      };

      const res = await fetch(`${baseUrl}/college/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${psgAdminToken}`,
        },
        body: JSON.stringify(dupPayload),
      });

      const json = (await res.json()) as any;
      if (res.status !== 409) {
        throw new Error(`Expected HTTP 409 Conflict for duplicate roll number, got ${res.status}: ${JSON.stringify(json)}`);
      }

      return `Duplicate roll number correctly rejected with HTTP 409: "${json.message}"`;
    });

    // 5. Tenant Isolation Test
    await record('Phase 7.E: Multi-Tenant Isolation Enforcement (HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/college/students/${createdStudentId}`, {
        headers: { Authorization: `Bearer ${kctAdminToken}` },
      });

      const json = (await res.json()) as any;
      if (res.status !== 403) {
        throw new Error(`Expected HTTP 403 Forbidden when accessing clg-psg-01 student from clg-kct-02, got ${res.status}: ${JSON.stringify(json)}`);
      }

      return `Cross-tenant read access strictly blocked with HTTP 403: "${json.message}"`;
    });

    // 6. Bulk Import Persistence Test
    await record('Phase 7.F: Bulk Student Import & Persistence (POST /students/bulk-import)', async () => {
      const bulkPayload = {
        students: [
          {
            name: 'Synthetic Bulk Alpha',
            rollNumber: bulkRoll1,
            email: bulkEmail1,
            department: 'Computer Science',
            course: 'B.E CSE',
            batch: '2024-2028',
          },
          {
            name: 'Synthetic Bulk Beta',
            rollNumber: bulkRoll2,
            email: bulkEmail2,
            department: 'Information Technology',
            course: 'B.Tech IT',
            batch: '2024-2028',
          },
        ],
      };

      const res = await fetch(`${baseUrl}/college/students/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${psgAdminToken}`,
        },
        body: JSON.stringify(bulkPayload),
      });

      const json = (await res.json()) as any;
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Expected HTTP 200/201 from bulk import, got ${res.status}: ${JSON.stringify(json)}`);
      }

      // Verify in PostgreSQL directly
      const bulkDbRes = await pool.query(
        'SELECT id, roll_number, email FROM students WHERE roll_number IN ($1, $2)',
        [bulkRoll1, bulkRoll2]
      );

      if (bulkDbRes.rows.length !== 2) {
        throw new Error(`Expected 2 bulk rows in PostgreSQL, found ${bulkDbRes.rows.length}`);
      }

      return `Bulk import succeeded (API returned importedCount=${json.data?.importedCount}). PostgreSQL verified 2 committed rows.`;
    });

  } finally {
    // 7. Cleanup only synthetic probe records
    await record('Phase 7.G: Synthetic Records Cleanup & Integrity Assurance', async () => {
      const probeRolls = [testRollNumber, bulkRoll1, bulkRoll2];
      const deleteRes = await pool.query(
        'DELETE FROM students WHERE roll_number = ANY($1::text[]) RETURNING id, roll_number',
        [probeRolls]
      );

      // Verify deletion
      const verifyRes = await pool.query(
        'SELECT count(*)::int as cnt FROM students WHERE roll_number = ANY($1::text[])',
        [probeRolls]
      );

      if (verifyRes.rows[0].cnt !== 0) {
        throw new Error(`Failed to clean up all synthetic records. Remaining: ${verifyRes.rows[0].cnt}`);
      }

      // Final count comparison
      const finalCountRes = await pool.query('SELECT count(*)::int as cnt FROM students');
      const finalCount = finalCountRes.rows[0].cnt;

      if (finalCount !== baselineCount) {
        throw new Error(`Baseline count mismatch! Original: ${baselineCount}, Final: ${finalCount}`);
      }

      return `Cleaned up ${deleteRes.rowCount} probe records. Baseline database count perfectly preserved: ${finalCount} records.`;
    });

    await pool.end();
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${results.length} INTEGRATION AUDIT TESTS PASSED!`);
  console.log(`======================================================`);
  console.table(results);
}

runAudit().catch((err) => {
  console.error('\n💥 AUDIT SUITE FAILED:', err);
  process.exit(1);
});
