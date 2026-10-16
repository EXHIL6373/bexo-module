/**
 * Staff & Role Management Service for BEXO College Panel
 * Manages authorized institutional team members, invitations, status and profile settings.
 * Strictly prevents assigning corporate administrative roles.
 */

import { StaffUser, Role, CollegeInvitation } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export interface InviteStaffInput {
  name: string;
  email: string;
  role: Role;
  department?: string;
  designation?: string;
  mobile?: string;
}

export const staffService = {
  /**
   * Fetch all staff members belonging to the authenticated college.
   */
  async getStaff(): Promise<StaffUser[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getStaff();
    }
    const res = await apiClient.get<StaffUser[]>('/college/staff');
    return res.data;
  },

  /**
   * Invite a new staff member or department coordinator.
   */
  async inviteStaff(input: InviteStaffInput): Promise<CollegeInvitation> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.inviteStaff(input);
    }
    const res = await apiClient.post<CollegeInvitation>('/college/staff/invite', input);
    return res.data;
  },

  /**
   * Resend onboarding invitation email.
   */
  async resendInvite(invitationId: string): Promise<CollegeInvitation> {
    if (apiClient.isDemoMode()) {
      const invites = mockAdapter.getOutboxEmails();
      return mockAdapter.inviteStaff({
        name: 'Staff Member',
        email: 'staff@college.edu',
        role: 'college_staff',
      });
    }
    const res = await apiClient.post<CollegeInvitation>(`/college/staff/invitations/${invitationId}/resend`);
    return res.data;
  },

  /**
   * Revoke a pending invitation.
   */
  async revokeInvite(invitationId: string, reason?: string): Promise<void> {
    if (apiClient.isDemoMode()) {
      return;
    }
    await apiClient.post(`/college/staff/invitations/${invitationId}/revoke`, { reason });
  },

  /**
   * Update institutional role for a staff member.
   */
  async updateStaffRole(staffId: string, newRole: Role): Promise<StaffUser> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.updateStaffRole(staffId, newRole);
    }
    const res = await apiClient.patch<StaffUser>(`/college/staff/${staffId}/role`, { role: newRole });
    return res.data;
  },

  /**
   * Suspend staff member's access.
   */
  async suspendStaff(staffId: string, reason?: string): Promise<StaffUser> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.suspendStaff(staffId, reason);
    }
    const res = await apiClient.post<StaffUser>(`/college/staff/${staffId}/suspend`, { reason });
    return res.data;
  },

  /**
   * Restore suspended staff member's access.
   */
  async activateStaff(staffId: string): Promise<StaffUser> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.activateStaff(staffId);
    }
    const res = await apiClient.post<StaffUser>(`/college/staff/${staffId}/activate`);
    return res.data;
  },

  /**
   * Update current user's profile details.
   */
  async updateProfile(updates: { name?: string; phone?: string; designation?: string; department?: string }): Promise<StaffUser> {
    if (apiClient.isDemoMode()) {
      const { user } = mockAdapter.getSession();
      if (!user) throw new Error('Not authenticated');
      const updated: StaffUser = { ...user, ...updates };
      mockAdapter.setSession(mockAdapter.getSession().token, updated);
      return updated;
    }
    const res = await apiClient.patch<StaffUser>('/college/staff/me', updates);
    return res.data;
  },

  /**
   * Change password for the authenticated user.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (apiClient.isDemoMode()) {
      return;
    }
    await apiClient.post('/college/staff/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
