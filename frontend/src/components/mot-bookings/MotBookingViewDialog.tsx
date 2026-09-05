"use client";

import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  formatMotVehicleLine,
  getMotStatusColor,
  getMotStatusLabel,
  getMotTestTypeLabel,
  type MotBooking,
} from "@/src/models/mot/MotBooking";
import {
  getDeliveryOptionLabel,
  getMotServiceById,
} from "@/src/components/mot-bookings/wizard/wizardUtils";
import type { MotDeliveryOption } from "@/src/components/mot-bookings/wizard/wizardTypes";
import { formatBookingDateTime } from "./motBookingUtils";
import { MotExpiryCountdown } from "./MotExpiryCountdown";

type MotBookingViewDialogProps = {
  booking: MotBooking | null;
  formatCurrency: (value: number) => string;
  onClose: () => void;
  onEdit: (booking: MotBooking) => void;
};

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-medium text-muted-foreground">{title}</div>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
}

export function MotBookingViewDialog({
  booking,
  formatCurrency,
  onClose,
  onEdit,
}: MotBookingViewDialogProps) {
  const { currentTenant } = useAuth();
  const confirmationPath =
    booking && currentTenant?.domain
      ? `/${currentTenant.domain}/mot/bookings/${booking.id}/confirmation`
      : null;
  const meta = (booking?.booking_meta || {}) as Record<string, unknown>;
  const customer = (meta.customer || {}) as Record<string, unknown>;
  const vehicle = (meta.vehicle || {}) as Record<string, unknown>;
  const services = (meta.services || {}) as Record<string, unknown>;
  const deliveryOption =
    booking?.delivery_option ||
    (meta.deliveryOption as string | undefined) ||
    "";

  const customerAddress = [
    [customer.houseNumber, customer.street].filter(Boolean).join(" "),
    customer.town,
    customer.county,
    customer.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const customerName = [customer.title, customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {!booking ? null : (
          <>
            <DialogHeader>
              <DialogTitle>MOT Booking Details</DialogTitle>
              <DialogDescription>
                {formatBookingDateTime(booking)} · Ref MOT-
                {booking.id.slice(0, 8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getMotStatusColor(booking.status)}>
                  {getMotStatusLabel(booking.status)}
                </Badge>
                <Badge variant="outline">
                  {getMotTestTypeLabel(booking.test_type)}
                </Badge>
              </div>

              <DetailSection title="Customer">
                <div>{booking.customer_name || customerName}</div>
                {booking.customer_phone && <div>{booking.customer_phone}</div>}
                {booking.customer_email && <div>{booking.customer_email}</div>}
                {customerAddress && (
                  <div className="text-muted-foreground">{customerAddress}</div>
                )}
              </DetailSection>

              <DetailSection title="Vehicle">
                <div>{formatMotVehicleLine(booking)}</div>
                {Boolean(booking.mileage || vehicle.mileage) && (
                  <div>
                    Mileage: {String(booking.mileage || vehicle.mileage)}
                  </div>
                )}
                {booking.expiry_status || booking.mot_expiry_date ? (
                  <div className="mt-2">
                    <MotExpiryCountdown
                      expiryDate={
                        booking.expiry_status?.mot_expiry_date ||
                        booking.mot_expiry_date
                      }
                      showExpiryDate
                    />
                  </div>
                ) : null}
              </DetailSection>

              <DetailSection title="Appointment">
                <div>
                  {booking.booking_date?.slice(0, 10)} {booking.start_time} –{" "}
                  {booking.end_time}
                </div>
                {Boolean(deliveryOption) && (
                  <div className="text-muted-foreground">
                    {getDeliveryOptionLabel(
                      deliveryOption as MotDeliveryOption,
                    )}
                  </div>
                )}
              </DetailSection>

              {(Boolean(services.motInspection) ||
                (Array.isArray(services.selectedServiceIds) &&
                  services.selectedServiceIds.length > 0) ||
                Boolean(services.otherServices)) && (
                <DetailSection title="Services">
                  {Boolean(services.motInspection) && (
                    <div className="flex justify-between gap-4">
                      <span>Carry Out MOT Inspection</span>
                      {Number.isFinite(Number(services.motPrice)) && (
                        <span className="font-medium">
                          £{Number(services.motPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                  {Array.isArray(services.selectedServiceIds) &&
                    services.selectedServiceIds
                      .filter((serviceId) => serviceId !== "mot-inspection")
                      .map((serviceId) => {
                        const motPrice = Number(services.motPrice);
                        const inspectionPrice =
                          Number.isFinite(motPrice) && motPrice >= 0
                            ? motPrice
                            : undefined;
                        const service =
                          typeof serviceId === "string"
                            ? getMotServiceById(serviceId, inspectionPrice)
                            : undefined;
                        return (
                          <div
                            key={String(serviceId)}
                            className="flex justify-between gap-4"
                          >
                            <span>{service?.label || String(serviceId)}</span>
                            {service && (
                              <span className="font-medium">
                                £{service.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  {typeof services.otherServices === "string" &&
                    services.otherServices.trim() && (
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {services.otherServices}
                      </div>
                    )}
                </DetailSection>
              )}

              <DetailSection title="Price">
                <div>{formatCurrency(Number(booking.price) || 0)}</div>
              </DetailSection>

              {booking.notes && (
                <DetailSection title="Notes">
                  <div className="whitespace-pre-wrap">{booking.notes}</div>
                </DetailSection>
              )}

              {booking.result_notes && (
                <DetailSection title="Result notes">
                  <div className="whitespace-pre-wrap">
                    {booking.result_notes}
                  </div>
                </DetailSection>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {confirmationPath && (
                <Button variant="outline" asChild>
                  <Link href={confirmationPath} target="_blank">
                    Open confirmation
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => onEdit(booking)}>Edit</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
