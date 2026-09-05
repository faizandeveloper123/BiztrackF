export interface TimeEntry {
  id: string;
  tenant_id: string;
  employeeId: string;
  projectId?: string;
  taskId?: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  notes?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryCreate {
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
  status?: string;
}

export interface TimeEntryUpdate {
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  overtimeHours?: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
  status?: string;
}

export interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TimeTrackingStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  totalHours: number;
  averageDailyHours: number;
  overtimeHours: number;
}

export interface TimeTrackingDashboard {
  stats: TimeTrackingStats;
  recentEntries: TimeEntry[];
  currentSession?: TimeEntry;
}

export interface TimeEntryFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  status?: string;
}

export interface ActiveTimeSession {
  id: string;
  employeeId: string;
  projectId?: string;
  taskId?: string;
  startTime: string;
  description?: string;
  isActive: boolean;
}
