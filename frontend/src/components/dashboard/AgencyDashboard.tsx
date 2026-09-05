"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ProjectCreateDialog } from "../projects/ProjectCreateDialog";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  FolderKanban,
  UserPlus,
  ListTodo,
  Activity,
  ChevronRight,
} from "lucide-react";

export interface AgencyProjectSummary {
  id: string;
  name: string;
  status: string;
  completionPercent: number;
  priority?: string;
  dueDate?: string;
}

export interface AgencyTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface AgencyStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalTeamMembers: number;
  activeTeamMembers: number;
  averageProgress: number;
  recentProjects: AgencyProjectSummary[];
  teamMembers: AgencyTeamMember[];
}

interface AgencyDashboardProps {
  stats: AgencyStats;
  onNavigate: (path: string) => void;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "completed") return "default";
  if (status === "on_hold") return "secondary";
  if (status === "in_progress" || status === "planning") return "outline";
  return "secondary";
}

function isRunningProject(status: string): boolean {
  return status === "in_progress" || status === "planning";
}

export default function AgencyDashboard({
  stats,
  onNavigate,
}: AgencyDashboardProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  const runningProjects = stats.recentProjects.filter((p) =>
    isRunningProject(p.status),
  );

  const displayedProjects =
    runningProjects.length > 0
      ? runningProjects
      : stats.recentProjects.slice(0, 6);

  const activeMembers = stats.teamMembers.filter((m) => m.isActive !== false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Agency Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Projects, team capacity, and delivery overview
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <Button
            onClick={() => onNavigate("/users")}
            variant="outline"
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {stats.totalProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              All client engagements
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Running Projects
            </CardTitle>
            <Activity className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              In planning or progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.completedProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.activeTeamMembers || stats.totalTeamMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeamMembers} total in workspace
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Running Projects
                </CardTitle>
                <CardDescription className="mt-1">
                  Active work across your agency
                </CardDescription>
              </div>
              <Button
                onClick={() => onNavigate("/projects")}
                variant="ghost"
                size="sm"
                className="text-indigo-600"
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FolderKanban className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No projects yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create a project to start tracking client delivery.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create project
                </Button>
              </div>
            ) : (
              displayedProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {project.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(project.status)}>
                          {statusLabel(project.status)}
                        </Badge>
                        {project.priority ? (
                          <span className="text-xs text-slate-500">
                            {project.priority} priority
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">
                      {project.completionPercent ?? 0}%
                    </span>
                  </div>
                  <Progress
                    value={project.completionPercent ?? 0}
                    className="mt-3 h-2"
                  />
                </div>
              ))
            )}

            <div className="grid grid-cols-3 gap-3 border-t pt-4">
              <div className="rounded-lg bg-indigo-50 p-3 text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {stats.averageProgress}%
                </div>
                <div className="text-xs text-slate-600">Avg progress</div>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <div className="text-lg font-bold text-amber-600">
                  {stats.onHoldProjects}
                </div>
                <div className="text-xs text-slate-600">On hold</div>
              </div>
              <div className="rounded-lg bg-violet-50 p-3 text-center">
                <div className="text-lg font-bold text-violet-600">
                  {runningProjects.length || stats.activeProjects}
                </div>
                <div className="text-xs text-slate-600">In flight</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-600" />
                  Team
                </CardTitle>
                <CardDescription className="mt-1">
                  People on active projects
                </CardDescription>
              </div>
              <Button
                onClick={() => onNavigate("/users")}
                variant="ghost"
                size="sm"
                className="text-violet-600"
              >
                Manage
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMembers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
                No team members yet. Invite your agency staff to collaborate.
              </div>
            ) : (
              activeMembers.slice(0, 8).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {member.role}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                    Active
                  </Badge>
                </div>
              ))
            )}

            <Button
              onClick={() => onNavigate("/hrm/employees")}
              variant="outline"
              className="w-full border-violet-600 text-violet-600 hover:bg-violet-50"
            >
              View employees
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Button
              onClick={() => onNavigate("/projects")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <FolderKanban className="h-6 w-6" />
              <span className="text-sm">Projects</span>
            </Button>

            <Button
              onClick={() => onNavigate("/tasks")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <ListTodo className="h-6 w-6" />
              <span className="text-sm">Tasks</span>
            </Button>

            <Button
              onClick={() => onNavigate("/team")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Team</span>
            </Button>

            <Button
              onClick={() => onNavigate("/hrm/employees")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm">Employees</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
