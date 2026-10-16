import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { StaffUser, CollegeInvitation } from '../types';

export interface LoginResponse {
  token: string;
  user: StaffUser;
}

export const authService = {
  async login(email: string, password?: string): Promise<ApiResponse<LoginResponse>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.login(email, password);
    }
    return apiClient.post<LoginResponse>('/auth/login', { email, password });
  },

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    apiClient.clearToken();
    if (apiClient.isDemoMode()) {
      return { success: true, data: { success: true } };
    }
    try {
      return await apiClient.post<{ success: boolean }>('/auth/logout');
    } catch {
      // Local session token already removed
      return { success: true, data: { success: true } };
    }
  },

  async getProfile(): Promise<ApiResponse<StaffUser>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getProfile('usr-super-kavin');
    }
    return apiClient.get<StaffUser>('/auth/me');
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<{ token?: string }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.requestPasswordReset(email);
    }
    return apiClient.post<{ token?: string }>('/auth/forgot-password', { email });
  },

  async validateResetToken(token: string): Promise<ApiResponse<{ valid: boolean; email?: string }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.validateResetToken(token);
    }
    return apiClient.get<{ valid: boolean; email?: string }>(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
  },

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.resetPassword(token, newPassword);
    }
    return apiClient.post<{ success: boolean }>('/auth/reset-password', { token, newPassword });
  },

  async validateInviteToken(token: string): Promise<ApiResponse<{ valid: boolean; invitation?: CollegeInvitation }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.validateInviteToken(token);
    }
    return apiClient.get<{ valid: boolean; invitation?: CollegeInvitation }>(`/auth/invitations/validate?token=${encodeURIComponent(token)}`);
  },

  async activateAccount(token: string, password: string): Promise<ApiResponse<{ user: StaffUser }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.activateAccount(token, password);
    }
    return apiClient.post<{ user: StaffUser }>('/auth/activate-account', { token, password });
  },
};
