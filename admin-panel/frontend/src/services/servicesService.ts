import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { PlatformService } from '../types';

export const servicesService = {
  async getPlatformServices(): Promise<ApiResponse<PlatformService[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getServices();
    }
    return apiClient.get<PlatformService[]>('/services');
  },

  async toggleGlobalService(serviceId: string): Promise<ApiResponse<PlatformService>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.toggleGlobalService(serviceId);
    }
    return apiClient.post<PlatformService>(`/services/${serviceId}/toggle-global`);
  },
};
