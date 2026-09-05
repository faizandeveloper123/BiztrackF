"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { apiService } from "@/src/services/ApiService";
import type { Project, User } from "@/src/models";
import type { ProjectDialogMode, ProjectFormData } from "@/src/types/projects";
import type { UserSearchItem } from "@/src/components/ui/user-search";
import type { UserMultiSearchItem } from "@/src/components/ui/user-multi-search";
import {
  DEFAULT_PROJECT_FORM_DATA,
  dedupeTenantUsers,
  filterProjects,
  getTenantIdFromStorage,
  hasActiveFilters,
  projectToFormData,
  validateProjectForm,
} from "@/src/utils/projects";

export function useProjectsPage() {
  const { user } = useAuth();
  const { canManageProjects, canUpdateProjects, canDeleteProjects, isOwner } =
    usePermissions();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [starredProjects, setStarredProjects] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ProjectDialogMode>("create");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(
    DEFAULT_PROJECT_FORM_DATA,
  );
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const fetchProjects = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const response = await apiService.get("/projects");
      setProjects(response.projects || []);
    } catch {
      if (!options?.silent) {
        setError("Failed to load projects");
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const tenantId = getTenantIdFromStorage();
      if (!tenantId) {
        setUsers([]);
        return;
      }
      const response = await apiService.getTenantUsers(tenantId);
      setUsers(dedupeTenantUsers(response.users || []));
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  const filteredProjects = useMemo(
    () => filterProjects(projects, searchTerm, statusFilter, priorityFilter),
    [projects, searchTerm, statusFilter, priorityFilter],
  );

  const filtersActive = useMemo(
    () => hasActiveFilters(searchTerm, statusFilter, priorityFilter),
    [searchTerm, statusFilter, priorityFilter],
  );

  const canCreateProject = useCallback(() => {
    return canManageProjects() || user?.userRole === "super_admin";
  }, [canManageProjects, user]);

  const canEditProject = useCallback(
    (project?: Project) => {
      if (user?.userRole === "super_admin" || isOwner()) return true;
      if (!canUpdateProjects() || !project) return false;
      const uid = user?.id;
      return project.projectManager?.id === uid || project.createdById === uid;
    },
    [canUpdateProjects, isOwner, user],
  );

  const getDeleteMode = useCallback(
    (
      project: Project,
    ): "direct" | "approved" | "pending" | "request" | "none" => {
      if (user?.userRole === "super_admin" || isOwner()) return "direct";
      const uid = user?.id;
      const isRequester =
        project.projectManager?.id === uid || project.createdById === uid;
      if (!canDeleteProjects() || !isRequester) return "none";
      if (project.deletionStatus === "approved") return "approved";
      if (project.deletionStatus === "pending") return "pending";
      return "request";
    },
    [canDeleteProjects, isOwner, user],
  );

  const handleRequestDeletion = useCallback(
    async (project: Project) => {
      try {
        await apiService.requestProjectDeletion(project.id);
        toast.success("Deletion request sent to the owner for approval");
        void fetchProjects({ silent: true });
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        toast.error(
          error?.response?.data?.detail ||
            error?.message ||
            "Failed to request deletion",
        );
      }
    },
    [fetchProjects],
  );

  const handleCreateProject = useCallback(() => {
    setDialogMode("create");
    setSelectedProject(null);
    setFormData(DEFAULT_PROJECT_FORM_DATA);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setDialogMode("edit");
    setSelectedProject(project);
    setFormData(projectToFormData(project));
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const handleDeleteProject = useCallback((project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDelete) return;
    try {
      await apiService.deleteProject(projectToDelete.id);
      await fetchProjects();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete project";
      toast.error(`Delete Error: ${errorMessage}`);
    }
  }, [projectToDelete, fetchProjects]);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateProjectForm(formData, dialogMode);
      if (validationError) {
        setFormError(validationError);
        return;
      }
      try {
        setFormError(null);
        setFormLoading(true);
        let savedProject: Project | null = null;
        if (dialogMode === "create") {
          savedProject = await apiService.createProject(formData);
        } else if (selectedProject) {
          savedProject = await apiService.updateProject(
            selectedProject.id,
            formData,
          );
        }
        if (savedProject) {
          setProjects((prev) =>
            dialogMode === "create"
              ? [
                  savedProject!,
                  ...prev.filter((p) => p.id !== savedProject!.id),
                ]
              : prev.map((p) =>
                  p.id === savedProject!.id ? savedProject! : p,
                ),
          );
        }
        setFormLoading(false);
        setDialogOpen(false);
        void fetchProjects({ silent: true });
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        setFormError(
          error?.response?.data?.detail ||
            error?.message ||
            "Failed to save project",
        );
        setFormLoading(false);
      }
    },
    [formData, dialogMode, selectedProject, fetchProjects],
  );

  const selectedProjectManager = useMemo((): UserSearchItem | null => {
    if (!formData.projectManagerId) return null;
    return (
      users.find((u) => (u.id || u.userId) === formData.projectManagerId) ??
      null
    );
  }, [users, formData.projectManagerId]);

  const selectedTeamMembers = useMemo((): UserMultiSearchItem[] => {
    return users.filter((u) =>
      formData.teamMemberIds.includes(u.id || u.userId || ""),
    );
  }, [users, formData.teamMemberIds]);

  const toggleStarred = useCallback((projectId: string) => {
    setStarredProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  }, []);

  const handleViewProject = useCallback(
    (projectId: string) => {
      router.push(`/projects/${projectId}`);
    },
    [router],
  );

  const handleViewTasks = useCallback(
    (projectId: string) => {
      router.push(`/projects/${projectId}/tasks`);
    },
    [router],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }, []);

  return {
    mounted,
    loading,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    filteredProjects,
    filtersActive,
    starredProjects,
    dialogOpen,
    dialogMode,
    formData,
    formError,
    formLoading,
    users,
    deleteDialogOpen,
    projectToDelete,
    selectedProjectManager,
    selectedTeamMembers,
    canCreateProject,
    canEditProject,
    getDeleteMode,
    handleRequestDeletion,
    setDialogOpen,
    setFormData,
    setDeleteDialogOpen,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    fetchProjects,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleFormSubmit,
    toggleStarred,
    handleViewProject,
    handleViewTasks,
    clearFilters,
  };
}
