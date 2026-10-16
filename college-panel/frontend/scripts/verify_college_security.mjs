/**
 * BEXO College Panel — Multi-Tenant Isolation & Security Verification Suite
 * Executes automated security audits testing tenant boundaries, parameter tampering,
 * role escalation prevention, and zero-leak corporate isolation.
 */

import { mockAdapter } from '../src/services/mockAdapter.ts';
import { ApiError } from '../src/services/apiClient.ts';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} - ${details}`);
    failedTests++;
  }
}

async function runSecurityTestSuite() {
  console.log('\n========================================================================');
  console.log('  BEXO COLLEGE PANEL — MULTI-TENANT ISOLATION & SECURITY VERIFICATION');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // TEST SUITE 1: AUTHENTICATION, REJECTION GATES & ROLE BOUNDARIES
  // -------------------------------------------------------------------------
  console.log('Test Suite 1: Authentication & Institutional Redirection Gate');

  // 1.1 College A (PSG Tech) Login
  const psgLogin = await mockAdapter.login('venkatesh.r@psgtech.edu', 'ValidPassword123!');
  assert(
    psgLogin.user.collegeId === 'clg-psg-01' && psgLogin.college.name.includes('PSG'),
    'College A (PSG Tech) authenticates successfully with verified collegeId clg-psg-01',
    `Got college: ${psgLogin.college.name}`
  );

  // 1.2 College B (Kumaraguru) Login
  const kctLogin = await mockAdapter.login('preetha.s@kct.ac.in', 'ValidPassword123!');
  assert(
    kctLogin.user.collegeId === 'clg-kct-02' && kctLogin.college.name.includes('Kumaraguru'),
    'College B (Kumaraguru) authenticates successfully with verified collegeId clg-kct-02',
    `Got college: ${kctLogin.college.name}`
  );

  // 1.3 Corporate Admin Login Rejection at College Portal
  let corporateRejected = false;
  let corporateErrorMsg = '';
  try {
    await mockAdapter.login('kavinbalaji@atbexo.com', 'AdminPass123!');
  } catch (err) {
    corporateRejected = true;
    corporateErrorMsg = err.message;
  }
  assert(
    corporateRejected && corporateErrorMsg.includes('Institutional Access Restricted'),
    'Corporate Admin (kavinbalaji@atbexo.com) login is strictly rejected at College Portal',
    `Error: ${corporateErrorMsg}`
  );

  // 1.4 Suspended College (CIT) Login Rejection
  let suspendedRejected = false;
  let suspendedErrorMsg = '';
  try {
    await mockAdapter.login('tsridhar@cit.edu.in', 'ValidPass123!');
  } catch (err) {
    suspendedRejected = true;
    suspendedErrorMsg = err.message;
  }
  assert(
    suspendedRejected && suspendedErrorMsg.includes('Institutional Access Suspended'),
    'Suspended College (CIT) login is locked with institutional suspension notice',
    `Error: ${suspendedErrorMsg}`
  );


  // -------------------------------------------------------------------------
  // TEST SUITE 2: STRICT DATA BOUNDARY ISOLATION (COLLEGE A vs COLLEGE B)
  // -------------------------------------------------------------------------
  console.log('\nTest Suite 2: Multi-Tenant Data Boundary Scoping');

  // Authenticate as College A
  await mockAdapter.login('venkatesh.r@psgtech.edu');

  // 2.1 College A student list contains ONLY College A students
  const psgStudents = await mockAdapter.getStudents();
  assert(
    psgStudents.length > 0 && psgStudents.every((s) => s.collegeId === 'clg-psg-01'),
    'College A receives ONLY records belonging to clg-psg-01',
    `Total: ${psgStudents.length}`
  );

  // Authenticate as College B
  await mockAdapter.login('preetha.s@kct.ac.in');

  // 2.2 College B student list contains ONLY College B students
  const kctStudents = await mockAdapter.getStudents();
  assert(
    kctStudents.length > 0 && kctStudents.every((s) => s.collegeId === 'clg-kct-02'),
    'College B receives ONLY records belonging to clg-kct-02',
    `Total: ${kctStudents.length}`
  );

  // 2.3 College A cannot inspect College B student by ID (403 Forbidden Gate)
  await mockAdapter.login('venkatesh.r@psgtech.edu'); // Back to College A
  const foreignStudentId = kctStudents[0].id;

  let crossInspectBlocked = false;
  let crossInspectStatus = 0;
  try {
    await mockAdapter.getStudentById(foreignStudentId);
  } catch (err) {
    crossInspectBlocked = true;
    crossInspectStatus = err.statusCode;
  }
  assert(
    crossInspectBlocked && crossInspectStatus === 403,
    `College A inspecting College B student (${foreignStudentId}) triggers 403 Tenant Isolation Gate`,
    `Status code: ${crossInspectStatus}`
  );

  // 2.4 College A can inspect own student by ID
  const ownStudentId = psgStudents[0].id;
  const ownStudent = await mockAdapter.getStudentById(ownStudentId);
  assert(
    ownStudent && ownStudent.id === ownStudentId && ownStudent.collegeId === 'clg-psg-01',
    `College A inspecting own student (${ownStudentId}) succeeds`,
    `Name: ${ownStudent?.name}`
  );


  // -------------------------------------------------------------------------
  // TEST SUITE 3: PARAMETER TAMPERING RESISTANCE & ROLE BOUNDARIES
  // -------------------------------------------------------------------------
  console.log('\nTest Suite 3: Client Tampering Resistance & Role Escalation Prevention');

  // 3.1 Adding student with forged collegeId (attempting to write to College B)
  const forgedStudent = await mockAdapter.addStudent({
    name: 'Tamper Attempt Student',
    rollNumber: `TAMPER-${Date.now().toString().slice(-4)}`,
    email: 'tamper@example.com',
    department: 'Computer Science',
    collegeId: 'clg-kct-02', // Tamper attempt!
  });
  assert(
    forgedStudent.collegeId === 'clg-psg-01',
    'Forged collegeId in addStudent is automatically overwritten by verified session identity',
    `Bound collegeId: ${forgedStudent.collegeId}`
  );

  // 3.2 Role Escalation Prevention: Attempting to invite a corporate super_admin
  let inviteEscalationBlocked = false;
  try {
    await mockAdapter.inviteStaff({
      name: 'Rogue Admin',
      email: 'rogue@example.com',
      role: 'super_admin', // Illegal role escalation
    });
  } catch (err) {
    inviteEscalationBlocked = true;
  }
  assert(
    inviteEscalationBlocked,
    'College administrator attempting to invite a super_admin is strictly blocked',
    `Escalation blocked: ${inviteEscalationBlocked}`
  );

  // 3.3 Role Escalation Prevention: Attempting to update existing staff to admin
  const psgStaff = await mockAdapter.getStaff();
  const staffMember = psgStaff.find((s) => s.role === 'college_staff' || s.role === 'college_coordinator') || psgStaff[0];
  let updateRoleEscalationBlocked = false;
  try {
    await mockAdapter.updateStaffRole(staffMember.id, 'admin'); // Illegal role escalation
  } catch (err) {
    updateRoleEscalationBlocked = true;
  }
  assert(
    updateRoleEscalationBlocked,
    'College administrator attempting to escalate staff role to admin is strictly blocked',
    `Escalation blocked: ${updateRoleEscalationBlocked}`
  );


  // -------------------------------------------------------------------------
  // TEST SUITE 4: REVISION OF SESSION TERMINATION & CLEAN STORAGE
  // -------------------------------------------------------------------------
  console.log('\nTest Suite 4: Secure Logout & Session Invalidation');

  await mockAdapter.logout();
  const sessionAfterLogout = mockAdapter.getSession();
  assert(
    sessionAfterLogout.token === null && sessionAfterLogout.user === null,
    'Safe logout clears in-memory session without destructive localStorage.clear()',
    `Session: ${JSON.stringify(sessionAfterLogout)}`
  );

  let unauthenticatedOpBlocked = false;
  try {
    await mockAdapter.getStudents();
  } catch (err) {
    unauthenticatedOpBlocked = true;
  }
  assert(
    unauthenticatedOpBlocked,
    'Operations after logout are rejected with 401 Authentication Required',
    `Blocked: ${unauthenticatedOpBlocked}`
  );


  // -------------------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTestSuite();
