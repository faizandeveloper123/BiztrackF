import { apiService } from '../ApiService';

export type MotBookingStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'cancelled'
  | 'no_show';

export type MotTestType = 'standard' | 'retest' | 'pre_mot';

export interface MotBooking {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  test_type: MotTestType;
  status: MotBookingStatus;
  price: number;
  mileage?: string;
  mot_expiry_date?: string;
  notes?: string;
  result_notes?: string;
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

const base = '/mot';

export async function getMotBookingStats(): Promise<MotBookingStats> {
  return apiService.get(`${base}/bookings/stats`);
}

export async function getMotBookings(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ bookings: MotBooking[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.status && params.status !== 'all') q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  q.set('limit', String(params?.limit ?? 100));
  const qs = q.toString();
  return apiService.get(qs ? `${base}/bookings?${qs}` : `${base}/bookings`);
}

export async function createMotBooking(body: Record<string, unknown>) {
  return apiService.post(`${base}/bookings`, body);
}

export async function updateMotBooking(id: string, body: Record<string, unknown>) {
  return apiService.put(`${base}/bookings/${id}`, body);
}

export async function updateMotBookingStatus(
  id: string,
  body: { status: MotBookingStatus; result_notes?: string },
) {
  return apiService.patch(`${base}/bookings/${id}/status`, body);
}

export async function deleteMotBooking(id: string) {
  return apiService.delete(`${base}/bookings/${id}`);
}
