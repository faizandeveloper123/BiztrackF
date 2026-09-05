"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../components/layout";
import { TimeTracker } from "../../components/timeTracking/TimeTracker";
import { TimeStats } from "../../components/timeTracking/TimeStats";
import { TimeEntryList } from "../../components/timeTracking/TimeEntryList";
import { TimeEntry } from "../../models/timeTracking";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/ApiService";

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [tasks, setTasks] = useState<
    Array<{ id: string; name: string; projectId: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  const fetchProjectsAndTasks = async () => {
    try {
      setLoading(true);

      const [projectsResponse, tasksResponse] = await Promise.all([
        apiService.get("/projects").catch(() => ({ projects: [] })),
        apiService.get("/tasks").catch(() => ({ tasks: [] })),
      ]);

      setProjects(projectsResponse.projects || []);

      // Transform tasks to match the expected structure
      const transformedTasks = (tasksResponse.tasks || []).map((task: any) => ({
        id: task.id,
        name: task.title, // Map title to name
        projectId: task.projectId,
      }));

      setTasks(transformedTasks);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntryCreated = (_timeEntry: TimeEntry) => {};

  const handleDeleteTimeEntry = (_timeEntry: TimeEntry) => {};

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Time Tracking
          </h1>
          <p className="text-gray-600 mt-2">
            Track your time and manage productivity
          </p>
        </div>

        <TimeTracker
          projects={projects}
          tasks={tasks}
          onTimeEntryCreated={handleTimeEntryCreated}
        />

        <TimeStats employeeId={user?.id} />

        <TimeEntryList
          projects={projects}
          tasks={tasks}
          onDelete={handleDeleteTimeEntry}
        />
      </div>
    </DashboardLayout>
  );
}
