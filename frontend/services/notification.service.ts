import { api } from './api';

export type Notification = {
  _id: string;
  type: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  success: boolean;
  data: Notification[];
};

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<NotificationsResponse>('/notifications');
  return data.data;
}

export async function markNotificationAsRead(notificationId: string) {
  await api.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead() {
  await api.patch('/notifications/read-all');
}
