import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { store } from '../../src/db/store';

const SERVICE_SECRET = process.env.SERVICE_AUTH_SECRET || 'bexo-service-to-service-secret-key-2026-staging-32-chars';

function generateTestServiceToken(scope: string[] = ['lifecycle:sync']) {
  return jwt.sign(
    {
      iss: 'bexo-admin-panel',
      aud: 'bexo-college-panel',
      sub: 'admin-service-identity',
      scope,
      role: 'corporate_sync',
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    SERVICE_SECRET,
    { algorithm: 'HS256' }
  );
}

describe('Integration — Service-to-Service College Lifecycle Synchronization', () => {
  const testCollegeId = 'clg-psg-01';

  it('Rejects lifecycle-sync without authentication token with 401', async () => {
    const res = await request(app)
      .post(`/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`)
      .send({
        status: 'Suspended',
        reason: 'Policy non-compliance',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Rejects lifecycle-sync with forged / invalid service token with 401', async () => {
    const invalidToken = jwt.sign(
      { iss: 'untrusted-issuer', aud: 'bexo-college-panel' },
      'wrong-secret-key',
      { algorithm: 'HS256' }
    );

    const res = await request(app)
      .post(`/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`)
      .set('Authorization', `Bearer ${invalidToken}`)
      .send({
        status: 'Suspended',
        reason: 'Policy non-compliance',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Successfully accepts valid signed service token and synchronizes suspension', async () => {
    const serviceToken = generateTestServiceToken();

    const res = await request(app)
      .post(`/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`)
      .set('Authorization', `Bearer ${serviceToken}`)
      .set('X-Service-Token', serviceToken)
      .set('X-Correlation-ID', 'trace-sync-001')
      .set('X-Bexo-Service', 'admin-panel')
      .send({
        collegeId: testCollegeId,
        status: 'Suspended',
        dashboardAccess: false,
        quotaAllocated: 4500,
        reason: 'Suspension dispatched from BEXO Central Administration',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Suspended');
    expect(res.body.data.dashboardAccess).toBe(false);

    // Verify college state in store
    const college = await store.getCollegeById(testCollegeId);
    expect(college?.status).toBe('Suspended');
    expect(college?.dashboardAccess).toBe(false);
  });

  it('Successfully synchronizes reactivation and quota adjustment via service token', async () => {
    const serviceToken = generateTestServiceToken();

    const res = await request(app)
      .post(`/api/v1/corporate/colleges/${testCollegeId}/lifecycle-sync`)
      .set('Authorization', `Bearer ${serviceToken}`)
      .set('X-Service-Token', serviceToken)
      .set('X-Correlation-ID', 'trace-sync-002')
      .set('X-Bexo-Service', 'admin-panel')
      .send({
        collegeId: testCollegeId,
        status: 'Active',
        dashboardAccess: true,
        quotaAllocated: 7500,
        reason: 'Full institutional restoration and capacity boost',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Active');
    expect(res.body.data.dashboardAccess).toBe(true);
    expect(res.body.data.quotaAllocated).toBe(7500);

    // Verify college state in store
    const college = await store.getCollegeById(testCollegeId);
    expect(college?.status).toBe('Active');
    expect(college?.dashboardAccess).toBe(true);
    expect(college?.quotaAllocated).toBe(7500);
  });
});
