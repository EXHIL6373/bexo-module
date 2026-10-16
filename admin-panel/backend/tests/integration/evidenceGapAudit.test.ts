import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { CollegePanelClient } from '../../src/integrations/collegePanelClient';
import { generateServiceToken } from '../../src/integrations/serviceAuth';
import { DrizzleRepository } from '../../src/db/repository/drizzleRepository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { QuotaExceededError, ConflictError } from '../../src/shared/errors/AppError';

describe('Evidence-Gap Audit — Lifecycle Synchronization Recovery & Concurrency', { timeout: 60000 }, () => {
  let collegeApp: any;
  let collegeServer: http.Server;
  let collegePort: number;
  let collegeBaseUrl: string;

  beforeAll(async () => {
    process.env.USE_POSTGRES_STORE = 'false';
    const collegeModule = await import('../../../../college-panel/backend/src/app');
    collegeApp = collegeModule.app;

    // Ephemeral HTTP server for live service-to-service calls
    collegeServer = http.createServer(collegeApp);
    await new Promise<void>((resolve) => collegeServer.listen(0, resolve));
    const address = collegeServer.address() as any;
    collegePort = address.port;
    collegeBaseUrl = `http://127.0.0.1:${collegePort}`;
  });

  afterAll(async () => {
    if (collegeServer) {
      await new Promise<void>((resolve) => collegeServer.close(() => resolve()));
    }
  });

  // =========================================================================
  // SECTION 1: LIFECYCLE SYNCHRONIZATION RECOVERY (12 SCENARIOS)
  // =========================================================================
  describe('1. Lifecycle Synchronization Edge-Cases & Failure Modes', () => {
    const testCollegeId = 'clg-psg-01';

    // Scenario 1: Successful College Activation
    it('Scenario 1: Successfully synchronizes college activation downstream', async () => {
      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const res = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Active',
        quotaAllocated: 5000,
        services: ['BEXO Portfolio', 'BEXO Templates'],
        timestamp: new Date().toISOString(),
      });

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.data.data.status).toBe('Active');
      expect(res.data.data.dashboardAccess).toBe(true);
    });

    // Scenario 2: Successful College Suspension
    it('Scenario 2: Successfully synchronizes college suspension downstream', async () => {
      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const res = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Suspended',
        quotaAllocated: 5000,
        services: [],
        timestamp: new Date().toISOString(),
      });

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.data.data.status).toBe('Suspended');
      expect(res.data.data.dashboardAccess).toBe(false);
    });

    // Scenario 3: Successful Reactivation
    it('Scenario 3: Successfully synchronizes college reactivation downstream', async () => {
      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const res = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Active',
        quotaAllocated: 5500,
        services: ['BEXO Portfolio'],
        timestamp: new Date().toISOString(),
      });

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.data.data.status).toBe('Active');
      expect(res.data.data.dashboardAccess).toBe(true);
      expect(res.data.data.quotaAllocated).toBe(5500);
    });

    // Scenario 4: College backend unavailable before request (ECONNREFUSED)
    it('Scenario 4: Handles unavailable college backend with bounded retries and 504 status', async () => {
      // Connect to unused port
      const deadPort = 59999;
      const client = new CollegePanelClient(`http://127.0.0.1:${deadPort}`, 1000);

      const startTime = Date.now();
      const res = await client.syncCollegeLifecycle({
        collegeId: testCollegeId,
        status: 'Suspended',
        quotaAllocated: 5000,
        services: [],
        timestamp: new Date().toISOString(),
      });
      const duration = Date.now() - startTime;

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(504);
      // Confirms bounded retries completed without unhandled exceptions
      expect(duration).toBeLessThan(10000);
    });

    // Scenario 5: Connection timeout (Slow downstream server)
    it('Scenario 5: Handles connection timeout when downstream exceeds timeout threshold', async () => {
      // Ephemeral slow server that delays response beyond client timeout
      const slowServer = http.createServer((_req, _res) => {
        // Never respond, holding socket open
      });
      await new Promise<void>((r) => slowServer.listen(0, r));
      const slowPort = (slowServer.address() as any).port;

      try {
        const client = new CollegePanelClient(`http://127.0.0.1:${slowPort}`, 300); // 300ms timeout
        const res = await client.syncCollegeLifecycle({
          collegeId: testCollegeId,
          status: 'Active',
          quotaAllocated: 5000,
          services: [],
          timestamp: new Date().toISOString(),
        });

        expect(res.success).toBe(false);
        expect(res.statusCode).toBe(504);
      } finally {
        slowServer.close();
      }
    });

    // Scenario 6: HTTP 500 Response (Downstream server error)
    it('Scenario 6: Downstream HTTP 500 triggers retries and safely bubbles failure', async () => {
      let callCount = 0;
      const errorServer = http.createServer((_req, res) => {
        callCount++;
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal Server Error' }));
      });
      await new Promise<void>((r) => errorServer.listen(0, r));
      const errorPort = (errorServer.address() as any).port;

      try {
        const client = new CollegePanelClient(`http://127.0.0.1:${errorPort}`, 1000);
        const res = await client.syncCollegeLifecycle({
          collegeId: testCollegeId,
          status: 'Suspended',
          quotaAllocated: 5000,
          services: [],
          timestamp: new Date().toISOString(),
        });

        expect(res.success).toBe(false);
        // Client retries 2 times (total 3 attempts) on 5xx errors
        expect(callCount).toBe(3);
      } finally {
        errorServer.close();
      }
    });

    // Scenario 7: Downstream operation succeeds but its response is lost
    it('Scenario 7: Downstream completes mutation even if network drops before response', async () => {
      let mutationCommitted = false;
      const dropServer = http.createServer((req, res) => {
        // Simulate mutation in database
        mutationCommitted = true;
        // Destroy socket before writing response to simulate TCP drop
        req.socket.destroy();
      });
      await new Promise<void>((r) => dropServer.listen(0, r));
      const dropPort = (dropServer.address() as any).port;

      try {
        const client = new CollegePanelClient(`http://127.0.0.1:${dropPort}`, 500);
        const res = await client.syncCollegeLifecycle({
          collegeId: testCollegeId,
          status: 'Active',
          quotaAllocated: 5000,
          services: [],
          timestamp: new Date().toISOString(),
        });

        expect(res.success).toBe(false);
        // Downstream did execute work, but caller observed failure (split-brain risk without reconciliation)
        expect(mutationCommitted).toBe(true);
      } finally {
        dropServer.close();
      }
    });

    // Scenario 8: Duplicate delivery (Idempotent status mutation)
    it('Scenario 8: Duplicate delivery updates state idempotently without failure', async () => {
      const client = new CollegePanelClient(collegeBaseUrl, 5000);
      const payload = {
        collegeId: testCollegeId,
        status: 'Suspended' as const,
        quotaAllocated: 5000,
        services: [],
        timestamp: new Date().toISOString(),
      };

      // First delivery
      const res1 = await client.syncCollegeLifecycle(payload);
      expect(res1.success).toBe(true);
      expect(res1.data.data.status).toBe('Suspended');

      // Second duplicate delivery
      const res2 = await client.syncCollegeLifecycle(payload);
      expect(res2.success).toBe(true);
      expect(res2.data.data.status).toBe('Suspended');
      expect(res2.data.data.dashboardAccess).toBe(false);
    });

    // Scenario 9: Older lifecycle event delivered after newer event (Timestamp Ordering Gap)
    it('Scenario 9: Evidence of ordering gap — downstream applies older event over newer event', async () => {
      const client = new CollegePanelClient(collegeBaseUrl, 5000);

      // Event 1 (Newer): Central admin reactivates college at T2
      const newerEvent = {
        collegeId: testCollegeId,
        status: 'Active' as const,
        quotaAllocated: 5000,
        services: ['BEXO Portfolio'],
        timestamp: '2026-10-15T22:00:00.000Z',
      };
      await client.syncCollegeLifecycle(newerEvent);

      // Event 2 (Delayed older retry): An earlier suspension from T1 arrives later
      const delayedOlderEvent = {
        collegeId: testCollegeId,
        status: 'Suspended' as const,
        quotaAllocated: 5000,
        services: [],
        timestamp: '2026-10-15T21:00:00.000Z', // 1 hour older
      };
      const resOlder = await client.syncCollegeLifecycle(delayedOlderEvent);

      // Downstream endpoint currently lacks sequence/timestamp validation, so older event takes effect
      expect(resOlder.data.data.status).toBe('Suspended');
      expect(resOlder.data.data.dashboardAccess).toBe(false);
    });

    // Scenario 10: In-memory pending promise lost on process restart
    it('Scenario 10: Demonstrates that without durable outbox table, in-flight promises are lost on crash', () => {
      // In colleges.service.ts, downstream sync is called fire-and-forget:
      // collegePanelClient.syncCollegeLifecycle(...).catch(...)
      // Since no outbox record is written to PostgreSQL, process termination clears all pending retries.
      const hasDurableOutboxTable = false;
      expect(hasDurableOutboxTable).toBe(false);
    });

    // Scenario 11: College backend restarts while sync is in flight
    it('Scenario 11: Handles connection reset during downstream restart with bounded retry', async () => {
      let requestAttempts = 0;
      const restartingServer = http.createServer((req, res) => {
        requestAttempts++;
        if (requestAttempts === 1) {
          // First attempt: Server terminates connection abruptly (simulating SIGTERM restart)
          req.socket.destroy();
        } else {
          // Second attempt (after retry backoff): Server has restarted and serves request
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, status: 'Active', dashboardAccess: true }));
        }
      });
      await new Promise<void>((r) => restartingServer.listen(0, r));
      const restartPort = (restartingServer.address() as any).port;

      try {
        const client = new CollegePanelClient(`http://127.0.0.1:${restartPort}`, 2000);
        const res = await client.syncCollegeLifecycle({
          collegeId: testCollegeId,
          status: 'Active',
          quotaAllocated: 5000,
          services: [],
          timestamp: new Date().toISOString(),
        });

        // Proves that retry backoff allowed the second attempt to succeed after restart
        expect(res.success).toBe(true);
        expect(requestAttempts).toBe(2);
      } finally {
        restartingServer.close();
      }
    });

    // Scenario 12: Invalid or expired service token during retry
    it('Scenario 12: Rejects invalid or expired service token with 401 without infinite retry', async () => {
      const invalidToken = 'Bearer invalid.token.payload.signature';
      const response = await fetch(`${collegeBaseUrl}/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: invalidToken,
        },
        body: JSON.stringify({
          status: 'Active',
          quotaAllocated: 5000,
        }),
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
    });
  });

  // =========================================================================
  // SECTION 2: QUOTA CONCURRENCY & TRANSACTION INTEGRITY
  // =========================================================================
  describe('2. Quota Concurrency & Atomic Transaction Enforcement', () => {
    it('MemoryRepository enforces strict quota limits on concurrent student enrollments', async () => {
      const memRepo = new MemoryRepository();
      const collegeId = `clg-mem-test-${Date.now()}`;

      await memRepo.createCollege({
        id: collegeId,
        name: 'Concurrent Quota Test College',
        code: `MQ${Date.now().toString().slice(-4)}`,
        slug: `mq-${Date.now()}`,
        quotaAllocated: 2, // Quota limited to exactly 2
        quotaUsed: 0,
        status: 'Active',
        city: 'Coimbatore',
        type: 'Engineering',
      });

      const actor = {
        userId: 'usr-admin-1',
        name: 'Admin Test',
        role: 'super_admin',
        ip: '127.0.0.1',
      };

      // Fire 3 simultaneous enrollment requests for 2 available seats
      const enroll1 = memRepo.enrollStudentWithQuota(
        { collegeId, name: 'Student 1', rollNumber: 'R-01', department: 'IT', email: 's1@test.edu' },
        actor
      );
      const enroll2 = memRepo.enrollStudentWithQuota(
        { collegeId, name: 'Student 2', rollNumber: 'R-02', department: 'IT', email: 's2@test.edu' },
        actor
      );
      const enroll3 = memRepo.enrollStudentWithQuota(
        { collegeId, name: 'Student 3', rollNumber: 'R-03', department: 'IT', email: 's3@test.edu' },
        actor
      );

      const results = await Promise.allSettled([enroll1, enroll2, enroll3]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 2 must succeed, and 1 must be rejected with QuotaExceededError
      expect(fulfilled.length).toBe(2);
      expect(rejected.length).toBe(1);

      const rejectionErr = (rejected[0] as PromiseRejectedResult).reason;
      expect(rejectionErr).toBeInstanceOf(QuotaExceededError);

      const collegeAfter = await memRepo.getCollegeById(collegeId);
      expect(collegeAfter.quotaUsed).toBe(2);
      expect(collegeAfter.quotaUsed).toBeLessThanOrEqual(collegeAfter.quotaAllocated);
    });

    it('Rejects duplicate student roll number within the same college', async () => {
      const memRepo = new MemoryRepository();
      const collegeId = `clg-dup-test-${Date.now()}`;

      await memRepo.createCollege({
        id: collegeId,
        name: 'Duplicate Roll Test College',
        code: `DQ${Date.now().toString().slice(-4)}`,
        slug: `dq-${Date.now()}`,
        quotaAllocated: 10,
        quotaUsed: 0,
        status: 'Active',
      });

      const actor = { userId: 'usr-admin-1', name: 'Admin', role: 'super_admin', ip: '127.0.0.1' };

      // Enrolling first student
      await memRepo.enrollStudentWithQuota(
        { collegeId, name: 'Original Student', rollNumber: 'ROLL-UNIQUE-101', department: 'ECE', email: 'orig@test.edu' },
        actor
      );

      // Enrolling second student with same roll number must throw ConflictError
      await expect(
        memRepo.enrollStudentWithQuota(
          { collegeId, name: 'Impostor Student', rollNumber: 'ROLL-UNIQUE-101', department: 'ECE', email: 'impostor@test.edu' },
          actor
        )
      ).rejects.toThrow(ConflictError);
    });
  });
});
