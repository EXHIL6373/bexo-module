import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — Bulk Student Provisioning Engine', () => {
  let memRepo: MemoryRepository;
  let opsToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    opsToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-ops-1',
      email: 'suresh.ops@atbexo.com',
      role: 'ops',
      name: 'Suresh Kumar',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Lists provisioning jobs and retrieves single job with failed records', async () => {
    const listRes = await request(app)
      .get('/api/v1/provisioning/jobs')
      .set('Authorization', `Bearer ${opsToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const singleRes = await request(app)
      .get('/api/v1/provisioning/jobs/job-prov-001')
      .set('Authorization', `Bearer ${opsToken}`);

    expect(singleRes.status).toBe(200);
    expect(singleRes.body.data.id).toBe('job-prov-001');
    expect(singleRes.body.data.failedRecords.length).toBeGreaterThan(0);
  });

  it('Triggers batch provisioning within valid college quota', async () => {
    const res = await request(app)
      .post('/api/v1/provisioning/batch')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        collegeId: 'clg-psg-01',
        source: 'Roll Number Range',
        startRoll: '21CS101',
        endRoll: '21CS150',
        batchSize: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.successful).toBe(50);
    expect(res.body.data.status).toBe('Completed');
  });

  it('Rejects batch provisioning for a suspended college', async () => {
    const res = await request(app)
      .post('/api/v1/provisioning/batch')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        collegeId: 'clg-cit-03', // CIT is Suspended in seed
        batchSize: 20,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('currently suspended');
  });

  it('Gracefully handles batch exceeding remaining quota with Partial/Failed status and failed records', async () => {
    const res = await request(app)
      .post('/api/v1/provisioning/batch')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        collegeId: 'clg-psg-01',
        batchSize: 1000, // Available quota in clg-psg-01 is 580 (5000 - 4420)
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Partially Completed');
    expect(res.body.data.successful).toBe(580);
    expect(res.body.data.failed).toBe(420);
    expect(res.body.data.failedRecords[0].status).toBe('Quota Exceeded');
  });
});
