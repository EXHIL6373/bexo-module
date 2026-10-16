import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken, hashToken } from '../../src/shared/utils/tokens';

describe('Security — Corporate RBAC & Multi-Tenant Isolation', () => {
  let memRepo: MemoryRepository;
  let superAdminToken: string;
  let adminToken: string;
  let opsToken: string;
  let financeToken: string;
  let supportToken: string;
  let collegeAdminToken: string;

  beforeEach(async () => {
    memRepo = new MemoryRepository();
    setRepository(memRepo);

    superAdminToken = signToken({
      userId: 'usr-super-kavin',
      email: 'kavinbalaji@atbexo.com',
      role: 'super_admin',
      name: 'Kavinbalaji S K',
      collegeId: null,
      sessionVersion: 1,
    });
    await memRepo.createSession({
      userId: 'usr-super-kavin',
      tokenHash: hashToken(superAdminToken),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    adminToken = signToken({
      userId: 'usr-admin-corp',
      email: 'rajesh.admin@atbexo.com',
      role: 'admin',
      name: 'Rajesh Ramasamy',
      collegeId: null,
      sessionVersion: 1,
    });
    await memRepo.createSession({
      userId: 'usr-admin-corp',
      tokenHash: hashToken(adminToken),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    opsToken = signToken({
      userId: 'usr-ops-1',
      email: 'suresh.ops@atbexo.com',
      role: 'ops',
      name: 'Suresh Kumar',
      collegeId: null,
      sessionVersion: 1,
    });
    await memRepo.createSession({
      userId: 'usr-ops-1',
      tokenHash: hashToken(opsToken),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    financeToken = signToken({
      userId: 'usr-fin-1',
      email: 'lakshmi.fin@atbexo.com',
      role: 'finance',
      name: 'Lakshmi Narayanan',
      collegeId: null,
      sessionVersion: 1,
    });
    await memRepo.createSession({
      userId: 'usr-fin-1',
      tokenHash: hashToken(financeToken),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    supportToken = signToken({
      userId: 'usr-sup-1',
      email: 'priya.support@atbexo.com',
      role: 'support',
      name: 'Priya Sundaram',
      collegeId: null,
      sessionVersion: 1,
    });
    await memRepo.createSession({
      userId: 'usr-sup-1',
      tokenHash: hashToken(supportToken),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    collegeAdminToken = signToken({
      userId: 'usr-college-venkatesh',
      email: 'venkatesh.r@psgtech.edu',
      role: 'college_admin',
      name: 'Prof. R. Venkatesh',
      collegeId: 'clg-psg-01',
      sessionVersion: 1,
    });
  });

  it('Denies College Admin identity access to ANY corporate endpoint with 403', async () => {
    const res = await request(app)
      .get('/api/v1/colleges')
      .set('Authorization', `Bearer ${collegeAdminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Institutional Access Restricted');
  });

  it('Denies support role from suspending colleges or adjusting quotas', async () => {
    // Support can view colleges
    const viewRes = await request(app)
      .get('/api/v1/colleges')
      .set('Authorization', `Bearer ${supportToken}`);
    expect(viewRes.status).toBe(200);

    // Support cannot suspend college
    const suspendRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/suspend')
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ reason: 'Unauthorized attempt' });
    expect(suspendRes.status).toBe(403);

    // Support cannot adjust quota
    const quotaRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/quota')
      .set('Authorization', `Bearer ${supportToken}`)
      .send({ quotaAllocated: 9000, reason: 'Unauthorized attempt' });
    expect(quotaRes.status).toBe(403);
  });

  it('Denies finance role from triggering provisioning or managing staff', async () => {
    // Finance can access payments
    const payRes = await request(app)
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${financeToken}`);
    expect(payRes.status).toBe(200);

    // Finance cannot trigger provisioning
    const provRes = await request(app)
      .post('/api/v1/provisioning/batch')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({ collegeId: 'clg-psg-01', batchSize: 50 });
    expect(provRes.status).toBe(403);

    // Finance cannot delete staff
    const staffRes = await request(app)
      .delete('/api/v1/users/staff/usr-ops-1')
      .set('Authorization', `Bearer ${financeToken}`);
    expect(staffRes.status).toBe(403);
  });

  it('Denies ops role from recording payments or suspending institutions', async () => {
    // Ops cannot record payments
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        invoiceNumber: 'INV-OPS-FAIL',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG',
        amount: 1000,
        status: 'Paid',
        billingCycle: 'Annual',
        plan: 'Enterprise',
        dueDate: '2026-10-15',
      });
    expect(payRes.status).toBe(403);

    // Ops cannot suspend college
    const suspRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/suspend')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({ reason: 'Unauthorized' });
    expect(suspRes.status).toBe(403);
  });

  it('Allows admin and super_admin full capabilities across operational domains', async () => {
    // Admin can adjust quota
    const quotaRes = await request(app)
      .post('/api/v1/colleges/clg-psg-01/quota')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quotaAllocated: 5500, reason: 'Admin adjustment' });
    expect(quotaRes.status).toBe(200);

    // Super admin can record payment
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        invoiceNumber: 'INV-SUPER-001',
        collegeId: 'clg-psg-01',
        collegeName: 'PSG',
        amount: 50000,
        status: 'Paid',
        billingCycle: 'Annual',
        plan: 'Enterprise',
        dueDate: '2026-10-15',
      });
    expect(payRes.status).toBe(201);
  });
});
