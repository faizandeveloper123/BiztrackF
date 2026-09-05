import {
  MOT_TIME_SLOTS,
  type MotBooking,
  type MotBookingCreate,
  type MotBookingStatus,
  type MotTestType,
} from "@/src/models/mot/MotBooking";
import type { MotBookingFiltersState, MotBookingFormData } from "./types";

export function defaultFilters(): MotBookingFiltersState {
  return {
    searchTerm: "",
    status: "all",
    testType: "all",
    dateFrom: "",
    dateTo: "",
  };
}

export function emptyMotBookingFormData(): MotBookingFormData {
  const today = new Date().toISOString().split("T")[0];
  const firstSlot = MOT_TIME_SLOTS[0];
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    vehicleRegistration: "",
    vehicleMake: "",
    vehicleModel: "",
    bookingDate: today,
    startTime: firstSlot.start,
    endTime: firstSlot.end,
    testType: "standard",
    status: "scheduled",
    price: 54.85,
    mileage: "",
    motExpiryDate: "",
    notes: "",
    resultNotes: "",
  };
}

export function bookingToFormData(booking: MotBooking): MotBookingFormData {
  return {
    customerName: booking.customer_name || "",
    customerPhone: booking.customer_phone || "",
    customerEmail: booking.customer_email || "",
    vehicleRegistration: booking.vehicle_registration || "",
    vehicleMake: booking.vehicle_make || "",
    vehicleModel: booking.vehicle_model || "",
    bookingDate: booking.booking_date?.slice(0, 10) || "",
    startTime: booking.start_time || "",
    endTime: booking.end_time || "",
    testType: booking.test_type || "standard",
    status: booking.status || "scheduled",
    price: Number(booking.price) || 0,
    mileage: booking.mileage || "",
    motExpiryDate: booking.mot_expiry_date?.slice(0, 10) || "",
    notes: booking.notes || "",
    resultNotes: booking.result_notes || "",
  };
}

export function formDataToPayload(
  formData: MotBookingFormData,
): MotBookingCreate {
  return {
    customer_name: formData.customerName || undefined,
    customer_phone: formData.customerPhone || undefined,
    customer_email: formData.customerEmail || undefined,
    vehicle_registration: formData.vehicleRegistration || undefined,
    vehicle_make: formData.vehicleMake || undefined,
    vehicle_model: formData.vehicleModel || undefined,
    booking_date: formData.bookingDate,
    start_time: formData.startTime,
    end_time: formData.endTime,
    test_type: formData.testType as MotTestType,
    status: formData.status as MotBookingStatus,
    price: formData.price,
    mileage: formData.mileage || undefined,
    mot_expiry_date: formData.motExpiryDate || undefined,
    notes: formData.notes || undefined,
    result_notes: formData.resultNotes || undefined,
  };
}

export function filterBookings(
  bookings: MotBooking[],
  filters: MotBookingFiltersState,
): MotBooking[] {
  return bookings.filter((booking) => {
    if (filters.status !== "all" && booking.status !== filters.status)
      return false;
    if (filters.testType !== "all" && booking.test_type !== filters.testType)
      return false;
    const bookingDate = booking.booking_date?.slice(0, 10) || "";
    if (filters.dateFrom && bookingDate < filters.dateFrom) return false;
    if (filters.dateTo && bookingDate > filters.dateTo) return false;
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const haystack = [
        booking.customer_name,
        booking.customer_phone,
        booking.vehicle_registration,
        booking.vehicle_make,
        booking.vehicle_model,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

export function applyTimeSlot(
  formData: MotBookingFormData,
  slotKey: string,
): MotBookingFormData {
  const slot = MOT_TIME_SLOTS.find((s) => `${s.start}-${s.end}` === slotKey);
  if (!slot) return formData;
  return { ...formData, startTime: slot.start, endTime: slot.end };
}

export function timeSlotKey(formData: MotBookingFormData): string {
  return `${formData.startTime}-${formData.endTime}`;
}

export function formatBookingDateTime(booking: MotBooking): string {
  const date = booking.booking_date?.slice(0, 10) || "";
  if (!date) return "";
  return `${date} ${booking.start_time || ""}`.trim();
}
