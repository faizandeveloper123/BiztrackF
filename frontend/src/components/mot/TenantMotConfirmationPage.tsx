"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Edit,
  Printer,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { MotPublicLayout } from "@/src/components/mot/MotPublicLayout";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import motBookingService from "@/src/services/MotBookingService";
import { getTenantMotBookingUrl } from "@/src/models/mot/MotSettings";
import {
  getMotStatusColor,
  getMotStatusLabel,
  type MotBooking,
} from "@/src/models/mot/MotBooking";
import {
  MotBookingPrintSheet,
  exportMotBookingPdf,
  printMotBooking,
} from "@/src/components/mot-bookings/wizard/MotBookingPrintSheet";
import { getVehicleBrandStyle } from "@/src/components/mot-bookings/wizard/motBrandStyle";
import {
  formatBookingDateTime,
  getDeliveryOptionLabel,
} from "@/src/components/mot-bookings/wizard/wizardUtils";
import { MOT_INSPECTION_PRICE } from "@/src/components/mot-bookings/wizard/wizardTypes";
import { MotExpiryCountdown } from "@/src/components/mot-bookings/MotExpiryCountdown";

export function TenantMotConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const tenantDomain = params.domain as string;
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<MotBooking | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const bookUrl = getTenantMotBookingUrl(tenantDomain);

  useEffect(() => {
    motBookingService
      .getPublicSettings(tenantDomain)
      .then((settings) => setTenantName(settings.tenant_name))
      .catch(() => setTenantName(tenantDomain));

    motBookingService
      .getPublicBooking(tenantDomain, bookingId)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [bookingId, tenantDomain]);

  const handleCancel = async () => {
    if (
      !booking ||
      !confirm("Are you sure you want to cancel this MOT booking?")
    )
      return;
    setCancelling(true);
    try {
      const updated = await motBookingService.updatePublicBookingStatus(
        tenantDomain,
        booking.id,
        {
          status: "cancelled",
        },
      );
      setBooking(updated);
    } catch {
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <MotPublicLayout tenantName={tenantName || tenantDomain}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </MotPublicLayout>
    );
  }

  if (!booking) {
    return (
      <MotPublicLayout tenantName={tenantName || tenantDomain}>
        <div className="text-center">
          <p className="text-muted-foreground">Booking not found.</p>
          <Button asChild className="mt-4">
            <Link href={bookUrl}>Book a new MOT</Link>
          </Button>
        </div>
      </MotPublicLayout>
    );
  }

  const brand = getVehicleBrandStyle(booking.vehicle_make || "");
  const isCancelled = booking.status === "cancelled";
  const bookingRef = booking.id.slice(0, 8).toUpperCase();

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportMotBookingPdf(bookingRef);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <MotPublicLayout tenantName={tenantName || tenantDomain}>
      <div className="no-print mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" asChild className="gap-2 rounded-xl">
          <Link href={bookUrl}>
            <ArrowLeft className="h-4 w-4" />
            Book another MOT
          </Link>
        </Button>

        <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-50 via-background to-blue-50/50 p-8 text-center dark:from-emerald-950/20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isCancelled ? "Booking Cancelled" : "MOT Booked Successfully"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Reference MOT-{bookingRef}
          </p>
          <Badge className={`mt-4 ${getMotStatusColor(booking.status)}`}>
            {getMotStatusLabel(booking.status)}
          </Badge>
        </div>

        <Card className="overflow-hidden rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${brand.gradient} text-sm font-black text-white`}
              >
                {brand.initials}
              </div>
              <div>
                <CardTitle className="uppercase">
                  {[booking.vehicle_make, booking.vehicle_model]
                    .filter(Boolean)
                    .join(" ")}
                </CardTitle>
                <p className="font-mono text-sm text-muted-foreground">
                  {booking.vehicle_registration}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Date & Time
                </p>
                <p className="font-medium">
                  {formatBookingDateTime(
                    booking.booking_date?.slice(0, 10) || "",
                    booking.start_time,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Total
                </p>
                <p className="text-xl font-bold">
                  £{Number(booking.price || MOT_INSPECTION_PRICE).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Customer
                </p>
                <p className="font-medium">{booking.customer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.customer_phone}
                </p>
              </div>
              {booking.expiry_status || booking.mot_expiry_date ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    MOT Expiry Status
                  </p>
                  <div className="mt-1">
                    <MotExpiryCountdown
                      expiryDate={
                        booking.expiry_status?.mot_expiry_date ||
                        booking.mot_expiry_date
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
            {booking.delivery_option && (
              <p className="text-sm text-muted-foreground">
                {getDeliveryOptionLabel(
                  booking.delivery_option as
                    | "drop_off"
                    | "wait_security"
                    | "wait_on_site",
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={printMotBooking}
            className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-semibold"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print MOT
          </Button>
          <Button
            variant="outline"
            disabled={exportingPdf}
            onClick={handleExportPdf}
            className="h-12 rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" />
            {exportingPdf ? "Exporting..." : "Export PDF"}
          </Button>
          <Button
            variant="outline"
            disabled={isCancelled}
            onClick={() => router.push(`${bookUrl}?amend=${booking.id}`)}
            className="h-12 rounded-xl"
          >
            <Edit className="mr-2 h-4 w-4" />
            Amend MOT
          </Button>
          <Button
            variant="destructive"
            disabled={isCancelled || cancelling}
            onClick={handleCancel}
            className="h-12 rounded-xl"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {cancelling ? "Cancelling..." : "Cancel MOT"}
          </Button>
        </div>
      </div>

      <MotBookingPrintSheet booking={booking} />
    </MotPublicLayout>
  );
}
