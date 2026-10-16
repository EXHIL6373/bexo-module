import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { College, QuotaHistoryEntry } from '../types';

export interface CollegeFilters {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const collegesService = {
  async getColleges(filters?: CollegeFilters): Promise<ApiResponse<College[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getColleges();
    }
    return apiClient.get<College[]>('/colleges', filters as Record<string, string | number>);
  },

  async getCollegeById(id: string): Promise<ApiResponse<College>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getCollegeById(id);
    }
    return apiClient.get<College>(`/colleges/${id}`);
  },

  async createCollege(collegeData: Omit<College, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt'>): Promise<ApiResponse<College>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.createCollege(collegeData);
    }
    return apiClient.post<College>('/colleges', collegeData);
  },

  async updateCollege(id: string, updates: Partial<College>): Promise<ApiResponse<College>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateCollege(id, updates);
    }
    return apiClient.patch<College>(`/colleges/${id}`, updates);
  },

  async suspendCollege(id: string, reason: string): Promise<ApiResponse<College>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.suspendCollege(id, reason);
    }
    return apiClient.post<College>(`/colleges/${id}/suspend`, { reason });
  },

  async reactivateCollege(id: string, reason?: string): Promise<ApiResponse<College>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.reactivateCollege(id);
    }
    return apiClient.post<College>(`/colleges/${id}/reactivate`, { reason });
  },

  async updateQuota(collegeId: string, newAllocated: number, reason: string): Promise<ApiResponse<QuotaHistoryEntry>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateQuota(collegeId, newAllocated, reason);
    }
    return apiClient.post<QuotaHistoryEntry>(`/colleges/${collegeId}/quota`, { allocated: newAllocated, reason });
  },

  async getQuotaHistory(collegeId?: string): Promise<ApiResponse<QuotaHistoryEntry[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getQuotaHistory(collegeId);
    }
    const endpoint = collegeId ? `/colleges/${collegeId}/quota-history` : '/colleges/quota-history';
    return apiClient.get<QuotaHistoryEntry[]>(endpoint);
  },

  async toggleCollegeService(collegeId: string, serviceId: string, enabled: boolean): Promise<ApiResponse<College>> {
    if (apiClient.isDemoMode()) {
      const res = await mockAdapter.getCollegeById(collegeId);
      const college = res.data;
      const updatedServices = college.services.map((s) =>
        s.serviceId === serviceId ? { ...s, isEnabled: enabled, activatedAt: enabled ? new Date().toISOString() : s.activatedAt } : s
      );
      return mockAdapter.updateCollege(collegeId, { services: updatedServices });
    }
    return apiClient.post<College>(`/colleges/${collegeId}/services/${serviceId}/toggle`, { enabled });
  },
};
