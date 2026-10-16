import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Integration — Student Provisioning & Entitlements', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/college-login')
      .send({ email: 'venkatesh.r@psgtech.edu', password: 'ValidPassword123!' });
    authToken = loginRes.body.data.token;
  });

  it('Fetches provisioning batch jobs for the college', async () => {
    const res = await request(app)
      .get('/api/v1/college/provisioning/jobs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Triggers student provisioning batch and creates entitlements', async () => {
    const res = await request(app)
      .post('/api/v1/college/provisioning/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        studentIds: ['stu-101', 'stu-102'],
        serviceName: 'BEXO Portfolio',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.successful).toBe(2);
    expect(res.body.data.job.status).toBe('Completed');
  });

  it('Rejects provisioning when requested seats exceed remaining quota', async () => {
    // Generate an array of 2000 fake student IDs to exceed quota
    const oversizedIds = Array.from({ length: 2000 }, (_, i) => `excess-stu-${i}`);

    const res = await request(app)
      .post('/api/v1/college/provisioning/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        studentIds: oversizedIds,
        serviceName: 'BEXO Portfolio',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient quota');
  });

  it('Fetches active student entitlements', async () => {
    const res = await request(app)
      .get('/api/v1/college/entitlements')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((e: any) => e.collegeId === 'clg-psg-01')).toBe(true);
  });

  it('Retries failed records in a provisioning job', async () => {
    const jobsRes = await request(app)
      .get('/api/v1/college/provisioning/jobs')
      .set('Authorization', `Bearer ${authToken}`);

    const jobWithFailures = jobsRes.body.data.find((j: any) => j.failed > 0);
    if (jobWithFailures) {
      const res = await request(app)
        .post(`/api/v1/college/provisioning/jobs/${jobWithFailures.id}/retry`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.retriedCount).toBeGreaterThan(0);
    }
  });
});
