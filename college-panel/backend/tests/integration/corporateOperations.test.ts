import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { store } from '../../src/db/store';
import { signToken } from '../../src/shared/security/tokens';

describe('Integration — Corporate Administrative Operations & Lifecycle', () => {
  let corporateToken: string;
  let collegeStaffToken: string;
  const testCollegeId = 'clg-psg-01';

  beforeAll(async () => {
    // Generate authorized corporate super_admin token
    corporateToken = signToken({
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      collegeId: null,
      name: 'Kavinbalaji S K',
      sessionVersion: 1,
    });

    // Obtain regular college coordinator token
    const loginRes = await request(app)
      .post('/api/v1/auth/college-login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });
    collegeStaffToken = loginRes.body.data.token;
  });

  // -------------------------------------------------------------------------
  // 1. AUTHORIZATION BOUNDARY
  // -------------------------------------------------------------------------
  describe('Corporate Route Authorization Boundary', () => {
    it('Rejects unauthenticated requests to corporate routes with 401', async () => {
      const res = await request(app).get('/api/v1/corporate/colleges');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Rejects college staff access to corporate endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/corporate/colleges')
        .set('Authorization', `Bearer ${collegeStaffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Action Forbidden');
    });

    it('Allows corporate administrator with super_admin role to list institutions', async () => {
      const res = await request(app)
        .get('/api/v1/corporate/colleges')
        .set('Authorization', `Bearer ${corporateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // 2. COLLEGE LIFECYCLE (SUSPEND & REACTIVATE)
  // -------------------------------------------------------------------------
  describe('College Suspension & Reactivation Lifecycle', () => {
    it('Rejects suspension for malformed collegeId with 400', async () => {
      const res = await request(app)
        .post('/api/v1/corporate/colleges/c/suspend')
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ reason: 'Audit pending' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Returns 404 when suspending a nonexistent college', async () => {
      const res = await request(app)
        .post('/api/v1/corporate/colleges/clg-nonexistent-999/suspend')
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ reason: 'Nonexistent test' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Successfully suspends an active college with audit trail', async () => {
      const res = await request(app)
        .post(`/api/v1/corporate/colleges/${testCollegeId}/suspend`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ reason: 'Annual institutional compliance review in progress' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Suspended');
      expect(res.body.data.dashboardAccess).toBe(false);
      expect(res.body.data.suspensionReason).toBe('Annual institutional compliance review in progress');
    });

    it('Reactivates a suspended college back to Active status', async () => {
      const res = await request(app)
        .post(`/api/v1/corporate/colleges/${testCollegeId}/reactivate`)
        .set('Authorization', `Bearer ${corporateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Active');
      expect(res.body.data.dashboardAccess).toBe(true);
      expect(res.body.data.suspensionReason).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 3. CORPORATE QUOTA ADJUSTMENT VALIDATION
  // -------------------------------------------------------------------------
  describe('Corporate Quota Mutation Validation', () => {
    it('Rejects negative quota value with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/corporate/colleges/${testCollegeId}/quota`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ allocated: -10, reason: 'Negative allocation attempt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorsStr = JSON.stringify(res.body.errors || {});
      expect(errorsStr).toContain('Allocated quota cannot be negative');
    });

    it('Rejects non-integer floating-point quota value with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/corporate/colleges/${testCollegeId}/quota`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ allocated: 500.75, reason: 'Fractional quota attempt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorsStr = JSON.stringify(res.body.errors || {});
      expect(errorsStr).toContain('Allocated quota must be an integer');
    });

    it('Rejects quota value exceeding 1,000,000 threshold with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/corporate/colleges/${testCollegeId}/quota`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ allocated: 2_500_000, reason: 'Exorbitant quota attempt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorsStr = JSON.stringify(res.body.errors || {});
      expect(errorsStr).toContain('cannot exceed institutional limit');
    });

    it('Rejects non-numeric quota payload with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/corporate/colleges/${testCollegeId}/quota`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ allocated: 'unlimited', reason: 'String quota attempt' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Successfully updates quota when valid parameters are provided', async () => {
      const res = await request(app)
        .patch(`/api/v1/corporate/colleges/${testCollegeId}/quota`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ allocated: 1200, reason: 'Annual institutional quota renewal' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quotaAllocated).toBe(1200);
    });
  });

  // -------------------------------------------------------------------------
  // 4. OPERATIONAL REQUEST REVIEW & ATOMIC QUOTA ADJUSTMENT
  // -------------------------------------------------------------------------
  describe('Operational Request Review & Atomic Quota Adjustment', () => {
    it('Rejects review request with arbitrary status with 400', async () => {
      const res = await request(app)
        .post('/api/v1/corporate/requests/req-test-01/review')
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ status: 'Acknowledged', decisionReason: 'Valid decision note' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorsStr = JSON.stringify(res.body.errors || {});
      expect(errorsStr).toContain("Status must be either 'Approved' or 'Rejected'");
    });

    it('Rejects review request with missing decisionReason with 400', async () => {
      const res = await request(app)
        .post('/api/v1/corporate/requests/req-test-01/review')
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ status: 'Approved' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errorsStr = JSON.stringify(res.body.errors || {});
      expect(errorsStr).toContain('Decision reason is required');
    });

    it('Returns 404 when reviewing a nonexistent request', async () => {
      const res = await request(app)
        .post('/api/v1/corporate/requests/req-nonexistent-888/review')
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({ status: 'Rejected', decisionReason: 'Not found in system' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Atomically approves Quota Increase request and updates college quota', async () => {
      const testRequestId = `req-quota-${Date.now()}`;
      const collegeBefore = await store.getCollegeById(testCollegeId);
      const startingQuota = collegeBefore?.quotaAllocated || 1000;
      const additionalSeats = 150;

      // Seed a pending quota expansion request
      await store.createRequest({
        id: testRequestId,
        collegeId: testCollegeId,
        type: 'Quota Increase',
        deltaSeats: additionalSeats,
        status: 'Pending',
        details: { title: 'Batch 2026 Expansion', requestedValue: startingQuota + additionalSeats },
        createdAt: new Date().toISOString(),
      });

      // Corporate admin approves the request
      const reviewRes = await request(app)
        .post(`/api/v1/corporate/requests/${testRequestId}/review`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({
          status: 'Approved',
          decisionReason: 'Approved by BEXO academic partnership director',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.status).toBe('Approved');
      expect(reviewRes.body.data.decisionReason).toBe('Approved by BEXO academic partnership director');

      // Verify that institutional quota was atomically incremented
      const collegeAfter = await store.getCollegeById(testCollegeId);
      expect(collegeAfter?.quotaAllocated).toBe(startingQuota + additionalSeats);

      // Verify idempotency / concurrency guard: second review attempt must fail
      const duplicateReviewRes = await request(app)
        .post(`/api/v1/corporate/requests/${testRequestId}/review`)
        .set('Authorization', `Bearer ${corporateToken}`)
        .send({
          status: 'Rejected',
          decisionReason: 'Attempting conflicting review',
        });

      expect(duplicateReviewRes.status).toBe(400);
      expect(duplicateReviewRes.body.success).toBe(false);
      expect(duplicateReviewRes.body.message).toContain('already been processed');
    });
  });

  afterAll(async () => {
    try {
      await store.updateCollege(testCollegeId, {
        quotaAllocated: 6000,
        status: 'ACTIVE',
        dashboardAccess: true,
      });
    } catch {
      // Ignore if DB offline
    }
  });
});
