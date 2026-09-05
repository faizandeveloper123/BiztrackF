import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  NotificationType,
  NotificationCategory,
  getCategoryDisplayName,
  type Notification,
} from '../../../models/notifications';
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
} from '../../../services/notifications/notificationsMobileApi';

type IonIconName = React.ComponentProps<typeof Ionicons>['name'];

const getIonIconForType = (type: NotificationType): IonIconName => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'checkmark-circle';
    case NotificationType.WARNING:
      return 'warning';
    case NotificationType.ERROR:
      return 'close-circle';
    case NotificationType.INFO:
      return 'information-circle';
    case NotificationType.SYSTEM:
      return 'settings';
    default:
      return 'notifications';
  }
};

const getIonIconForCategory = (cat: NotificationCategory): IonIconName => {
  switch (cat) {
    case NotificationCategory.HRM:
      return 'people';
    case NotificationCategory.INVENTORY:
      return 'cube';
    case NotificationCategory.CRM:
      return 'person-add';
    case NotificationCategory.PRODUCTION:
      return 'business';
    case NotificationCategory.QUALITY:
      return 'shield-checkmark';
    case NotificationCategory.MAINTENANCE:
      return 'construct';
    case NotificationCategory.LEDGER:
      return 'calculator';
    case NotificationCategory.SYSTEM:
      return 'settings';
    default:
      return 'notifications';
  }
};

const getTypeColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'text-green-600';
    case NotificationType.WARNING:
      return 'text-yellow-600';
    case NotificationType.ERROR:
      return 'text-red-600';
    case NotificationType.INFO:
      return 'text-blue-600';
    case NotificationType.SYSTEM:
      return 'text-gray-600';
    default:
      return 'text-slate-600';
  }
};

const getTypeBg = (type: NotificationType) => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'bg-green-50';
    case NotificationType.WARNING:
      return 'bg-yellow-50';
    case NotificationType.ERROR:
      return 'bg-red-50';
    case NotificationType.INFO:
      return 'bg-blue-50';
    case NotificationType.SYSTEM:
      return 'bg-gray-50';
    default:
      return 'bg-slate-50';
  }
};

export function MobileNotificationsScreen() {
  const { workspacePath, setSidebarActivePath, setWorkspacePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await getNotifications({ limit: 50 });
      setNotifications(res.notifications);
    } catch (e) {
      Alert.alert('Notifications', extractErrorMessage(e, 'Failed to load notifications'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/notifications',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load(true);
  }, [load]);

  const handleToggleRead = async (n: Notification) => {
    try {
      if (n.is_read) {
        await markAsUnread(n.id);
      } else {
        await markAsRead(n.id);
      }
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: !n.is_read } : item,
        ),
      );
    } catch (e) {
      Alert.alert('Error', extractErrorMessage(e, 'Action failed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      Alert.alert('Error', extractErrorMessage(e, 'Delete failed'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true })),
      );
    } catch (e) {
      Alert.alert('Error', extractErrorMessage(e, 'Action failed'));
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Notifications
        </Text>
        <View className="flex-row items-center">
          <Pressable
            className="p-2"
            onPress={() => setWorkspacePath('/notifications/settings')}
          >
            <Ionicons name="settings-outline" size={22} color="#64748b" />
          </Pressable>
          <Pressable className="p-2" onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={24} color="#2563eb" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="px-4 py-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-slate-600">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notifications`
                  : 'You are all caught up!'}
              </Text>
            </View>

            {notifications.length === 0 ? (
              <View className="mt-20 items-center justify-center">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="notifications-off-outline" size={40} color="#94a3b8" />
                </View>
                <Text className="mt-4 text-lg font-medium text-slate-900">No notifications</Text>
                <Text className="mt-1 text-center text-slate-500">
                  We'll let you know when something happens
                </Text>
              </View>
            ) : (
              notifications.map((n) => (
                <View
                  key={n.id}
                  className={`mb-3 rounded-2xl border ${
                    !n.is_read ? 'border-blue-100 bg-blue-50/50' : 'border-slate-100 bg-white'
                  } p-4 shadow-sm`}
                >
                  <View className="flex-row items-start space-x-3">
                    <View className={`h-10 w-10 items-center justify-center rounded-full ${getTypeBg(n.type)}`}>
                      <Ionicons
                        name={getIonIconForType(n.type)}
                        size={20}
                        className={getTypeColor(n.type)}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-semibold text-slate-900">{n.title}</Text>
                        {!n.is_read && <View className="h-2 w-2 rounded-full bg-blue-600" />}
                      </View>
                      <Text className="mt-1 text-sm text-slate-600">{n.message}</Text>
                      
                      <View className="mt-3 flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-2">
                           <View className="flex-row items-center rounded-full bg-slate-100 px-2 py-0.5">
                              <Ionicons name={getIonIconForCategory(n.category)} size={12} color="#64748b" />
                              <Text className="ml-1 text-xs font-medium text-slate-500">
                                {getCategoryDisplayName(n.category)}
                              </Text>
                           </View>
                           <Text className="text-xs text-slate-400">
                              {new Date(n.created_at).toLocaleDateString()}
                           </Text>
                        </View>
                        
                        <View className="flex-row items-center">
                          <Pressable
                            className={`mr-2 rounded-full px-4 py-1.5 ${
                              n.is_read ? 'bg-slate-100' : 'bg-blue-600'
                            }`}
                            onPress={() => void handleToggleRead(n)}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                n.is_read ? 'text-slate-600' : 'text-white'
                              }`}
                            >
                              {n.is_read ? 'Mark as Unread' : 'Mark as Read'}
                            </Text>
                          </Pressable>
                          <Pressable
                            className="h-8 w-8 items-center justify-center rounded-full bg-red-50"
                            onPress={() => void handleDelete(n.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
