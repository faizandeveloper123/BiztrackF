import { ApiService } from "./ApiService";
import type {
  Employee,
  EmployeeProfileUpdate,
  PortalTimeEntry,
  PortalTimeSession,
} from "../models/employeePortal";

export class EmployeePortalService {
  constructor(private apiService: ApiService) {}

  getMyEmployeeProfile(): Promise<Employee> {
    return this.apiService.get<Employee>("/employee-portal/me");
  }

  updateMyEmployeeProfile(data: EmployeeProfileUpdate): Promise<Employee> {
    return this.apiService.put<Employee>("/employee-portal/me", data);
  }

  getCurrentSession(): Promise<{ session: PortalTimeSession | null }> {
    return this.apiService.get(
      "/employee-portal/time-tracking/current-session",
    );
  }

  startSession(body?: {
    projectId?: string;
    taskId?: string;
    description?: string;
  }): Promise<{ session: PortalTimeSession }> {
    const payload: {
      projectId?: string;
      taskId?: string;
      description?: string;
    } = {};
    if (body?.projectId) payload.projectId = body.projectId;
    if (body?.taskId) payload.taskId = body.taskId;
    if (body?.description?.trim())
      payload.description = body.description.trim();
    return this.apiService.post(
      "/employee-portal/time-tracking/start",
      payload,
    );
  }

  stopSession(
    sessionId: string,
    notes?: string,
  ): Promise<{ timeEntry: PortalTimeEntry }> {
    const payload = notes?.trim() ? { notes: notes.trim() } : {};
    return this.apiService.post(
      `/employee-portal/time-tracking/stop/${sessionId}`,
      payload,
    );
  }

  listTimeEntries(opts?: {
    start_date?: string;
    end_date?: string;
    employee_id?: string;
  }): Promise<{ timeEntries: PortalTimeEntry[] }> {
    const params = new URLSearchParams();
    if (opts?.start_date) params.append("start_date", opts.start_date);
    if (opts?.end_date) params.append("end_date", opts.end_date);
    if (opts?.employee_id) params.append("employee_id", opts.employee_id);
    const q = params.toString();
    return this.apiService.get(
      `/employee-portal/time-entries${q ? `?${q}` : ""}`,
    );
  }
}

export default EmployeePortalService;
