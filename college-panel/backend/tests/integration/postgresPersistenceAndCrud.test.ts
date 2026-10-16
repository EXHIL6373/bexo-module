import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool } from '../../src/db/client';
import { DrizzlePostgresRepository } from '../../src/db/postgresRepository';
import * as schema from '../../src/db/schema';
import pg from 'pg';
import { env } from '../../src/config/env';

describe('Integration — PostgreSQL Live Persistence, Constraints & CRUD Lifecycle', () => {
  let repo: DrizzlePostgresRepository;
  const testCollegeId = 'clg-psg-01'; // Seeded institutional reference
  const probeStudentId = `stu-pg-${Date.now()}`;
  const probeRollNumber = `PG-${Date.now().toString().slice(-6)}`;
  const probeInviteId = `inv-pg-${Date.now()}`;
  const probeRequestId = `req-pg-${Date.now()}`;
  const probeAuditId = `aud-pg-${Date.now()}`;

  beforeAll(async () => {
    // Strict hard check for PostgreSQL availability: fails loudly if unreachable
    const ping = await Promise.race([
      db.execute(sql`SELECT 1 as alive`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connecting to Postgres')), 25000)),
    ]);
    if (!ping) {
      throw new Error('PostgreSQL readiness probe returned no response.');
    }
    repo = new DrizzlePostgresRepository();
  }, 30000);

  afterAll(async () => {
    try {
      // Ensure all test probe records are cleaned up
      await db.delete(schema.students).where(eq(schema.students.id, probeStudentId)).catch(() => {});
      await db.delete(schema.collegeInvitations).where(eq(schema.collegeInvitations.id, probeInviteId)).catch(() => {});
      await db.delete(schema.approvalRequests).where(eq(schema.approvalRequests.id, probeRequestId)).catch(() => {});
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.id, probeAuditId)).catch(() => {});
    } catch (_) {
      // Ignore cleanup error
    }
  });

  it('Verifies PostgreSQL connection and schema availability', async () => {
    const res: any = await db.execute(sql`SELECT current_database(), version()`);
    expect(res).toBeDefined();
    expect(res.rows || res).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 1. STUDENT CRUD & UNIQUE CONSTRAINT ENFORCEMENT
  // -------------------------------------------------------------------------
  it('Student CRUD: creates, retrieves by ID, updates, and enforces unique rollNumber constraint', async () => {

    // 1. Create student
    const created = await repo.createStudent({
      id: probeStudentId,
      collegeId: testCollegeId,
      name: 'Postgres Test Student',
      rollNumber: probeRollNumber,
      email: `pg.${Date.now()}@psgtech.edu`,
      department: 'Robotics',
      year: 3,
      batch: '2024-2028',
      accessStatus: 'ACTIVE',
      source: 'DIRECT',
    });
    expect(created).toBeDefined();
    expect(created.id).toBe(probeStudentId);

    // 2. Read by ID
    const fetched = await repo.getStudentById(probeStudentId, testCollegeId);
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('Postgres Test Student');
    expect(fetched?.rollNumber).toBe(probeRollNumber);

    // 3. Update student access status (Revocation lifecycle)
    const updated = await repo.updateStudent(probeStudentId, {
      accessStatus: 'REVOKED',
    });
    expect(updated.accessStatus).toBe('REVOKED');

    // 4. Verify update persisted in database
    const verifyUpdated = await repo.getStudentById(probeStudentId);
    expect(verifyUpdated?.accessStatus).toBe('REVOKED');

    // 5. Unique constraint enforcement: inserting duplicate rollNumber for same college must throw
    let duplicateFailed = false;
    try {
      await repo.createStudent({
        id: `stu-dup-${Date.now()}`,
        collegeId: testCollegeId,
        name: 'Duplicate Student',
        rollNumber: probeRollNumber, // Duplicate roll number
        email: `dup.${Date.now()}@psgtech.edu`,
        department: 'Robotics',
        year: 3,
        batch: '2024-2028',
        accessStatus: 'ACTIVE',
        source: 'DIRECT',
      });
    } catch (err: any) {
      duplicateFailed = true;
      // Postgres error 23505 is unique_violation
      expect(err.code === '23505' || err.message.toLowerCase().includes('unique') || err.message.toLowerCase().includes('duplicate')).toBe(true);
    }
    expect(duplicateFailed).toBe(true);
  }, 10000);

  // -------------------------------------------------------------------------
  // 2. INVITATION LIFECYCLE & HASH STORAGE
  // -------------------------------------------------------------------------
  it('Invitation lifecycle: stores hash, updates token on resend, and retrieves correctly', async () => {
    const initialTokenHash = `hash-init-${Date.now()}`;
    const resentTokenHash = `hash-resent-${Date.now()}`;

    // 1. Create invitation
    const invite = await repo.createInvitation({
      id: probeInviteId,
      collegeId: testCollegeId,
      fullName: 'Dr. Test Candidate',
      email: `candidate-${Date.now()}@psgtech.edu`,
      role: 'college_coordinator',
      token: initialTokenHash,
      tokenHash: initialTokenHash,
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      status: 'INVITED',
    });
    expect(invite).toBeDefined();
    expect(invite.id).toBe(probeInviteId);

    // 2. Retrieve by initial token hash
    const foundByInit = await repo.getInvitationByToken(initialTokenHash);
    expect(foundByInit).toBeDefined();
    expect(foundByInit?.id).toBe(probeInviteId);

    // 3. Resend simulation: update to new token hash
    await repo.updateInvitation(probeInviteId, {
      token: resentTokenHash,
      tokenHash: resentTokenHash,
    });

    // 4. Old token hash lookup returns null
    const oldLookup = await repo.getInvitationByToken(initialTokenHash);
    expect(oldLookup).toBeNull();

    // 5. New token hash lookup succeeds
    const newLookup = await repo.getInvitationByToken(resentTokenHash);
    expect(newLookup).toBeDefined();
    expect(newLookup?.id).toBe(probeInviteId);
  }, 10000);

  // -------------------------------------------------------------------------
  // 3. ATOMIC QUOTA TRANSACTION & QUOTA HISTORY
  // -------------------------------------------------------------------------
  it('Quota update: executes atomically and generates immutable audit entry in quota_history', async () => {
    const college = await repo.getCollegeById(testCollegeId);
    expect(college).toBeDefined();
    const originalQuota = college.quotaAllocated;
    const targetQuota = originalQuota + 50;

    // Execute atomic update
    const updatedCollege = await repo.updateQuota(
      testCollegeId,
      targetQuota,
      'PostgreSQL automated integration test allocation',
      'Integration Tester'
    );
    expect(updatedCollege.quotaAllocated).toBe(targetQuota);

    // Verify quota history entry exists in database
    const historyRows = await db
      .select()
      .from(schema.quotaHistory)
      .where(eq(schema.quotaHistory.collegeId, testCollegeId))
      .orderBy(sql`${schema.quotaHistory.timestamp} DESC`)
      .limit(1);

    expect(historyRows.length).toBeGreaterThan(0);
    expect(historyRows[0].newAllocated).toBe(targetQuota);
    expect(historyRows[0].reason).toBe('PostgreSQL automated integration test allocation');

    // Revert quota back to original
    await repo.updateQuota(
      testCollegeId,
      originalQuota,
      'PostgreSQL test revert',
      'Integration Tester'
    );
  }, 10000);

  // -------------------------------------------------------------------------
  // 4. APPROVAL REQUEST LIFECYCLE
  // -------------------------------------------------------------------------
  it('Approval Request: creates pending request, retrieves, and processes review decision', async () => {
    // 1. Create request
    const req = await repo.createRequest({
      id: probeRequestId,
      collegeId: testCollegeId,
      type: 'Quota Increase',
      deltaSeats: 100,
      targetTotal: 5100,
      status: 'Pending',
      submittedBy: 'Dr. Coordinator',
      reason: 'Additional laboratory seats for semester 5',
      details: { title: 'Semester 5 Quota Expansion' },
    });
    expect(req).toBeDefined();

    // 2. Query request
    const retrieved = await repo.getRequestById(probeRequestId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('Pending');

    // 3. Update request
    const updated = await repo.updateRequest(probeRequestId, {
      status: 'Approved',
      decisionReason: 'Verified laboratory allocation capacity',
      reviewedBy: 'Corporate Ops Admin',
      reviewedAt: new Date().toISOString(),
    });
    expect(updated.status).toBe('Approved');
    expect(updated.decisionReason).toBe('Verified laboratory allocation capacity');
  }, 10000);

  // -------------------------------------------------------------------------
  // 5. AUDIT LOG PERSISTENCE & SCHEMA COMPLIANCE
  // -------------------------------------------------------------------------
  it('Audit Log: records structured audit log with full column mappings and retrieves successfully', async () => {
    await repo.createAuditLog({
      id: probeAuditId,
      collegeId: testCollegeId,
      actorStaffId: 'usr-psg-admin',
      actorName: 'Prof. R. Venkatesh',
      actorRole: 'college_admin',
      action: 'TEST_PERSISTENCE_AUDIT',
      entity: 'Student',
      entityId: probeStudentId,
      entityName: 'Postgres Test Student',
      ip: '127.0.0.1',
      result: 'Success',
      reason: 'PostgreSQL audit persistence verification',
    });

    const logs = await repo.getAuditLogsByCollege(testCollegeId);
    expect(logs.length).toBeGreaterThan(0);
    const probeLog = logs.find((l: any) => l.id === probeAuditId);
    expect(probeLog).toBeDefined();
    expect(probeLog?.action).toBe('TEST_PERSISTENCE_AUDIT');
  }, 10000);

  // -------------------------------------------------------------------------
  // 6. PROCESS RESTART / FRESH POOL PERSISTENCE
  // -------------------------------------------------------------------------
  it('Persistence across client lifecycle: record written by Pool A persists and is read by fresh Pool B', async () => {
    const restartProbeId = `aud-restart-${Date.now()}`;

    // 1. Write record with primary repository
    await repo.createAuditLog({
      id: restartProbeId,
      collegeId: testCollegeId,
      actorStaffId: 'usr-psg-admin',
      actorName: 'Pool A Process',
      actorRole: 'college_admin',
      action: 'RESTART_PERSISTENCE_PROBE',
      entity: 'System',
      entityId: restartProbeId,
      entityName: 'Restart Probe Test',
      ip: '127.0.0.1',
      result: 'Success',
      reason: 'Written by Pool A',
    });

    // 2. Instantiate completely separate connection pool B (simulating cold process restart)
    const freshPool = new pg.Pool({
      connectionString: env.DATABASE_URL
        .replace(/([&?])channel_binding=[^&]+(&|$)/g, '$1')
        .replace(/\?&/, '?')
        .replace(/[?&]$/, ''),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      const client = await freshPool.connect();
      try {
        const queryRes = await client.query(
          'SELECT id, action, reason FROM audit_logs WHERE id = $1',
          [restartProbeId]
        );
        expect(queryRes.rows.length).toBe(1);
        expect(queryRes.rows[0].id).toBe(restartProbeId);
        expect(queryRes.rows[0].action).toBe('RESTART_PERSISTENCE_PROBE');
        expect(queryRes.rows[0].reason).toBe('Written by Pool A');

        // Cleanup probe row
        await client.query('DELETE FROM audit_logs WHERE id = $1', [restartProbeId]);
      } finally {
        client.release();
      }
    } finally {
      await freshPool.end();
    }
  }, 15000);
});
