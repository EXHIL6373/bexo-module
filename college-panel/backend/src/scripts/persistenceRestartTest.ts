import { pool } from '../db/client';

const BASE = 'http://localhost:8000/api/v1';

async function request(url: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(url, { method, headers, body });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

async function phase1() {
  console.log('--- RESTART PERSISTENCE: PHASE 1 (PRE-RESTART WRITE & MUTATION) ---');
  // 1. Login
  const loginRes = await request(`${BASE}/auth/college-login`, {
    method: 'POST',
    body: { email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' },
  });
  const token = loginRes.body?.data?.token;
  if (!token) throw new Error('Login failed in Phase 1');

  const ts = Date.now();
  const rollNumber = `PERSIST-${ts.toString().slice(-6)}`;
  const email = `persist-${ts}@psgtech.edu`;

  // 2. Create student
  const createRes = await request(`${BASE}/college/students`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      name: 'Cold Restart Durability Probe',
      rollNumber,
      email,
      department: 'Aerospace Engineering',
      batchYear: '2026',
    },
  });
  const studentId = createRes.body?.data?.id;
  if (!studentId) throw new Error('Student creation failed in Phase 1');
  console.log(`✅ [PHASE 1: CREATE] Student created via HTTP API: ${studentId} (${rollNumber})`);

  // 3. Mutate student
  const updateRes = await request(`${BASE}/college/students/${studentId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { department: 'Avionics & Space Tech' },
  });
  if (updateRes.status !== 200) throw new Error('Student mutation failed');
  console.log(`✅ [PHASE 1: UPDATE] Student department mutated to 'Avionics & Space Tech'`);

  // 4. Verify in PostgreSQL direct
  const dbRes: any = await pool.query('SELECT id, roll_number, department, access_status FROM students WHERE id = $1', [studentId]);
  if (!dbRes.rows[0] || dbRes.rows[0].department !== 'Avionics & Space Tech') {
    throw new Error('Direct DB read failed to reflect mutated state');
  }
  console.log(`✅ [PHASE 1: DB_VERIFY] Direct PostgreSQL query confirmed row exists with mutated department.`);

  // Write probe info to a temp file so phase 2 can pick it up
  const fs = await import('node:fs');
  fs.writeFileSync('d:/ACEDIGITALS/college-panel/backend/src/scripts/.restartProbe.json', JSON.stringify({ studentId, rollNumber, department: 'Avionics & Space Tech' }));
  console.log('✅ [PHASE 1: READY] Saved probe metadata for post-restart verification.');
}

async function phase2() {
  console.log('--- RESTART PERSISTENCE: PHASE 2 (POST-RESTART VERIFICATION) ---');
  const fs = await import('node:fs');
  const probeData = JSON.parse(fs.readFileSync('d:/ACEDIGITALS/college-panel/backend/src/scripts/.restartProbe.json', 'utf-8'));
  const { studentId, rollNumber, department } = probeData;

  // 1. Login to freshly restarted server
  const loginRes = await request(`${BASE}/auth/college-login`, {
    method: 'POST',
    body: { email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' },
  });
  const token = loginRes.body?.data?.token;
  if (!token) throw new Error('Login failed on freshly restarted server');
  console.log(`✅ [PHASE 2: LOGIN] Successfully authenticated against new backend process.`);

  // 2. Read student via HTTP API
  const getRes = await request(`${BASE}/college/students/${studentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (getRes.status !== 200) {
    throw new Error(`Failed to read student post-restart: Status ${getRes.status}`);
  }
  const student = getRes.body?.data;
  if (student.rollNumber !== rollNumber || student.department !== department) {
    throw new Error(`Data mismatch post-restart! Got: ${JSON.stringify(student)}`);
  }
  console.log(`✅ [PHASE 2: HTTP_READ] Student ${studentId} successfully read post-restart with department '${student.department}'!`);

  // 3. Clean up probe record
  await pool.query('DELETE FROM students WHERE id = $1', [studentId]);
  console.log(`✅ [PHASE 2: CLEANUP] Test record cleaned up from PostgreSQL.`);
  fs.unlinkSync('d:/ACEDIGITALS/college-panel/backend/src/scripts/.restartProbe.json');
  console.log('========================================================================');
  console.log('  COLD RESTART PERSISTENCE FULLY VERIFIED (DURABILITY APPROVED)        ');
  console.log('========================================================================');
}

const mode = process.argv[2];
if (mode === 'phase1') {
  phase1().then(() => pool.end()).catch(e => { console.error(e); pool.end(); process.exit(1); });
} else if (mode === 'phase2') {
  phase2().then(() => pool.end()).catch(e => { console.error(e); pool.end(); process.exit(1); });
} else {
  console.error('Specify phase1 or phase2');
  process.exit(1);
}
