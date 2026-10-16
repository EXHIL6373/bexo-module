import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { ProvisioningJob } from '../types';

export interface ProvisioningBatchPayload {
  collegeId: string;
  source: 'Roll Number Range' | 'CSV Upload' | 'Manual Batch';
  startRoll?: string;
  endRoll?: string;
  batchSize?: number;
}

export const provisioningService = {
  async getProvisioningJobs(collegeId?: string): Promise<ApiResponse<ProvisioningJob[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getProvisioningJobs();
    }
    const params = collegeId ? { collegeId } : undefined;
    return apiClient.get<ProvisioningJob[]>('/provisioning/jobs', params);
  },

  async triggerProvisioningBatch(payload: ProvisioningBatchPayload): Promise<ApiResponse<ProvisioningJob>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.triggerProvisioningBatch(
        payload.collegeId,
        payload.source,
        payload.batchSize || 50
      );
    }
    return apiClient.post<ProvisioningJob>('/provisioning/batch', payload);
  },

  async getJobById(jobId: string): Promise<ApiResponse<ProvisioningJob>> {
    if (apiClient.isDemoMode()) {
      const res = await mockAdapter.getProvisioningJobs();
      const job = res.data.find((j) => j.id === jobId);
      if (!job) throw new Error('Provisioning job not found');
      return { success: true, data: job };
    }
    return apiClient.get<ProvisioningJob>(`/provisioning/jobs/${jobId}`);
  },
};
