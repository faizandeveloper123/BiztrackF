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
import { Calendar, X, Plus, Loader2, AlertCircle } from "lucide-react";
import {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskStatus,
  TaskPriority,
  TaskUser,
} from "../../models/task";
import { Project } from "../../models/project/Project";
import { TaskMessagesPanel } from "./TaskMessagesPanel";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreate | TaskUpdate) => void;
  task?: Task;
  projects: Project[];
  users: TaskUser[];
  parentTask?: Task;
  loading?: boolean;
  error?: string;
  defaultProjectId?: string;
}

const statusOptions = [
  { value: TaskStatus.TODO, label: "To Do" },
  { value: TaskStatus.IN_PROGRESS, label: "In Progress" },
  { value: TaskStatus.COMPLETED, label: "Completed" },
  { value: TaskStatus.CANCELLED, label: "Cancelled" },
];

const priorityOptions = [
  { value: TaskPriority.LOW, label: "Low" },
  { value: TaskPriority.MEDIUM, label: "Medium" },
  { value: TaskPriority.HIGH, label: "High" },
  { value: TaskPriority.CRITICAL, label: "Critical" },
];

export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onClose,
  onSubmit,
  task,
  projects,
  users,
  parentTask,
  loading = false,
  error,
  defaultProjectId,
}) => {
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    project: "",
    assignedTo: "",
    dueDate: "",
    estimatedHours: 0,
    estimatedMinutes: 0,
    estimatedSeconds: 0,
    reminderHours: 0,
    reminderMinutes: 15,
    reminderSeconds: 0,
    actualHours: 0,
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  const isEditing = Boolean(task);
  const isSubtask = Boolean(parentTask);

  useEffect(() => {
    if (task) {
      // Editing: do not include 'project' in formData
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo?.id || "unassigned",
        dueDate: task.dueDate || "",
        estimatedHours: task.estimatedHours || 0,
        estimatedMinutes: task.estimatedMinutes || 0,
        estimatedSeconds: task.estimatedSeconds || 0,
        reminderHours: task.reminderHours || 0,
        reminderMinutes: task.reminderMinutes ?? 15,
        reminderSeconds: task.reminderSeconds || 0,
        actualHours: task.actualHours || 0,
        tags: task.tags || [],
      });
    } else {
      // Creating: include 'project'
      setFormData({
        title: "",
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        project: defaultProjectId || "",
        parentTaskId: parentTask?.id,
        assignedTo: "unassigned",
        dueDate: "",
        estimatedHours: 0,
        estimatedMinutes: 0,
        estimatedSeconds: 0,
        reminderHours: 0,
        reminderMinutes: 15,
        reminderSeconds: 0,
        actualHours: 0,
        tags: [],
      });
    }
  }, [task, parentTask, defaultProjectId]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = (): void => {
    const tag = tagInput.trim();
    if (tag && !(formData.tags as string[] | undefined)?.includes(tag)) {
      const newTags: string[] = [...((formData.tags as string[]) || []), tag];
      handleInputChange("tags", newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    const newTags: string[] =
      (formData.tags as string[] | undefined)?.filter(
        (tag: string) => tag !== tagToRemove,
      ) || [];
    handleInputChange("tags", newTags);
  };

  const handleSubmit = () => {
    const submitData = { ...formData };

    // Clean up empty values
    if (!submitData.description?.trim()) delete submitData.description;
    if (submitData.assignedTo === "unassigned") delete submitData.assignedTo;
    if (!submitData.dueDate) delete submitData.dueDate;
    const hasEstimate =
      (submitData.estimatedHours || 0) > 0 ||
      (submitData.estimatedMinutes || 0) > 0 ||
      (submitData.estimatedSeconds || 0) > 0;
    if (!hasEstimate) {
      delete submitData.estimatedHours;
      delete submitData.estimatedMinutes;
      delete submitData.estimatedSeconds;
    }
    const hasReminder =
      (submitData.reminderHours || 0) > 0 ||
      (submitData.reminderMinutes || 0) > 0 ||
      (submitData.reminderSeconds || 0) > 0;
    if (!hasReminder) {
      delete submitData.reminderHours;
      delete submitData.reminderMinutes;
      delete submitData.reminderSeconds;
    }
    if (!submitData.actualHours) delete submitData.actualHours;
    if (!submitData.tags?.length) delete submitData.tags;

    // Map frontend field names to backend field names
    if (submitData.project) {
      submitData.projectId = submitData.project;
      delete submitData.project;
    }
    if (submitData.assignedTo) {
      submitData.assignedToId = submitData.assignedTo;
      delete submitData.assignedTo;
    }

    onSubmit(submitData);
  };

  const handleClose = () => {
    setTagInput("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            {isEditing
              ? `Edit ${isSubtask ? "Subtask" : "Task"}`
              : `Create ${isSubtask ? "Subtask" : "Task"}`}
          </DialogTitle>
          {parentTask && (
            <p className="text-sm text-gray-600 mt-1">
              Parent Task: {parentTask.title}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Enter task description"
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

            {!isSubtask && (
              <div>
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={
                    task
                      ? typeof task.project === "object" &&
                        task.project &&
                        "id" in task.project
                        ? (task.project as { id: string }).id
                        : typeof task.project === "string"
                          ? task.project
                          : ""
                      : formData.project
                  }
                  onValueChange={(value) => handleInputChange("project", value)}
                  disabled={!!task}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) =>
                  handleInputChange("assignedTo", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="relative mt-1">
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Estimated Time</Label>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <Label
                    htmlFor="estimatedHours"
                    className="text-xs text-muted-foreground"
                  >
                    Hours
                  </Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={(e) =>
                      handleInputChange(
                        "estimatedHours",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="estimatedMinutes"
                    className="text-xs text-muted-foreground"
                  >
                    Minutes
                  </Label>
                  <Input
                    id="estimatedMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.estimatedMinutes}
                    onChange={(e) =>
                      handleInputChange(
                        "estimatedMinutes",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="estimatedSeconds"
                    className="text-xs text-muted-foreground"
                  >
                    Seconds
                  </Label>
                  <Input
                    id="estimatedSeconds"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.estimatedSeconds}
                    onChange={(e) =>
                      handleInputChange(
                        "estimatedSeconds",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Reminder When Time Left</Label>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <Label
                    htmlFor="reminderHours"
                    className="text-xs text-muted-foreground"
                  >
                    Hours
                  </Label>
                  <Input
                    id="reminderHours"
                    type="number"
                    min="0"
                    value={formData.reminderHours}
                    onChange={(e) =>
                      handleInputChange(
                        "reminderHours",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="reminderMinutes"
                    className="text-xs text-muted-foreground"
                  >
                    Minutes
                  </Label>
                  <Input
                    id="reminderMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.reminderMinutes}
                    onChange={(e) =>
                      handleInputChange(
                        "reminderMinutes",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
                <div>
                  <Label
                    htmlFor="reminderSeconds"
                    className="text-xs text-muted-foreground"
                  >
                    Seconds
                  </Label>
                  <Input
                    id="reminderSeconds"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.reminderSeconds}
                    onChange={(e) =>
                      handleInputChange(
                        "reminderSeconds",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div>
                <Label htmlFor="actualHours">
                  Tracked Hours (read-only sync)
                </Label>
                <Input
                  id="actualHours"
                  type="number"
                  value={formData.actualHours}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
            )}

            <div className="md:col-span-3">
              <Label>Tags</Label>
              <div className="mt-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(formData.tags as string[] | undefined)?.map(
                    (tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ),
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {isEditing && task?.id && (
              <div className="md:col-span-3">
                <TaskMessagesPanel taskId={task.id} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.title.trim() ||
              (!isSubtask && !task && !formData.project)
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
