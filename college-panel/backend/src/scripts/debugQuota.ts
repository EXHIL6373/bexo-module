import request from 'supertest';
import { app } from '../app';
import { store } from '../db/store';
import { signToken } from '../shared/security/tokens';

async function debug() {
  const corporateToken = signToken({
    userId: 'usr-super-kavin',
    email: 'kavinbalaji@atbexo.com',
    role: 'super_admin',
    collegeId: null,
    name: 'Kavinbalaji S K',
    sessionVersion: 1,
  });

  const testCollegeId = 'clg-psg-01';
  const testRequestId = `req-quota-${Date.now()}`;
  const collegeBefore = await store.getCollegeById(testCollegeId);
  const startingQuota = collegeBefore?.quotaAllocated || 1000;
  const additionalSeats = 150;

  console.log('startingQuota:', startingQuota);

  await store.createRequest({
    id: testRequestId,
    collegeId: testCollegeId,
    type: 'Quota Increase',
    deltaSeats: additionalSeats,
    status: 'Pending',
    details: { title: 'Batch 2026 Expansion', requestedValue: startingQuota + additionalSeats },
    createdAt: new Date().toISOString(),
  });

  const reviewRes = await request(app)
    .post(`/api/v1/corporate/requests/${testRequestId}/review`)
    .set('Authorization', `Bearer ${corporateToken}`)
    .send({
      status: 'Approved',
      decisionReason: 'Approved by BEXO academic partnership director',
    });

  console.log('reviewRes status:', reviewRes.status);
  console.log('reviewRes body:', JSON.stringify(reviewRes.body, null, 2));

  const collegeAfter = await store.getCollegeById(testCollegeId);
  console.log('collegeAfter quotaAllocated:', collegeAfter?.quotaAllocated);
}

debug().catch(console.error);
