import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DrizzleRepository } from '../../src/db/repository/drizzleRepository';
import { db, pool, closePool } from '../../src/db/client';
import { hashToken, generateSecureToken } from '../../src/shared/utils/tokens';
import { QuotaExceededError, ConflictError } from '../../src/shared/errors/AppError';
import { sql } from 'drizzle-orm';
import * as schema from '../../src/db/schema';

describe('PostgreSQL — Transactional Concurrency & Integrity on Neon DB', { timeout: 90000 }, () => {
  let repo: DrizzleRepository;

  beforeAll(async () => {
    repo = new DrizzleRepository();
  });

  afterAll(async () => {
    // Note: Do not close pool here if other tests need it, or let vitest process exit cleanly
  });

  it('Guarantees concurrent student creation CANNOT exceed college quota in PostgreSQL', async () => {
    // 1. Create a dedicated test college with quota = 2
    const collegeId = `clg-tx-test-${Date.now()}`;
    await repo.createCollege({
      id: collegeId,
      name: 'Transaction Concurrency Test Institute',
      code: `TXC${Date.now().toString().slice(-4)}`,
      slug: `txc-${Date.now()}`,
      quotaAllocated: 2,
      quotaUsed: 0,
      status: 'Active',
      city: 'Coimbatore',
      type: 'Engineering',
    });

    const actor = {
      userId: 'usr-admin-tx',
      name: 'TX Test Admin',
      role: 'super_admin',
      ip: '127.0.0.1',
    };

    // 2. Fire 3 concurrent enrollment requests for quota = 2
    const student1 = repo.enrollStudentWithQuota(
      {
        collegeId,
        name: 'Concurrent Student 1',
        rollNumber: 'ROLL-001',
        department: 'CSE',
        email: `student1.${Date.now()}@txc.edu`,
      },
      actor
    );

    const student2 = repo.enrollStudentWithQuota(
      {
        collegeId,
        name: 'Concurrent Student 2',
        rollNumber: 'ROLL-002',
        department: 'CSE',
        email: `student2.${Date.now()}@txc.edu`,
      },
      actor
    );

    const student3 = repo.enrollStudentWithQuota(
      {
        collegeId,
        name: 'Concurrent Student 3',
        rollNumber: 'ROLL-003',
        department: 'CSE',
        email: `student3.${Date.now()}@txc.edu`,
      },
      actor
    );

    const results = await Promise.allSettled([student1, student2, student3]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 2 must succeed and 1 must be rejected with QuotaExceededError
    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(1);

    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason).toBeInstanceOf(QuotaExceededError);

    // 3. Inspect PostgreSQL directly: quotaUsed must be exactly 2
    const collegeInDb = await repo.getCollegeById(collegeId);
    expect(collegeInDb.quotaUsed).toBe(2);
    expect(collegeInDb.quotaUsed).toBeLessThanOrEqual(collegeInDb.quotaAllocated);
  });

  it('PostgreSQL atomic reset token consumption rejects concurrent replay', async () => {
    // 1. Create test user
    const testEmail = `test.user.${Date.now()}@atbexo.com`;
    const user = await repo.createStaffUser({
      name: 'Reset Test User',
      email: testEmail,
      role: 'ops',
      designation: 'Engineer',
      passwordHash: 'InitialHash123!',
      isActive: true,
      accountStatus: 'ACTIVE',
      sessionVersion: 1,
    });

    // 2. Create password reset token in PostgreSQL
    const rawToken = generateSecureToken(32);
    const tokenH = hashToken(rawToken);
    await repo.createPasswordResetToken({
      userId: user.id,
      email: testEmail,
      tokenHash: tokenH,
      expiresAt: new Date(Date.now() + 3600000),
    });

    // 3. Fire two concurrent consumption attempts in PostgreSQL
    const req1 = repo.consumeResetTokenAndSetPassword(tokenH, 'NewHashPasswordA1!');
    const req2 = repo.consumeResetTokenAndSetPassword(tokenH, 'NewHashPasswordB2!');

    const results = await Promise.allSettled([req1, req2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 must succeed and 1 must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // 4. Verify user in PostgreSQL has bumped sessionVersion
    const updatedUser = await repo.getStaffById(user.id);
    expect(updatedUser.sessionVersion).toBe(2);
  });

  it('PostgreSQL atomic approval decision prevents repeated reviews', async () => {
    // 1. Create pending approval request in PostgreSQL
    const approval = await repo.createApproval({
      type: 'Quota Increase',
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      requester: 'Test Requester',
      requesterEmail: 'test.requester@psgtech.edu',
      requesterRole: 'college_admin',
      status: 'Pending',
      details: { requestedValue: 500 },
    });

    // 2. First decision must succeed
    const firstDecision = await repo.updateApprovalDecision(
      approval.id,
      'Approved',
      'Quota approved by audit committee',
      'Director Kavin'
    );
    expect(firstDecision.status).toBe('Approved');

    // 3. Second decision attempt on same approval MUST throw ConflictError
    await expect(
      repo.updateApprovalDecision(approval.id, 'Rejected', 'Duplicate review attempt', 'Director Ezhil')
    ).rejects.toThrow(ConflictError);
  });
});
