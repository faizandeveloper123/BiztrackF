import type { Project } from "@/src/models";

export type ProjectDialogMode = "create" | "edit";

export interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  budget: number;
  notes: string;
  clientEmail: string;
  projectManagerId: string;
  teamMemberIds: string[];
}

export type ProjectDeleteMode =
  | "direct"
  | "approved"
  | "pending"
  | "request"
  | "none";

export interface ProjectCardProps {
  project: Project;
  isStarred: boolean;
  onToggleStarred: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onRequestDeletion: (project: Project) => void;
  onViewProject: (projectId: string) => void;
  onViewTasks: (projectId: string) => void;
  canEdit: boolean;
  deleteMode: ProjectDeleteMode;
}

export interface ProjectsToolbarProps {
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  canCreate: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onCreateProject: () => void;
}

export interface ProjectFormDialogProps {
  open: boolean;
  mode: ProjectDialogMode;
  formData: ProjectFormData;
  formError: string | null;
  formLoading: boolean;
  users: import("@/src/models").User[];
  selectedProjectManager:
    | import("@/src/components/ui/user-search").UserSearchItem
    | null;
  selectedTeamMembers: import("@/src/components/ui/user-multi-search").UserMultiSearchItem[];
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: ProjectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export interface ProjectDeleteDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: () => void;
}
