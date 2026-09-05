"use client";

import { Button } from "@/src/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { MotWizardData, MotWizardStep } from "../wizardTypes";
import {
  calculateTotalCost,
  formatBookingDateTime,
  formatCustomerAddress,
  formatCustomerName,
  formatVehicleSummary,
  getDeliveryOptionLabel,
  getSelectedMotServices,
} from "../wizardUtils";

type Step5ConfirmSummaryProps = {
  data: MotWizardData;
  inspectionPrice: number;
  onEditStep: (step: MotWizardStep) => void;
  onBack: () => void;
  onConfirm: () => void;
  confirming: boolean;
};

function SummaryBlock({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: MotWizardStep;
  onEdit: (step: MotWizardStep) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </h4>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

export function Step5ConfirmSummary({
  data,
  inspectionPrice,
  onEditStep,
  onBack,
  onConfirm,
  confirming,
}: Step5ConfirmSummaryProps) {
  const total = calculateTotalCost(data, inspectionPrice);
  const customerLines = formatCustomerAddress(data);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Step 05
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          Confirm Your Booking
        </h2>
        <p className="mt-2 text-muted-foreground">
          Review all details below. Press confirm to complete your MOT booking.
        </p>
      </div>

      <div className="rounded-2xl border-2 bg-muted/20 p-6">
        <SummaryBlock title="Your Vehicle" step={1} onEdit={onEditStep}>
          <p className="font-semibold uppercase">
            {formatVehicleSummary(data)}
          </p>
          <p className="text-muted-foreground">
            {data.vehicle.registration.toUpperCase()}
          </p>
          <p className="text-muted-foreground">{data.vehicle.mileage} miles</p>
        </SummaryBlock>

        <SummaryBlock title="Your Services" step={2} onEdit={onEditStep}>
          {getSelectedMotServices(data.services, inspectionPrice).map(
            (service) => (
              <div
                key={service.id}
                className="flex justify-between font-medium"
              >
                <span>{service.label}</span>
                <span>£{service.price.toFixed(2)}</span>
              </div>
            ),
          )}
          {data.services.otherServices.trim() && (
            <p className="text-muted-foreground">
              {data.services.otherServices}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {getDeliveryOptionLabel(data.dateTime.deliveryOption)}
          </p>
        </SummaryBlock>

        <SummaryBlock title="Your Date and Time" step={3} onEdit={onEditStep}>
          <p className="font-medium">
            {formatBookingDateTime(
              data.dateTime.bookingDate,
              data.dateTime.bookingTime,
            )}
          </p>
        </SummaryBlock>

        <SummaryBlock title="Your Details" step={4} onEdit={onEditStep}>
          <p className="font-semibold">{formatCustomerName(data)}</p>
          {data.customer.email && <p>{data.customer.email}</p>}
          <p>{data.customer.telephone}</p>
          {customerLines.map((line) => (
            <p key={line} className="text-muted-foreground">
              {line}
            </p>
          ))}
        </SummaryBlock>

        <div className="border-t border-border/60 pt-5">
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="uppercase tracking-wide">Total Cost*</span>
            <span>£{total.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            *Payable on day of appointment
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 rounded-xl gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={confirming}
          className="h-12 flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-8 text-sm font-bold uppercase tracking-wider hover:from-emerald-700 hover:to-green-700 sm:flex-none"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {confirming ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}
