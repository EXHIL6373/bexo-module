import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { StaffUser, CollegeInvitation } from '../types';

export interface LoginResponse {
  token: string;
  user: StaffUser;
}

export interface OtpRequestResponse {
  challengeId: string;
  phoneNumber: string;
  maskedPhoneNumber: string;
  expiresInSeconds: number;
  debugOtp?: string;
}

export interface RolePersona {
  id: string;
  role: string;
  portal: 'admin' | 'college' | 'user';
  label: string;
  collegeId?: string | null;
  collegeName?: string | null;
  department?: string | null;
  isDefault?: boolean;
}

export interface AuthSuccessData {
  token?: string;
  user?: StaffUser | any;
  requiresRoleSelection?: boolean;
  preAuthToken?: string;
  availableRoles?: RolePersona[];
  requiresPhoneVerification?: boolean;
  preLinkToken?: string;
  isLinked?: boolean;
  phoneNumber?: string;
  maskedPhoneNumber?: string;
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

  // --- PHONE OTP, ROLE DISCOVERY & GOOGLE AUTH ---

  async requestOtp(phoneNumber: string, purpose = 'login'): Promise<ApiResponse<OtpRequestResponse>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.requestOtp(phoneNumber, purpose);
    }
    return apiClient.post<OtpRequestResponse>('/auth/otp/request', { phoneNumber, purpose });
  },

  async verifyOtp(challengeId: string, otp: string): Promise<ApiResponse<AuthSuccessData>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.verifyOtp(challengeId, otp);
    }
    return apiClient.post<AuthSuccessData>('/auth/otp/verify', { challengeId, otp });
  },

  async selectRole(preAuthToken: string, selectedRoleId: string): Promise<ApiResponse<AuthSuccessData>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.selectRole(preAuthToken, selectedRoleId);
    }
    return apiClient.post<AuthSuccessData>('/auth/select-role', { preAuthToken, selectedRoleId });
  },

  async verifyGoogle(idToken: string): Promise<ApiResponse<AuthSuccessData>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.verifyGoogle(idToken);
    }
    return apiClient.post<AuthSuccessData>('/auth/google/verify', { idToken });
  },

  async linkAccount(phoneNumber: string, idToken: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.linkAccount(phoneNumber, idToken);
    }
    return apiClient.post<{ success: boolean; message: string }>('/auth/link-account', { phoneNumber, idToken });
  },

  async completeGoogleLink(preLinkToken: string, phoneNumber: string): Promise<ApiResponse<AuthSuccessData>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.completeGoogleLink(preLinkToken, phoneNumber);
    }
    return apiClient.post<AuthSuccessData>('/auth/google/complete-link', { preLinkToken, phoneNumber });
  },
};
