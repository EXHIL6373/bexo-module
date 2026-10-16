/**
 * Notifications, Announcements & Tasks Service for BEXO College Panel
 */

import { NotificationItem, CollegeAnnouncement, CollegeTask } from '../types';
import { apiClient } from './apiClient';
import { mockAdapter } from './mockAdapter';

export const notificationsService = {
  /**
   * Fetch scoped college notifications.
   */
  async getNotifications(): Promise<NotificationItem[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getNotifications();
    }
    const res = await apiClient.get<NotificationItem[]>('/college/notifications');
    return res.data;
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: string): Promise<void> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.markNotificationRead(id);
    }
    await apiClient.patch(`/college/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.markAllNotificationsRead();
    }
    await apiClient.post('/college/notifications/read-all');
  },

  /**
   * Fetch announcements targeted to this college or all institutions.
   */
  async getAnnouncements(): Promise<CollegeAnnouncement[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getAnnouncements();
    }
    const res = await apiClient.get<CollegeAnnouncement[]>('/college/announcements');
    return res.data;
  },

  /**
   * Fetch operational tasks and deadlines.
   */
  async getTasks(): Promise<CollegeTask[]> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.getTasks();
    }
    const res = await apiClient.get<CollegeTask[]>('/college/tasks');
    return res.data;
  },

  /**
   * Toggle task completion status.
   */
  async toggleTask(id: string): Promise<CollegeTask> {
    if (apiClient.isDemoMode()) {
      return mockAdapter.toggleTask(id);
    }
    const res = await apiClient.patch<CollegeTask>(`/college/tasks/${id}/toggle`);
    return res.data;
  },
};
