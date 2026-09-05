export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface ProjectActivity {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  performedAt: string;
  metadata?: any;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  completionPercent: number;
  budget?: number;
  actualCost?: number;
  notes?: string;
  clientEmail?: string;
  createdById?: string;
  projectManager: TeamMember;
  teamMembers: TeamMember[];
  createdAt: string;
  updatedAt: string;
  activities?: ProjectActivity[];
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  notes?: string;
  clientEmail?: string;
  projectManagerId: string;
  teamMemberIds: string[];
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  completionPercent?: number;
  projectManagerId?: string;
  teamMemberIds?: string[];
  clientEmail?: string;
  notes?: string;
}

export interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
