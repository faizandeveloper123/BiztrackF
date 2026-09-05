"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Copy,
  ExternalLink,
  Globe,
  PoundSterling,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import motBookingService from "@/src/services/MotBookingService";
import { getTenantMotBookingUrl } from "@/src/models/mot/MotSettings";
import { MOT_INSPECTION_PRICE } from "@/src/components/mot-bookings/wizard/wizardTypes";

type MotSettingsCardProps = {
  onSaved?: (settings: { price: number; enabled: boolean }) => void;
};

export function MotSettingsCard({ onSaved }: MotSettingsCardProps) {
  const [price, setPrice] = useState(String(MOT_INSPECTION_PRICE));
  const [enabled, setEnabled] = useState(false);
  const [tenantDomain, setTenantDomain] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    motBookingService
      .getSettings()
      .then((settings) => {
        setPrice(String(Number(settings.inspection_price)));
        setEnabled(Boolean(settings.public_booking_enabled));
        setTenantDomain(settings.tenant_domain);
        setTenantName(settings.tenant_name);
      })
      .catch(() => {
        setPrice(String(MOT_INSPECTION_PRICE));
      })
      .finally(() => setLoading(false));
  }, []);

  const bookingUrl =
    typeof window !== "undefined" && tenantDomain
      ? `${window.location.origin}${getTenantMotBookingUrl(tenantDomain)}`
      : tenantDomain
        ? getTenantMotBookingUrl(tenantDomain)
        : "";

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSave = async () => {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const settings = await motBookingService.updateSettings({
        inspection_price: parsed,
        public_booking_enabled: enabled,
      });
      const savedPrice = Number(settings.inspection_price);
      setPrice(String(savedPrice));
      setEnabled(Boolean(settings.public_booking_enabled));
      setTenantDomain(settings.tenant_domain);
      setTenantName(settings.tenant_name);
      onSaved?.({
        price: savedPrice,
        enabled: Boolean(settings.public_booking_enabled),
      });
      toast.success("MOT settings updated");
    } catch {
      toast.error("Failed to update MOT settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          MOT Service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <Label htmlFor="mot-service-enabled" className="text-base">
              Enable public MOT booking
            </Label>
            <p className="text-sm text-muted-foreground">
              Customers can book MOT tests on your public booking page
            </p>
          </div>
          <Switch
            id="mot-service-enabled"
            checked={enabled}
            disabled={loading || saving}
            onCheckedChange={setEnabled}
          />
        </div>

        {tenantDomain && (
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-primary" />
              {tenantName || tenantDomain} public booking URL
            </div>
            <div className="flex flex-wrap gap-2">
              <code className="flex-1 rounded-lg bg-background px-3 py-2 text-sm">
                {bookingUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(bookingUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {enabled && (
                <Button variant="outline" size="icon" asChild>
                  <Link
                    href={getTenantMotBookingUrl(tenantDomain)}
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            {!enabled && (
              <p className="text-sm text-muted-foreground">
                Enable MOT service to activate this public booking link.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label
              htmlFor="mot-inspection-price"
              className="flex items-center gap-2"
            >
              <PoundSterling className="h-4 w-4" />
              Inspection price
            </Label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                £
              </span>
              <Input
                id="mot-inspection-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                disabled={loading || saving}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
            className="sm:mb-0.5"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
