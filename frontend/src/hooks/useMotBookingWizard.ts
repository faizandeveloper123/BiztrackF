"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import motBookingService from "@/src/services/MotBookingService";
import { getTenantMotBookingUrl } from "@/src/models/mot/MotSettings";
import {
  MOT_INSPECTION_PRICE,
  emptyMotWizardData,
  type MotVehicleSubStep,
  type MotWizardData,
  type MotWizardStep,
} from "@/src/components/mot-bookings/wizard/wizardTypes";
import {
  bookingToWizardData,
  clearWizardDraft,
  isCustomerDetailsComplete,
  isDateTimeComplete,
  isServicesComplete,
  isVehicleDetailsComplete,
  isVehicleModelComplete,
  loadWizardDraft,
  saveWizardDraft,
  wizardDataToBookingPayload,
} from "@/src/components/mot-bookings/wizard/wizardUtils";

type MotBookingWizardOptions = {
  tenantDomain: string;
  confirmationPath?: (bookingId: string) => string;
};

function normalizeWizardStep(step: number): MotWizardStep {
  if (step <= 1) return 1;
  if (step === 2) return 2;
  return Math.min(Math.max(step - 1, 2), 5) as MotWizardStep;
}

export type MotBookingWizardState = {
  tenantDomain: string;
  tenantName: string;
  loading: boolean;
  currentStep: MotWizardStep;
  vehicleSubStep: MotVehicleSubStep;
  data: MotWizardData;
  confirming: boolean;
  privacyModalOpen: boolean;
  setPrivacyModalOpen: (open: boolean) => void;
  maxAvailableStep: MotWizardStep;
  canPrimaryNext: boolean;
  primaryNextLabel: string;
  showSidebarNext: boolean;
  updateVehicle: (patch: Partial<MotWizardData["vehicle"]>) => void;
  updateServices: (patch: Partial<MotWizardData["services"]>) => void;
  updateDateTime: (patch: Partial<MotWizardData["dateTime"]>) => void;
  updateCustomer: (patch: Partial<MotWizardData["customer"]>) => void;
  updateContactConsent: (
    patch: Partial<MotWizardData["customer"]["contactConsent"]>,
  ) => void;
  goToStep: (step: MotWizardStep) => void;
  confirmVehicleDetails: () => void;
  completeVehicleStep: () => void;
  handlePrimaryNext: () => void;
  openPrivacyModal: () => void;
  confirmPrivacyAndGoToConfirm: () => void;
  submitBooking: () => Promise<void>;
  setVehicleSubStep: (subStep: MotVehicleSubStep) => void;
  setCurrentStep: (step: MotWizardStep) => void;
  inspectionPrice: number;
};

