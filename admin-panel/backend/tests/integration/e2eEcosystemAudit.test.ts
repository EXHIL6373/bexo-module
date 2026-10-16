import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { app as adminApp } from '../../src/app';
import { env } from '../../src/config/env';
import { CollegePanelClient } from '../../src/integrations/collegePanelClient';
import { MobileAppClient } from '../../src/integrations/mobileAppClient';
import { generateServiceToken } from '../../src/integrations/serviceAuth';

// Dynamically import college app to prevent static environment overrides
let collegeApp: any;
let collegeServer: http.Server;
let collegePort: number;

describe('Ecosystem Audit — Controlled End-to-End Cross-Module Integration', () => {
  let adminToken: string;
  let collegeServiceToken: string;

  beforeAll(async () => {
    // Force in-memory store for college backend during controlled local test
    process.env.USE_POSTGRES_STORE = 'false';
    const collegeModule = await import('../../../../college-panel/backend/src/app');
    collegeApp = collegeModule.app;

    // Start college app on ephemeral port for real HTTP service-to-service roundtrip
    collegeServer = http.createServer(collegeApp);
    await new Promise<void>((resolve) => collegeServer.listen(0, resolve));
    const address = collegeServer.address() as any;
    collegePort = address.port;
  });

  afterAll(async () => {
    if (collegeServer) {
      await new Promise<void>((resolve) => collegeServer.close(() => resolve()));
    }
  });

  // =========================================================================
  // 1. CORPORATE ADMIN AUTHENTICATION & MULTI-TENANT PERIMETER GUARDS
  // =========================================================================
  describe('Phase 3.1: Corporate Admin Boundary Verification', () => {
    it('Authenticates corporate super_admin successfully and returns signed JWT with sessionVersion', async () => {
      const res = await request(adminApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'kavinbalaji@atbexo.com',
          password: 'AdminPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('super_admin');
      expect(res.body.data.user.collegeId).toBeNull();

      adminToken = res.body.data.token;
    });

    it('Rejects invalid password with generic 401 error', async () => {
      const res = await request(adminApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'kavinbalaji@atbexo.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Rejects college admin credentials at corporate login boundary with 403 Forbidden', async () => {
      const res = await request(adminApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'venkatesh.r@psgtech.edu',
          password: 'ValidPassword123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Institutional Access Restricted');
    });

    it('Rejects unauthenticated requests to protected corporate routes with 401', async () => {
      const res = await request(adminApp).get('/api/v1/colleges');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Allows authenticated corporate administrator to view college directory', async () => {
      const res = await request(adminApp)
        .get('/api/v1/colleges')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. COLLEGE ADMIN AUTHENTICATION & INSTITUTIONAL ISOLATION
  // =========================================================================
  describe('Phase 3.2: Institutional College Boundary Verification', () => {
    it('Authenticates college administrator at College Backend with verified collegeId', async () => {
      const res = await request(collegeApp)
        .post('/api/v1/auth/college-login')
        .send({
          email: 'venkatesh.r@psgtech.edu',
          password: 'ValidPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.collegeId).toBe('clg-psg-01');
      expect(res.body.data.token).toBeDefined();
    });

    it('Corporate administrator login is strictly rejected with 403 at College Portal boundary', async () => {
      const res = await request(collegeApp)
        .post('/api/v1/auth/college-login')
        .send({
          email: 'kavinbalaji@atbexo.com',
          password: 'AdminPassword123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Institutional Access Restricted');
    });
  });

  // =========================================================================
  // 3. CROSS-BACKEND SERVICE-TO-SERVICE LIFECYCLE SYNCHRONIZATION
  // =========================================================================
  describe('Phase 4: Cross-Module Service Integration via Real HTTP Calls', () => {
    let client: CollegePanelClient;

    beforeAll(() => {
      client = new CollegePanelClient(`http://127.0.0.1:${collegePort}`, 10000);
      collegeServiceToken = generateServiceToken('bexo-college-panel', ['lifecycle:sync']);
    });

    it('CollegePanelClient performs health check against live College Backend HTTP server', async () => {
      const health = await client.checkHealth();
      expect(health.success).toBe(true);
      expect(health.statusCode).toBe(200);
    });

    it('Rejects unauthenticated call to /lifecycle-sync on College Backend with 401', async () => {
      const res = await request(collegeApp)
        .post('/api/v1/corporate/colleges/clg-psg-01/lifecycle-sync')
        .send({
          status: 'Suspended',
          reason: 'Unauthenticated test',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Rejects forged service token with invalid signature with 401', async () => {
      const forgedToken = jwt.sign(
        { iss: 'bexo-admin-panel', aud: 'bexo-college-panel', role: 'corporate_sync' },
        'tampered-secret-key-32-chars-minimum!',
        { algorithm: 'HS256' }
      );

      const res = await request(collegeApp)
        .post('/api/v1/corporate/colleges/clg-psg-01/lifecycle-sync')
        .set('Authorization', `Bearer ${forgedToken}`)
        .send({
          status: 'Suspended',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Executes end-to-end college suspension synchronization via CollegePanelClient', async () => {
      const syncResult = await client.syncCollegeLifecycle({
        collegeId: 'clg-psg-01',
        status: 'Suspended',
        dashboardAccess: false,
        quotaAllocated: 5000,
        reason: 'Compliance review suspension dispatched from Central Admin Panel',
        updatedAt: new Date().toISOString(),
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.statusCode).toBe(200);
      expect(syncResult.data).toBeDefined();

      const data = (syncResult.data as any).data;
      expect(data.collegeId).toBe('clg-psg-01');
      expect(data.status).toBe('Suspended');
      expect(data.dashboardAccess).toBe(false);
    });

    it('Executes end-to-end college reactivation & quota expansion via CollegePanelClient', async () => {
      const syncResult = await client.syncCollegeLifecycle({
        collegeId: 'clg-psg-01',
        status: 'Active',
        dashboardAccess: true,
        quotaAllocated: 7500,
        reason: 'Reactivation and quota increase approved by Corporate Admin',
        updatedAt: new Date().toISOString(),
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.statusCode).toBe(200);

      const data = (syncResult.data as any).data;
      expect(data.collegeId).toBe('clg-psg-01');
      expect(data.status).toBe('Active');
      expect(data.dashboardAccess).toBe(true);
      expect(data.quotaAllocated).toBe(7500);
    });
  });

  // =========================================================================
  // 4. DOWNSTREAM MOBILE RESILIENCY & NON-BLOCKING ISOLATION
  // =========================================================================
  describe('Phase 5: External Mobile Backend Outage Handling', () => {
    it('MobileAppClient handles offline mobile backend safely without throwing uncaught exceptions', async () => {
      // Connect to non-listening port to simulate mobile backend outage
      const offlineMobileClient = new MobileAppClient('http://127.0.0.1:59997', 500);

      const health = await offlineMobileClient.checkHealth();
      expect(health.success).toBe(false);
      expect(health.statusCode).toBe(503);

      const sync = await offlineMobileClient.syncStudentEntitlement({
        studentId: 'stu-psg-001',
        collegeId: 'clg-psg-01',
        rollNumber: '21CS001',
        entitlementStatus: 'Active',
      });

      expect(sync.success).toBe(false);
      expect(sync.statusCode).toBe(504);
    });
  });
});
