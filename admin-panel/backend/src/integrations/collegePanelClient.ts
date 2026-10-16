import crypto from 'node:crypto';
import { env } from '../config/env';
import { logger } from '../shared/utils/logger';
import { generateServiceToken } from './serviceAuth';
import { CollegeSyncPayload, DownstreamResponse } from './types';

export class CollegePanelClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl = env.COLLEGE_PANEL_API_URL, timeoutMs = 5000) {
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
      logger.warn({ err: err.message, correlationId }, 'College Panel health check unreachable');
      return { success: false, statusCode: 503, error: err.message };
    }
  }

  async syncCollegeLifecycle(payload: CollegeSyncPayload): Promise<DownstreamResponse> {
    const correlationId = crypto.randomUUID();
    const serviceToken = generateServiceToken('bexo-college-panel', ['lifecycle:sync']);
    const url = `${this.baseUrl}/api/v1/corporate/colleges/${payload.collegeId}/lifecycle-sync`;

    logger.info({ collegeId: payload.collegeId, correlationId }, 'Syncing college lifecycle to College Panel API');

    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
      attempts++;
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

        if (response.status >= 400 && response.status < 500) {
          // Client error: downstream endpoint rejected request; do not retry
          const errorJson = (await response.json().catch(() => ({}))) as any;
          return {
            success: false,
            statusCode: response.status,
            message: errorJson.message || 'Client rejection from College Panel',
          };
        }
      } catch (err: any) {
        if (attempts > maxRetries) {
          logger.warn({ err: err.message, correlationId, attempts }, 'College Panel sync unreachable after retries (non-blocking)');
          return { success: false, statusCode: 504, error: err.message };
        }
        await new Promise((r) => setTimeout(r, 200 * attempts));
      }
    }

    return { success: false, statusCode: 504, error: 'Request timed out' };
  }
}

export const collegePanelClient = new CollegePanelClient();
