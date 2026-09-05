"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { MotWizardData, MotWizardStep } from "./wizardTypes";
import {
  calculateTotalCost,
  formatBookingDateTime,
  formatVehicleSummary,
  getDeliveryOptionLabel,
  getSelectedMotServices,
} from "./wizardUtils";

type MotBookingSummaryPanelProps = {
  data: MotWizardData;
  inspectionPrice: number;
  currentStep: MotWizardStep;
  onEditStep: (step: MotWizardStep) => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showNext?: boolean;
};

function SummarySection({
  title,
  step,
  currentStep,
  onEdit,
  children,
  hasContent,
}: {
  title: string;
  step: MotWizardStep;
  currentStep: MotWizardStep;
  onEdit: (step: MotWizardStep) => void;
  children: React.ReactNode;
  hasContent: boolean;
}) {
  return (
    <div className="border-b border-border/60 py-4 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </h4>
        {hasContent && step !== currentStep && (
          <button
            type="button"
            onClick={() => onEdit(step)}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      {hasContent ? (
        <div className="space-y-1 text-sm">{children}</div>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">Not added yet</p>
      )}
    </div>
  );
}

export function MotBookingSummaryPanel({
  data,
  inspectionPrice,
  currentStep,
  onEditStep,
  onNext,
  nextLabel = "Next Step",
  nextDisabled = false,
  showNext = true,
}: MotBookingSummaryPanelProps) {
  const vehicleSummary = formatVehicleSummary(data);
  const total = calculateTotalCost(data, inspectionPrice);
  const deliveryLabel = getDeliveryOptionLabel(data.dateTime.deliveryOption);
  const dateTimeLabel = formatBookingDateTime(
    data.dateTime.bookingDate,
    data.dateTime.bookingTime,
  );

  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border bg-card shadow-xl shadow-indigo-500/5">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4" />
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Your Booking Details
          </h3>
        </div>
      </div>

      <div className="px-5">
        <SummarySection
          title="Your Vehicle"
          step={1}
          currentStep={currentStep}
          onEdit={onEditStep}
          hasContent={Boolean(vehicleSummary || data.vehicle.registration)}
        >
          {vehicleSummary && (
            <p className="font-semibold uppercase">{vehicleSummary}</p>
          )}
          {data.vehicle.registration && (
            <p className="text-muted-foreground">
              {data.vehicle.registration.toUpperCase()}
            </p>
          )}
          {data.vehicle.mileage && (
            <p className="text-muted-foreground">
              {data.vehicle.mileage} miles
            </p>
          )}
        </SummarySection>

        <SummarySection
          title="Your Services"
          step={2}
          currentStep={currentStep}
          onEdit={onEditStep}
          hasContent={
            data.services.motInspection ||
            data.services.selectedServiceIds.length > 0 ||
            Boolean(data.services.otherServices.trim())
          }
        >
          {getSelectedMotServices(data.services, inspectionPrice).map(
            (service) => (
              <div
                key={service.id}
                className="flex items-start justify-between gap-2"
              >
                <span>{service.label}</span>
                <span className="font-bold">£{service.price.toFixed(2)}</span>
              </div>
            ),
          )}
          {deliveryLabel && currentStep >= 3 && (
            <p className="text-xs text-muted-foreground">{deliveryLabel}</p>
          )}
          {data.services.otherServices.trim() && (
            <p className="text-muted-foreground">
              {data.services.otherServices}
            </p>
          )}
        </SummarySection>

        <div className="border-b border-border/60 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest">
              Total Cost*
            </span>
            <span className="text-lg font-bold">£{total.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            *Payable on day of appointment
          </p>
        </div>

        <SummarySection
          title="Your Date and Time"
          step={3}
          currentStep={currentStep}
          onEdit={onEditStep}
          hasContent={Boolean(dateTimeLabel)}
        >
          {dateTimeLabel && <p className="font-medium">{dateTimeLabel}</p>}
          {deliveryLabel && (
            <p className="text-xs text-muted-foreground">{deliveryLabel}</p>
          )}
        </SummarySection>

        {currentStep >= 4 && (
          <SummarySection
            title="Your Details"
            step={4}
            currentStep={currentStep}
            onEdit={onEditStep}
            hasContent={Boolean(
              data.customer.firstName && data.customer.lastName,
            )}
          >
            <p className="font-semibold">
              {[
                data.customer.title,
                data.customer.firstName,
                data.customer.lastName,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>
            {data.customer.email && (
              <p className="text-muted-foreground">{data.customer.email}</p>
            )}
            {data.customer.telephone && (
              <p className="text-muted-foreground">{data.customer.telephone}</p>
            )}
          </SummarySection>
        )}
      </div>

      {showNext && onNext && (
        <div className="border-t bg-muted/20 p-5">
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold uppercase tracking-wider hover:from-blue-700 hover:to-purple-700"
          >
            {nextLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
