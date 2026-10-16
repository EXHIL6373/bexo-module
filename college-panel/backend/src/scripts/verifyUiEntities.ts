import { pool } from '../db/client';

async function verifyUiEntities() {
  const roll = 'RL-UI-991';
  const email = 'ui991@psgtech.edu';
  const staffEmail = 'ramesh.k@psgtech.edu';

  console.log('--- VERIFYING ENTITIES CREATED THROUGH FRONTEND UI ---');
  
  // 1. Check Student
  const studentRes: any = await pool.query('SELECT id, roll_number, name, email, department, access_status FROM students WHERE roll_number = $1', [roll]);
  if (studentRes.rows.length > 0) {
    const s = studentRes.rows[0];
    console.log(`✅ [STUDENT PERSISTED] Found student '${s.name}' (Roll: ${s.roll_number}, Dept: ${s.department}, Status: ${s.access_status}) created via Frontend UI!`);
  } else {
    console.log(`ℹ️ Student ${roll} not found in DB.`);
  }

  // 2. Check Staff Invitation
  const inviteRes: any = await pool.query('SELECT id, email, full_name, role, status FROM college_invitations WHERE email = $1', [staffEmail]);
  if (inviteRes.rows.length > 0) {
    const inv = inviteRes.rows[0];
    console.log(`✅ [STAFF INVITATION PERSISTED] Found invitation for '${inv.full_name}' (${inv.email}, Role: ${inv.role}, Status: ${inv.status}) created via Frontend UI!`);
  } else {
    console.log(`ℹ️ Staff invitation ${staffEmail} not found in DB.`);
  }

  // 3. Check Quota Request
  const reqRes: any = await pool.query("SELECT id, type, requester, status, details FROM approval_requests WHERE details->>'title' LIKE '%UI Test%' OR details->>'title' LIKE '%Expansion%'");
  if (reqRes.rows.length > 0) {
    const r = reqRes.rows[reqRes.rows.length - 1];
    console.log(`✅ [REQUEST PERSISTED] Found operational request '${r.details?.title}' (ID: ${r.id}, Status: ${r.status}, Requester: ${r.requester}) created via Frontend UI!`);
  }

  // Clean up UI probe student and staff invitation so tests leave no garbage
  await pool.query('DELETE FROM students WHERE roll_number = $1', [roll]);
  await pool.query('DELETE FROM college_invitations WHERE email = $1', [staffEmail]);
  console.log('🧹 [CLEANUP] Probe test student and invitation cleaned up.');
}

verifyUiEntities().then(() => pool.end()).catch(e => {
  console.error(e);
  pool.end();
});
