import { apiService } from '../ApiService';
import type {
  EmployeePortalDashboard,
  EmployeeProfileUpdate,
  LeaveRequestSelfCreate,
  EmployeeTaskCreate,
  EmployeeTaskLog,
  EmployeeDevice,
  EmployeeDeviceCreate,
  PortalTasksResponse,
} from '../../models/employeePortal';
import type { Employee, LeaveRequest } from '../../models/hrm';
import type { ProjectTimeEntry } from '../../models/project/pmApiTypes';

export async function getEmployeePortalDashboard(): Promise<EmployeePortalDashboard> {
  return apiService.get<EmployeePortalDashboard>('/employee-portal/dashboard');
}

export async function getMyEmployeeProfile(): Promise<Employee> {
  return apiService.get<Employee>('/employee-portal/me');
}

export async function updateMyEmployeeProfile(
  data: EmployeeProfileUpdate,
): Promise<Employee> {
  return apiService.put<Employee>('/employee-portal/me', data);
}

export async function getPortalLeaveRequests(
  status?: string,
): Promise<{ leaveRequests: LeaveRequest[] }> {
  const p = new URLSearchParams();
  if (status) p.append('status', status);
  const q = p.toString();
  return apiService.get(`/employee-portal/leave-requests${q ? `?${q}` : ''}`);
}

export async function createPortalLeaveRequest(
  data: LeaveRequestSelfCreate,
): Promise<LeaveRequest> {
  return apiService.post<LeaveRequest>('/employee-portal/leave-requests', data);
}

export async function reviewPortalLeaveRequest(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): Promise<LeaveRequest> {
  return apiService.post<LeaveRequest>(`/employee-portal/leave-requests/${id}/review`, {
    action,
    rejectionReason,
  });
}

export async function getPortalTimeEntries(opts?: {
  start_date?: string;
  end_date?: string;
  employee_id?: string;
}): Promise<{ timeEntries: ProjectTimeEntry[] }> {
  const p = new URLSearchParams();
  if (opts?.start_date) p.append('start_date', opts.start_date);
  if (opts?.end_date) p.append('end_date', opts.end_date);
  if (opts?.employee_id) p.append('employee_id', opts.employee_id);
  const q = p.toString();
  return apiService.get(`/employee-portal/time-entries${q ? `?${q}` : ''}`);
}

export async function getCurrentTimeSession(): Promise<{
  session: {
    id: string;
    employeeId?: string;
    startTime?: string | null;
    description?: string | null;
    isActive: boolean;
  } | null;
}> {
  return apiService.get('/employee-portal/time-tracking/current-session');
}

export async function startTimeSession(body?: {
  projectId?: string;
  taskId?: string;
  description?: string;
}): Promise<{
  session: {
    id: string;
    startTime?: string | null;
    description?: string | null;
    isActive: boolean;
  };
}> {
  const payload: {
    projectId?: string;
    taskId?: string;
    description?: string;
  } = {};
  if (body?.projectId) payload.projectId = body.projectId;
  if (body?.taskId) payload.taskId = body.taskId;
  if (body?.description?.trim()) payload.description = body.description.trim();
  return apiService.post('/employee-portal/time-tracking/start', payload);
}

export async function stopTimeSession(
  sessionId: string,
  notes?: string,
): Promise<{ timeEntry: ProjectTimeEntry }> {
  const payload = notes?.trim() ? { notes: notes.trim() } : {};
  return apiService.post(`/employee-portal/time-tracking/stop/${sessionId}`, payload);
}

export async function getPortalTasks(status?: string): Promise<PortalTasksResponse> {
  const p = new URLSearchParams();
  if (status) p.append('status', status);
  const q = p.toString();
  return apiService.get(`/employee-portal/tasks${q ? `?${q}` : ''}`);
}

export async function createPortalTask(
  data: EmployeeTaskCreate,
): Promise<unknown> {
  return apiService.post('/employee-portal/tasks', data);
}

export async function logPortalTask(
  taskId: string,
  data: EmployeeTaskLog,
): Promise<{ success: boolean; loggedHours: number }> {
  return apiService.post(`/employee-portal/tasks/${taskId}/log`, data);
}

export async function completePortalTask(taskId: string): Promise<unknown> {
  return apiService.put(`/employee-portal/tasks/${taskId}/complete`, {});
}

export type PortalTaskMessage = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  messageType: string;
  createdAt?: string;
  isMine?: boolean;
};

export async function getPortalTaskMessages(
  taskId: string,
): Promise<PortalTaskMessage[]> {
  return apiService.get(`/employee-portal/tasks/${taskId}/messages`);
}

export async function createPortalTaskMessage(
  taskId: string,
  data: { body: string; messageType?: string },
): Promise<PortalTaskMessage> {
  return apiService.post(`/employee-portal/tasks/${taskId}/messages`, data);
}

export async function getPortalDevices(opts?: {
  all_devices?: boolean;
  employee_id?: string;
}): Promise<{ devices: EmployeeDevice[] }> {
  const p = new URLSearchParams();
  if (opts?.all_devices) p.append('all_devices', 'true');
  if (opts?.employee_id) p.append('employee_id', opts.employee_id);
  const q = p.toString();
  return apiService.get(`/employee-portal/devices${q ? `?${q}` : ''}`);
}

export async function assignPortalDevice(
  data: EmployeeDeviceCreate,
): Promise<EmployeeDevice> {
  return apiService.post<EmployeeDevice>('/employee-portal/devices', data);
}

export async function updatePortalDevice(
  id: string,
  data: Partial<EmployeeDeviceCreate> & { status?: string; returnedAt?: string },
): Promise<EmployeeDevice> {
  return apiService.put<EmployeeDevice>(`/employee-portal/devices/${id}`, data);
}
