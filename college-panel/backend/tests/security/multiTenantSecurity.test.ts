import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('BEXO College Panel — Multi-Tenant Isolation & Security Verification Suite', () => {
  let psgToken: string;
  let kctToken: string;
  let psgStudentId: string;
  let kctStudentId: string;

  // -------------------------------------------------------------------------
  // SUITE 1: AUTHENTICATION, REJECTION GATES & ROLE BOUNDARIES
  // -------------------------------------------------------------------------
  describe('Suite 1: Authentication & Institutional Redirection Gate', () => {
    it('College A (PSG Tech) authenticates successfully with verified collegeId clg-psg-01', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.collegeId).toBe('clg-psg-01');
      expect(res.body.data.college.name).toContain('PSG');
      psgToken = res.body.data.token;
    });

    it('College B (Kumaraguru) authenticates successfully with verified collegeId clg-kct-02', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: 'preetha.s@kct.ac.in', password: 'ValidPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.collegeId).toBe('clg-kct-02');
      expect(res.body.data.college.name).toContain('Kumaraguru');
      kctToken = res.body.data.token;
    });

    it('Corporate Admin (kavinbalaji@atbexo.com) login is strictly rejected with 403 at College Portal', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: 'kavinbalaji@atbexo.com', password: 'ValidPassword123!' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Institutional Access Restricted');
    });

    it('Suspended College (CIT) login is locked with institutional suspension notice', async () => {
      const res = await request(app)
        .post('/api/v1/auth/college-login')
        .send({ email: 'tsridhar@cit.edu.in', password: 'ValidPassword123!' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Institutional Access Suspended');
    });
  });

  // -------------------------------------------------------------------------
  // SUITE 2: STRICT DATA BOUNDARY ISOLATION (COLLEGE A vs COLLEGE B)
  // -------------------------------------------------------------------------
  describe('Suite 2: Multi-Tenant Data Boundary Scoping', () => {
    it('College A student list contains ONLY College A students', async () => {
      const res = await request(app)
        .get('/api/v1/college/students')
        .set('Authorization', `Bearer ${psgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((s: any) => s.collegeId === 'clg-psg-01')).toBe(true);
      psgStudentId = res.body.data[0].id;
    });

    it('College B student list contains ONLY College B students', async () => {
      const res = await request(app)
        .get('/api/v1/college/students')
        .set('Authorization', `Bearer ${kctToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((s: any) => s.collegeId === 'clg-kct-02')).toBe(true);
      kctStudentId = res.body.data[0].id;
    });

    it('College A inspecting College B student by ID triggers 403 Tenant Isolation Gate', async () => {
      const res = await request(app)
        .get(`/api/v1/college/students/${kctStudentId}`)
        .set('Authorization', `Bearer ${psgToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cross-Tenant Boundary Violation');
    });

    it('College A inspecting own student by ID succeeds', async () => {
      const res = await request(app)
        .get(`/api/v1/college/students/${psgStudentId}`)
        .set('Authorization', `Bearer ${psgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(psgStudentId);
      expect(res.body.data.collegeId).toBe('clg-psg-01');
    });
  });

  // -------------------------------------------------------------------------
  // SUITE 3: PARAMETER TAMPERING RESISTANCE & ROLE BOUNDARIES
  // -------------------------------------------------------------------------
  describe('Suite 3: Client Tampering Resistance & Role Escalation Prevention', () => {
    it('Forged collegeId in addStudent is automatically overwritten by verified session identity', async () => {
      const res = await request(app)
        .post('/api/v1/college/students')
        .set('Authorization', `Bearer ${psgToken}`)
        .send({
          name: 'Tamper Attempt Student',
          rollNumber: `TAMPER-${Date.now().toString().slice(-4)}`,
          email: `tamper-${Date.now()}@example.com`,
          department: 'Computer Science',
          collegeId: 'clg-kct-02', // Tamper attempt to write to College B!
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collegeId).toBe('clg-psg-01'); // Bound strictly to PSG!
    });

    it('College administrator attempting to invite a super_admin is strictly blocked with 403', async () => {
      const res = await request(app)
        .post('/api/v1/college/staff/invite')
        .set('Authorization', `Bearer ${psgToken}`)
        .send({
          name: 'Rogue Admin',
          email: 'rogue@example.com',
          role: 'super_admin', // Illegal role escalation!
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Role Escalation Blocked');
    });

    it('College administrator attempting to escalate staff role to admin is strictly blocked with 403', async () => {
      // Find a staff member
      const staffRes = await request(app)
        .get('/api/v1/college/staff')
        .set('Authorization', `Bearer ${psgToken}`);

      const staffMember = staffRes.body.data.find(
        (s: any) => s.role === 'college_staff' || s.role === 'college_coordinator'
      ) || staffRes.body.data[0];

      const res = await request(app)
        .patch(`/api/v1/college/staff/${staffMember.id}/role`)
        .set('Authorization', `Bearer ${psgToken}`)
        .send({ role: 'admin' }); // Illegal role escalation to central admin!

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Role Escalation Blocked');
    });

    it('College administrator attempting to access Corporate-only endpoints is rejected with 403', async () => {
      const res = await request(app)
        .get('/api/v1/corporate/colleges')
        .set('Authorization', `Bearer ${psgToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // SUITE 4: UNATHENTICATED REJECTION & LOGOUT
  // -------------------------------------------------------------------------
  describe('Suite 4: Secure Logout & Session Invalidation', () => {
    it('Operations without token are rejected with 401 Authentication Required', async () => {
      const res = await request(app).get('/api/v1/college/students');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Logout terminates session cleanly', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${psgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
