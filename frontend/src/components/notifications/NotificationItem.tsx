"use client";

import React from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Notification,
  getCategoryDisplayName,
  getCategoryIcon,
  getNotificationTargetHref,
  getNotificationTypeColor,
  getNotificationTypeIcon,
  resolveNotificationActionPath,
} from "../../models/notifications";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Check,
  X,
  Clock,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Bell,
  FolderOpen,
  Users,
  Package,
  UserCheck,
  Factory,
  Shield,
  Wrench,
  Calculator,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onAction?: () => void;
}

const iconMap = {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Settings,
  Bell,
  FolderOpen,
  Users,
  Package,
  UserCheck,
  Factory,
  Shield,
  Wrench,
  Calculator,
};

export default function NotificationItem({
  notification,
  compact = false,
  onAction,
}: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, markAsUnread, deleteNotification } = useNotifications();

  const handleMarkAsRead = async () => {
    try {
      if (notification.is_read) {
        await markAsUnread(notification.id);
      } else {
        await markAsRead(notification.id);
      }
    } catch (error) {}
  };

  const handleDelete = async () => {
    try {
      await deleteNotification(notification.id);
    } catch (error) {}
  };

  const handleActionClick = () => {
    const rawHref = getNotificationTargetHref(notification);
    if (!rawHref) {
      return;
    }
    const resolvedPath = resolveNotificationActionPath(rawHref);
    const go = () => {
      try {
        if (/^https?:\/\//i.test(resolvedPath)) {
          const u = new URL(resolvedPath);
          if (u.origin === window.location.origin) {
            router.push(u.pathname + u.search + u.hash);
          } else {
            window.open(resolvedPath, "_blank", "noopener,noreferrer");
          }
        } else {
          const path = resolvedPath.startsWith("/")
            ? resolvedPath
            : `/${resolvedPath}`;
          router.push(path);
        }
      } catch {
        window.open(rawHref, "_blank", "noopener,noreferrer");
      }
      onAction?.();
    };
    if (!notification.is_read) {
      markAsRead(notification.id).then(go).catch(go);
    } else {
      go();
    }
  };

  const detailHref = getNotificationTargetHref(notification);

  const typeColor = getNotificationTypeColor(notification.type);
  const typeIconName = getNotificationTypeIcon(notification.type);
  const categoryIconName = getCategoryIcon(notification.category);
  const TypeIcon = iconMap[typeIconName as keyof typeof iconMap] || Bell;
  const CategoryIcon =
    iconMap[categoryIconName as keyof typeof iconMap] || Bell;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  if (compact) {
    return (
      <div
        className={`p-3 hover:bg-gray-50 transition-colors ${!notification.is_read ? "bg-blue-50" : ""}`}
      >
        <div className="flex items-start space-x-3">
          <div className={`p-1.5 rounded-full ${typeColor}`}>
            <TypeIcon className="h-3 w-3" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </p>
              <div className="flex items-center space-x-1 ml-2">
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-6 w-6 p-0"
                >
                  {notification.is_read ? (
                    <Check className="h-3 w-3 text-gray-400" />
                  ) : (
                    <Check className="h-3 w-3 text-blue-500" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <CategoryIcon className="h-2 w-2 mr-1" />
                  {getCategoryDisplayName(notification.category)}
                </Badge>
                <span className="text-xs text-gray-400">{timeAgo}</span>
              </div>

              {detailHref && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleActionClick}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
        !notification.is_read
          ? "bg-blue-50/60 hover:bg-blue-50"
          : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeColor}`}
      >
        <TypeIcon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {!notification.is_read && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
              <h4
                className={`truncate text-sm ${
                  notification.is_read
                    ? "font-medium text-gray-700"
                    : "font-semibold text-gray-900"
                }`}
              >
                {notification.title}
              </h4>
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
              {notification.message}
            </p>
          </div>

          <div className="flex shrink-0 items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              title={
                notification.is_read ? "Mark as unread" : "Mark as read"
              }
              className="h-7 w-7 p-0"
            >
              {notification.is_read ? (
                <Check className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <Check className="h-3.5 w-3.5 text-blue-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              title="Delete"
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <CategoryIcon className="h-3 w-3" />
            {getCategoryDisplayName(notification.category)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          {notification.read_at && (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Read{" "}
              {formatDistanceToNow(new Date(notification.read_at), {
                addSuffix: true,
              })}
            </span>
          )}
          {detailHref && (
            <button
              type="button"
              onClick={handleActionClick}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
