import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { ApprovalRequest, ApprovalStatus } from '../types';

export const approvalsService = {
  async getApprovals(status?: ApprovalStatus): Promise<ApiResponse<ApprovalRequest[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getApprovals();
    }
    const params = status ? { status } : undefined;
    return apiClient.get<ApprovalRequest[]>('/approvals', params);
  },

  async approveRequest(id: string, decisionReason: string): Promise<ApiResponse<ApprovalRequest>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.approveRequest(id, decisionReason);
    }
    return apiClient.post<ApprovalRequest>(`/approvals/${id}/approve`, { decisionReason });
  },

  async rejectRequest(id: string, decisionReason: string): Promise<ApiResponse<ApprovalRequest>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.rejectRequest(id, decisionReason);
    }
    return apiClient.post<ApprovalRequest>(`/approvals/${id}/reject`, { decisionReason });
  },

  async submitRequest(requestData: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<ApiResponse<ApprovalRequest>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.submitRequest(requestData);
    }
    return apiClient.post<ApprovalRequest>('/approvals', requestData);
  },
};
