"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowRight,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Task, TaskStatus } from "../../models/task";
import { apiService } from "../../services/ApiService";
import {
  cn,
  getStatusColor,
  getPriorityColor,
  getInitials,
  formatDate,
} from "../../lib/utils";

export default function TasksWidget() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTasks({
        limit: 5,
        includeSubtasks: false,
      });
      setTasks(response.tasks || []);
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;

    return { totalTasks, completedTasks, inProgressTasks, todoTasks };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/tasks")}
            className="text-blue-600 hover:text-blue-700"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.completedTasks}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.inProgressTasks}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.todoTasks}
            </div>
            <div className="text-xs text-gray-600">To Do</div>
          </div>
        </div>

        <Separator />

        {/* Recent Tasks List */}
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => router.push("/tasks")}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate text-sm">
                    {task.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getStatusColor(task.status))}
                  >
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {task.assignedTo && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={task.assignedTo.name} />
                        <AvatarFallback className="text-xs bg-gradient-primary text-white">
                          {getInitials(task.assignedTo.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{task.assignedTo.name}</span>
                    </div>
                  )}
                  {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
                </div>
              </div>

              <Badge
                variant="outline"
                className={cn("text-xs", getPriorityColor(task.priority))}
              >
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-6">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No tasks found</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/tasks")}
              className="mt-2"
            >
              Create Task
            </Button>
          </div>
        )}

        {tasks.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/tasks")}
          >
            View All Tasks
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
