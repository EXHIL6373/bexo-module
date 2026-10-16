/**
 * Provisioning & Entitlements Service for BEXO College Panel
 * Handles batch student access granting, async job tracking, retry execution, and student entitlements.
 */

import { ProvisioningJob, StudentEntitlement } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export interface ProvisioningResult {
  job: ProvisioningJob;
  successful: number;
  failed: number;
  skipped: number;
}

export const provisioningService = {
  /**
   * Fetch all provisioning jobs executed for the authenticated college.
   */
  async getJobs(): Promise<ProvisioningJob[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getProvisioningJobs();
    }
    const res = await apiClient.get<ProvisioningJob[]>('/college/provisioning/jobs');
    return res.data;
  },

  /**
   * Fetch details of a specific provisioning batch.
   */
  async getJobById(id: string): Promise<ProvisioningJob> {
    if (apiClient.isDemoMode()) {
      const jobs = await mockAdapter.getProvisioningJobs();
      const job = jobs.find((j) => j.id === id);
      if (!job) throw new Error('Provisioning job not found');
      return job;
    }
    const res = await apiClient.get<ProvisioningJob>(`/college/provisioning/jobs/${id}`);
    return res.data;
  },

  /**
   * Grant student access to a platform service (e.g., BEXO Portfolio or ATS Resume Builder).
   * Server validates remaining quota, updates college usage, and creates an audited provisioning job.
   */
  async triggerProvisioning(studentIds: string[], serviceName: string): Promise<ProvisioningResult> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.triggerProvisioning(studentIds, serviceName);
    }
    const res = await apiClient.post<ProvisioningResult>('/college/provisioning/jobs', {
      studentIds,
      serviceName,
    });
    return res.data;
  },

  /**
   * Retry failed records from a previous provisioning batch.
   */
  async retryJob(jobId: string): Promise<{ success: boolean; retriedCount: number }> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.retryProvisioningJob(jobId);
    }
    const res = await apiClient.post<{ success: boolean; retriedCount: number }>(
      `/college/provisioning/jobs/${jobId}/retry`
    );
    return res.data;
  },

  /**
   * Fetch active service entitlements for students of the authenticated college.
   */
  async getEntitlements(): Promise<StudentEntitlement[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getEntitlements();
    }
    const res = await apiClient.get<StudentEntitlement[]>('/college/entitlements');
    return res.data;
  },
};
