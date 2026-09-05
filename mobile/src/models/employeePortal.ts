import type { Employee, LeaveRequest } from './hrm';
import type { SubTaskRecord } from './project/pmApiTypes';

export interface EmployeePortalStats {
  tasksDueToday: number;
  openTasks: number;
  hoursToday: number;
  leaveBalance: number;
  devicesCount: number;
  pendingLeave: number;
}

export interface TimeSession {
  id: string;
  employeeId: string;
  projectId?: string | null;
  taskId?: string | null;
  startTime?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface EmployeePortalTaskSummary {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId?: string | null;
  actualHours: number;
}

export interface PendingApproval {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
}

export interface TeamTimeRow {
  employeeId: string;
  name: string;
  hoursToday: number;
}

export interface EmployeePortalDashboard {
  employee: Employee;
  isManager: boolean;
  stats: EmployeePortalStats;
  activeSession: TimeSession | null;
  todayTasks: EmployeePortalTaskSummary[];
  pendingApprovals?: PendingApproval[];
  teamTimeToday?: TeamTimeRow[];
}

export interface EmployeeDevice {
  id: string;
  employeeId: string;
  employeeName?: string;
  name: string;
  deviceType: string;
  serialNumber?: string | null;
  model?: string | null;
  status: string;
  assignedAt?: string | null;
  returnedAt?: string | null;
  notes?: string | null;
  tenant_id: string;
}

export interface EmployeeProfileUpdate {
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  avatar?: string | null;
}

export interface LeaveRequestSelfCreate {
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
}

export interface EmployeeTaskCreate {
  title: string;
  description?: string;
  projectId?: string;
  dueDate?: string;
  priority?: string;
}

export interface EmployeeTaskLog {
  hours: number;
  notes?: string;
  status?: string;
}

export interface EmployeeDeviceCreate {
  employeeId: string;
  name: string;
  deviceType?: string;
  serialNumber?: string;
  model?: string;
  notes?: string;
}

export interface PortalTasksResponse {
  tasks: SubTaskRecord[];
  pagination?: { page: number; limit: number; total: number };
}
