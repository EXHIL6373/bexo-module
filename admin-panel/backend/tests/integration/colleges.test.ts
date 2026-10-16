import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — College Lifecycle, Governance & Quotas', () => {
  let memRepo: MemoryRepository;
  let superAdminToken: string;
  let opsToken: string;

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

    opsToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-ops-1',
      email: 'suresh.ops@atbexo.com',
      role: 'ops',
      name: 'Suresh Kumar',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Lists all colleges with search filtering and pagination meta', async () => {
    const res = await request(app)
      .get('/api/v1/colleges?search=PSG')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].code).toBe('PSGCT');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBeDefined();
  });

  it('Retrieves single college by ID', async () => {
    const res = await request(app)
      .get('/api/v1/colleges/clg-psg-01')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('clg-psg-01');
    expect(res.body.data.name).toBe('PSG College of Technology');
    expect(res.body.data.quota.allocated).toBe(5000);
  });

  it('Onboards new college and prevents duplicate registration', async () => {
    const newCollegePayload = {
      name: 'Thiagarajar College of Engineering',
      code: 'TCE-MDU',
      slug: 'tce-mdu',
      type: 'Autonomous University',
      affiliation: 'Anna University',
      city: 'Madurai',
      state: 'Tamil Nadu',
      primaryContact: {
        name: 'Dr. M. Palaninatha Raja',
        designation: 'Principal',
        email: 'principal@tce.edu',
        mobile: '+91 94431 88990',
      },
      quota: {
        allocated: 3000,
        used: 0,
        warningThreshold: 80,
        criticalThreshold: 95,
      },
    };

    const res = await request(app)
      .post('/api/v1/colleges')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(newCollegePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('TCE-MDU');

    // Attempt duplicate registration with same code
    const dupRes = await request(app)
      .post('/api/v1/colleges')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(newCollegePayload);

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
  });

  it('Suspends an active college, disables dashboard access, and preserves records', async () => {
    const res = await request(app)
      .post('/api/v1/colleges/clg-psg-01/suspend')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Institutional MOU audit required.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Suspended');
    expect(res.body.data.dashboardAccess).toBe(false);

    // Verify college record remains queryable and historical data preserved
    const getRes = await request(app)
      .get('/api/v1/colleges/clg-psg-01')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.status).toBe('Suspended');
    expect(getRes.body.data.dashboardAccess).toBe(false);
    expect(getRes.body.data.totalStudents).toBeGreaterThan(0);
  });

  it('Reactivates a suspended college', async () => {
    // Suspend first
    await request(app)
      .post('/api/v1/colleges/clg-psg-01/suspend')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Audit pending' });

    // Reactivate
    const res = await request(app)
      .post('/api/v1/colleges/clg-psg-01/reactivate')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'MOU audit cleared.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Active');
    expect(res.body.data.dashboardAccess).toBe(true);
  });

  it('Validates and adjusts quota allocation with audit history', async () => {
    // Rejects negative quota
    const negRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/quota')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ allocated: -100, reason: 'Invalid test' });
    expect(negRes.status).toBe(400);

    // Rejects non-integer quota
    const floatRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/quota')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ allocated: 2500.5, reason: 'Float test' });
    expect(floatRes.status).toBe(400);

    // Rejects over-limit quota (> 1,000,000)
    const overRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/quota')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ allocated: 2000000, reason: 'Over limit' });
    expect(overRes.status).toBe(400);

    // Valid quota adjustment
    const validRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/quota')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ allocated: 6000, reason: 'Approved expansion for lateral entry batch' });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.newAllocated).toBe(6000);

    // Verify quota history endpoint
    const historyRes = await request(app)
      .get('/api/v1/colleges/clg-psg-01/quota-history')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.length).toBeGreaterThan(0);
    expect(historyRes.body.data[0].newAllocated).toBe(6000);
  });

  it('Toggles institutional service configuration', async () => {
    const res = await request(app)
      .post('/api/v1/colleges/clg-psg-01/services/srv-1/toggle')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ enabled: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const srv1 = res.body.data.services.find((s: any) => s.serviceId === 'srv-1');
    expect(srv1.isEnabled).toBe(false);
  });
});
