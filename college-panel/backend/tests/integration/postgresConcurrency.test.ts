import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db, pool } from '../../src/db/client';
import { DrizzlePostgresRepository } from '../../src/db/postgresRepository';
import * as schema from '../../src/db/schema';
import { QuotaExceededError, ConflictError } from '../../src/shared/errors/AppError';

describe('Integration — PostgreSQL Live Concurrency, Atomic Row Locking & Quota Integrity', () => {
  let repo: DrizzlePostgresRepository;
  const testCollegeId = `clg-conc-${Date.now()}`;
  const actor = {
    userId: 'usr-conc-tester',
    name: 'Concurrency Tester',
    role: 'super_admin',
    ip: '127.0.0.1',
  };

  beforeAll(async () => {
    // Hard fail if PostgreSQL connection is unavailable
    const ping = await Promise.race([
      db.execute(sql`SELECT 1 as alive`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PostgreSQL connection timeout in concurrency suite')), 25000)),
    ]);
    if (!ping) {
      throw new Error('PostgreSQL connection ping failed.');
    }

    repo = new DrizzlePostgresRepository();

    // Create an isolated synthetic college for this concurrency test run
    await db.insert(schema.colleges).values({
      id: testCollegeId,
      name: 'Concurrency Verification Institute',
      code: `CVI-${Date.now().toString().slice(-4)}`,
      slug: `cvi-${Date.now()}`,
      type: 'Engineering',
      affiliation: 'Autonomous Testing University',
      establishedYear: 2026,
      address: '100 Concurrency Way',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      country: 'India',
      primaryContact: { name: 'Dr. Lock', email: 'lock@test.edu', phone: '+919999999999', designation: 'Director' },
      adminContact: { name: 'Admin Lock', email: 'admin@test.edu', phone: '+919999999998', role: 'Head Admin' },
      status: 'Active',
      dashboardAccess: true,
      totalStudents: 0,
      activeStudents: 0,
      quotaAllocated: 2,
      quotaUsed: 1, // Only 1 seat remaining
      services: ['BEXO Portfolio', 'BEXO Templates'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, 30000);

  afterAll(async () => {
    try {
      // Clean up all test records
      await db.delete(schema.students).where(eq(schema.students.collegeId, testCollegeId)).catch(() => {});
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.collegeId, testCollegeId)).catch(() => {});
      await db.delete(schema.provisioningJobs).where(eq(schema.provisioningJobs.collegeId, testCollegeId)).catch(() => {});
      await db.delete(schema.colleges).where(eq(schema.colleges.id, testCollegeId)).catch(() => {});
    } catch {
      // Ignore cleanup error
    }
  });

  // -------------------------------------------------------------------------
  // 1. CONCURRENT ENROLLMENTS COMPETING FOR THE FINAL REMAINING SEAT
  // -------------------------------------------------------------------------
  it('Row Locking: Concurrent enrollments competing for the final remaining seat allow exactly 1 winner and reject contenders with QuotaExceededError', async () => {
    // 3 parallel enrollment attempts competing for 1 available seat
    const contenders = [
      {
        id: `stu-conc-1-${Date.now()}`,
        collegeId: testCollegeId,
        name: 'Contender One',
        rollNumber: `CONC-A-${Date.now().toString().slice(-4)}`,
        email: `contender1-${Date.now()}@cvi.edu`,
        department: 'CS',
      },
      {
        id: `stu-conc-2-${Date.now()}`,
        collegeId: testCollegeId,
        name: 'Contender Two',
        rollNumber: `CONC-B-${Date.now().toString().slice(-4)}`,
        email: `contender2-${Date.now()}@cvi.edu`,
        department: 'IT',
      },
      {
        id: `stu-conc-3-${Date.now()}`,
        collegeId: testCollegeId,
        name: 'Contender Three',
        rollNumber: `CONC-C-${Date.now().toString().slice(-4)}`,
        email: `contender3-${Date.now()}@cvi.edu`,
        department: 'AI',
      },
    ];

    const results = await Promise.allSettled(
      contenders.map((c) => repo.enrollStudentWithQuota(c, actor))
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 must succeed and exactly 2 must be rejected
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);

    for (const rej of rejected) {
      const err = (rej as PromiseRejectedResult).reason;
      expect(err).toBeInstanceOf(QuotaExceededError);
      expect(err.message).toContain('quota limit reached');
    }

    // Inspect database state to verify quotaUsed was incremented by exactly 1 (to quotaAllocated = 2)
    const collegeRows = await db
      .select()
      .from(schema.colleges)
      .where(eq(schema.colleges.id, testCollegeId))
      .limit(1);

    expect(collegeRows[0].quotaAllocated).toBe(2);
    expect(collegeRows[0].quotaUsed).toBe(2); // Never 3 or 4
  });

  // -------------------------------------------------------------------------
  // 2. ROLLBACK ON DUPLICATE ROLL NUMBER COLLISION
  // -------------------------------------------------------------------------
  it('Atomic Rollback: Duplicate roll number collision rolls back transaction completely without incrementing quota', async () => {
    // Increase quota to allow 1 more student
    await db
      .update(schema.colleges)
      .set({ quotaAllocated: 5 })
      .where(eq(schema.colleges.id, testCollegeId));

    const existingStudent = {
      id: `stu-dup-orig-${Date.now()}`,
      collegeId: testCollegeId,
      name: 'Original Student',
      rollNumber: `DUP-ROLL-${Date.now().toString().slice(-4)}`,
      email: `orig-${Date.now()}@cvi.edu`,
      department: 'CS',
    };

    const enrolled = await repo.enrollStudentWithQuota(existingStudent, actor);
    expect(enrolled).toBeDefined();

    // Check quotaUsed before collision attempt
    const beforeCol = await repo.getCollegeById(testCollegeId);
    const beforeUsed = beforeCol.quotaUsed;

    // Attempt to enroll second student with same roll number
    const collidingStudent = {
      id: `stu-dup-coll-${Date.now()}`,
      collegeId: testCollegeId,
      name: 'Colliding Student',
      rollNumber: existingStudent.rollNumber, // Duplicate roll number
      email: `diff-email-${Date.now()}@cvi.edu`,
      department: 'CS',
    };

    let collisionError: any;
    try {
      await repo.enrollStudentWithQuota(collidingStudent, actor);
    } catch (err) {
      collisionError = err;
    }

    expect(collisionError).toBeInstanceOf(ConflictError);
    expect(collisionError.message).toContain('already enrolled');

    // Verify database state: quotaUsed was NOT incremented on rollback
    const afterCol = await repo.getCollegeById(testCollegeId);
    expect(afterCol.quotaUsed).toBe(beforeUsed);
  });

  // -------------------------------------------------------------------------
  // 3. CONCURRENT BATCH PROVISIONING INTEGRITY
  // -------------------------------------------------------------------------
  it('Concurrent Batch Provisioning: Parallel batch requests competing for remaining seats preserve quota invariants', async () => {
    // Reset college quota to allocated = 10, used = 8 (2 seats available)
    await db
      .update(schema.colleges)
      .set({ quotaAllocated: 10, quotaUsed: 8 })
      .where(eq(schema.colleges.id, testCollegeId));

    // Two parallel batches each requiring 2 seats (sum = 4 > 2 available)
    const batchA = [`stu-ba-1-${Date.now()}`, `stu-ba-2-${Date.now()}`];
    const batchB = [`stu-bb-1-${Date.now()}`, `stu-bb-2-${Date.now()}`];

    // Insert dummy student records for the batch
    const allBatchStudents = [...batchA, ...batchB];
    for (let i = 0; i < allBatchStudents.length; i++) {
      const sid = allBatchStudents[i];
      await db.insert(schema.students).values({
        id: sid,
        collegeId: testCollegeId,
        collegeName: 'Concurrency Verification Institute',
        name: `Batch Student ${sid}`,
        rollNumber: `BATCH-${i}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        email: `${sid}@cvi.edu`,
        department: 'CS',
        course: 'CS Program',
        batch: '2026-2030',
        accessStatus: 'Active',
        services: ['BEXO Portfolio'],
        entitlementId: `ent-${sid}`,
        enrolledYear: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const [resA, resB] = await Promise.allSettled([
      repo.provisionBatchWithQuota(testCollegeId, batchA, ['BEXO Templates'], actor),
      repo.provisionBatchWithQuota(testCollegeId, batchB, ['BEXO Templates'], actor),
    ]);

    const fulfilledCount = [resA, resB].filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = [resA, resB].filter((r) => r.status === 'rejected').length;

    // Exactly one batch of 2 seats must win, the other must be rejected
    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);

    const rej = [resA, resB].find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rej.reason).toBeInstanceOf(QuotaExceededError);
    expect(rej.reason.message).toContain('Insufficient quota');

    // Inspect college in DB: quotaUsed should be exactly 10
    const col = await repo.getCollegeById(testCollegeId);
    expect(col.quotaAllocated).toBe(10);
    expect(col.quotaUsed).toBe(10);
  });

  // -------------------------------------------------------------------------
  // 4. BULK IMPORT QUOTA EXHAUSTION SAFETY
  // -------------------------------------------------------------------------
  it('Bulk Import Quota Exhaustion: Roster batch imports up to allocated quota and records remainder as skipped', async () => {
    // Set quota allocated = 15, used = 13 (2 seats available)
    await db
      .update(schema.colleges)
      .set({ quotaAllocated: 15, quotaUsed: 13 })
      .where(eq(schema.colleges.id, testCollegeId));

    const roster = [
      { name: 'Bulk Student 1', rollNumber: `BLK-1-${Date.now()}`, email: `blk1-${Date.now()}@cvi.edu` },
      { name: 'Bulk Student 2', rollNumber: `BLK-2-${Date.now()}`, email: `blk2-${Date.now()}@cvi.edu` },
      { name: 'Bulk Student 3', rollNumber: `BLK-3-${Date.now()}`, email: `blk3-${Date.now()}@cvi.edu` }, // Exceeds quota
      { name: 'Bulk Student 4', rollNumber: `BLK-4-${Date.now()}`, email: `blk4-${Date.now()}@cvi.edu` }, // Exceeds quota
    ];

    const result = await repo.bulkImportStudentsWithQuota(testCollegeId, roster, actor);

    // Exactly 2 students inserted, 2 skipped due to quota
    expect(result.insertedStudents.length).toBe(2);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].reason).toContain('Institutional quota exhausted');
    expect(result.errors[1].reason).toContain('Institutional quota exhausted');

    // Final college quota used is exactly 15
    const col = await repo.getCollegeById(testCollegeId);
    expect(col.quotaUsed).toBe(15);
  });
});
