"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Loader2, TrendingUp, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Project } from "../../models/project/Project";
import { User } from "../../models/auth";
import { apiService } from "../../services/ApiService";
import { toast } from "sonner";

const schema = yup.object({
  name: yup.string().required("Project name is required"),
  description: yup.string().required("Description is required"),
  status: yup.string().required("Status is required"),
  priority: yup.string().required("Priority is required"),
  startDate: yup.date().required("Start date is required"),
  endDate: yup
    .date()
    .required("End date is required")
    .min(yup.ref("startDate"), "End date must be after start date"),
  budget: yup.number().positive("Budget must be positive").nullable(),
  projectManagerId: yup.string().required("Project manager is required"),
  teamMemberIds: yup
    .array()
    .of(yup.string())
    .min(1, "At least one team member is required"),
  clientEmail: yup.string().email("Invalid email format").nullable(),
  notes: yup.string().nullable(),
});

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project?: Project | null;
  mode: "create" | "edit";
}

export default function ProjectDialog({
  open,
  onClose,
  onSave,
  project,
  mode,
}: ProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<User[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      priority: "medium",
      startDate: new Date(),
      endDate: new Date(),
      budget: null,
      projectManagerId: "",
      teamMemberIds: [],
      clientEmail: "",
      notes: "",
    },
  });

  const watchedTeamMemberIds = watch("teamMemberIds");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const tenantId = apiService.getTenantId();
        if (!tenantId) return;
        const result = await apiService.getTenantUsers(tenantId);
        let users = result?.users || result || [];
        users = users.map((u: any) => ({ ...u, id: u.id || u.userId }));

        // Remove duplicates based on id/userId
        const uniqueUsers = users.reduce((acc: any[], user: any) => {
          const existingUser = acc.find(
            (u) => u.id === user.id || u.userId === user.id,
          );
          if (!existingUser) {
            acc.push(user);
          }
          return acc;
        }, []);

        setProjectManagers(
          uniqueUsers.filter(
            (u: User) =>
              u.userRole === "project_manager" || u.userRole === "admin",
          ),
        );
        setTeamMembers(
          uniqueUsers.filter(
            (u: User) =>
              u.userRole === "team_member" ||
              u.userRole === "project_manager" ||
              u.userRole === "admin",
          ),
        );
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.detail ||
          error?.message ||
          "Failed to load users";
        toast.error(`Load Error: ${errorMessage}`);
      } finally {
        setLoadingUsers(false);
      }
    };
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (project && mode === "edit") {
      reset({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        budget: project.budget,
        projectManagerId: project.projectManager.id,
        teamMemberIds: project.teamMembers?.map((member) => member.id) || [],
        clientEmail: project.clientEmail || "",
        notes: project.notes || "",
      });
      setSelectedTeamMembers(
        (project.teamMembers || []).map((member) => ({
          id: member.id,
          userName: member.name,
          userRole: "team_member", // default role
          email: member.email,
          firstName: member.name.split(" ")[0] || "",
          lastName: member.name.split(" ").slice(1).join(" ") || "",
          avatar: member.avatar,
        })),
      );
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        status: "planning",
        priority: "medium",
        startDate: new Date(),
        endDate: new Date(),
        budget: null,
        projectManagerId: "",
        teamMemberIds: [],
        clientEmail: "",
        notes: "",
      });
      setSelectedTeamMembers([]);
    }
  }, [project, mode, reset]);

  useEffect(() => {
    const selected = teamMembers.filter((member) =>
      watchedTeamMemberIds?.includes(member.id || member.userId),
    );
    setSelectedTeamMembers(selected);
  }, [watchedTeamMemberIds, teamMembers]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const projectData = {
        ...data,
        startDate: data.startDate.toISOString().split("T")[0],
        endDate: data.endDate.toISOString().split("T")[0],
        budget: data.budget || undefined,
        clientEmail: data.clientEmail || undefined,
        notes: data.notes || undefined,
      };

      let savedProject;

      if (mode === "create") {
        savedProject = await apiService.createProject(projectData);
      } else {
        savedProject = await apiService.updateProject(project!.id, projectData);
      }

      onSave(savedProject);
      onClose();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to save project";
      toast.error(`Save Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamMemberToggle = (userId: string) => {
    const currentIds = watchedTeamMemberIds || [];
    const newIds = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    setValue("teamMemberIds", newIds);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90vh] sm:max-w-[600px]">
        <DialogHeader className="shrink-0 space-y-1.5 px-6 pb-2 pt-6 text-left">
          <DialogTitle>
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details to create a new project"
              : "Update the project information"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-2 [scrollbar-gutter:stable]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="name"
                      placeholder="Enter project name"
                      className={errors.name ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="description"
                      placeholder="Enter project description"
                      rows={3}
                      className={errors.description ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority *</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={
                        field.value
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className={errors.startDate ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      value={
                        field.value
                          ? field.value.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Controller
                    name="budget"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        placeholder="0.00"
                        className="pl-10"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Controller
                  name="clientEmail"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="client@example.com"
                      value={field.value || ""}
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Project Manager *</Label>
                <Controller
                  name="projectManagerId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectManagers.map((user) => (
                          <SelectItem
                            key={user.id || user.userId}
                            value={user.id || user.userId || ""}
                          >
                            {user.firstName || user.userName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.projectManagerId && (
                  <p className="text-sm text-red-600">
                    {errors.projectManagerId.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Team Members *</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-gray-600">
                        Loading users...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() =>
                            handleTeamMemberToggle(user.id || user.userId || "")
                          }
                        >
                          <div>
                            <p className="font-medium">
                              {user.firstName || user.userName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={
                              watchedTeamMemberIds?.includes(user.id) || false
                            }
                            onChange={() =>
                              handleTeamMemberToggle(
                                user.id || user.userId || "",
                              )
                            }
                            className="rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedTeamMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTeamMembers.map((member) => (
                      <Badge
                        key={member.id || member.userId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {member.firstName || member.userName}
                        <button
                          type="button"
                          onClick={() =>
                            handleTeamMemberToggle(
                              member.id || member.userId || "",
                            )
                          }
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {errors.teamMemberIds && (
                  <p className="text-sm text-red-600">
                    {errors.teamMemberIds.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="notes"
                      placeholder="Additional project notes..."
                      rows={3}
                      value={field.value || ""}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="modern-button">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Project"
              ) : (
                "Update Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
