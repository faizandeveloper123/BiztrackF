"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Plus,
  Search,
  RefreshCw,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskStatus,
  SubTask,
} from "../../models/task";
import { Project } from "../../models/project/Project";
import { User } from "../../models/auth";
import { apiService } from "../../services/ApiService";
import { extractErrorMessage } from "../../utils/errorUtils";
import { cn } from "../../lib/utils";
import { usePermissions } from "../../hooks/usePermissions";

interface TaskListProps {
  projectId?: string;
  showProjectFilter?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  projectId,
  showProjectFilter = true,
}) => {
  const { canCreateTasks, canUpdateTasks, canDeleteTasks } = usePermissions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [subtaskToDelete, setSubtaskToDelete] = useState<SubTask | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    project: projectId || "",
    status: "",
    assignedTo: "",
    search: "",
    mainTasksOnly: false,
  });

  const [completedSheetOpen, setCompletedSheetOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTasks();
    void loadCompletedTasks();
  }, [filters, page]);

  useEffect(() => {
    const hasActiveTimer = tasks.some((task) => task.isTimerActive);
    if (!hasActiveTimer) return;
    const interval = setInterval(() => {
      void loadTasks();
    }, 15000);
    return () => clearInterval(interval);
  }, [tasks]);

  const loadInitialData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        apiService.getProjects(),
        apiService.getUsers(),
      ]);

      setProjects(projectsRes.projects || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      setError("Failed to load projects and users");
    }
  };

  const applySearchFilter = (taskList: Task[]) => {
    if (!filters.search) return taskList;
    const searchLower = filters.search.toLowerCase();
    return taskList.filter(
      (task: Task) =>
        (task.title && task.title.toLowerCase().includes(searchLower)) ||
        (task.description &&
          task.description.toLowerCase().includes(searchLower)) ||
        (Array.isArray(task.tags) &&
          task.tags.some(
            (tag: string) => tag && tag.toLowerCase().includes(searchLower),
          )),
    );
  };

  const parseTasksResponse = (response: unknown): Task[] => {
    if (Array.isArray(response)) return response;
    if (
      response &&
      typeof response === "object" &&
      "tasks" in response &&
      Array.isArray((response as { tasks: Task[] }).tasks)
    ) {
      return (response as { tasks: Task[] }).tasks;
    }
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray((response as { data: Task[] }).data)
    ) {
      return (response as { data: Task[] }).data;
    }
    return [];
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        includeSubtasks: true,
        mainTasksOnly: filters.mainTasksOnly,
        ...(filters.project && { project: filters.project }),
        ...(filters.status && { status: filters.status }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      };

      const response = await apiService.getTasks(params);
      let filteredTasks = parseTasksResponse(response);

      if (!filters.status) {
        filteredTasks = filteredTasks.filter(
          (task) => task.status !== TaskStatus.COMPLETED,
        );
      }

      filteredTasks = applySearchFilter(filteredTasks);

      setTasks(filteredTasks);
      setTotalPages(response.pagination?.pages || 1);
      setTotalTasks(filteredTasks.length);
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedTasks = async () => {
    try {
      setCompletedLoading(true);
      const params = {
        page: 1,
        limit: 100,
        includeSubtasks: true,
        status: TaskStatus.COMPLETED,
        mainTasksOnly: filters.mainTasksOnly,
        ...(filters.project && { project: filters.project }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      };
      const response = await apiService.getTasks(params);
      setCompletedTasks(applySearchFilter(parseTasksResponse(response)));
    } catch {
      setCompletedTasks([]);
    } finally {
      setCompletedLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setParentTask(null);
    setDialogError(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setParentTask(null);
    setDialogError(null);
    setTaskDialogOpen(true);
  };

  const handleAddSubtask = (parentTaskId: string) => {
    const parent = [...tasks, ...completedTasks].find(
      (t) => t.id === parentTaskId,
    );
    if (parent) {
      setEditingTask(null);
      setParentTask(parent);
      setDialogError(null);
      setTaskDialogOpen(true);
    }
  };

  const handleEditSubtask = (subtask: SubTask) => {
    // Convert subtask to task format for editing
    const taskForEdit: Task = {
      ...subtask,
      project:
        [...tasks, ...completedTasks].find((t) =>
          t.subtasks.some((s) => s.id === subtask.id),
        )?.project || "",
      subtasks: [],
      subtaskCount: 0,
      completedSubtaskCount: 0,
    };
    setEditingTask(taskForEdit);
    setParentTask(null);
    setDialogError(null);
    setTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (data: TaskCreate | TaskUpdate) => {
    try {
      setDialogLoading(true);
      setDialogError(null);

      if (editingTask) {
        // Update existing task or subtask
        await apiService.updateTask(editingTask.id, data);
      } else if (parentTask) {
        // Create subtask
        await apiService.createSubtask(parentTask.id, data);
      } else {
        // Create new task
        await apiService.createTask(data);
      }
      setTaskDialogOpen(false);
      setEditingTask(null);
      setParentTask(null);
      await loadTasks();
      await loadCompletedTasks();
    } catch (err: any) {
      setDialogError(extractErrorMessage(err, "Failed to save task"));
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setSubtaskToDelete(null);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubtask = (subtask: SubTask) => {
    setSubtaskToDelete(subtask);
    setTaskToDelete(null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete && !subtaskToDelete) return;

    try {
      setDeleteLoading(true);
      const taskId = taskToDelete?.id || subtaskToDelete?.id;
      if (taskId) {
        await apiService.deleteTask(taskId);
        await loadTasks();
        await loadCompletedTasks();
      }
      setDeleteModalOpen(false);
      setTaskToDelete(null);
      setSubtaskToDelete(null);
    } catch (err) {
      setError(
        taskToDelete ? "Failed to delete task" : "Failed to delete subtask",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setTaskToDelete(null);
    setSubtaskToDelete(null);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await apiService.updateTask(taskId, { status });
      await loadTasks();
      await loadCompletedTasks();
    } catch (err) {
      setError("Failed to update task status");
    }
  };

  const handleFilterChange = (field: string, value: string | boolean) => {
    // Convert "all" values to empty strings for filtering
    const filterValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [field]: filterValue }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      project: projectId || "",
      status: "",
      assignedTo: "",
      search: "",
      mainTasksOnly: false,
    });
    setPage(1);
  };

  const getTaskStats = () => {
    const totalTasks = tasks.length + completedTasks.length;
    const completedTasksCount = completedTasks.length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;

    return {
      totalTasks,
      completedTasks: completedTasksCount,
      inProgressTasks,
      todoTasks,
    };
  };

  const renderTaskCard = (task: Task) => (
    <TaskCard
      key={task.id}
      task={task}
      onEdit={canUpdateTasks() ? handleEditTask : undefined}
      onDelete={
        canDeleteTasks()
          ? (taskId) =>
              handleDeleteTask(
                tasks.find((t) => t.id === taskId) ||
                  completedTasks.find((t) => t.id === taskId)!,
              )
          : undefined
      }
      onStatusChange={canUpdateTasks() ? handleStatusChange : undefined}
      onAddSubtask={canCreateTasks() ? handleAddSubtask : undefined}
      onEditSubtask={canUpdateTasks() ? handleEditSubtask : undefined}
      onDeleteSubtask={
        canDeleteTasks()
          ? (subtaskId) => {
              const allTasks = [...tasks, ...completedTasks];
              const subtask = allTasks
                .flatMap((t) => t.subtasks || [])
                .find((s) => s.id === subtaskId);
              if (subtask) handleDeleteSubtask(subtask);
            }
          : undefined
      }
      onSubtaskStatusChange={canUpdateTasks() ? handleStatusChange : undefined}
      canCreateTasks={canCreateTasks()}
      canUpdateTasks={canUpdateTasks()}
      canDeleteTasks={canDeleteTasks()}
    />
  );

  const taskStats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Tasks
          </h1>
          {totalTasks > 0 && (
            <p className="text-gray-600 mt-1">{tasks.length} active tasks</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => setCompletedSheetOpen(true)}
            className="text-green-700 hover:text-green-800 hover:bg-green-50"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completed
            {completedTasks.length > 0 && (
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {completedTasks.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              void loadTasks();
              void loadCompletedTasks();
            }}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {canCreateTasks() && (
            <Button onClick={handleCreateTask} className="modern-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {taskStats.totalTasks}
                </p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {taskStats.completedTasks}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlayCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {taskStats.inProgressTasks}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {taskStats.todoTasks}
                </p>
                <p className="text-sm text-gray-600">To Do</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showProjectFilter && (
              <div>
                <Select
                  value={filters.project || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("project", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
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
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>
                    In Progress
                  </SelectItem>
                  <SelectItem value={TaskStatus.CANCELLED}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={filters.assignedTo || "all"}
                onValueChange={(value) =>
                  handleFilterChange("assignedTo", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id || user.userId || ""}
                      value={user.id || user.userId || ""}
                    >
                      {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                        user.userName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={filters.mainTasksOnly ? "main" : "all"}
                onValueChange={(value) =>
                  handleFilterChange("mainTasksOnly", value === "main")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="main">Main Tasks Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Task List */}
      {!loading && (
        <>
          {tasks.length === 0 ? (
            <Card className="modern-card">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some((v) => v)
                    ? "Try adjusting your filters or create a new task."
                    : "Get started by creating your first task."}
                </p>
                {canCreateTasks() && (
                  <Button onClick={handleCreateTask} className="modern-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => renderTaskCard(task))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={handleTaskSubmit}
        task={editingTask ?? undefined}
        parentTask={parentTask ?? undefined}
        projects={projects}
        users={users.map((u) => ({
          id: u.id || u.userId || "",
          name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.userName,
          email: u.email,
        }))}
        loading={dialogLoading}
        error={dialogError ?? undefined}
        defaultProjectId={projectId}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete {taskToDelete ? "Task" : "Subtask"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{taskToDelete?.title || subtaskToDelete?.title}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={completedSheetOpen} onOpenChange={setCompletedSheetOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completed Tasks
            </SheetTitle>
            <SheetDescription>
              All completed tasks across your workspace
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {completedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-700">No completed tasks</p>
                <p className="mt-1 text-sm">
                  Tasks marked as completed will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => renderTaskCard(task))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
