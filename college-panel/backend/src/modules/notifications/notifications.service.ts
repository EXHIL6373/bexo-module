import { store } from '../../db/store';

export class NotificationsService {
  async getNotifications(collegeId: string) {
    return store.getNotificationsByCollege(collegeId);
  }

  async markAsRead(id: string, collegeId: string) {
    await store.markNotificationRead(id, collegeId);
  }

  async markAllAsRead(collegeId: string) {
    await store.markAllNotificationsRead(collegeId);
  }

  async getAnnouncements(collegeId: string) {
    return store.getAnnouncementsForCollege(collegeId);
  }

  async getTasks(collegeId: string) {
    return store.getTasksByCollege(collegeId);
  }

  async toggleTask(id: string, collegeId: string) {
    return store.toggleTask(id, collegeId);
  }
}

export const notificationsService = new NotificationsService();
