"use client";

import React, { useState, useEffect } from "react";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { AlertCircle, Bell, Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import InvoiceCustomizationService from "@/src/services/InvoiceCustomizationService";
import { useNotifications } from "@/src/contexts/NotificationContext";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { usePermissions } from "@/src/hooks/usePermissions";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

export default function SettingsPage() {
  const { isOwner, hasPermission, initializing } = usePermissions();
  const {
    currency,
    setCurrency,
    formatCurrency,
    loading: currencyLoading,
  } = useCurrency();
  const { preferences, unreadCount } = useNotifications();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const canManageSettings = isOwner() || hasPermission("users:view");

  useEffect(() => {
    setSelectedCurrency(currency);
    setHasChanges(false);
  }, [currency]);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    setHasChanges(newCurrency !== currency);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update the currency in the invoice customization
      await InvoiceCustomizationService.updateCustomization({
        default_currency: selectedCurrency,
      });

      // Update the global currency context
      setCurrency(selectedCurrency);
      setHasChanges(false);

      toast.success("Currency settings updated successfully!");
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          "Failed to update currency settings. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrencyInfo = CURRENCIES.find(
    (c) => c.code === selectedCurrency,
  );

  if (currencyLoading || initializing) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canManageSettings) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            You do not have permission to manage general settings.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">
                Manage your application preferences
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Currency Settings
              </CardTitle>
              <CardDescription>
                Set your default currency for invoices, transactions, and
                financial displays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{curr.symbol}</span>
                          <span>
                            {curr.name} ({curr.code})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCurrencyInfo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Selected Currency</p>
                      <p className="text-sm text-gray-600">
                        {selectedCurrencyInfo.name} ({selectedCurrencyInfo.code}
                        )
                      </p>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {selectedCurrencyInfo.symbol}
                    </Badge>
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview:</p>
                    <div className="flex gap-4 text-sm">
                      <span>Price: {formatCurrency(99.99)}</span>
                      <span>Total: {formatCurrency(1250.5)}</span>
                      <span>Tax: {formatCurrency(125.05)}</span>
                    </div>
                  </div>
                </div>
              )}

              {hasChanges && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    You have unsaved changes. Don&apos;t forget to save your
                    settings.
                  </span>
                </div>
              )}

              <div className="flex justify-end">
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
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage your notification preferences and channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Notification Preferences</h3>
                    <p className="text-sm text-gray-600">
                      Configure how you receive notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="mr-2">
                      {unreadCount} unread
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = "/notifications/settings")
                    }
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Preferences
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Email</h4>
                  <p className="text-xs text-gray-600">
                    {preferences.filter((p) => p.email_enabled).length}{" "}
                    categories enabled
                  </p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Push</h4>
                  <p className="text-xs text-gray-600">
                    {preferences.filter((p) => p.push_enabled).length}{" "}
                    categories enabled
                  </p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">In-App</h4>
                  <p className="text-xs text-gray-600">
                    {preferences.filter((p) => p.in_app_enabled).length}{" "}
                    categories enabled
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Additional Settings
              </CardTitle>
              <CardDescription>
                More customization options will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>More settings options coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
