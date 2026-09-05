import type { MotBooking } from "@/src/models/mot/MotBooking";

const BOOKED_STATUSES = new Set([
  "scheduled",
  "confirmed",
  "in_progress",
  "passed",
  "failed",
]);

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getCalendarDateRange(monthsAhead = 6): {
  dateFrom: string;
  dateTo: string;
} {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setMonth(to.getMonth() + monthsAhead);
  return {
    dateFrom: formatLocalDate(from),
    dateTo: formatLocalDate(to),
  };
}

export function normalizeTimeSlot(time?: string): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes || "0", 10);
  if (Number.isNaN(hour)) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isActiveBooking(
  booking: MotBooking,
  excludeBookingId?: string | null,
): boolean {
  if (excludeBookingId && booking.id === excludeBookingId) return false;
  if (!booking.is_active) return false;
  if (!BOOKED_STATUSES.has(booking.status)) return false;
  return true;
}

export function getBookedSlotsByDate(
  bookings: MotBooking[],
  excludeBookingId?: string | null,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const booking of bookings) {
    if (!isActiveBooking(booking, excludeBookingId)) continue;

    const date = booking.booking_date?.slice(0, 10);
    const time = normalizeTimeSlot(booking.start_time);
    if (!date || !time) continue;

    if (!map.has(date)) map.set(date, new Set());
    map.get(date)!.add(time);
  }

  return map;
}

export function getBookedTimesForDate(
  bookedSlotsByDate: Map<string, Set<string>>,
  date: string,
): Set<string> {
  return bookedSlotsByDate.get(date) || new Set();
}
