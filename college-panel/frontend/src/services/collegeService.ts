/**
 * College Institutional Service
 * Manages institutional profile, settings, agreement, and billing.
 */

import { College, PaymentInvoice } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export const collegeService = {
  /**
   * Fetch authenticated college profile.
   * Scoped strictly by server identity - no collegeId parameter is needed.
   */
  async getMyCollege(): Promise<College> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getMyCollege();
    }
    const res = await apiClient.get<College>('/college/profile');
    return res.data;
  },

  /**
   * Update permitted college profile settings (address, phone, contact).
   */
  async updateSettings(updates: Partial<College>): Promise<College> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateCollegeSettings(updates);
    }
    const res = await apiClient.patch<College>('/college/settings', updates);
    return res.data;
  },

  /**
   * Fetch institutional invoices and billing information.
   */
  async getBilling(): Promise<PaymentInvoice[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getBilling();
    }
    const res = await apiClient.get<PaymentInvoice[]>('/college/billing');
    return res.data;
  },
};
