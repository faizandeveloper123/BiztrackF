import { apiService } from "./ApiService";
import {
  TimeEntry,
  TimeEntryCreate,
  TimeEntryUpdate,
  TimeEntriesResponse,
  TimeTrackingDashboard,
  TimeEntryFilters,
  ActiveTimeSession,
} from "../models/timeTracking";

class TimeTrackingService {
  async getTimeEntries(
    page: number = 1,
    limit: number = 100,
    filters?: TimeEntryFilters,
  ): Promise<TimeEntriesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.employeeId) params.append("employee_id", filters.employeeId);
    if (filters?.startDate) params.append("start_date", filters.startDate);
    if (filters?.endDate) params.append("end_date", filters.endDate);
    if (filters?.projectId) params.append("project_id", filters.projectId);
    if (filters?.status) params.append("status", filters.status);

    const response = await apiService.get(
      `/projects/time-entries?${params.toString()}`,
    );
    return response;
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    const response = await apiService.get(`/projects/time-entries/${id}`);
    return response;
  }

  async createTimeEntry(timeEntryData: TimeEntryCreate): Promise<TimeEntry> {
    const response = await apiService.post(
      "/projects/time-entries",
      timeEntryData,
    );
    return response;
  }

  async updateTimeEntry(
    id: string,
    timeEntryData: TimeEntryUpdate,
  ): Promise<TimeEntry> {
    const response = await apiService.put(
      `/projects/time-entries/${id}`,
      timeEntryData,
    );
    return response;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await apiService.delete(`/projects/time-entries/${id}`);
  }

  async getTimeTrackingDashboard(): Promise<TimeTrackingDashboard> {
    const response = await apiService.get("/projects/time-tracking/dashboard");
    return response;
  }

  async getCurrentSession(): Promise<ActiveTimeSession | null> {
    try {
      const response = await apiService.get(
        "/projects/time-tracking/current-session",
      );
      return response.session || null;
    } catch (error) {
      return null;
    }
  }

  async startTimeSession(sessionData: {
    projectId?: string;
    taskId?: string;
    description?: string;
  }): Promise<ActiveTimeSession> {
    const response = await apiService.post(
      "/projects/time-tracking/start",
      sessionData,
    );
    return response.session;
  }

  async stopTimeSession(sessionId: string, notes?: string): Promise<TimeEntry> {
    const response = await apiService.post(
      `/projects/time-tracking/stop/${sessionId}`,
      {
        notes,
      },
    );
    return response.timeEntry;
  }

  async pauseTimeSession(sessionId: string): Promise<ActiveTimeSession> {
    const response = await apiService.post(
      `/projects/time-tracking/pause/${sessionId}`,
    );
    return response.session;
  }

  async resumeTimeSession(sessionId: string): Promise<ActiveTimeSession> {
    const response = await apiService.post(
      `/projects/time-tracking/resume/${sessionId}`,
    );
    return response.session;
  }

  async getTimeTrackingStats(
    startDate?: string,
    endDate?: string,
    employeeId?: string,
  ): Promise<{
    todayHours: number;
    weekHours: number;
    monthHours: number;
    totalHours: number;
    averageDailyHours: number;
    overtimeHours: number;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (employeeId) params.append("employee_id", employeeId);

    const response = await apiService.get(
      `/projects/time-tracking/stats?${params.toString()}`,
    );
    return response;
  }

  async approveTimeEntry(timeEntryId: string): Promise<TimeEntry> {
    const response = await apiService.post(
      `/projects/time-entries/${timeEntryId}/approve`,
    );
    return response;
  }

  async rejectTimeEntry(
    timeEntryId: string,
    reason: string,
  ): Promise<TimeEntry> {
    const response = await apiService.post(
      `/projects/time-entries/${timeEntryId}/reject`,
      {
        reason,
      },
    );
    return response;
  }
}

export const timeTrackingService = new TimeTrackingService();