export function useMotBookingWizard(
  options: MotBookingWizardOptions,
): MotBookingWizardState {
  const { tenantDomain, confirmationPath } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const amendId = searchParams.get("amend");

  const [currentStep, setCurrentStep] = useState<MotWizardStep>(1);
  const [vehicleSubStep, setVehicleSubStep] =
    useState<MotVehicleSubStep>("details");
  const [data, setData] = useState<MotWizardData>(emptyMotWizardData());
  const [loading, setLoading] = useState(true);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [amendBookingId, setAmendBookingId] = useState<string | null>(null);
  const [inspectionPrice, setInspectionPrice] = useState(MOT_INSPECTION_PRICE);
  const [tenantName, setTenantName] = useState("");

  const maxAvailableStep = useMemo((): MotWizardStep => {
    if (!isVehicleModelComplete(data)) return 1;
    if (!isServicesComplete(data)) return 2;
    if (!isDateTimeComplete(data)) return 3;
    if (!isCustomerDetailsComplete(data)) return 4;
    return 5;
  }, [data]);

  useEffect(() => {
    const init = async () => {
      try {
        const settings =
          await motBookingService.getPublicSettings(tenantDomain);
        const price = Number(settings.inspection_price);
        if (Number.isFinite(price) && price >= 0) {
          setInspectionPrice(price);
        }
        setTenantName(settings.tenant_name);
      } catch {}

      if (amendId) {
        try {
          const booking = await motBookingService.getPublicBooking(
            tenantDomain,
            amendId,
          );
          setData(bookingToWizardData(booking));
          setAmendBookingId(amendId);
          setCurrentStep(5);
          setVehicleSubStep("model");
        } catch {
          setData(emptyMotWizardData());
        }
        setLoading(false);
        return;
      }

      const draft = loadWizardDraft(tenantDomain);
      if (draft) {
        setData(draft.data);
        setCurrentStep(normalizeWizardStep(draft.step));
        setVehicleSubStep(
          draft.vehicleSubStep === "model" ? "model" : "details",
        );
      }
      setLoading(false);
    };
    init();
  }, [amendId, tenantDomain]);

  useEffect(() => {
    if (!loading) {
      saveWizardDraft(tenantDomain, data, currentStep, vehicleSubStep);
    }
  }, [data, currentStep, vehicleSubStep, loading, tenantDomain]);

  const updateVehicle = useCallback(
    (patch: Partial<MotWizardData["vehicle"]>) => {
      setData((prev) => ({ ...prev, vehicle: { ...prev.vehicle, ...patch } }));
    },
    [],
  );

  const updateServices = useCallback(
    (patch: Partial<MotWizardData["services"]>) => {
      setData((prev) => ({
        ...prev,
        services: { ...prev.services, ...patch },
      }));
    },
    [],
  );

  const updateDateTime = useCallback(
    (patch: Partial<MotWizardData["dateTime"]>) => {
      setData((prev) => ({
        ...prev,
        dateTime: { ...prev.dateTime, ...patch },
      }));
    },
    [],
  );

  const updateCustomer = useCallback(
    (patch: Partial<MotWizardData["customer"]>) => {
      setData((prev) => ({
        ...prev,
        customer: { ...prev.customer, ...patch },
      }));
    },
    [],
  );

  const updateContactConsent = useCallback(
    (patch: Partial<MotWizardData["customer"]["contactConsent"]>) => {
      setData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          contactConsent: { ...prev.customer.contactConsent, ...patch },
        },
      }));
    },
    [],
  );

  const goToStep = useCallback(
    (step: MotWizardStep) => {
      if (step > 5) return;
      setCurrentStep(step);
      if (step === 1) {
        setVehicleSubStep(isVehicleDetailsComplete(data) ? "model" : "details");
      }
    },
    [data],
  );

  const confirmVehicleDetails = useCallback(() => {
    if (!isVehicleDetailsComplete(data)) return;
    setVehicleSubStep("model");
  }, [data]);

  const completeVehicleStep = useCallback(() => {
    if (!isVehicleModelComplete(data)) return;
    setCurrentStep(2);
  }, [data]);

  const openPrivacyModal = useCallback(() => {
    if (!isCustomerDetailsComplete(data)) return;
    setPrivacyModalOpen(true);
  }, [data]);

  const confirmPrivacyAndGoToConfirm = useCallback(() => {
    setPrivacyModalOpen(false);
    setCurrentStep(5);
  }, []);

  const submitBooking = useCallback(async () => {
    setConfirming(true);
    try {
      const payload = wizardDataToBookingPayload(data, inspectionPrice);
      let booking;
      if (amendBookingId) {
        booking = await motBookingService.updatePublicBooking(
          tenantDomain,
          amendBookingId,
          payload,
        );
      } else {
        booking = await motBookingService.createPublicBooking(
          tenantDomain,
          payload,
        );
      }
      clearWizardDraft(tenantDomain);
      const nextPath = confirmationPath
        ? confirmationPath(booking.id)
        : `/${tenantDomain}/mot/bookings/${booking.id}/confirmation`;
      router.push(nextPath);
    } catch {
    } finally {
      setConfirming(false);
    }
  }, [
    amendBookingId,
    confirmationPath,
    data,
    inspectionPrice,
    router,
    tenantDomain,
  ]);

  const handlePrimaryNext = useCallback(() => {
    if (currentStep === 1) {
      if (vehicleSubStep === "details") confirmVehicleDetails();
      else completeVehicleStep();
      return;
    }
    if (currentStep === 2 && isServicesComplete(data)) {
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3 && isDateTimeComplete(data)) {
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4 && isCustomerDetailsComplete(data)) {
      openPrivacyModal();
    }
  }, [
    currentStep,
    vehicleSubStep,
    data,
    confirmVehicleDetails,
    completeVehicleStep,
    openPrivacyModal,
  ]);

  const canPrimaryNext = useMemo(() => {
    if (currentStep === 1) {
      return vehicleSubStep === "details"
        ? isVehicleDetailsComplete(data)
        : isVehicleModelComplete(data);
    }
    if (currentStep === 2) return isServicesComplete(data);
    if (currentStep === 3) return isDateTimeComplete(data);
    if (currentStep === 4) return isCustomerDetailsComplete(data);
    return false;
  }, [currentStep, vehicleSubStep, data]);

  const primaryNextLabel = useMemo(() => {
    if (currentStep === 1 && vehicleSubStep === "details") return "Confirm";
    if (currentStep === 3) return "Continue to Step 4";
    if (currentStep === 4) return "Next Step";
    return "Next Step";
  }, [currentStep, vehicleSubStep]);

  const showSidebarNext = currentStep >= 1 && currentStep <= 4;

  return {
    tenantDomain,
    tenantName,
    loading,
    currentStep,
    vehicleSubStep,
    data,
    confirming,
    privacyModalOpen,
    setPrivacyModalOpen,
    maxAvailableStep,
    canPrimaryNext,
    primaryNextLabel,
    showSidebarNext,
    updateVehicle,
    updateServices,
    updateDateTime,
    updateCustomer,
    updateContactConsent,
    goToStep,
    confirmVehicleDetails,
    completeVehicleStep,
    handlePrimaryNext,
    openPrivacyModal,
    confirmPrivacyAndGoToConfirm,
    submitBooking,
    setVehicleSubStep,
    setCurrentStep,
    inspectionPrice,
  };
}

export function getDefaultMotConfirmationPath(tenantDomain: string) {
  return (bookingId: string) =>
    `/${tenantDomain}/mot/bookings/${bookingId}/confirmation`;
}

export function getDefaultMotBookPath(tenantDomain: string) {
  return getTenantMotBookingUrl(tenantDomain);
}
