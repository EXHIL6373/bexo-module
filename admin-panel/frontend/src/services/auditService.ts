import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { AuditLogItem } from '../types';

export const auditService = {
  async getAuditLogs(entity?: string): Promise<ApiResponse<AuditLogItem[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getAuditLogs();
    }
    const params = entity ? { entity } : undefined;
    return apiClient.get<AuditLogItem[]>('/audit/logs', params);
  },

  async logAction(logData: Omit<AuditLogItem, 'id' | 'timestamp'>): Promise<ApiResponse<AuditLogItem>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.logAction(logData);
    }
    return apiClient.post<AuditLogItem>('/audit/logs', logData);
  },
};
