import type { Employee } from "./hrm";

export interface EmployeeProfileUpdate {
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  avatar?: string | null;
}

export interface PortalTimeSession {
  id: string;
  employeeId?: string;
  projectId?: string | null;
  taskId?: string | null;
  startTime?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface PortalTimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string | null;
  totalHours?: number | null;
  overtimeHours?: number | null;
  projectId?: string | null;
  taskId?: string | null;
  notes?: string | null;
  status?: string;
  tenant_id?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type { Employee };
