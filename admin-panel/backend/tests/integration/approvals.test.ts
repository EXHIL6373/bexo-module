import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — Approval Center & Requests Ledger', () => {
  let memRepo: MemoryRepository;
  let superAdminToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    superAdminToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      name: 'Kavinbalaji S K',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Lists approval requests with status filter', async () => {
    const res = await request(app)
      .get('/api/v1/approvals?status=Pending')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Submits a new operational approval request', async () => {
    const payload = {
      type: 'Service Activation',
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      requester: 'Prof. R. Venkatesh',
      requesterEmail: 'venkatesh.r@psgtech.edu',
      requesterRole: 'college_admin',
      details: {
        title: 'Activate Placement & Recruiter Portal',
        description: 'Need early access for upcoming campus placement drive.',
      },
      priority: 'High',
    };

    const res = await request(app)
      .post('/api/v1/approvals')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('Pending');
  });

  it('Approves Quota Increase request and atomically updates college quota', async () => {
    const collegeBefore = await memRepo.getCollegeById('clg-psg-01');
    expect(collegeBefore.quotaAllocated).toBe(5000);

    const res = await request(app)
      .post('/api/v1/approvals/req-appr-001/approve')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ decisionReason: 'Approved for lateral entry batch expansion.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Approved');
    expect(res.body.data.decisionReason).toBe('Approved for lateral entry batch expansion.');

    // Verify institutional quota was atomically adjusted
    const collegeAfter = await memRepo.getCollegeById('clg-psg-01');
    expect(collegeAfter.quotaAllocated).toBe(5250);

    // Concurrency / Idempotency guard: reviewing already decided request must fail
    const repeatRes = await request(app)
      .post('/api/v1/approvals/req-appr-001/approve')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ decisionReason: 'Duplicate attempt' });

    expect(repeatRes.status).toBe(409);
  });

  it('Rejects an operational request with mandatory decision reason', async () => {
    // Missing decision reason fails
    const failRes = await request(app)
      .post('/api/v1/approvals/req-appr-001/reject')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ decisionReason: '' });

    expect(failRes.status).toBe(400);

    // Valid rejection
    const res = await request(app)
      .post('/api/v1/approvals/req-appr-001/reject')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ decisionReason: 'MOU terms must be revised prior to seat expansion.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Rejected');
  });
});
