"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { FolderOpen, Users, TrendingUp, Loader2, Building } from "lucide-react";
import { apiService } from "../../../services/ApiService";

interface WorkspaceStats {
  totalProjects: number;
  activeProjects: number;
  totalMembers: number;
  completionRate: number;
}

export default function WorkspacePage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [stats, setStats] = useState<WorkspaceStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalMembers: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Set tenant context
      apiService.setTenantId(tenantId);

      const [projectsResponse, usersResponse] = await Promise.all([
        apiService.getProjects().catch(() => ({ projects: [] })),
        apiService.getTenantUsers(tenantId).catch(() => ({ users: [] })),
      ]);

      const projects = projectsResponse.projects || [];
      const users = usersResponse.users || [];

      const totalProjects = projects.length;
      const activeProjects = projects.filter(
        (p: any) => p.status === "in_progress",
      ).length;
      const totalMembers = users.length;
      const completionRate =
        totalProjects > 0
          ? Math.round(
              projects.reduce(
                (sum: number, p: any) => sum + (p.completionPercent || 0),
                0,
              ) / totalProjects,
            )
          : 0;

      setStats({
        totalProjects,
        activeProjects,
        totalMembers,
        completionRate,
      });
    } catch (err) {
      setError("Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-white rounded-full shadow-lg">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Workspace Dashboard
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Welcome to your organization&apos;s workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalProjects}
                  </p>
                  <p className="text-sm text-gray-600">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeProjects}
                  </p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalMembers}
                  </p>
                  <p className="text-sm text-gray-600">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completionRate}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Workspace Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Overall Completion
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.completionRate}%
                  </span>
                </div>
                <Progress value={stats.completionRate} className="h-3" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {stats.totalProjects}
                  </p>
                  <p className="text-sm text-gray-600">Total Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {stats.activeProjects}
                  </p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">
                    {stats.totalMembers}
                  </p>
                  <p className="text-sm text-gray-600">Team Members</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => (window.location.href = "/projects")}
              >
                <FolderOpen className="h-6 w-6" />
                <span>View Projects</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => (window.location.href = "/team")}
              >
                <Users className="h-6 w-6" />
                <span>Manage Team</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => (window.location.href = "/reports")}
              >
                <TrendingUp className="h-6 w-6" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
