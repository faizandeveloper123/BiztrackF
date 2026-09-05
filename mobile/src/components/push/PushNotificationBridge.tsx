import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebarDrawer } from '../../contexts/SidebarDrawerContext';
import {
  registerAndSyncPushTokenWithBackend,
  resolveNotificationActionPath,
} from '../../services/push/expoPush';

export function PushNotificationBridge() {
  const { isAuthenticated, currentTenant } = useAuth();
  const { navigateMenuPath } = useSidebarDrawer();
  const navigateRef = useRef(navigateMenuPath);
  navigateRef.current = navigateMenuPath;

  useEffect(() => {
    if (!isAuthenticated) return;
    void registerAndSyncPushTokenWithBackend();
  }, [isAuthenticated, currentTenant?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const path = resolveNotificationActionPath(response);
      if (path) {
        void navigateRef.current(path);
      }
    };

    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (last) {
        handleResponse(last);
      }
    });

    const sub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void registerAndSyncPushTokenWithBackend();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [isAuthenticated]);

  return null;
}
