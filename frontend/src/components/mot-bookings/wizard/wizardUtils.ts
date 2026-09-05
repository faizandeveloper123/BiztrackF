import {
  MOT_DELIVERY_OPTIONS,
  MOT_INSPECTION_PRICE,
  MOT_INSPECTION_SERVICE,
  MOT_SERVICE_OPTIONS,
  type MotDeliveryOption,
  type MotServiceOption,
  type MotWizardData,
  type MotWizardServices,
  type MotWizardVehicle,
} from "./wizardTypes";

export function getMotServiceById(
  id: string,
  inspectionPrice: number = MOT_INSPECTION_PRICE,
): MotServiceOption | undefined {
  if (id === "mot-inspection") {
    return { ...MOT_INSPECTION_SERVICE, price: inspectionPrice };
  }
  return MOT_SERVICE_OPTIONS.find((item) => item.id === id);
}

export function getSelectedMotServices(
  services: MotWizardServices,
  inspectionPrice: number = MOT_INSPECTION_PRICE,
): MotServiceOption[] {
  const selected: MotServiceOption[] = [];
  if (services.motInspection) {
    const mot = getMotServiceById("mot-inspection", inspectionPrice);
    if (mot) selected.push(mot);
  }
  services.selectedServiceIds
    .filter((id) => id !== "mot-inspection")
    .forEach((id) => {
      const service = getMotServiceById(id, inspectionPrice);
      if (service) selected.push(service);
    });
  return selected;
}

export function hasMotInspectionSelected(services: MotWizardServices): boolean {
  return services.motInspection;
}

export function getWizardStorageKey(tenantDomain: string) {
  return `mot_booking_wizard_draft:${tenantDomain}`;
}

export function saveWizardDraft(
  tenantDomain: string,
  data: MotWizardData,
  step: number,
  vehicleSubStep: string,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getWizardStorageKey(tenantDomain),
    JSON.stringify({ data, step, vehicleSubStep, savedAt: Date.now() }),
  );
}

export function normalizeWizardServices(
  services: Partial<MotWizardServices> | undefined,
): MotWizardServices {
  const selectedServiceIds = Array.isArray(services?.selectedServiceIds)
    ? services.selectedServiceIds
    : [];
  const hadMotInIds = selectedServiceIds.includes("mot-inspection");
  return {
    motInspection:
      typeof services?.motInspection === "boolean"
        ? services.motInspection
        : hadMotInIds || selectedServiceIds.length === 0,
    selectedServiceIds: selectedServiceIds.filter(
      (id) => id !== "mot-inspection",
    ),
    otherServices: services?.otherServices || "",
  };
}

export function loadWizardDraft(
  tenantDomain: string,
): { data: MotWizardData; step: number; vehicleSubStep: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getWizardStorageKey(tenantDomain));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data) return null;
    parsed.data.services = normalizeWizardServices(parsed.data.services);
    return parsed;
  } catch {
    return null;
  }
}

export function clearWizardDraft(tenantDomain: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getWizardStorageKey(tenantDomain));
}

export function formatVehicleSummary(data: MotWizardData): string {
  const { vehicle } = data;
  const parts = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean);
  if (parts.length) return parts.join(" ").toUpperCase();
  if (vehicle.registration) return vehicle.registration.toUpperCase();
  return "";
}

export function getDeliveryOptionLabel(option: MotDeliveryOption | ""): string {
  if (!option) return "";
  if (option === "wait_on_site") {
    return "I would like to wait for my vehicle whilst it is in the workshop";
  }
  return MOT_DELIVERY_OPTIONS.find((o) => o.value === option)?.label ?? "";
}

export function formatBookingDateTime(date: string, time: string): string {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return `${date}${time ? ` ${time}` : ""}`;
  return (
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) + (time ? ` ${time}` : "")
  );
}

export function calculateTotalCost(
  data: MotWizardData,
  inspectionPrice: number = MOT_INSPECTION_PRICE,
): number {
  return getSelectedMotServices(data.services, inspectionPrice).reduce(
    (total, service) => total + service.price,
    0,
  );
}

export function isVehicleDetailsComplete(data: MotWizardData): boolean {
  const { vehicle } = data;
  return Boolean(
    vehicle.registration.trim() &&
      vehicle.mileage.trim() &&
      vehicle.make.trim() &&
      vehicle.year.trim(),
  );
}

export function isVehicleModelComplete(data: MotWizardData): boolean {
  return Boolean(data.vehicle.model.trim());
}

export function isServicesComplete(data: MotWizardData): boolean {
  return (
    data.services.motInspection ||
    data.services.selectedServiceIds.length > 0 ||
    data.services.otherServices.trim().length > 0
  );
}

export function isDateTimeComplete(data: MotWizardData): boolean {
  const { dateTime } = data;
  return Boolean(
    dateTime.deliveryOption && dateTime.bookingDate && dateTime.bookingTime,
  );
}

