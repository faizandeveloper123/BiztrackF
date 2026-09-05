"use client";

import React, { useEffect, useRef } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import NotificationItem from "./NotificationItem";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Check, X, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    loadNotifications,
  } = useNotifications();

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent notifications when dropdown opens
  useEffect(() => {
    loadNotifications({ limit: 10, page: 1 });
  }, [loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {}
  };

  const handleViewAll = () => {
    onClose();
    router.push("/notifications");
  };

  const handleSettings = () => {
    onClose();
    router.push("/notifications/settings");
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-2 flex w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(32rem,calc(100vh-5rem))] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div className="shrink-0 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({unreadCount} unread)
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettings}
              className="text-xs"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications yet</p>
            <p className="text-sm">
              We&apos;ll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={true}
                onAction={() => onClose()}
              />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <>
          <Separator className="shrink-0" />
          <div className="shrink-0 p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewAll}
              className="w-full"
            >
              View All Notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
