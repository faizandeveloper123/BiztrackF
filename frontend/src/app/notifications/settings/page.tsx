"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Save,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/src/contexts/NotificationContext";
import {
  NotificationCategory,
  NotificationPreference,
  NotificationPreferenceUpdate,
  getCategoryDisplayName,
} from "@/src/models/notifications";

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  NotificationCategory.SYSTEM,
  NotificationCategory.INVENTORY,
  NotificationCategory.CRM,
  NotificationCategory.HRM,
  NotificationCategory.MAINTENANCE,
  NotificationCategory.QUALITY,
  NotificationCategory.LEDGER,
];

const NOTIFICATION_CHANNELS = [
  {
    id: "email",
    name: "Email",
    description: "Receive notifications via email",
    icon: Mail,
  },
  {
    id: "push",
    name: "Push Notifications",
    description: "Receive push notifications on your device",
    icon: Smartphone,
  },
  {
    id: "in_app",
    name: "In-App Notifications",
    description: "Show notifications within the application",
    icon: Monitor,
  },
];

export default function NotificationSettingsPage() {
  const { preferences, loading, updatePreference } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<
    NotificationPreference[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences.length > 0) {
      setLocalPreferences([...preferences]);
      setHasChanges(false);
    } else {
      // Initialize with default preferences if none exist
      const defaultPreferences: NotificationPreference[] =
        NOTIFICATION_CATEGORIES.map((category) => ({
          id: `default-${category}`,
          tenant_id: "",
          user_id: "",
          category,
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      setLocalPreferences(defaultPreferences);
    }
  }, [preferences]);

  const handlePreferenceChange = (
    category: NotificationCategory,
    channel: "email" | "push" | "in_app",
    enabled: boolean,
  ) => {
    setLocalPreferences((prev) => {
      const existingPreference = prev.find(
        (pref) => pref.category === category,
      );

      if (existingPreference) {
        // Update existing preference
        const updated = prev.map((pref) =>
          pref.category === category
            ? { ...pref, [`${channel}_enabled`]: enabled }
            : pref,
        );
        return updated;
      } else {
        // Create new preference if it doesn't exist
        const newPreference: NotificationPreference = {
          id: `new-${category}`,
          tenant_id: "",
          user_id: "",
          category,
          email_enabled: channel === "email" ? enabled : true,
          push_enabled: channel === "push" ? enabled : true,
          in_app_enabled: channel === "in_app" ? enabled : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [...prev, newPreference];
        return updated;
      }
    });
    setHasChanges(true);
  };

  const getPreferenceForCategory = (category: NotificationCategory) => {
    const preference = localPreferences.find(
      (pref) => pref.category === category,
    );
    return preference;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates: NotificationPreferenceUpdate[] = [];

      for (const category of NOTIFICATION_CATEGORIES) {
        const preference = getPreferenceForCategory(category);
        if (preference) {
          updates.push({
            category,
            email_enabled: preference.email_enabled,
            push_enabled: preference.push_enabled,
            in_app_enabled: preference.in_app_enabled,
          });
        }
      }

      await Promise.all(updates.map((update) => updatePreference(update)));

      setHasChanges(false);
      toast.success("Notification preferences updated successfully!");
    } catch (error) {
      toast.error(
        "Failed to update notification preferences. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaultPreferences: NotificationPreference[] =
      NOTIFICATION_CATEGORIES.map((category) => ({
        id: `default-${category}`,
        tenant_id: "",
        user_id: "",
        category,
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    setLocalPreferences(defaultPreferences);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">
                Loading notification preferences...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Notification Settings
              </h1>
              <p className="text-gray-600">
                Manage your notification preferences and channels
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Notification Channels Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications for different
                categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <div key={channel.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <channel.icon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">{channel.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {channel.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Category Preferences
              </CardTitle>
              <CardDescription>
                Configure notification settings for each category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {NOTIFICATION_CATEGORIES.map((category, index) => {
                const preference = getPreferenceForCategory(category);
                const categoryDisplayName = getCategoryDisplayName(category);

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Bell className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{categoryDisplayName}</h3>
                          <p className="text-sm text-gray-600">
                            {category.replace("_", " ").toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {NOTIFICATION_CHANNELS.map((channel) => (
                          <div
                            key={channel.id}
                            className="flex items-center gap-2"
                          >
                            <channel.icon className="h-4 w-4 text-gray-500" />
                            <Switch
                              checked={
                                (preference?.[
                                  `${channel.id}_enabled` as keyof NotificationPreference
                                ] as boolean) || false
                              }
                              onCheckedChange={(enabled) =>
                                handlePreferenceChange(
                                  category,
                                  channel.id as "email" | "push" | "in_app",
                                  enabled,
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {index < NOTIFICATION_CATEGORIES.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Preferences Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {NOTIFICATION_CHANNELS.map((channel) => {
                  const enabledCount = localPreferences.filter(
                    (pref) =>
                      pref[
                        `${channel.id}_enabled` as keyof NotificationPreference
                      ],
                  ).length;

                  return (
                    <div
                      key={channel.id}
                      className="text-center p-4 border rounded-lg"
                    >
                      <channel.icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium mb-1">{channel.name}</h3>
                      <Badge
                        variant={enabledCount > 0 ? "default" : "secondary"}
                      >
                        {enabledCount} of {NOTIFICATION_CATEGORIES.length}{" "}
                        enabled
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Save Notice */}
          {hasChanges && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                You have unsaved changes. Don&apos;t forget to save your
                notification preferences.
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
