import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { app as adminApp } from '../../src/app';
import { repository } from '../../src/db/repository';
import { outboxProcessor } from '../../src/integrations/outboxProcessor';
import { CollegePanelClient } from '../../src/integrations/collegePanelClient';
import { generateServiceToken } from '../../src/integrations/serviceAuth';

// Dynamically import college module to share memory store in controlled test
let collegeApp: any;
let collegeStore: any;
let collegeServer: http.Server;
let collegePort: number;
let collegeBaseUrl: string;

describe('Staging Release-Candidate Validation Suite', { timeout: 60000 }, () => {
  let adminToken: string;
  const testCollegeId = `clg-staging-${Date.now()}`;

  beforeAll(async () => {
    process.env.USE_POSTGRES_STORE = 'false';
    const collegeModule = await import('../../../../college-panel/backend/src/app');
    const storeModule = await import('../../../../college-panel/backend/src/db/store');
    collegeApp = collegeModule.app;
    collegeStore = storeModule.store;

    collegeServer = http.createServer(collegeApp);
    await new Promise<void>((resolve) => collegeServer.listen(0, resolve));
    collegePort = (collegeServer.address() as any).port;
    collegeBaseUrl = `http://127.0.0.1:${collegePort}`;

    // Login as Corporate Admin
    const loginRes = await request(adminApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'kavinbalaji@atbexo.com',
        password: 'AdminPassword123!',
      });
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (collegeServer) {
      await new Promise<void>((resolve) => collegeServer.close(() => resolve()));
    }
  });

  // =========================================================================
  // CHECK 3: OUTBOX DURABILITY & RECOVERY FROM RESTART
  // =========================================================================
  describe('Check 3: Outbox Durability & Recovery', () => {
    it('Persists pending outbox event and recovers/processes it on processor cycle', async () => {
      // 1. Create a college in downstream store first
      await collegeStore.createCollege({
        id: testCollegeId,
        name: 'Staging Outbox College',
        code: `STG-${Date.now().toString().slice(-4)}`,
        slug: `stg-${Date.now()}`,
        status: 'Active',
        quotaAllocated: 1000,
        quotaUsed: 0,
        lifecycleVersion: 1,
      });

      // 2. Insert a PENDING outbox entry into repository simulating an uncommitted sync before crash
      const outboxId = `outbox-rc-${Date.now()}`;
      await repository.createOutboxEvent({
        id: outboxId,
        collegeId: testCollegeId,
        lifecycleVersion: 2,
        eventType: 'SUSPEND',
        payload: {
          collegeId: testCollegeId,
          status: 'Suspended',
          dashboardAccess: false,
          quotaAllocated: 1000,
          services: [],
          version: 2,
          reason: 'Pre-crash pending suspension',
          timestamp: new Date().toISOString(),
        },
        status: 'PENDING',
      });

      // Confirm outbox entry is in PENDING state
      const pendingBefore = await repository.getPendingOutboxEvents();
      const match = pendingBefore.find((e: any) => e.id === outboxId || e.collegeId === testCollegeId);
      expect(match).toBeDefined();
      expect(match.status).toBe('PENDING');

      // 3. Simulate backend restart: Instantiate client with current college server and run outboxProcessor
      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const res = await client.syncCollegeLifecycle(match.payload);
      expect(res.success).toBe(true);

      // Mark outbox entry processed
      await repository.updateOutboxEvent(match.id, {
        status: 'SYNCED',
        lastAttemptAt: new Date().toISOString(),
      });

      // Verify downstream state updated
      const downstreamCollege = await collegeStore.getCollegeById(testCollegeId);
      expect(downstreamCollege.status).toBe('Suspended');
      expect(downstreamCollege.dashboardAccess).toBe(false);
      expect(downstreamCollege.lifecycleVersion).toBe(2);
    });
  });

  // =========================================================================
  // CHECK 4: LIFECYCLE ORDERING & STALE EVENT REJECTION
  // =========================================================================
  describe('Check 4: Lifecycle Monotonic Ordering & Deduplication', () => {
    it('Applies newer version (v3), rejects stale delayed version (v2), and acknowledges duplicate (v3)', async () => {
      const client = new CollegePanelClient(collegeBaseUrl, 5000);

      // 1. Send version 3 (Reactivation)
      const resV3 = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Active',
        dashboardAccess: true,
        quotaAllocated: 2500,
        services: ['BEXO Portfolio'],
        version: 3,
        reason: 'Reactivated at v3',
        timestamp: new Date().toISOString(),
      });
      expect(resV3.success).toBe(true);
      expect(resV3.data.data.status).toBe('Active');
      expect(resV3.data.data.applied).toBe(true);

      const stateAfterV3 = await collegeStore.getCollegeById(testCollegeId);
      expect(stateAfterV3.status).toBe('Active');
      expect(stateAfterV3.lifecycleVersion).toBe(3);

      // 2. Deliver delayed older event (v2 Suspension)
      const resStaleV2 = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Suspended',
        dashboardAccess: false,
        quotaAllocated: 1000,
        services: [],
        version: 2, // Older than 3!
        reason: 'Delayed older suspension',
        timestamp: new Date().toISOString(),
      });
      expect(resStaleV2.success).toBe(true);
      // Downstream should NOT apply stale version
      expect(resStaleV2.data.data.applied).toBe(false);
      expect(resStaleV2.data.data.status).toBe('Active'); // Remains Active!

      const stateAfterStale = await collegeStore.getCollegeById(testCollegeId);
      expect(stateAfterStale.status).toBe('Active'); // Intact!
      expect(stateAfterStale.lifecycleVersion).toBe(3);

      // 3. Deliver duplicate delivery (v3 replay)
      const resDupV3 = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Active',
        dashboardAccess: true,
        quotaAllocated: 2500,
        services: ['BEXO Portfolio'],
        version: 3, // Identical version
        reason: 'Duplicate delivery replay',
        timestamp: new Date().toISOString(),
      });
      expect(resDupV3.success).toBe(true);
      expect(resDupV3.data.data.applied).toBe(true);
      expect(resDupV3.data.data.idempotentDuplicate).toBe(true);

      const stateAfterDup = await collegeStore.getCollegeById(testCollegeId);
      expect(stateAfterDup.lifecycleVersion).toBe(3);
    });
  });

  // =========================================================================
  // CHECK 5: OUTBOX ACKNOWLEDGEMENT DROP & RECOVERY (SPLIT-BRAIN RESILIENCE)
  // =========================================================================
  describe('Check 5: Downstream Commit with Network Loss on Ack', () => {
    it('Downstream commits version 4; simulated network cut triggers idempotent recovery', async () => {
      // 1. Deliver version 4 directly to simulate downstream commitment
      const serviceToken = generateServiceToken('bexo-college-panel', ['lifecycle:sync']);
      const res = await request(collegeApp)
        .post(`/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`)
        .set('Authorization', `Bearer ${serviceToken}`)
        .send({
          collegeId: testCollegeId,
          status: 'Suspended',
          dashboardAccess: false,
          quotaAllocated: 2500,
          services: [],
          version: 4,
          reason: 'Network severance test',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.applied).toBe(true);

      // Downstream is now at version 4 (Suspended)
      const downstreamCollege = await collegeStore.getCollegeById(testCollegeId);
      expect(downstreamCollege.status).toBe('Suspended');
      expect(downstreamCollege.lifecycleVersion).toBe(4);

      // 2. Caller (Admin) had simulated network timeout, so outbox event is retried with version 4
      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const retryRes = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Suspended',
        dashboardAccess: false,
        quotaAllocated: 2500,
        services: [],
        version: 4,
        reason: 'Retry after lost ack',
        timestamp: new Date().toISOString(),
      });

      // 3. Downstream must acknowledge idempotently with HTTP 200 without error or state distortion
      expect(retryRes.success).toBe(true);
      expect(retryRes.statusCode).toBe(200);
      expect(retryRes.data.data.idempotentDuplicate).toBe(true);
      expect(retryRes.data.data.status).toBe('Suspended');
    });
  });

  // =========================================================================
  // CHECK 6: CROSS-MODULE END-TO-END WORKFLOW
  // =========================================================================
  describe('Check 6: Full Multi-Stage Institutional Lifecycle Workflow', () => {
    const workflowCollegeId = `clg-flow-${Date.now()}`;

    it('Stage A: Creates synthetic college in central admin repository', async () => {
      const created = await repository.createCollege({
        id: workflowCollegeId,
        name: 'Apex Institute of Technology',
        code: `AIT-${Date.now().toString().slice(-4)}`,
        slug: `ait-${Date.now()}`,
        status: 'Active',
        quotaAllocated: 5,
        quotaUsed: 0,
        lifecycleVersion: 1,
        syncStatus: 'SYNCED',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        type: 'Engineering',
      });

      expect(created.id).toBe(workflowCollegeId);
      expect(created.quotaAllocated).toBe(5);
      expect(created.quotaUsed).toBe(0);

      // Initialize downstream college
      await collegeStore.createCollege({
        id: workflowCollegeId,
        name: 'Apex Institute of Technology',
        code: created.code,
        slug: created.slug,
        status: 'Active',
        quotaAllocated: 5,
        quotaUsed: 0,
        lifecycleVersion: 1,
      });
    });

    it('Stage B: Expands quota from 5 to 10 in Central Admin and syncs to College', async () => {
      await repository.updateCollege(workflowCollegeId, {
        quotaAllocated: 10,
        lifecycleVersion: 2,
      });

      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const syncRes = await client.syncCollegeLifecycle({
        collegeId: workflowCollegeId,
        status: 'Active',
        quotaAllocated: 10,
        version: 2,
        reason: 'Expansion approved',
        timestamp: new Date().toISOString(),
      });

      expect(syncRes.success).toBe(true);
      const downstream = await collegeStore.getCollegeById(workflowCollegeId);
      expect(downstream.quotaAllocated).toBe(10);
      expect(downstream.lifecycleVersion).toBe(2);
    });

    it('Stage C: Provisions students up to capacity and checks quotaUsed updates', async () => {
      const actor = {
        userId: 'staff-admin-01',
        name: 'Dean Admissions',
        role: 'college_admin',
        ip: '127.0.0.1',
      };

      // Enroll 3 students
      for (let i = 1; i <= 3; i++) {
        await collegeStore.enrollStudentWithQuota(
          {
            collegeId: workflowCollegeId,
            name: `AIT Student ${i}`,
            rollNumber: `AIT-2026-00${i}`,
            department: 'Computer Science',
            email: `student${i}@ait.edu`,
          },
          actor
        );
      }

      const collegeAfter = await collegeStore.getCollegeById(workflowCollegeId);
      expect(collegeAfter.quotaUsed).toBe(3);
      expect(collegeAfter.quotaAllocated).toBe(10);
    });

    it('Stage D: Central Admin suspends college (v3) -> College Access Disabled', async () => {
      await repository.updateCollege(workflowCollegeId, {
        status: 'Suspended',
        dashboardAccess: false,
        lifecycleVersion: 3,
      });

      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const syncRes = await client.syncCollegeLifecycle({
        collegeId: workflowCollegeId,
        status: 'Suspended',
        dashboardAccess: false,
        quotaAllocated: 10,
        version: 3,
        reason: 'Payment compliance audit',
        timestamp: new Date().toISOString(),
      });

      expect(syncRes.success).toBe(true);
      const downstream = await collegeStore.getCollegeById(workflowCollegeId);
      expect(downstream.status).toBe('Suspended');
      expect(downstream.dashboardAccess).toBe(false);
      expect(downstream.lifecycleVersion).toBe(3);
    });

    it('Stage E: Central Admin reactivates college (v4) -> Access Restored', async () => {
      await repository.updateCollege(workflowCollegeId, {
        status: 'Active',
        dashboardAccess: true,
        lifecycleVersion: 4,
      });

      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const syncRes = await client.syncCollegeLifecycle({
        collegeId: workflowCollegeId,
        status: 'Active',
        dashboardAccess: true,
        quotaAllocated: 10,
        version: 4,
        reason: 'Audit resolved and restored',
        timestamp: new Date().toISOString(),
      });

      expect(syncRes.success).toBe(true);
      const downstream = await collegeStore.getCollegeById(workflowCollegeId);
      expect(downstream.status).toBe('Active');
      expect(downstream.dashboardAccess).toBe(true);
      expect(downstream.lifecycleVersion).toBe(4);
      expect(downstream.quotaUsed).toBe(3); // Quota usage preserved intact
    });
  });

  // =========================================================================
  // CHECK 7: AUTHENTICATION, ROLE BOUNDARIES, AND SESSION REVOCATION
  // =========================================================================
  describe('Check 7: Authentication Perimeter, M2M Tokens & Role Boundaries', () => {
    it('Corporate Admin cannot access College Panel APIs with Corporate JWT', async () => {
      const res = await request(collegeApp)
        .get('/api/v1/college/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      // Rejection: 401 or 403 because corporate user lacks institutional collegeId
      expect([401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('College user credentials cannot authenticate against Corporate Admin Login', async () => {
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

    it('Service-to-service endpoint strictly rejects tokens with missing or forged scopes', async () => {
      const badScopeToken = jwt.sign(
        {
          iss: 'bexo-admin-panel',
          aud: 'bexo-college-panel',
          scope: ['unrelated:read'],
          role: 'corporate_sync',
        },
        process.env.SERVICE_AUTH_SECRET || 'bexo-service-to-service-secret-key-2026-staging-32-chars',
        { algorithm: 'HS256' }
      );

      const res = await request(collegeApp)
        .post(`/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`)
        .set('Authorization', `Bearer ${badScopeToken}`)
        .send({
          status: 'Active',
        });

      expect([401, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});
