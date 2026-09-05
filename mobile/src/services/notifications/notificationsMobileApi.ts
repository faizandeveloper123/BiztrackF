import { apiService } from '../ApiService';
import type {
  NotificationListResponse,
  UnreadCountResponse,
  NotificationFilters,
} from '../../models/notifications';

export async function getNotifications(
  filters: NotificationFilters = {},
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.is_read !== undefined)
    params.append('is_read', filters.is_read.toString());
  if (filters.category) params.append('category', filters.category);
  if (filters.type) params.append('type', filters.type);

  const queryString = params.toString();
  const url = queryString ? `/notifications?${queryString}` : '/notifications';

  return apiService.get<NotificationListResponse>(url);
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiService.get<UnreadCountResponse>('/notifications/unread-count');
}

export async function markAsRead(
  notificationId: string,
): Promise<{ message: string }> {
  return apiService.put<{ message: string }>(
    `/notifications/${notificationId}/read`,
  );
}

export async function markAsUnread(
  notificationId: string,
): Promise<{ message: string }> {
  return apiService.put<{ message: string }>(
    `/notifications/${notificationId}/unread`,
  );
}

export async function markAllAsRead(): Promise<{ message: string }> {
  return apiService.post<{ message: string }>('/notifications/mark-all-read');
}

export async function deleteNotification(
  notificationId: string,
): Promise<{ message: string }> {
  return apiService.delete<{ message: string }>(`/notifications/${notificationId}`);
}
