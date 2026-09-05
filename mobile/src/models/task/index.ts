export interface TaskUser {
  id: string;
  name: string;
  email: string;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: TaskUser | null;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  tags: string[];
  createdBy?: TaskUser | null;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  parentTaskId?: string;
  assignedTo?: TaskUser | null;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  tags: string[];
  createdBy?: TaskUser | null;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  subtasks: SubTask[];
  subtaskCount: number;
  completedSubtaskCount: number;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  project: string;
  parentTaskId?: string;
  assignedTo?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  parentTaskId?: string;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
