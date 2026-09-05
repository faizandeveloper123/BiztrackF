"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TaskList } from "../../../../components/tasks";
import { Project } from "../../../../models/project/Project";
import { Task, TaskStatus } from "../../../../models/task";
import { apiService } from "../../../../services/ApiService";
import { DashboardLayout } from "../../../../components/layout";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Progress } from "../../../../components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../components/ui/breadcrumb";
import { ErrorBoundary } from "../../../../components/ErrorBoundary";
import {
  ArrowLeft,
  CheckSquare,
  CheckCircle,
  Clock,
  Play,
  Loader2,
} from "lucide-react";

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getProject(projectId);
      setProject(response);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load project details";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    try {
      const response = await apiService.getTasks({
        project: projectId,
        includeSubtasks: true,
        mainTasksOnly: false,
      });

      // Handle different response structures
      let taskList = [];
      if (Array.isArray(response)) {
        taskList = response;
      } else if (response.tasks && Array.isArray(response.tasks)) {
        taskList = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        taskList = response.data;
      } else {
        taskList = [];
      }

      setTasks(taskList);
    } catch (err: any) {}
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadTasks();
  }, [loadProject, loadTasks]);

  const getTaskStats = () => {
    if (!tasks || !Array.isArray(tasks)) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        cancelledTasks: 0,
        totalSubtasks: 0,
        completedSubtasks: 0,
      };
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const cancelledTasks = tasks.filter(
      (t) => t.status === TaskStatus.CANCELLED,
    ).length;

    const totalSubtasks = tasks.reduce(
      (sum, task) => sum + task.subtaskCount,
      0,
    );
    const completedSubtasks = tasks.reduce(
      (sum, task) => sum + task.completedSubtaskCount,
      0,
    );

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      cancelledTasks,
      totalSubtasks,
      completedSubtasks,
    };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error || "Project not found"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push("/projects")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Projects</span>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const taskStats = getTaskStats();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Project</span>
            </Button>

            <div className="flex-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/projects">Projects</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`/projects/${projectId}`}>
                        {project.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Tasks</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {project.name} - Task Management
              </h1>

              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <Card className="modern-card mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Task Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CheckSquare className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {taskStats.totalTasks}
                </div>
                <div className="text-sm text-gray-600">Total Tasks</div>
                {taskStats.totalSubtasks > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    + {taskStats.totalSubtasks} subtasks
                  </div>
                )}
              </Card>

              <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {taskStats.completedTasks}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
                {taskStats.completedSubtasks > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    + {taskStats.completedSubtasks} subtasks
                  </div>
                )}
              </Card>

              <Card className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <Play className="h-10 w-10 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {taskStats.inProgressTasks}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </Card>

              <Card className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                <Clock className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-600 mb-1">
                  {taskStats.todoTasks}
                </div>
                <div className="text-sm text-gray-600">To Do</div>
              </Card>
            </div>

            {/* Progress Bar */}
            {taskStats.totalTasks > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Project Task Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {Math.round(
                      (taskStats.completedTasks / taskStats.totalTasks) * 100,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (taskStats.completedTasks / taskStats.totalTasks) * 100
                  }
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>
                    {taskStats.completedTasks} of {taskStats.totalTasks} tasks
                    completed
                  </span>
                  <span>
                    {taskStats.inProgressTasks} in progress,{" "}
                    {taskStats.todoTasks} pending
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Management */}
        <ErrorBoundary>
          <TaskList projectId={projectId} showProjectFilter={false} />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
