import { describe, it, expect } from 'vitest';
import http from 'node:http';
import { generateServiceToken } from '../../src/integrations/serviceAuth';
import { CollegePanelClient } from '../../src/integrations/collegePanelClient';
import { MobileAppClient } from '../../src/integrations/mobileAppClient';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

describe('Integration — Future Service Adapters & Service-to-Service Auth', () => {
  it('Generates signed service-to-service token with audience, scope, and short expiry', () => {
    const token = generateServiceToken('bexo-college-panel', ['lifecycle:sync']);
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, env.SERVICE_AUTH_SECRET) as any;
    expect(decoded.iss).toBe('bexo-admin-panel');
    expect(decoded.aud).toBe('bexo-college-panel');
    expect(decoded.role).toBe('corporate_sync');
    expect(decoded.scope).toContain('lifecycle:sync');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('CollegePanelClient safely handles connection failures without throwing uncaught exceptions', async () => {
    // Point to non-listening port to simulate downstream outage
    const client = new CollegePanelClient('http://127.0.0.1:59999', 500);

    const health = await client.checkHealth();
    expect(health.success).toBe(false);
    expect(health.statusCode).toBe(503);

    const sync = await client.syncCollegeLifecycle({
      collegeId: 'clg-psg-01',
      status: 'Suspended',
      dashboardAccess: false,
      quotaAllocated: 5000,
      updatedAt: new Date().toISOString(),
    });

    expect(sync.success).toBe(false);
    expect(sync.statusCode).toBe(504);
  });

  it('CollegePanelClient successfully issues verified service-authenticated request to downstream endpoint', async () => {
    let receivedAuth = '';
    let receivedServiceToken = '';
    let receivedBexoService = '';
    let receivedCorrelationId = '';
    let receivedBody: any = null;

    const server = http.createServer((req, res) => {
      receivedAuth = req.headers['authorization'] || '';
      receivedServiceToken = (req.headers['x-service-token'] as string) || '';
      receivedBexoService = (req.headers['x-bexo-service'] as string) || '';
      receivedCorrelationId = (req.headers['x-correlation-id'] as string) || '';

      let bodyStr = '';
      req.on('data', (chunk) => { bodyStr += chunk; });
      req.on('end', () => {
        receivedBody = JSON.parse(bodyStr);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Lifecycle synced successfully', data: receivedBody }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    const testPort = address.port;

    try {
      const client = new CollegePanelClient(`http://127.0.0.1:${testPort}`, 2000);
      const syncResult = await client.syncCollegeLifecycle({
        collegeId: 'clg-psg-01',
        status: 'Active',
        quotaAllocated: 6000,
        services: ['BEXO Portfolio', 'ATS Resume Engine'],
        updatedAt: new Date().toISOString(),
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.statusCode).toBe(200);

      // Verify the received headers
      expect(receivedAuth).toMatch(/^Bearer ey/);
      expect(receivedServiceToken).toMatch(/^ey/);
      expect(receivedBexoService).toBe('admin-panel');
      expect(receivedCorrelationId).toBeDefined();

      // Verify service token cryptographic claims
      const token = receivedAuth.replace('Bearer ', '');
      const verified = jwt.verify(token, env.SERVICE_AUTH_SECRET) as any;
      expect(verified.iss).toBe('bexo-admin-panel');
      expect(verified.aud).toBe('bexo-college-panel');
      expect(verified.role).toBe('corporate_sync');

      // Verify payload
      expect(receivedBody.collegeId).toBe('clg-psg-01');
      expect(receivedBody.status).toBe('Active');
      expect(receivedBody.quotaAllocated).toBe(6000);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('MobileAppClient safely handles downstream connection timeout without throwing uncaught exceptions', async () => {
    const client = new MobileAppClient('http://127.0.0.1:59999', 500);

    const health = await client.checkHealth();
    expect(health.success).toBe(false);
    expect(health.statusCode).toBe(503);

    const sync = await client.syncStudentEntitlement({
      studentId: 'stu-psg-001',
      collegeId: 'clg-psg-01',
      rollNumber: '21CS001',
      entitlementStatus: 'Suspended',
      reason: 'Institutional suspension',
    });

    expect(sync.success).toBe(false);
    expect(sync.statusCode).toBe(504);
  });
});
