export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ProjectTeamMemberRef {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string | null;
}

export interface ProjectRecord {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate?: string | null;
  endDate?: string | null;
  completionPercent: number;
  budget?: number | null;
  actualCost?: number;
  notes?: string | null;
  clientEmail?: string | null;
  projectManagerId: string;
  createdById?: string | null;
  projectManager: ProjectTeamMemberRef;
  teamMembers: ProjectTeamMemberRef[];
  createdAt: string;
  updatedAt: string;
}

export interface PmProjectsApiResponse {
  projects: ProjectRecord[];
  pagination: ProjectPagination;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string | null;
  status?: string;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  completionPercent?: number;
  budget?: number | null;
  actualCost?: number;
  notes?: string | null;
  clientEmail?: string | null;
  projectManagerId: string;
  teamMemberIds?: string[];
}

export interface ProjectUpdatePayload {
  name?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  completionPercent?: number;
  budget?: number | null;
  actualCost?: number;
  notes?: string | null;
  clientEmail?: string | null;
  projectManagerId?: string;
  teamMemberIds?: string[];
}

export interface SubTaskRecord {
  id: string;
  tenant_id?: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  projectId?: string;
  assignedToId?: string | null;
  createdById?: string;
  parentTaskId?: string | null;
  assignedTo?: { id: string; name: string; email?: string } | null;
  createdBy: { id: string; name: string; email?: string };
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number;
  tags: string[];
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks?: SubTaskRecord[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

export interface PmTasksApiResponse {
  tasks: SubTaskRecord[];
  pagination: ProjectPagination;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  projectId: string;
  assignedToId?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number;
  tags?: string[];
  parentTaskId?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assignedToId?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number;
  tags?: string[];
  parentTaskId?: string | null;
}

export interface ProjectTeamMembersApiResponse {
  teamMembers: ProjectTeamMemberRef[];
}

export interface ProjectTimeEntry {
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
  tenant_id: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTimeEntriesResponse {
  timeEntries: ProjectTimeEntry[];
  pagination: ProjectPagination;
}
