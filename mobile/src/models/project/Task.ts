// Legacy task interfaces - use models/task/index.ts for new implementations
// Keeping for backward compatibility

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
}

export interface TaskCreator {
  id: string;
  name: string;
  email: string;
}

export interface LegacyTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: string;
  assignedTo?: TaskAssignee;
  createdBy: TaskCreator;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyTaskCreate {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  project: string;
  assignedTo?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface LegacyTaskUpdate {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface LegacyTasksResponse {
  tasks: LegacyTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
