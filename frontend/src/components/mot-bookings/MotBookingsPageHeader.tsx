"use client";

import Link from "next/link";
import { ClipboardCheck, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useAuth } from "@/src/contexts/AuthContext";
import { getTenantMotBookingUrl } from "@/src/models/mot/MotSettings";

type MotBookingsPageHeaderProps = {
  onAddBooking?: () => void;
};

export function MotBookingsPageHeader({
  onAddBooking,
}: MotBookingsPageHeaderProps) {
  const { currentTenant } = useAuth();
  const tenantDomain = currentTenant?.domain;
  const bookingUrl = tenantDomain ? getTenantMotBookingUrl(tenantDomain) : "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <ClipboardCheck className="h-8 w-8" />
          MOT Bookings
        </h1>
        <p className="text-muted-foreground">
          Manage MOT test appointments for your workshop
        </p>
        {tenantDomain && (
          <p className="mt-2 text-sm text-muted-foreground">
            Public booking URL:{" "}
            <Link
              href={bookingUrl}
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              {typeof window !== "undefined"
                ? `${window.location.origin}${bookingUrl}`
                : bookingUrl}
            </Link>
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tenantDomain && (
          <>
            <Button variant="outline" asChild>
              <Link href={bookingUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open booking page
              </Link>
            </Button>
            <Button onClick={onAddBooking}>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
