"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import NotificationService from "../services/NotificationService";
import { extractErrorMessage } from "../utils/errorUtils";
import {
  Notification,
  NotificationFilters,
  NotificationPreference,
  NotificationPreferenceUpdate,
} from "../models/notifications";

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreference[];

  // Actions
  loadNotifications: (filters?: NotificationFilters) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreference: (preference: NotificationPreferenceUpdate) => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Real-time updates
  addNotification: (notification: Notification) => void;
  updateNotification: (
    notificationId: string,
    updates: Partial<Notification>,
  ) => void;
  removeNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, currentTenant } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  // Load notifications with filters
  const loadNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      if (!user || !currentTenant) return;

      try {
        setLoading(true);
        setError(null);
        const response = await NotificationService.getNotifications(filters);
        setNotifications(response.notifications);
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to load notifications"));
      } finally {
        setLoading(false);
      }
    },
    [user, currentTenant],
  );

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user || !currentTenant) return;

    try {
      const response = await NotificationService.getUnreadCount();
      setUnreadCount(response.unread_count);
    } catch (err: any) {}
  }, [user, currentTenant]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user || !currentTenant) return;

    try {
      const response = await NotificationService.getNotificationPreferences();
      setPreferences(response.preferences);
    } catch (err: any) {}
  }, [user, currentTenant]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to mark notification as read"));
      throw err;
    }
  }, []);

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsUnread(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: false, read_at: undefined }
            : notification,
        ),
      );

      // Update unread count
      setUnreadCount((prev) => prev + 1);
    } catch (err: any) {
      setError(
        extractErrorMessage(err, "Failed to mark notification as unread"),
      );
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (err: any) {
      setError(
        extractErrorMessage(err, "Failed to mark all notifications as read"),
      );
      throw err;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await NotificationService.deleteNotification(notificationId);

        // Update local state
        const deletedNotification = notifications.find(
          (n) => n.id === notificationId,
        );
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId),
        );

        // Update unread count if deleted notification was unread
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to delete notification"));
        throw err;
      }
    },
    [notifications],
  );

  // Update preference
  const updatePreference = useCallback(
    async (preference: NotificationPreferenceUpdate) => {
      try {
        await NotificationService.updateNotificationPreference(preference);

        // Update local state
        setPreferences((prev) =>
          prev.map((pref) =>
            pref.category === preference.category
              ? { ...pref, ...preference }
              : pref,
          ),
        );
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update preference"));
        throw err;
      }
    },
    [],
  );

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  // Real-time update methods
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const updateNotification = useCallback(
    (notificationId: string, updates: Partial<Notification>) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, ...updates }
            : notification,
        ),
      );
    },
    [],
  );

  const removeNotification = useCallback(
    (notificationId: string) => {
      const deletedNotification = notifications.find(
        (n) => n.id === notificationId,
      );
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [notifications],
  );

  // Initial load
  useEffect(() => {
    if (user && currentTenant) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    }
  }, [
    user,
    currentTenant,
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
  ]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user || !currentTenant) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, currentTenant, loadUnreadCount]);

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    preferences,

    // Actions
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    updatePreference,
    refreshNotifications,

    // Real-time updates
    addNotification,
    updateNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
