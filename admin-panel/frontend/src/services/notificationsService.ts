import { apiClient, ApiResponse } from './apiClient';
import { mockAdapter } from './mockAdapter';
import { NotificationItem } from '../types';

export const notificationsService = {
  async getNotifications(): Promise<ApiResponse<NotificationItem[]>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getNotifications();
    }
    return apiClient.get<NotificationItem[]>('/notifications');
  },

  async markAsRead(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.markNotificationAsRead(id);
    }
    return apiClient.post<{ success: boolean }>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.markAllNotificationsAsRead();
    }
    return apiClient.post<{ success: boolean }>('/notifications/mark-all-read');
  },

  async clearNotification(id: string): Promise<ApiResponse<{ success: boolean }>> {
    if (apiClient.isDemoMode()) {
      return { success: true, data: { success: true } };
    }
    return apiClient.delete<{ success: boolean }>(`/notifications/${id}`);
  },
};
