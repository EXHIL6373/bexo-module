import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { SystemHealthMetric } from '../types';

export const systemHealthService = {
  async getSystemHealth(): Promise<ApiResponse<SystemHealthMetric[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getSystemHealth();
    }
    return apiClient.get<SystemHealthMetric[]>('/system/health');
  },
};