export function isCustomerDetailsComplete(data: MotWizardData): boolean {
  const { customer } = data;
  return Boolean(
    customer.title &&
      customer.firstName.trim() &&
      customer.lastName.trim() &&
      customer.telephone.trim() &&
      customer.postcode.trim() &&
      customer.privacyAccepted &&
      customer.termsAccepted,
  );
}

export function formatCustomerName(data: MotWizardData): string {
  const { customer } = data;
  return [customer.title, customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function formatCustomerAddress(data: MotWizardData): string[] {
  const { customer } = data;
  return [
    [customer.houseNumber, customer.street].filter(Boolean).join(" "),
    customer.town,
    customer.county,
    customer.postcode,
  ].filter(Boolean);
}

export function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const next = (h + 1) * 60 + (m || 0);
  const hours = Math.floor(next / 60) % 24;
  const mins = next % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function wizardDataToBookingPayload(
  data: MotWizardData,
  inspectionPrice: number = MOT_INSPECTION_PRICE,
) {
  const endTime = addOneHour(data.dateTime.bookingTime);
  const notesParts = [
    data.services.otherServices.trim(),
    data.customer.additionalComments.trim(),
  ].filter(Boolean);

  return {
    customer_name: formatCustomerName(data),
    customer_phone: data.customer.telephone,
    customer_email: data.customer.email,
    vehicle_registration: data.vehicle.registration,
    vehicle_make: data.vehicle.make,
    vehicle_model: data.vehicle.model,
    vehicle_year: data.vehicle.year,
    delivery_option: data.dateTime.deliveryOption || undefined,
    booking_date: data.dateTime.bookingDate,
    start_time: data.dateTime.bookingTime,
    end_time: endTime,
    test_type: "standard" as const,
    status: "confirmed" as const,
    price: calculateTotalCost(data, inspectionPrice),
    mileage: data.vehicle.mileage,
    notes: notesParts.join("\n\n") || undefined,
    booking_meta: {
      services: {
        motInspection: data.services.motInspection,
        selectedServiceIds: data.services.selectedServiceIds.filter(
          (id) => id !== "mot-inspection",
        ),
        otherServices: data.services.otherServices,
        motPrice: inspectionPrice,
      },
      deliveryOption: data.dateTime.deliveryOption,
      customer: data.customer,
      vehicle: data.vehicle,
    },
  };
}

export function bookingToWizardData(
  booking: import("@/src/models/mot/MotBooking").MotBooking,
): MotWizardData {
  const meta = (booking.booking_meta || {}) as Record<string, unknown>;
  const customerMeta = (meta.customer || {}) as Partial<
    MotWizardData["customer"]
  >;
  const servicesMeta = (meta.services || {}) as Partial<
    MotWizardData["services"]
  >;
  const vehicleMeta = (meta.vehicle || {}) as Partial<MotWizardVehicle>;
  const nameParts = (booking.customer_name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    vehicle: {
      registration:
        booking.vehicle_registration || vehicleMeta.registration || "",
      mileage: booking.mileage || vehicleMeta.mileage || "",
      make: booking.vehicle_make || vehicleMeta.make || "",
      year: booking.vehicle_year || vehicleMeta.year || "",
      model: booking.vehicle_model || vehicleMeta.model || "",
    },
    services: {
      motInspection:
        typeof servicesMeta.motInspection === "boolean"
          ? servicesMeta.motInspection
          : Array.isArray(servicesMeta.selectedServiceIds)
            ? servicesMeta.selectedServiceIds.includes("mot-inspection")
            : true,
      selectedServiceIds: Array.isArray(servicesMeta.selectedServiceIds)
        ? servicesMeta.selectedServiceIds.filter(
            (id) => id !== "mot-inspection",
          )
        : [],
      otherServices: servicesMeta.otherServices || booking.notes || "",
    },
    dateTime: {
      deliveryOption:
        booking.delivery_option === "wait_on_site"
          ? "wait_security"
          : (booking.delivery_option as MotDeliveryOption) || "",
      bookingDate: booking.booking_date?.slice(0, 10) || "",
      bookingTime: booking.start_time || "",
    },
    customer: {
      title: customerMeta.title || "",
      firstName: customerMeta.firstName || nameParts.slice(0, -1).join(" ") || nameParts[0] || "",
      lastName:
        customerMeta.lastName ||
        (nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""),
      email: booking.customer_email || customerMeta.email || "",
      county: customerMeta.county || "",
      telephone: booking.customer_phone || customerMeta.telephone || "",
      houseNumber: customerMeta.houseNumber || "",
      street: customerMeta.street || "",
      town: customerMeta.town || "",
      postcode: customerMeta.postcode || "",
      contactConsent: customerMeta.contactConsent || {
        email: false,
        post: false,
        telephone: false,
        sms: false,
      },
      additionalComments: customerMeta.additionalComments || "",
      privacyAccepted: customerMeta.privacyAccepted ?? false,
      termsAccepted: customerMeta.termsAccepted ?? false,
    },
  };
}
