import crypto from 'node:crypto';
import { env } from '../config/env';
import { logger } from '../shared/utils/logger';
import { generateServiceToken } from './serviceAuth';
import { StudentEntitlementSyncPayload, DownstreamResponse } from './types';

export class MobileAppClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl = env.MOBILE_APP_API_URL, timeoutMs = 5000) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async checkHealth(): Promise<DownstreamResponse<{ status: string }>> {
    const correlationId = crypto.randomUUID();
    const url = `${this.baseUrl}/health`;
    try {
      const response = await this.fetchWithTimeout(url, {
        headers: { 'X-Correlation-ID': correlationId },
      });
      if (response.ok) {
        return { success: true, statusCode: response.status, data: { status: 'healthy' } };
      }
      return { success: false, statusCode: response.status, error: `Status ${response.status}` };
    } catch (err: any) {
      logger.warn({ err: err.message, correlationId }, 'Mobile backend health check unreachable');
      return { success: false, statusCode: 503, error: err.message };
    }
  }

  async syncStudentEntitlement(payload: StudentEntitlementSyncPayload): Promise<DownstreamResponse> {
    const correlationId = crypto.randomUUID();
    const serviceToken = generateServiceToken('bexo-mobile-backend', ['entitlements:sync']);
    const url = `${this.baseUrl}/api/v1/internal/entitlements/sync`;

    logger.info({ studentId: payload.studentId, correlationId }, 'Syncing student entitlement to Mobile backend');

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceToken}`,
          'X-Service-Token': serviceToken,
          'X-Correlation-ID': correlationId,
          'X-Bexo-Service': 'admin-panel',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json = await response.json().catch(() => ({}));
        return { success: true, statusCode: response.status, data: json };
      }

      return { success: false, statusCode: response.status, error: 'Mobile service error' };
    } catch (err: any) {
      logger.warn({ err: err.message, correlationId }, 'Failed to communicate with Mobile App Backend (non-blocking)');
      return { success: false, statusCode: 504, error: err.message };
    }
  }
}

export const mobileAppClient = new MobileAppClient();
