import { apiService } from '../ApiService';
import type {
  NotificationPreference,
  NotificationPreferenceUpdate,
} from '../../models/notifications';

export async function getNotificationPreferences(): Promise<
  NotificationPreference[]
> {
  const res = await apiService.get<{ preferences: NotificationPreference[] }>(
    '/notifications/preferences',
  );
  return res.preferences ?? [];
}

export async function updateNotificationPreference(
  body: NotificationPreferenceUpdate,
): Promise<void> {
  await apiService.put('/notifications/preferences', body);
}
