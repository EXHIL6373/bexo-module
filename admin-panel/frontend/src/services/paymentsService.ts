import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { PaymentInvoice } from '../types';

export const paymentsService = {
  async getPayments(collegeId?: string): Promise<ApiResponse<PaymentInvoice[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getPayments();
    }
    const params = collegeId ? { collegeId } : undefined;
    return apiClient.get<PaymentInvoice[]>('/payments', params);
  },

  async recordPayment(paymentData: Omit<PaymentInvoice, 'id'>): Promise<ApiResponse<PaymentInvoice>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.recordPayment(paymentData);
    }
    return apiClient.post<PaymentInvoice>('/payments', paymentData);
  },
};
