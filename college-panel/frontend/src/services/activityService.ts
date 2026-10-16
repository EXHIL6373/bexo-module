/**
 * Activity Logs & Reports Service for BEXO College Panel
 * Scoped strictly to the authenticated college's own activity and operations.
 */

import { AuditLogItem } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export const activityService = {
  /**
   * Fetch activity and security audit trail for this college.
   */
  async getActivityLogs(): Promise<AuditLogItem[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getActivityLogs();
    }
    const res = await apiClient.get<AuditLogItem[]>('/college/activity');
    return res.data;
  },

  /**
   * Export institutional reports (CSV / XLSX format).
   */
  async exportReport(reportType: 'students' | 'provisioning' | 'entitlements'): Promise<string> {
    if (apiClient.isDemoMode()) {
      return `Report: ${reportType}\nGenerated: ${new Date().toISOString()}\n`;
    }
    const res = await apiClient.get<{ downloadUrl: string }>(`/college/reports/export`, {
      type: reportType,
    });
    return res.data.downloadUrl;
  },
};
