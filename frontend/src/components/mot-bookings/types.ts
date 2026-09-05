import type {
  MotBookingStatus,
  MotTestType,
} from "@/src/models/mot/MotBooking";

export type MotBookingFiltersState = {
  searchTerm: string;
  status: MotBookingStatus | "all";
  testType: MotTestType | "all";
  dateFrom: string;
  dateTo: string;
};

export type MotBookingFormData = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  testType: MotTestType;
  status: MotBookingStatus;
  price: number;
  mileage: string;
  motExpiryDate: string;
  notes: string;
  resultNotes: string;
};
