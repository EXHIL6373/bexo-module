import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { StaffUser, CollegeInvitation } from '../types';

export interface CreateInvitationPayload {
  email: string;
  fullName: string;
  phone?: string;
  designation: string;
  collegeId?: string;
  collegeName?: string;
  role: string;
}

export const usersService = {
  async getStaffUsers(collegeId?: string): Promise<ApiResponse<StaffUser[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getStaffUsers();
    }
    const params = collegeId ? { collegeId } : undefined;
    return apiClient.get<StaffUser[]>('/users/staff', params);
  },

  async addStaffUser(userData: Omit<StaffUser, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<ApiResponse<StaffUser>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.addStaffUser(userData);
    }
    return apiClient.post<StaffUser>('/users/staff', userData);
  },

  async updateStaffUser(id: string, updates: Partial<StaffUser>): Promise<ApiResponse<StaffUser>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateStaffUser(id, updates);
    }
    return apiClient.patch<StaffUser>(`/users/staff/${id}`, updates);
  },

  async deleteStaffUser(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.deleteStaffUser(id);
    }
    return apiClient.delete<{ success: boolean }>(`/users/staff/${id}`);
  },

  async createInvitation(payload: CreateInvitationPayload): Promise<ApiResponse<CollegeInvitation>> {
    if (apiClient.isDemoMode()) {
      const invite: CollegeInvitation = {
        id: `inv-${Date.now()}`,
        token: `inv_token_${Math.random().toString(36).substring(2, 12)}`,
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone,
        designation: payload.designation,
        collegeId: payload.collegeId || '',
        collegeName: payload.collegeName || 'Administration',
        role: payload.role as any,
        invitedBy: 'Central Administration',
        invitedByRole: 'super_admin',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        status: 'INVITED',
      };
      return { success: true, data: invite };
    }
    return apiClient.post<CollegeInvitation>('/invitations', payload);
  },

  async resendInvitation(invitationId: string): Promise<ApiResponse<CollegeInvitation>> {
    if (apiClient.isDemoMode()) {
      return {
        success: true,
        data: {
          id: invitationId,
          token: `inv_resend_${Date.now()}`,
          email: 'recipient@college.edu',
          fullName: 'Staff Member',
          designation: 'Coordinator',
          collegeId: 'clg-01',
          collegeName: 'Institution',
          role: 'college_admin',
          invitedBy: 'Central Administration',
          invitedByRole: 'super_admin',
          invitedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'INVITED',
        },
      };
    }
    return apiClient.post<CollegeInvitation>(`/invitations/${invitationId}/resend`);
  },

  async revokeInvitation(invitationId: string, reason?: string): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return { success: true, data: { success: true } };
    }
    return apiClient.post<{ success: boolean }>(`/invitations/${invitationId}/revoke`, { reason });
  },
};
