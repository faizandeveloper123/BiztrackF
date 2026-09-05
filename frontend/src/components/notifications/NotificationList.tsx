"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import NotificationItem from "./NotificationItem";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Check, Filter, Search, RefreshCw } from "lucide-react";
import {
  NotificationCategory,
  NotificationType,
  getCategoryDisplayName,
} from "../../models/notifications";

export default function NotificationList() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const [filters, setFilters] = useState({
    is_read: undefined as boolean | undefined,
    category: undefined as NotificationCategory | undefined,
    type: undefined as NotificationType | undefined,
    search: "",
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadNotifications({ ...filters, page, limit: 20 });
  }, [filters, page, loadNotifications]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {}
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={
                  filters.is_read === undefined
                    ? "all"
                    : filters.is_read
                      ? "read"
                      : "unread"
                }
                onValueChange={(value) => {
                  const isRead = value === "all" ? undefined : value === "read";
                  handleFilterChange("is_read", isRead);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => {
                  const category =
                    value === "all"
                      ? undefined
                      : (value as NotificationCategory);
                  handleFilterChange("category", category);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(NotificationCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryDisplayName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => {
                  const type =
                    value === "all" ? undefined : (value as NotificationType);
                  handleFilterChange("type", type);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(NotificationType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filters.search ||
              filters.is_read !== undefined ||
              filters.category ||
              filters.type
                ? "No notifications match your filters"
                : "No notifications yet"}
            </h3>
            <p className="text-gray-500">
              {filters.search ||
              filters.is_read !== undefined ||
              filters.category ||
              filters.type
                ? "Try adjusting your filters to see more notifications"
                : "We'll notify you when something important happens"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={false}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredNotifications.length} notifications
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Badge variant="outline">{page}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={filteredNotifications.length < 20}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
