export type MotDeliveryOption = "drop_off" | "wait_security" | "wait_on_site";

export type MotWizardStep = 1 | 2 | 3 | 4 | 5;

export type MotVehicleSubStep = "details" | "model";

export type MotWizardVehicle = {
  registration: string;
  mileage: string;
  make: string;
  year: string;
  model: string;
};

export type MotServiceOption = {
  id: string;
  label: string;
  description: string;
  price: number;
};

export const MOT_INSPECTION_SERVICE: MotServiceOption = {
  id: "mot-inspection",
  label: "Carry Out MOT Inspection",
  description: "Standard MOT test including emissions and safety checks",
  price: 49,
};

export const MOT_SERVICE_OPTIONS: MotServiceOption[] = [
  {
    id: "oil-filter-change",
    label: "Oil & Filter Change",
    description: "Engine oil and filter replacement",
    price: 79,
  },
  {
    id: "brake-pad-replacement",
    label: "Brake Pad Replacement",
    description: "Front or rear brake pad replacement",
    price: 149,
  },
  {
    id: "full-service",
    label: "Full Service",
    description: "Comprehensive vehicle service and safety check",
    price: 199,
  },
  {
    id: "tyre-rotation",
    label: "Tyre Rotation",
    description: "Rotate tyres for even wear",
    price: 39,
  },
  {
    id: "air-con-regas",
    label: "Air Conditioning Regas",
    description: "Recharge air conditioning system",
    price: 89,
  },
  {
    id: "battery-check",
    label: "Battery Check & Replacement",
    description: "Battery health test and replacement if required",
    price: 120,
  },
  {
    id: "wheel-alignment",
    label: "Wheel Alignment",
    description: "Four-wheel alignment and tracking adjustment",
    price: 65,
  },
];

export type MotWizardServices = {
  motInspection: boolean;
  selectedServiceIds: string[];
  otherServices: string;
};

export type MotWizardDateTime = {
  deliveryOption: MotDeliveryOption | "";
  bookingDate: string;
  bookingTime: string;
};

export type MotContactConsent = {
  email: boolean;
  post: boolean;
  telephone: boolean;
  sms: boolean;
};

export type MotWizardCustomer = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  county: string;
  telephone: string;
  houseNumber: string;
  street: string;
  town: string;
  postcode: string;
  contactConsent: MotContactConsent;
  additionalComments: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
};

export type MotWizardData = {
  vehicle: MotWizardVehicle;
  services: MotWizardServices;
  dateTime: MotWizardDateTime;
  customer: MotWizardCustomer;
};

export const MOT_TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"];

export const MOT_WIZARD_STEPS: { step: MotWizardStep; label: string }[] = [
  { step: 1, label: "Your Vehicle" },
  { step: 2, label: "Services" },
  { step: 3, label: "Date & Time" },
  { step: 4, label: "Your Details" },
  { step: 5, label: "Confirm" },
];

export const MOT_DELIVERY_OPTIONS: {
  value: MotDeliveryOption;
  label: string;
  description?: string;
}[] = [
  {
    value: "drop_off",
    label: "I will drop my vehicle off and make my own onward travel plans",
  },
  {
    value: "wait_security",
    label: "I would like to wait while my vehicle is in the workshop",
  },
];

export const MOT_INSPECTION_PRICE = 49;

export const MOT_HOURLY_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, "0")}:00`;
});

export type MotMeridiem = "AM" | "PM";

export function bookingTimeToParts(time: string): {
  hour12: string;
  meridiem: MotMeridiem;
} | null {
  if (!time) return null;
  const hour24 = Number(time.split(":")[0]);
  if (Number.isNaN(hour24)) return null;
  const meridiem: MotMeridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour12: String(hour12), meridiem };
}

export function partsToBookingTime(
  hour12: string,
  meridiem: MotMeridiem,
): string {
  const h = Number(hour12);
  if (!h || Number.isNaN(h)) return "";
  let hour24 = h % 12;
  if (meridiem === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:00`;
}

export function getHour12OptionsForMeridiem(meridiem: MotMeridiem): string[] {
  return MOT_HOURLY_SLOTS.filter((slot) => {
    const parts = bookingTimeToParts(slot);
    return parts?.meridiem === meridiem;
  }).map((slot) => bookingTimeToParts(slot)!.hour12);
}

export function emptyMotWizardData(): MotWizardData {
  return {
    vehicle: {
      registration: "",
      mileage: "",
      make: "",
      year: "",
      model: "",
    },
    services: {
      motInspection: true,
      selectedServiceIds: [],
      otherServices: "",
    },
    dateTime: {
      deliveryOption: "",
      bookingDate: "",
      bookingTime: "",
    },
    customer: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      county: "",
      telephone: "",
      houseNumber: "",
      street: "",
      town: "",
      postcode: "",
      contactConsent: {
        email: false,
        post: false,
        telephone: false,
        sms: false,
      },
      additionalComments: "",
      privacyAccepted: false,
      termsAccepted: false,
    },
  };
}
