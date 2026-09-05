import { apiService } from '../ApiService';
import type {
  ProjectCreatePayload,
  ProjectRecord,
  PmProjectsApiResponse,
  ProjectTeamMembersApiResponse,
  ProjectTimeEntriesResponse,
  ProjectTimeEntry,
  ProjectUpdatePayload,
  SubTaskRecord,
  TaskCreatePayload,
  PmTasksApiResponse,
  TaskUpdatePayload,
} from '../../models/project';
import type { TimeEntryCreate } from '../../models/hrm';

export async function fetchProjectsPaged(
  page = 1,
  limit = 20,
  opts?: { status?: string; priority?: string; search?: string },
): Promise<PmProjectsApiResponse> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(safeLimit));
  if (opts?.status) p.append('status', opts.status);
  if (opts?.priority) p.append('priority', opts.priority);
  if (opts?.search) p.append('search', opts.search);
  return apiService.get<PmProjectsApiResponse>(`/projects?${p.toString()}`);
}

export async function fetchProject(id: string): Promise<ProjectRecord> {
  return apiService.get<ProjectRecord>(`/projects/${id}`);
}

export async function createProjectApi(
  body: ProjectCreatePayload,
): Promise<ProjectRecord> {
  return apiService.post<ProjectRecord>('/projects', body);
}

export async function updateProjectApi(
  id: string,
  body: ProjectUpdatePayload,
): Promise<ProjectRecord> {
  return apiService.put<ProjectRecord>(`/projects/${id}`, body);
}

export async function deleteProjectApi(id: string): Promise<void> {
  await apiService.delete(`/projects/${id}`);
}

export async function fetchProjectTeamMembers(): Promise<ProjectTeamMembersApiResponse> {
  return apiService.get<ProjectTeamMembersApiResponse>(
    '/projects/team-members',
  );
}

export async function fetchTasksPaged(
  page = 1,
  limit = 50,
  opts?: {
    project?: string;
    status?: string;
    assignedTo?: string;
    main_tasks_only?: boolean;
    include_subtasks?: boolean;
  },
): Promise<PmTasksApiResponse> {
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(limit));
  if (opts?.project) p.append('project', opts.project);
  if (opts?.status) p.append('status', opts.status);
  if (opts?.assignedTo) p.append('assignedTo', opts.assignedTo);
  if (opts?.main_tasks_only !== undefined) {
    p.append('main_tasks_only', String(opts.main_tasks_only));
  }
  if (opts?.include_subtasks !== undefined) {
    p.append('include_subtasks', String(opts.include_subtasks));
  }
  return apiService.get<PmTasksApiResponse>(`/tasks?${p.toString()}`);
}

export async function fetchTask(id: string): Promise<SubTaskRecord> {
  return apiService.get<SubTaskRecord>(`/tasks/${id}`);
}

export async function createTaskApi(
  body: TaskCreatePayload,
): Promise<SubTaskRecord> {
  return apiService.post<SubTaskRecord>('/tasks', body);
}

export async function updateTaskApi(
  id: string,
  body: TaskUpdatePayload,
): Promise<SubTaskRecord> {
  return apiService.put<SubTaskRecord>(`/tasks/${id}`, body);
}

export async function deleteTaskApi(id: string): Promise<void> {
  await apiService.delete(`/tasks/${id}`);
}

export async function fetchProjectTimeEntriesPaged(
  page = 1,
  limit = 30,
  opts?: {
    employee_id?: string;
    start_date?: string;
    end_date?: string;
    project_id?: string;
  },
): Promise<ProjectTimeEntriesResponse> {
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(limit));
  if (opts?.employee_id) p.append('employee_id', opts.employee_id);
  if (opts?.start_date) p.append('start_date', opts.start_date);
  if (opts?.end_date) p.append('end_date', opts.end_date);
  if (opts?.project_id) p.append('project_id', opts.project_id);
  return apiService.get<ProjectTimeEntriesResponse>(
    `/projects/time-entries?${p.toString()}`,
  );
}

export async function createProjectTimeEntryApi(
  body: TimeEntryCreate,
): Promise<ProjectTimeEntry> {
  return apiService.post<ProjectTimeEntry>('/projects/time-entries', body);
}

export async function updateProjectTimeEntryApi(
  id: string,
  body: Partial<TimeEntryCreate>,
): Promise<ProjectTimeEntry> {
  return apiService.put<ProjectTimeEntry>(`/projects/time-entries/${id}`, body);
}

export async function deleteProjectTimeEntryApi(id: string): Promise<void> {
  await apiService.delete(`/projects/time-entries/${id}`);
}
