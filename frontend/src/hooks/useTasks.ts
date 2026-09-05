import { useState, useEffect, useCallback } from "react";
import { Task, TaskCreate, TaskUpdate, TaskStatus } from "../models/task";
import { apiService } from "../services/ApiService";
import { extractErrorMessage } from "../utils/errorUtils";

interface UseTasksOptions {
  projectId?: string;
  autoLoad?: boolean;
  includeSubtasks?: boolean;
  mainTasksOnly?: boolean;
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const {
    projectId,
    autoLoad = true,
    includeSubtasks = true,
    mainTasksOnly = false,
  } = options;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(
    async (params?: {
      status?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const requestParams = {
          ...(projectId && { project: projectId }),
          includeSubtasks,
          mainTasksOnly,
          ...params,
        };

        const response = await apiService.getTasks(requestParams);
        setTasks(response.tasks || []);
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to load tasks"));
      } finally {
        setLoading(false);
      }
    },
    [projectId, includeSubtasks, mainTasksOnly],
  );

  const createTask = useCallback(
    async (data: TaskCreate) => {
      try {
        setError(null);
        await apiService.createTask(data);
        await loadTasks();
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create task"));
        throw err;
      }
    },
    [loadTasks],
  );

  const updateTask = useCallback(
    async (taskId: string, data: TaskUpdate) => {
      try {
        setError(null);
        await apiService.updateTask(taskId, data);
        await loadTasks();
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update task"));
        throw err;
      }
    },
    [loadTasks],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        setError(null);
        await apiService.deleteTask(taskId);
        await loadTasks();
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to delete task"));
        throw err;
      }
    },
    [loadTasks],
  );

  const createSubtask = useCallback(
    async (parentTaskId: string, data: TaskCreate) => {
      try {
        setError(null);
        await apiService.createSubtask(parentTaskId, data);
        await loadTasks();
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to create subtask"));
        throw err;
      }
    },
    [loadTasks],
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      try {
        setError(null);
        await apiService.updateTask(taskId, { status });
        await loadTasks();
      } catch (err: any) {
        setError(extractErrorMessage(err, "Failed to update task status"));
        throw err;
      }
    },
    [loadTasks],
  );

  useEffect(() => {
    if (autoLoad) {
      loadTasks();
    }
  }, [autoLoad, loadTasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    updateTaskStatus,
    setError,
  };
};
