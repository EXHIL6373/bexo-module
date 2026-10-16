/**
 * Requests & Approvals Service for BEXO College Panel
 * Allows college staff to submit operational requests (quota increase, service activation, MOU renewal).
 */

import { ApprovalRequest } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export interface SubmitRequestInput {
  type: ApprovalRequest['type'];
  requester: string;
  requesterEmail: string;
  requesterRole: string;
  details: ApprovalRequest['details'];
  priority: ApprovalRequest['priority'];
}

export const requestsService = {
  /**
   * Fetch all requests submitted by the authenticated college.
   */
  async getRequests(): Promise<ApprovalRequest[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getRequests();
    }
    const res = await apiClient.get<ApprovalRequest[]>('/college/requests');
    return res.data;
  },

  /**
   * Submit an operational request for BEXO central administration review.
   */
  async submitRequest(input: SubmitRequestInput): Promise<ApprovalRequest> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.submitRequest(input);
    }
    const res = await apiClient.post<ApprovalRequest>('/college/requests', input);
    return res.data;
  },
};
