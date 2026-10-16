import { repository } from '../../db/repository';

export class NotificationsService {
  async getNotifications() {
    return await repository.getAllNotifications();
  }

  async markAsRead(id: string) {
    await repository.markNotificationRead(id);
    return { success: true };
  }

  async markAllAsRead() {
    await repository.markAllNotificationsRead();
    return { success: true };
  }

  async deleteNotification(id: string) {
    await repository.deleteNotification(id);
    return { success: true };
  }
}

export const notificationsService = new NotificationsService();
