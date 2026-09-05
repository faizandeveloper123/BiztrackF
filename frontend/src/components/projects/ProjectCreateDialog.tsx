"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { apiService } from "@/src/services/ApiService";
import type { Project, User } from "@/src/models";
import type { ProjectFormData } from "@/src/types/projects";
import type { UserSearchItem } from "@/src/components/ui/user-search";
import type { UserMultiSearchItem } from "@/src/components/ui/user-multi-search";
import { ProjectFormDialog } from "./ProjectFormDialog";
import {
  DEFAULT_PROJECT_FORM_DATA,
  dedupeTenantUsers,
  getTenantIdFromStorage,
  validateProjectForm,
} from "@/src/utils/projects";

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (project: Project) => void;
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: ProjectCreateDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>(
    DEFAULT_PROJECT_FORM_DATA,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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
    if (open) {
      setFormData(DEFAULT_PROJECT_FORM_DATA);
      setFormError(null);
      void fetchUsers();
    }
  }, [open, fetchUsers]);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateProjectForm(formData, "create");
      if (validationError) {
        setFormError(validationError);
        return;
      }
      try {
        setFormError(null);
        setFormLoading(true);
        const savedProject = await apiService.createProject(formData);
        setFormLoading(false);
        onOpenChange(false);
        toast.success("Project created successfully");
        onCreated?.(savedProject);
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        setFormError(
          error?.response?.data?.detail ||
            error?.message ||
            "Failed to create project",
        );
        setFormLoading(false);
      }
    },
    [formData, onOpenChange, onCreated],
  );

  return (
    <ProjectFormDialog
      open={open}
      mode="create"
      formData={formData}
      formError={formError}
      formLoading={formLoading}
      users={users}
      selectedProjectManager={selectedProjectManager}
      selectedTeamMembers={selectedTeamMembers}
      onOpenChange={onOpenChange}
      onFormDataChange={setFormData}
      onSubmit={handleSubmit}
    />
  );
}