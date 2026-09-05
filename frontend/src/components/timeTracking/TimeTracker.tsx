"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Play, Square, Pause, Timer } from "lucide-react";
import { timeTrackingService } from "../../services/TimeTrackingService";
import { ActiveTimeSession } from "../../models/timeTracking";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

interface TimeTrackerProps {
  projects?: Array<{ id: string; name: string }>;
  tasks?: Array<{ id: string; name: string; projectId: string }>;
  onTimeEntryCreated?: (timeEntry: any) => void;
}

export function TimeTracker({
  projects = [],
  tasks = [],
  onTimeEntryCreated,
}: TimeTrackerProps) {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] =
    useState<ActiveTimeSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [description, setDescription] = useState("");

  const filteredTasks = selectedProject
    ? tasks.filter((task) => task.projectId === selectedProject)
    : tasks;

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  useEffect(() => {
    if (selectedProject && selectedTask) {
      const task = tasks.find((t) => t.id === selectedTask);
      if (task && task.projectId !== selectedProject) {
        setSelectedTask("");
      }
    }
  }, [selectedProject, selectedTask, tasks]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession?.isActive) {
      interval = setInterval(() => {
        const startTime = new Date(currentSession.startTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const fetchCurrentSession = async () => {
    try {
      const session = await timeTrackingService.getCurrentSession();
      setCurrentSession(session);
      if (session) {
        const startTime = new Date(session.startTime).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }
    } catch (error) {}
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!user) {
      return;
    }

    const userId = user.userId || user.id;
    if (!userId) {
      return;
    }

    setIsLoading(true);
    try {
      const sessionData = {
        projectId: selectedProject || undefined,
        taskId: selectedTask || undefined,
        description: description || undefined,
      };

      const session = await timeTrackingService.startTimeSession(sessionData);
      setCurrentSession(session);
      setElapsedTime(0);
      toast.success("Time tracking started");
    } catch (error) {
      toast.error("Failed to start time tracking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const timeEntry = await timeTrackingService.stopTimeSession(
        currentSession.id,
        description,
      );
      setCurrentSession(null);
      setElapsedTime(0);
      setDescription("");
      setSelectedProject("");
      setSelectedTask("");

      if (onTimeEntryCreated) {
        onTimeEntryCreated(timeEntry);
      }
      toast.success("Time tracking stopped");
    } catch (error) {
      toast.error("Failed to stop time tracking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const session = await timeTrackingService.pauseTimeSession(
        currentSession.id,
      );
      setCurrentSession(session);
      toast.success("Time tracking paused");
    } catch (error) {
      toast.error("Failed to pause time tracking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const session = await timeTrackingService.resumeTimeSession(
        currentSession.id,
      );
      setCurrentSession(session);
      toast.success("Time tracking resumed");
    } catch (error) {
      toast.error("Failed to resume time tracking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
            {formatTime(elapsedTime)}
          </div>

          {currentSession?.isActive && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 mb-4"
            >
              Currently tracking
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedProject || undefined}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
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

            <div>
              <Label htmlFor="task">Task</Label>
              <Select
                value={selectedTask || undefined}
                onValueChange={setSelectedTask}
                disabled={filteredTasks.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!currentSession ? (
            <Button
              onClick={handleStart}
              disabled={isLoading}
              className="modern-button"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={currentSession.isActive ? handlePause : handleResume}
                disabled={isLoading}
                variant="outline"
              >
                {currentSession.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                onClick={handleStop}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
