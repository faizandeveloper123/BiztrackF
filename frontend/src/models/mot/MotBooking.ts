export type MotBookingStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "passed"
  | "failed"
  | "cancelled"
  | "no_show";

export type MotTestType = "standard" | "retest" | "pre_mot";

export type MotExpiryPhase = "green" | "yellow" | "red" | "expired" | "unknown";

export interface MotBookingExpiryStatus {
  days_left: number | null;
  expiry_phase: MotExpiryPhase;
  mot_expiry_date?: string;
}

export interface MotBooking {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  delivery_option?: string;
  booking_meta?: Record<string, unknown>;
  booking_date: string;
  start_time: string;
  end_time: string;
  test_type: MotTestType;
  status: MotBookingStatus;
  price: number;
  mileage?: string;
  mot_expiry_date?: string;
  mot_reminder_sent_at?: string;
  notes?: string;
  result_notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  expiry_status?: MotBookingExpiryStatus;
}

export interface MotBookingCreate {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  delivery_option?: string;
  booking_meta?: Record<string, unknown>;
  booking_date: string;
  start_time: string;
  end_time: string;
  test_type?: MotTestType;
  status?: MotBookingStatus;
  price?: number;
  mileage?: string;
  mot_expiry_date?: string;
  notes?: string;
  result_notes?: string;
}

export interface MotBookingUpdate extends Partial<MotBookingCreate> {
  is_active?: boolean;
}

export interface MotBookingStatusUpdate {
  status: MotBookingStatus;
  result_notes?: string;
}

export interface MotBookingsResponse {
  bookings: MotBooking[];
  total: number;
}

export interface MotBookingStats {
  total_bookings: number;
  today_bookings: number;
  upcoming_week: number;
  scheduled_count: number;
  confirmed_count: number;
  in_progress_count: number;
  passed_count: number;
  failed_count: number;
  cancelled_count: number;
}

export const MOT_BOOKING_STATUSES: {
  value: MotBookingStatus;
  label: string;
}[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const MOT_TEST_TYPES: { value: MotTestType; label: string }[] = [
  { value: "standard", label: "Standard MOT" },
  { value: "retest", label: "Retest" },
  { value: "pre_mot", label: "Pre-MOT Check" },
];

export const MOT_TIME_SLOTS = [
  { start: "08:00", end: "08:45" },
  { start: "08:45", end: "09:30" },
  { start: "09:30", end: "10:15" },
  { start: "10:15", end: "11:00" },
  { start: "11:00", end: "11:45" },
  { start: "11:45", end: "12:30" },
  { start: "13:00", end: "13:45" },
  { start: "13:45", end: "14:30" },
  { start: "14:30", end: "15:15" },
  { start: "15:15", end: "16:00" },
  { start: "16:00", end: "16:45" },
  { start: "16:45", end: "17:30" },
];

export function getMotStatusColor(status: MotBookingStatus): string {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-indigo-100 text-indigo-800";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "passed":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    case "no_show":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getMotTestTypeLabel(type: MotTestType): string {
  return MOT_TEST_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getMotStatusLabel(status: MotBookingStatus): string {
  return MOT_BOOKING_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function formatMotVehicleLine(booking: MotBooking): string {
  const parts = [
    booking.vehicle_registration,
    booking.vehicle_make,
    booking.vehicle_model,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}
