/**
 * Authentication Service for BEXO College Panel
 * Handles institutional login, session restore, token validation, password reset & activation,
 * as well as Phone OTP, Google Sign-In & Role Selection.
 */

import { StaffUser, College, CollegeInvitation } from '../types';
import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';

export interface AuthSessionResponse {
  token: string;
  user: StaffUser;
  college: College;
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
  college?: College | any;
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
  /**
   * Authenticate institutional credentials through backend API.
   * If VITE_DEMO_MODE=true, operates against the in-memory mockAdapter.
   */
  async login(email: string, password?: string): Promise<AuthSessionResponse> {
    if (apiClient.isDemoMode()) {
      const res = await mockAdapter.login(email, password);
      apiClient.setToken(res.token);
      return res;
    }

    const res = await apiClient.post<AuthSessionResponse>('/auth/college-login', {
      email: email.trim().toLowerCase(),
      password,
    });

    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }

    return res.data;
  },

  /**
   * Fetch authenticated user identity and institutional college details.
   */
  async getMe(): Promise<{ user: StaffUser; college: College }> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getMe();
    }

    const res = await apiClient.get<{ user: StaffUser; college: College }>('/auth/me');
    return res.data;
  },

  /**
   * Safely terminate active session and invalidate server-side token.
   */
  async logout(): Promise<void> {
    try {
      if (apiClient.isDemoMode()) {
        await mockAdapter.logout();
      } else {
        await apiClient.post('/auth/logout');
      }
    } finally {
      apiClient.clearToken();
    }
  },

  /**
   * Validate onboarding invitation token.
   */
  async validateInvitation(token: string): Promise<{ valid: boolean; error?: string; invitation?: CollegeInvitation }> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.validateInvitation(token);
    }

    const res = await apiClient.get<{ valid: boolean; invitation?: CollegeInvitation }>(
      '/auth/invitations/validate',
      { token }
    );
    return { valid: res.data.valid, invitation: res.data.invitation };
  },

  /**
   * Activate staff account with single-use invitation token.
   */
  async activateAccount(token: string, password: string): Promise<{ user: StaffUser; college: College }> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.activateAccount(token, password);
    }

    const res = await apiClient.post<AuthSessionResponse>('/auth/activate-account', {
      token,
      password,
    });

    if (res.data?.token) {
      apiClient.setToken(res.data.token);
    }

    return { user: res.data.user, college: res.data.college };
  },

  /**
   * Request password reset instructions via email.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; token?: string }> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.requestPasswordReset(email);
    }

    const res = await apiClient.post<{ message: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return { success: res.success };
  },

  /**
   * Validate password reset token.
   */
  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.validateResetToken(token);
    }

    const res = await apiClient.get<{ valid: boolean; email?: string }>(
      '/auth/reset-password/validate',
      { token }
    );
    return { valid: res.data.valid, email: res.data.email };
  },

  /**
   * Complete password reset with token.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.resetPassword(token, newPassword);
    }

    await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
  },

  // --- PHONE OTP, ROLE DISCOVERY & GOOGLE SIGN-IN ---

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
