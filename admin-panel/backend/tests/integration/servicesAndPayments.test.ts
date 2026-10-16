import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setRepository } from '../../src/db/repository';
import { MemoryRepository } from '../../src/db/repository/memoryRepository';
import { signToken } from '../../src/shared/utils/tokens';

import { createAuthenticatedSession } from '../helpers/authHelper';

describe('Integration — Services Catalog & Payments Finance', () => {
  let memRepo: MemoryRepository;
  let superAdminToken: string;
  let financeToken: string;

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

    financeToken = await createAuthenticatedSession(memRepo, {
      userId: 'usr-fin-1',
      email: 'lakshmi.fin@atbexo.com',
      role: 'finance',
      name: 'Lakshmi Narayanan',
      collegeId: null,
      sessionVersion: 1,
    });
  });

  it('Lists all platform services and toggles global service active state', async () => {
    const listRes = await request(app)
      .get('/api/v1/services')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);

    const srv1 = listRes.body.data.find((s: any) => s.id === 'srv-1');
    expect(srv1.isGlobalActive).toBe(true);

    // Toggle global state
    const toggleRes = await request(app)
      .post('/api/v1/services/srv-1/toggle-global')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.isGlobalActive).toBe(false);
  });

  it('Lists institutional payments and records new invoice transaction', async () => {
    const listRes = await request(app)
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${financeToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const newPayment = {
      invoiceNumber: 'BEXO-INV-2026-9999',
      collegeId: 'clg-psg-01',
      collegeName: 'PSG College of Technology',
      amount: 450000,
      status: 'Paid',
      date: '2026-10-01',
      dueDate: '2026-10-15',
      paymentMethod: 'Corporate Wire / RTGS',
      description: 'Q3 Enterprise license installment',
    };

    const recordRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send(newPayment);

    expect(recordRes.status).toBe(201);
    expect(recordRes.body.success).toBe(true);
    expect(recordRes.body.data.invoiceNumber).toBe('BEXO-INV-2026-9999');

    // Duplicate invoice number rejection
    const dupRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${financeToken}`)
      .send(newPayment);

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
  });
});
