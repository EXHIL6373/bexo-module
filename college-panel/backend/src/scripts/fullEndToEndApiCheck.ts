import { pool } from '../db/client';
import { signToken } from '../shared/security/tokens';

interface ApiCheckResult {
  endpoint: string;
  method: string;
  expectedStatus: number;
  actualStatus: number;
  success: boolean;
  notes: string;
}

const results: ApiCheckResult[] = [];

function logResult(method: string, endpoint: string, expectedStatus: number, actualStatus: number, success: boolean, notes: string) {
  results.push({ endpoint, method, expectedStatus, actualStatus, success, notes });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} [${method} ${endpoint}] Expected: ${expectedStatus}, Got: ${actualStatus} - ${notes}`);
}

async function request(url: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(url, { method, headers, body });
  let json: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  } else {
    try {
      json = await res.text();
    } catch {
      json = null;
    }
  }
  return { status: res.status, headers: res.headers, body: json };
}

async function runAllChecks() {
  const BASE = 'http://localhost:8000/api/v1';
  const ROOT = 'http://localhost:8000';
  const ts = Date.now();

  console.log('========================================================================');
  console.log('  BEXO COLLEGE PANEL — COMPLETE LIVE API AUDIT MATRIX VERIFICATION      ');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // 1. HEALTH AND OBSERVABILITY
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 1: HEALTH & OBSERVABILITY PROBES ---');
  {
    const res = await request(`${ROOT}/health`);
    logResult('GET', '/health', 200, res.status, res.status === 200 && res.body?.data?.database === 'connected', 'Root health probe with live DB');
  }
  {
    const res = await request(`${BASE}/health/live`);
    logResult('GET', '/api/v1/health/live', 200, res.status, res.status === 200 && res.body?.data?.status === 'alive', 'Liveness probe');
  }
  {
    const res = await request(`${BASE}/health/ready`);
    logResult('GET', '/api/v1/health/ready', 200, res.status, res.status === 200 && res.body?.data?.database === 'connected', 'Readiness probe with live DB pool');
  }

  // -------------------------------------------------------------------------
  // 2. AUTHENTICATION & ACCOUNT LIFECYCLE
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 2: AUTHENTICATION & ACCOUNT LIFECYCLE ---');
  let psgToken = '';
  let kctToken = '';
  let corporateToken = signToken({
    userId: 'usr-super-kavin',
    email: 'kavinbalaji@atbexo.com',
    role: 'super_admin',
    collegeId: null,
    name: 'Kavinbalaji S K',
    sessionVersion: 1,
  });

  // Login Valid PSG
  {
    const res = await request(`${BASE}/auth/college-login`, {
      method: 'POST',
      body: { email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' },
    });
    psgToken = res.body?.data?.token || '';
    logResult('POST', '/api/v1/auth/college-login', 200, res.status, res.status === 200 && !!psgToken, 'Login valid PSG College Admin');
  }

  // Login KCT
  {
    const res = await request(`${BASE}/auth/college-login`, {
      method: 'POST',
      body: { email: 'preetha.s@kct.ac.in', password: 'ValidPassword123!' },
    });
    kctToken = res.body?.data?.token || '';
    logResult('POST', '/api/v1/auth/college-login (KCT)', 200, res.status, res.status === 200 && !!kctToken, 'Login valid Kumaraguru College Admin');
  }

  // Login Bad Password (401)
  {
    const res = await request(`${BASE}/auth/college-login`, {
      method: 'POST',
      body: { email: 'venkatesh.r@psgtech.edu', password: 'WrongPassword999!' },
    });
    logResult('POST', '/api/v1/auth/college-login (Bad Password)', 401, res.status, res.status === 401, 'Rejection of invalid password');
  }

  // Login Corporate Role Rejection (403)
  {
    const res = await request(`${BASE}/auth/college-login`, {
      method: 'POST',
      body: { email: 'kavinbalaji@atbexo.com', password: 'AdminPass123!' },
    });
    logResult('POST', '/api/v1/auth/college-login (Corporate Gate)', 403, res.status, res.status === 403, 'Rejection of corporate administrator at college portal');
  }

  // Login Invalid Schema (400)
  {
    const res = await request(`${BASE}/auth/college-login`, {
      method: 'POST',
      body: { email: 'not-an-email' },
    });
    logResult('POST', '/api/v1/auth/college-login (Schema Failure)', 400, res.status, res.status === 400, 'Rejection of invalid schema payload');
  }

  // GET /auth/me
  {
    const res = await request(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/auth/me', 200, res.status, res.status === 200 && res.body?.data?.college?.id === 'clg-psg-01', 'Retrieve active authenticated identity');
  }

  // GET /auth/me without token (401)
  {
    const res = await request(`${BASE}/auth/me`);
    logResult('GET', '/api/v1/auth/me (No Auth)', 401, res.status, res.status === 401, '401 Unauthorized when missing token');
  }

  // Forgot password
  {
    const res = await request(`${BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: 'venkatesh.r@psgtech.edu' },
    });
    logResult('POST', '/api/v1/auth/forgot-password', 200, res.status, res.status === 200, 'Password reset dispatch for institutional email');
  }

  // Reset password validate without token query param (400 validation error)
  {
    const res = await request(`${BASE}/auth/reset-password/validate`);
    logResult('GET', '/api/v1/auth/reset-password/validate (Missing Param)', 400, res.status, res.status === 400, 'Rejection of missing token parameter with 400');
  }

  // Reset password validate with non-existent token (200 with valid: false)
  {
    const res = await request(`${BASE}/auth/reset-password/validate?token=nonexistent_token_12345`);
    const isExpected = res.status === 200 && res.body?.data?.valid === false;
    logResult('GET', '/api/v1/auth/reset-password/validate (Invalid Token)', 200, res.status, isExpected, 'Graceful handling of invalid reset token ({ valid: false })');
  }

  // Reset password submit with invalid token (400)
  {
    const res = await request(`${BASE}/auth/reset-password`, {
      method: 'POST',
      body: { token: 'nonexistent_token_12345', newPassword: 'NewSecurePassword123!' },
    });
    logResult('POST', '/api/v1/auth/reset-password (Invalid Token)', 400, res.status, res.status === 400, 'Rejection of reset attempt with bad token');
  }

  // Invitation validate without token query param (400 validation error)
  {
    const res = await request(`${BASE}/auth/invitations/validate`);
    logResult('GET', '/api/v1/auth/invitations/validate (Missing Param)', 400, res.status, res.status === 400, 'Rejection of missing invite token parameter with 400');
  }

  // Invitation validate with non-existent token (200 with valid: false)
  {
    const res = await request(`${BASE}/auth/invitations/validate?token=invalid_invite_token_xyz`);
    const isExpected = res.status === 200 && res.body?.data?.valid === false;
    logResult('GET', '/api/v1/auth/invitations/validate (Invalid Token)', 200, res.status, isExpected, 'Graceful handling of invalid invitation token ({ valid: false })');
  }

  // Activate account with invalid token (400)
  {
    const res = await request(`${BASE}/auth/activate-account`, {
      method: 'POST',
      body: { token: 'invalid_invite_token_xyz', password: 'ActivatedPassword123!' },
    });
    logResult('POST', '/api/v1/auth/activate-account (Invalid Token)', 400, res.status, res.status === 400, 'Rejection of activation with bad token');
  }

  // Logout
  {
    const res = await request(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('POST', '/api/v1/auth/logout', 200, res.status, res.status === 200, 'Logout session cleanly');
    // Re-login to get a fresh token for subsequent tests
    const relogin = await request(`${BASE}/auth/college-login`, {
      method: 'POST',
      body: { email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' },
    });
    psgToken = relogin.body?.data?.token || '';
  }

  // -------------------------------------------------------------------------
  // 3. COLLEGE PROFILE & SETTINGS
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 3: INSTITUTIONAL COLLEGE PROFILE & SETTINGS ---');
  {
    const res = await request(`${BASE}/college/profile`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/profile', 200, res.status, res.status === 200 && res.body?.data?.id === 'clg-psg-01', 'Retrieve college profile and quota figures');
  }
  {
    const res = await request(`${BASE}/college/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: { contactEmail: 'admin-contact@psgtech.edu', website: 'https://www.psgtech.edu' },
    });
    logResult('PATCH', '/api/v1/college/settings', 200, res.status, res.status === 200, 'Update college settings');
  }
  {
    const res = await request(`${BASE}/college/agreement`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/agreement', 200, res.status, res.status === 200, 'Retrieve college legal agreement');
  }
  {
    const res = await request(`${BASE}/college/billing`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/billing', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'Retrieve institutional billing and invoices');
  }

  // -------------------------------------------------------------------------
  // 4. STAFF MANAGEMENT & INVITATIONS
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 4: STAFF & ROLE MANAGEMENT ---');
  let testInviteId = '';
  let testStaffEmail = `staff-${ts}@psgtech.edu`;
  {
    const res = await request(`${BASE}/college/staff`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/staff', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List institutional staff members');
  }
  {
    const res = await request(`${BASE}/college/staff/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        name: 'Test Auditor Coordinator',
        email: testStaffEmail,
        role: 'college_staff',
        department: 'Information Technology',
        designation: 'Assistant Professor',
      },
    });
    testInviteId = res.body?.data?.id || '';
    logResult('POST', '/api/v1/college/staff/invite', 201, res.status, res.status === 201 && !!testInviteId, 'Invite new coordinator to institution');
  }

  // Resend Invite
  if (testInviteId) {
    const res = await request(`${BASE}/college/staff/invitations/${testInviteId}/resend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('POST', `/api/v1/college/staff/invitations/:id/resend`, 200, res.status, res.status === 200, 'Resend onboarding invitation with refreshed token');
  }

  // Revoke Invite
  if (testInviteId) {
    const res = await request(`${BASE}/college/staff/invitations/${testInviteId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('POST', `/api/v1/college/staff/invitations/:id/revoke`, 200, res.status, res.status === 200, 'Revoke onboarding invitation token');
  }

  // Staff Me Update
  {
    const res = await request(`${BASE}/college/staff/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: { name: 'Dr. Venkatesh R (Audited)' },
    });
    logResult('PATCH', '/api/v1/college/staff/me', 200, res.status, res.status === 200, 'Update current staff profile');
  }

  // Staff Change Password with Invalid Current Password (400 ValidationError)
  {
    const res = await request(`${BASE}/college/staff/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: { currentPassword: 'WrongOldPassword123!', newPassword: 'NewValidPassword123!' },
    });
    logResult('POST', '/api/v1/college/staff/change-password (Wrong Old)', 400, res.status, res.status === 400, 'Rejection of password change with incorrect current password');
  }

  // Role Escalation Rejection (403 Forbidden)
  {
    const res = await request(`${BASE}/college/staff/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        name: 'Attacker Admin',
        email: `attacker-${ts}@psgtech.edu`,
        role: 'super_admin',
        department: 'IT',
      },
    });
    logResult('POST', '/api/v1/college/staff/invite (Role Escalation)', 403, res.status, res.status === 403, 'Rejection of college admin attempting to invite super_admin');
  }

  // -------------------------------------------------------------------------
  // 5. STUDENT ROSTER & ONBOARDING
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 5: STUDENT ROSTER & BULK MANAGEMENT ---');
  let testStudentId = '';
  const testRoll = `RL-E2E-${ts.toString().slice(-6)}`;
  const testStudentEmail = `stu-${ts}@psgtech.edu`;

  // List students
  {
    const res = await request(`${BASE}/college/students?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/students', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List paginated students with metadata');
  }

  // Add student
  {
    const res = await request(`${BASE}/college/students`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        name: 'Automated Audit Student',
        rollNumber: testRoll,
        email: testStudentEmail,
        department: 'Artificial Intelligence',
        batchYear: '2026',
      },
    });
    testStudentId = res.body?.data?.id || '';
    logResult('POST', '/api/v1/college/students', 201, res.status, res.status === 201 && !!testStudentId, `Add student record (${testRoll})`);
  }

  // Duplicate student roll number conflict (409)
  {
    const res = await request(`${BASE}/college/students`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        name: 'Duplicate Student',
        rollNumber: testRoll,
        email: `dup-${ts}@psgtech.edu`,
        department: 'AI',
        batchYear: '2026',
      },
    });
    logResult('POST', '/api/v1/college/students (Duplicate Roll)', 409, res.status, res.status === 409, 'Enforce unique rollNumber constraint with 409 Conflict');
  }

  // Get student by ID
  if (testStudentId) {
    const res = await request(`${BASE}/college/students/${testStudentId}`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', `/api/v1/college/students/:id`, 200, res.status, res.status === 200 && res.body?.data?.rollNumber === testRoll, 'Retrieve student record by ID');
  }

  // Cross-tenant isolation: College B inspecting College A student (403)
  if (testStudentId) {
    const res = await request(`${BASE}/college/students/${testStudentId}`, {
      headers: { Authorization: `Bearer ${kctToken}` },
    });
    logResult('GET', `/api/v1/college/students/:id (Cross-Tenant)`, 403, res.status, res.status === 403, 'Cross-tenant boundary protection: College B cannot access College A student');
  }

  // Update student
  if (testStudentId) {
    const res = await request(`${BASE}/college/students/${testStudentId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: { department: 'Data Science & AI' },
    });
    logResult('PATCH', `/api/v1/college/students/:id`, 200, res.status, res.status === 200 && res.body?.data?.department === 'Data Science & AI', 'Update student details');
  }

  // Revoke student
  if (testStudentId) {
    const res = await request(`${BASE}/college/students/${testStudentId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: { reason: 'Academic Leave' },
    });
    const isRevoked = res.body?.data?.accessStatus === 'Revoked';
    logResult('POST', `/api/v1/college/students/:id/revoke`, 200, res.status, res.status === 200 && isRevoked, 'Revoke student service access');
  }

  // Reactivate student
  if (testStudentId) {
    const res = await request(`${BASE}/college/students/${testStudentId}/reactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    const isActive = res.body?.data?.accessStatus === 'Active';
    logResult('POST', `/api/v1/college/students/:id/reactivate`, 200, res.status, res.status === 200 && isActive, 'Reactivate student access');
  }

  // Bulk Import
  {
    const res = await request(`${BASE}/college/students/bulk-import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        students: [
          { name: 'Bulk Student 1', rollNumber: `BK1-${ts.toString().slice(-5)}`, email: `bk1-${ts}@psgtech.edu`, department: 'CSE' },
          { name: 'Bulk Student 2', rollNumber: `BK2-${ts.toString().slice(-5)}`, email: `bk2-${ts}@psgtech.edu`, department: 'ECE' },
        ],
      },
    });
    logResult('POST', '/api/v1/college/students/bulk-import', 200, res.status, res.status === 200 && res.body?.data?.importedCount >= 2, 'Batch student roster import');
  }

  // -------------------------------------------------------------------------
  // 6. PROVISIONING & ENTITLEMENTS
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 6: PROVISIONING & ENTITLEMENTS ---');
  let testJobId = '';
  {
    const res = await request(`${BASE}/college/provisioning/jobs`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/provisioning/jobs', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List provisioning jobs history');
  }

  if (testStudentId) {
    const res = await request(`${BASE}/college/provisioning/jobs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        studentIds: [testStudentId],
        serviceName: 'BEXO Code Lab',
        batchName: `Batch-${ts.toString().slice(-5)}`,
      },
    });
    testJobId = res.body?.data?.job?.id || '';
    logResult('POST', '/api/v1/college/provisioning/jobs', 201, res.status, res.status === 201, 'Trigger provisioning job for student');
  }

  if (testJobId) {
    const res = await request(`${BASE}/college/provisioning/jobs/${testJobId}`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', `/api/v1/college/provisioning/jobs/:id`, 200, res.status, res.status === 200 && res.body?.data?.id === testJobId, 'Retrieve single provisioning job status');
  }

  // Entitlements list
  {
    const res = await request(`${BASE}/college/entitlements`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/entitlements', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List active student service entitlements');
  }

  // -------------------------------------------------------------------------
  // 7. REQUESTS, NOTIFICATIONS, TASKS & REPORTS
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 7: REQUESTS, NOTIFICATIONS, TASKS & REPORTS ---');
  let testRequestId = '';
  {
    const res = await request(`${BASE}/college/requests`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/requests', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List college operational requests');
  }

  {
    const res = await request(`${BASE}/college/requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
      body: {
        type: 'Quota Increase',
        requester: 'Dr. Venkatesh R',
        requesterEmail: 'venkatesh.r@psgtech.edu',
        requesterRole: 'college_admin',
        details: {
          title: 'Automated E2E Audit Expansion',
          description: 'Expanding laboratory quota for upcoming AI placement semester batch',
          currentValue: 6500,
          requestedValue: 7000,
        },
        priority: 'Medium',
      },
    });
    testRequestId = res.body?.data?.id || '';
    logResult('POST', '/api/v1/college/requests', 201, res.status, res.status === 201 && !!testRequestId, 'Submit operational quota expansion request');
  }

  {
    const res = await request(`${BASE}/college/notifications`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/notifications', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List college notifications');
  }

  {
    const res = await request(`${BASE}/college/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('POST', '/api/v1/college/notifications/read-all', 200, res.status, res.status === 200, 'Mark all notifications as read');
  }

  {
    const res = await request(`${BASE}/college/announcements`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/announcements', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List institutional announcements');
  }

  {
    const res = await request(`${BASE}/college/tasks`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/tasks', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List college checklist onboarding tasks');
  }

  {
    const res = await request(`${BASE}/college/activity`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/activity', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List structured audit and activity logs');
  }

  {
    const res = await request(`${BASE}/college/reports/export?type=students`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/college/reports/export', 200, res.status, res.status === 200 && typeof res.body?.data?.csvContent === 'string', 'Export CSV student report without leaking sensitive data');
  }

  // -------------------------------------------------------------------------
  // 8. CENTRAL CORPORATE ADMINISTRATION
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 8: CENTRAL CORPORATE ADMINISTRATION ---');
  {
    const res = await request(`${BASE}/corporate/colleges`, {
      headers: { Authorization: `Bearer ${corporateToken}` },
    });
    logResult('GET', '/api/v1/corporate/colleges', 200, res.status, res.status === 200 && Array.isArray(res.body?.data), 'List all institutions (corporate admin)');
  }

  // College Staff attempting corporate endpoint (403)
  {
    const res = await request(`${BASE}/corporate/colleges`, {
      headers: { Authorization: `Bearer ${psgToken}` },
    });
    logResult('GET', '/api/v1/corporate/colleges (College Staff Attempt)', 403, res.status, res.status === 403, 'Enforce corporate boundary against college staff with 403 Forbidden');
  }

  // Review operational request
  if (testRequestId) {
    const res = await request(`${BASE}/corporate/requests/${testRequestId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${corporateToken}` },
      body: {
        status: 'Approved',
        decisionReason: 'Approved during automated E2E audit',
      },
    });
    logResult('POST', `/api/v1/corporate/requests/:id/review`, 200, res.status, res.status === 200 && res.body?.data?.status === 'Approved', 'Review and approve operational request atomically');
  }

  // Corporate Quota update
  {
    const res = await request(`${BASE}/corporate/colleges/clg-psg-01/quota`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${corporateToken}` },
      body: {
        allocated: 6500,
        reason: 'Adjusted during automated E2E audit',
      },
    });
    logResult('PATCH', '/api/v1/corporate/colleges/:id/quota', 200, res.status, res.status === 200 && res.body?.data?.quotaAllocated === 6500, 'Corporate admin updates institutional quota');
  }

  // Corporate Suspend and Reactivate College
  {
    const suspendRes = await request(`${BASE}/corporate/colleges/clg-kct-02/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${corporateToken}` },
      body: { reason: 'Audit lifecycle check' },
    });
    logResult('POST', '/api/v1/corporate/colleges/:id/suspend', 200, suspendRes.status, suspendRes.status === 200 && suspendRes.body?.data?.status === 'Suspended', 'Corporate admin suspends college');

    const reactivateRes = await request(`${BASE}/corporate/colleges/clg-kct-02/reactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${corporateToken}` },
    });
    logResult('POST', '/api/v1/corporate/colleges/:id/reactivate', 200, reactivateRes.status, reactivateRes.status === 200 && reactivateRes.body?.data?.status === 'Active', 'Corporate admin reactivates college');
  }

  // -------------------------------------------------------------------------
  // 9. POSTGRESQL DIRECT QUERY PERSISTENCE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- DOMAIN 9: POSTGRESQL PERSISTENCE VERIFICATION ---');
  if (testStudentId) {
    const dbRes: any = await pool.query('SELECT id, roll_number, name, email, department, access_status FROM students WHERE id = $1', [testStudentId]);
    const stored = dbRes.rows[0];
    const isDirectMatch = stored && stored.roll_number === testRoll && stored.department === 'Data Science & AI';
    logResult('SQL_DIRECT', 'PostgreSQL DB Direct Read', 1, dbRes.rows.length, isDirectMatch, `Direct DB query verified student ${testStudentId} in PostgreSQL ('${stored?.name}', dept='${stored?.department}', status='${stored?.access_status}')`);
  }

  // Summary
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n========================================================================');
  console.log(`  E2E API AUDIT COMPLETE: ${passed}/${total} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.error('FAILED CHECKS:');
    results.filter(r => !r.success).forEach(r => {
      console.error(`- [${r.method} ${r.endpoint}] Expected ${r.expectedStatus}, got ${r.actualStatus}: ${r.notes}`);
    });
    process.exit(1);
  }
}

runAllChecks().then(() => {
  pool.end();
}).catch(err => {
  console.error('FATAL AUDIT ERROR:', err);
  pool.end();
  process.exit(1);
});
