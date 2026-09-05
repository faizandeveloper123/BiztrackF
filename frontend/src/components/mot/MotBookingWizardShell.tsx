"use client";

import { MotBookingStepNav } from "@/src/components/mot-bookings/wizard/MotBookingStepNav";
import { MotBookingSummaryPanel } from "@/src/components/mot-bookings/wizard/MotBookingSummaryPanel";
import { MotPrivacyConfirmModal } from "@/src/components/mot-bookings/wizard/MotPrivacyConfirmModal";
import { Step1VehicleDetails } from "@/src/components/mot-bookings/wizard/steps/Step1VehicleDetails";
import { Step1VehicleModel } from "@/src/components/mot-bookings/wizard/steps/Step1VehicleModel";
import { Step2Services } from "@/src/components/mot-bookings/wizard/steps/Step2Services";
import { Step3DateTime } from "@/src/components/mot-bookings/wizard/steps/Step3DateTime";
import { Step4YourDetails } from "@/src/components/mot-bookings/wizard/steps/Step4YourDetails";
import { Step5ConfirmSummary } from "@/src/components/mot-bookings/wizard/steps/Step5ConfirmSummary";
import {
  isCustomerDetailsComplete,
  isVehicleDetailsComplete,
  isVehicleModelComplete,
  isServicesComplete,
  isDateTimeComplete,
} from "@/src/components/mot-bookings/wizard/wizardUtils";
import type { MotBookingWizardState } from "@/src/hooks/useMotBookingWizard";

type MotBookingWizardShellProps = {
  wizard: MotBookingWizardState;
};

export function MotBookingWizardShell({ wizard }: MotBookingWizardShellProps) {
  const renderStep = () => {
    if (wizard.currentStep === 1 && wizard.vehicleSubStep === "details") {
      return (
        <Step1VehicleDetails
          vehicle={wizard.data.vehicle}
          onChange={wizard.updateVehicle}
          onConfirm={wizard.confirmVehicleDetails}
          canConfirm={isVehicleDetailsComplete(wizard.data)}
        />
      );
    }
    if (wizard.currentStep === 1 && wizard.vehicleSubStep === "model") {
      return (
        <Step1VehicleModel
          vehicle={wizard.data.vehicle}
          onChange={wizard.updateVehicle}
          onBack={() => wizard.setVehicleSubStep("details")}
          onNext={wizard.completeVehicleStep}
          canNext={isVehicleModelComplete(wizard.data)}
        />
      );
    }
    if (wizard.currentStep === 2) {
      return (
        <Step2Services
          services={wizard.data.services}
          inspectionPrice={wizard.inspectionPrice}
          onChange={wizard.updateServices}
          onBack={() => {
            wizard.setCurrentStep(1);
            wizard.setVehicleSubStep("model");
          }}
          onNext={() => wizard.setCurrentStep(3)}
          canNext={isServicesComplete(wizard.data)}
        />
      );
    }
    if (wizard.currentStep === 3) {
      return (
        <Step3DateTime
          tenantDomain={wizard.tenantDomain}
          dateTime={wizard.data.dateTime}
          onChange={wizard.updateDateTime}
          onBack={() => wizard.setCurrentStep(2)}
          onNext={() => wizard.setCurrentStep(4)}
          canNext={isDateTimeComplete(wizard.data)}
        />
      );
    }
    if (wizard.currentStep === 4) {
      return (
        <Step4YourDetails
          customer={wizard.data.customer}
          onChange={wizard.updateCustomer}
          onConsentChange={wizard.updateContactConsent}
          onBack={() => wizard.setCurrentStep(3)}
          onNext={wizard.openPrivacyModal}
          canNext={isCustomerDetailsComplete(wizard.data)}
        />
      );
    }
    if (wizard.currentStep === 5) {
      return (
        <Step5ConfirmSummary
          data={wizard.data}
          inspectionPrice={wizard.inspectionPrice}
          onEditStep={wizard.goToStep}
          onBack={() => wizard.setCurrentStep(4)}
          onConfirm={wizard.submitBooking}
          confirming={wizard.confirming}
        />
      );
    }
    return null;
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-orange-50/50 via-background to-indigo-50/30 p-6 dark:from-orange-950/10 dark:to-indigo-950/20">
        <h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Book Your MOT Checkup
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A smooth, step-by-step booking experience. Your progress is saved as
          you go.
        </p>
      </div>

      <MotBookingStepNav
        currentStep={wizard.currentStep}
        maxAvailableStep={wizard.maxAvailableStep}
        onStepClick={wizard.goToStep}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          {renderStep()}
        </div>

        {wizard.currentStep < 5 && (
          <MotBookingSummaryPanel
            data={wizard.data}
            inspectionPrice={wizard.inspectionPrice}
            currentStep={wizard.currentStep}
            onEditStep={wizard.goToStep}
            onNext={wizard.handlePrimaryNext}
            nextLabel={wizard.primaryNextLabel}
            nextDisabled={!wizard.canPrimaryNext}
            showNext={wizard.showSidebarNext}
          />
        )}
      </div>

      <MotPrivacyConfirmModal
        open={wizard.privacyModalOpen}
        onOpenChange={wizard.setPrivacyModalOpen}
        onConfirm={wizard.confirmPrivacyAndGoToConfirm}
      />
    </>
  );
}
