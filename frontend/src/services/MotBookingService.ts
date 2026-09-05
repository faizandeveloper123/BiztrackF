import { apiService } from "./ApiService";
import type {
  MotBooking,
  MotBookingCreate,
  MotBookingUpdate,
  MotBookingStatusUpdate,
  MotBookingsResponse,
  MotBookingStats,
} from "../models/mot/MotBooking";
import type { MotSettings, MotSettingsUpdate } from "../models/mot/MotSettings";

export class MotBookingService {
  private adminBaseUrl = "/mot";

  private publicBaseUrl(tenantDomain: string): string {
    return `/public/mot/${encodeURIComponent(tenantDomain)}`;
  }

  async getPublicSettings(tenantDomain: string): Promise<MotSettings> {
    return apiService.get(`${this.publicBaseUrl(tenantDomain)}/settings`);
  }

  async getSettings(): Promise<MotSettings> {
    return apiService.get(`${this.adminBaseUrl}/settings`);
  }

  async updateSettings(data: MotSettingsUpdate): Promise<MotSettings> {
    return apiService.patch(`${this.adminBaseUrl}/settings`, data);
  }

  async getStats(): Promise<MotBookingStats> {
    return apiService.get(`${this.adminBaseUrl}/bookings/stats`);
  }

  async getBookings(params?: {
    status?: string;
    test_type?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MotBookingsResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all")
      query.set("status", params.status);
    if (params?.test_type && params.test_type !== "all")
      query.set("test_type", params.test_type);
    if (params?.date_from) query.set("date_from", params.date_from);
    if (params?.date_to) query.set("date_to", params.date_to);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiService.get(
      qs
        ? `${this.adminBaseUrl}/bookings?${qs}`
        : `${this.adminBaseUrl}/bookings`,
    );
  }

  async getCalendar(
    dateFrom: string,
    dateTo: string,
  ): Promise<MotBookingsResponse> {
    return apiService.get(
      `${this.adminBaseUrl}/bookings/calendar?date_from=${dateFrom}&date_to=${dateTo}`,
    );
  }

  async getPublicCalendar(
    tenantDomain: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<MotBookingsResponse> {
    return apiService.get(
      `${this.publicBaseUrl(tenantDomain)}/bookings/calendar?date_from=${dateFrom}&date_to=${dateTo}`,
    );
  }

  async getPublicBooking(
    tenantDomain: string,
    id: string,
  ): Promise<MotBooking> {
    return apiService.get(`${this.publicBaseUrl(tenantDomain)}/bookings/${id}`);
  }

  async createPublicBooking(
    tenantDomain: string,
    data: MotBookingCreate,
  ): Promise<MotBooking> {
    return apiService.post(
      `${this.publicBaseUrl(tenantDomain)}/bookings`,
      data,
    );
  }

  async updatePublicBooking(
    tenantDomain: string,
    id: string,
    data: MotBookingUpdate,
  ): Promise<MotBooking> {
    return apiService.put(
      `${this.publicBaseUrl(tenantDomain)}/bookings/${id}`,
      data,
    );
  }

  async updatePublicBookingStatus(
    tenantDomain: string,
    id: string,
    data: MotBookingStatusUpdate,
  ): Promise<MotBooking> {
    return apiService.patch(
      `${this.publicBaseUrl(tenantDomain)}/bookings/${id}/status`,
      data,
    );
  }

  async adminCreateBooking(data: MotBookingCreate): Promise<MotBooking> {
    return apiService.post(`${this.adminBaseUrl}/bookings`, data);
  }

  async adminUpdateBooking(
    id: string,
    data: MotBookingUpdate,
  ): Promise<MotBooking> {
    return apiService.put(`${this.adminBaseUrl}/bookings/${id}`, data);
  }

  async adminUpdateBookingStatus(
    id: string,
    data: MotBookingStatusUpdate,
  ): Promise<MotBooking> {
    return apiService.patch(`${this.adminBaseUrl}/bookings/${id}/status`, data);
  }

  async deleteBooking(id: string): Promise<void> {
    return apiService.delete(`${this.adminBaseUrl}/bookings/${id}`);
  }
}

export const motBookingService = new MotBookingService();
export default motBookingService;
