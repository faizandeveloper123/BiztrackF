"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectStatus,
  ProjectPriority,
} from "../../models/project/Project";
import { User } from "../../models/auth";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => void;
  project?: Project;
  users: User[];
  loading?: boolean;
  error?: string;
}

const statusOptions = [
  { value: ProjectStatus.PLANNING, label: "Planning" },
  { value: ProjectStatus.IN_PROGRESS, label: "In Progress" },
  { value: ProjectStatus.ON_HOLD, label: "On Hold" },
  { value: ProjectStatus.COMPLETED, label: "Completed" },
  { value: ProjectStatus.CANCELLED, label: "Cancelled" },
];

const priorityOptions = [
  { value: ProjectPriority.LOW, label: "Low" },
  { value: ProjectPriority.MEDIUM, label: "Medium" },
  { value: ProjectPriority.HIGH, label: "High" },
  { value: ProjectPriority.CRITICAL, label: "Critical" },
];

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onClose,
  onSubmit,
  project,
  users,
  loading = false,
  error,
}) => {
  const [formData, setFormData] = useState<ProjectCreate | ProjectUpdate>({
    name: "",
    description: "",
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
    startDate: "",
    endDate: "",
    budget: 0,
    notes: "",
    projectManagerId: "",
    teamMemberIds: [],
  });

  const [selectedTeamMembers, setSelectedTeamMembers] = useState<User[]>([]);

  const isEditing = Boolean(project);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        status: project.status,
        priority: project.priority,
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        budget: project.budget || 0,
        notes: project.notes || "",
        projectManagerId: project.projectManager?.id || "",
        teamMemberIds: project.teamMembers?.map((member) => member.id) || [],
      });
      setSelectedTeamMembers(
        (project.teamMembers || []).map((member) => ({
          id: member.id,
          userId: member.id, // fallback for userId
          userName: member.name,
          userRole: "team_member", // default role
          email: member.email,
          firstName: member.name.split(" ")[0] || "",
          lastName: member.name.split(" ").slice(1).join(" ") || "",
          avatar: member.avatar,
        })),
      );
    } else {
      setFormData({
        name: "",
        description: "",
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        startDate: "",
        endDate: "",
        completionPercent: 0,
        budget: 0,
        notes: "",
        projectManagerId: "",
        teamMemberIds: [],
      });
      setSelectedTeamMembers([]);
    }
  }, [project]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTeamMemberToggle = (user: User) => {
    const isSelected = selectedTeamMembers.some(
      (member) => member.userId === user.userId,
    );
    let newTeamMembers;

    if (isSelected) {
      newTeamMembers = selectedTeamMembers.filter(
        (member) => member.userId !== user.userId,
      );
    } else {
      newTeamMembers = [...selectedTeamMembers, user];
    }

    setSelectedTeamMembers(newTeamMembers);
    handleInputChange(
      "teamMemberIds",
      newTeamMembers.map((user) => user.userId),
    );
  };

  const handleSubmit = () => {
    const submitData = { ...formData };
    // Clean up empty values
    if (!submitData.description?.trim()) delete submitData.description;
    if (!submitData.startDate) delete submitData.startDate;
    if (!submitData.endDate) delete submitData.endDate;
    if (!submitData.budget) delete submitData.budget;
    if (!submitData.notes?.trim()) delete submitData.notes;
    if (!submitData.teamMemberIds?.length) delete submitData.teamMemberIds;
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            {isEditing ? "Edit Project" : "Create Project"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter project description"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="projectManager">Project Manager *</Label>
              <Select
                value={formData.projectManagerId}
                onValueChange={(value) =>
                  handleInputChange("projectManagerId", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select project manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user.userId ?? user.id ?? ""}
                      value={user.userId ?? user.id ?? ""}
                    >
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative mt-1">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative mt-1">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  min={formData.startDate}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Budget</Label>
              <div className="relative mt-1">
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    handleInputChange("budget", parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  className="pl-10"
                />
                <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Team Members</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {users.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`user-${user.userId}`}
                      checked={selectedTeamMembers.some(
                        (member) => member.userId === user.userId,
                      )}
                      onChange={() => handleTeamMemberToggle(user)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`user-${user.userId}`} className="text-sm">
                      {user.firstName} {user.lastName} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
              {selectedTeamMembers.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTeamMembers.map((member) => (
                    <Badge key={member.userId} variant="secondary">
                      {member.firstName} {member.lastName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the project"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !(formData.name ?? "").trim() ||
              !(formData.projectManagerId ?? "")
            }
            className="modern-button"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
