import bcrypt from 'bcryptjs';
import { pool } from '../db/client';

async function main() {
  const hash = await bcrypt.hash('ValidPassword123!', 10);
  await pool.query('UPDATE staff_users SET password_hash = $1 WHERE email = $2', [hash, 'venkatesh.r@psgtech.edu']);
  console.log('Successfully updated password hash for venkatesh.r@psgtech.edu');
  const check = await pool.query('SELECT email, password_hash FROM staff_users WHERE email = $1', ['venkatesh.r@psgtech.edu']);
  console.log('Verification match:', bcrypt.compareSync('ValidPassword123!', check.rows[0].password_hash));
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
