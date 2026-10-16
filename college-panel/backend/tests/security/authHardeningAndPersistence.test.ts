import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import * as dbClient from '../../src/db/client';
import { app } from '../../src/app';
import { store } from '../../src/db/store';
import { hashPassword } from '../../src/shared/security/passwords';
import { signToken, hashToken } from '../../src/shared/security/tokens';

describe('BEXO College Panel — Production Hardening & Security Verification Suite', () => {
  let validToken: string;
  let testStaffId: string;
  let testStaffEmail: string;

  beforeAll(async () => {
    testStaffEmail = `hardening.staff.${Date.now()}@psgtech.edu`;
    // Authenticate a valid college admin
    const loginRes = await request(app)
      .post('/api/v1/auth/college-login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });

    expect(loginRes.status).toBe(200);
    validToken = loginRes.body.data.token;

    // Create a dedicated test staff for sessionVersion and account state testing
    testStaffId = `usr-test-${Date.now()}`;
    const hash = await hashPassword('TestPassword123!');
    await store.createStaff({
      id: testStaffId,
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      name: 'Security Test Staff',
      email: testStaffEmail,
      phone: '+91 99887 76655',
      role: 'college_staff',
      department: 'ECE',
      designation: 'Lab Instructor',
      isActive: true,
      accountStatus: 'ACTIVE',
      passwordHash: hash,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Ensure quota is sufficient for bulk import tests
    await store.updateCollege('clg-psg-01', { quotaAllocated: 6000 });
  });

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & PASSWORD INTEGRITY
  // ---------------------------------------------------------------------------
  describe('1. Authentication & Password Security', () => {
    it('Rejects invalid password with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: testStaffEmail, password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid institutional email or password');
    });

    it('Rejects missing password or empty string', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: testStaffEmail, password: '' });

      expect(res.status).toBe(400); // validation error
      expect(res.body.success).toBe(false);
    });

    it('Rejects user account when passwordHash is missing/null in persistent store', async () => {
      const ts = Date.now();
      const noHashUserId = `usr-nohash-${ts}`;
      const noHashEmail = `nohash.${ts}@psgtech.edu`;
      await store.createStaff({
        id: noHashUserId,
        collegeId: 'clg-psg-01',
        name: 'No Hash User',
        email: noHashEmail,
        role: 'college_staff',
        isActive: true,
        accountStatus: 'ACTIVE',
        passwordHash: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: noHashEmail, password: 'AnyPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid institutional email or password');
    });

    it('Never leaks passwordHash in authentication response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: testStaffEmail, password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('$2a$');
      expect(JSON.stringify(res.body)).not.toContain('$2b$');
    });

    it('Rejects inactive or suspended user accounts with 403 Forbidden', async () => {
      const ts = Date.now();
      const suspendedId = `usr-susp-${ts}`;
      const suspendedEmail = `suspended.${ts}@psgtech.edu`;
      const hash = await hashPassword('ValidPassword123!');
      await store.createStaff({
        id: suspendedId,
        collegeId: 'clg-psg-01',
        name: 'Suspended Staff',
        email: suspendedEmail,
        role: 'college_staff',
        isActive: false,
        accountStatus: 'SUSPENDED',
        passwordHash: hash,
      });

      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: suspendedEmail, password: 'ValidPassword123!' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Account is inactive, suspended or revoked');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. SESSION VERSION & TOKEN INVALIDATION
  // ---------------------------------------------------------------------------
  describe('2. Session Version & Instant Session Invalidation', () => {
    it('Permits access when token sessionVersion matches active account state', async () => {
      const token = signToken({
        userId: testStaffId,
        email: testStaffEmail,
        role: 'college_staff',
        collegeId: 'clg-psg-01',
        sessionVersion: 1,
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStaffEmail);
    });

    it('Instantly rejects token with 401 when staff sessionVersion is bumped (e.g. password changed or invalidated)', async () => {
      const oldToken = signToken({
        userId: testStaffId,
        email: testStaffEmail,
        role: 'college_staff',
        collegeId: 'clg-psg-01',
        sessionVersion: 1,
      });

      // Administratively bump sessionVersion to 2
      await store.updateStaff(testStaffId, { sessionVersion: 2 });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Session has been revoked or invalidated');
    });

    it('Rejects malformed and tampered bearer tokens with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. INVITATIONS & SINGLE-USE REDEMPTION
  // ---------------------------------------------------------------------------
  describe('3. Invitation Token Security & Redemption Integrity', () => {
    let inviteToken: string;
    const inviteEmail = `invitee.${Date.now()}@psgtech.edu`;

    it('Admin creates an invitation with secure hashed storage', async () => {
      const res = await request(app)
        .post('/api/v1/college/staff/invite')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Invited Researcher',
          email: inviteEmail,
          role: 'college_staff',
          department: 'Robotics',
          designation: 'Research Fellow',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      inviteToken = res.body.data.token;

      // Verify that store saved the token hash
      const tokenHash = hashToken(inviteToken);
      const storedInvite = await store.getInvitationByToken(tokenHash);
      expect(storedInvite).toBeDefined();
    });

    it('Successfully activates account on first use', async () => {
      const res = await request(app)
        .post('/api/v1/auth/activate-account')
        .send({
          token: inviteToken,
          password: 'ActivatedSecurePassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('Rejects duplicate / replay attempt to activate with same token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/activate-account')
        .send({
          token: inviteToken,
          password: 'AnotherPassword123!',
        });

      expect(res.status).toBe(400); // validation error: no longer active
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. STUDENT IMPORT VALIDATION & QUOTA ENFORCEMENT
  // ---------------------------------------------------------------------------
  describe('4. Student Roster Import & Quota Boundary Validation', () => {
    it('Detects and skips duplicate roll numbers and duplicate emails in batch import', async () => {
      const ts = Date.now();
      const uniqueRoll1 = `SEC_${ts}_A`;
      const uniqueRoll2 = `SEC_${ts}_B`;
      const sharedEmail = `student.a.${ts}@psgtech.edu`;

      const res = await request(app)
        .post('/api/v1/college/students/bulk-import')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          students: [
            {
              name: 'Student A',
              rollNumber: uniqueRoll1,
              email: sharedEmail,
              department: 'CSE',
            },
            {
              name: 'Duplicate Student A (Roll Collision)',
              rollNumber: uniqueRoll1, // Duplicate roll number in same batch
              email: `student.diff.${ts}@psgtech.edu`,
              department: 'CSE',
            },
            {
              name: 'Duplicate Student B (Email Collision)',
              rollNumber: uniqueRoll2,
              email: sharedEmail, // Duplicate email in same batch
              department: 'CSE',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.importedCount).toBe(1);
      expect(res.body.data.skippedCount).toBe(2);
      expect(res.body.data.errors.length).toBe(2);
    });

    it('Rejects provisioning when requested seats exceed institutional quota', async () => {
      const res = await request(app)
        .post('/api/v1/college/provisioning/jobs')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          studentIds: Array.from({ length: 3000 }, (_, i) => `stu-overflow-${i}`),
          serviceName: 'BEXO Portfolio',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient quota');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. CORS PREFLIGHT & ORIGIN CONTROLS
  // ---------------------------------------------------------------------------
  describe('5. CORS Preflight & Header Security', () => {
    it('Responds successfully to OPTIONS preflight requests for allowed origins', async () => {
      const res = await request(app)
        .options('/api/v1/auth/college-login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });

    it('Does not allow arbitrary untrusted origins when origin is evaluated', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://malicious-phishing-site.com');

      // Disallowed origins will not have the matching Access-Control-Allow-Origin header
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. HEALTH PROBES (LIVENESS & READINESS)
  // ---------------------------------------------------------------------------
  describe('6. Health Probes (Liveness & Readiness)', () => {
    it('Liveness probe returns 200 OK alive independently of database connectivity', async () => {
      // Simulate database failure
      const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(false);

      const res = await request(app).get('/api/v1/health/live');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('alive');
      expect(res.body.data.uptimeSeconds).toBeDefined();

      checkSpy.mockRestore();
    });

    it('Readiness probe returns 200 OK and ready status when PostgreSQL is reachable', async () => {
      const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(true);

      const res = await request(app).get('/api/v1/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.database).toBe('connected');

      checkSpy.mockRestore();
    });

    it('Readiness probe returns 503 Service Unavailable when PostgreSQL is unreachable', async () => {
      const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(false);

      const res = await request(app).get('/api/v1/health/ready');
      expect(res.status).toBe(503);
      expect(res.status).not.toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Database readiness check failed: PostgreSQL connection unavailable.');

      checkSpy.mockRestore();
    });

    it('Readiness probe does not leak internal database credentials or stack trace on failure', async () => {
      const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(false);

      const res = await request(app).get('/api/v1/health/ready');
      expect(res.status).toBe(503);
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('postgresql://');
      expect(bodyStr).not.toContain('password');
      expect(bodyStr).not.toContain('neon.tech');
      expect(bodyStr).not.toContain('node_modules');

      checkSpy.mockRestore();
    });

    it('checkDatabaseConnection handles query timeout gracefully without uncaught rejection', async () => {
      // Direct unit test of checkDatabaseConnection with a fast 50ms bounded timeout
      const result = await dbClient.checkDatabaseConnection(50);
      // Host is unreachable in local test runner; should return false gracefully within bounded time
      expect(typeof result).toBe('boolean');
    });

    it('Composite /api/v1/health returns 503 degraded when database is disconnected', async () => {
      const checkSpy = vi.spyOn(dbClient, 'checkDatabaseConnection').mockResolvedValueOnce(false);

      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('degraded');
      expect(res.body.data.database).toBe('disconnected');

      checkSpy.mockRestore();
    });
  });
});
