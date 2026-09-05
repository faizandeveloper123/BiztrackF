"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Progress } from "../../../components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../../components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Users,
  Calendar,
  TrendingUp,
  Flag,
  MoreVertical,
  Clock,
  FileText,
  ArrowLeft,
  CheckSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Project,
  ProjectStatus,
  ProjectPriority,
} from "../../../models/project";
import { Task } from "../../../models/task";
import { apiService } from "../../../services/ApiService";
import { extractErrorMessage } from "../../../utils/errorUtils";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissions } from "../../../hooks/usePermissions";
import { DashboardLayout } from "../../../components/layout";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { ProjectDialog } from "../../../components/projects";
import { TaskCard } from "../../../components/tasks";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { canUpdateProjects, canDeleteProjects, isOwner } = usePermissions();
  const { getCurrencySymbol } = useCurrency();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getProject(projectId);
      setProject(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load project details"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const response = await apiService.getTasks({
        project: projectId,
        includeSubtasks: true,
        mainTasksOnly: false,
      });
      setTasks(response.tasks || []);
    } catch (err) {
    } finally {
      setTasksLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectDetails();
  }, [loadProjectDetails]);

  useEffect(() => {
    if (activeTab === "tasks") {
      loadTasks();
    }
  }, [activeTab, loadTasks]);

  const handleEditProject = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    const ok = await confirm({
      description:
        "Are you sure you want to delete this project? This action cannot be undone.",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await apiService.deleteProject(projectId);
      router.push("/projects");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete project"));
    }
  };

  const handleRequestDeletion = async () => {
    const ok = await confirm({
      description:
        "This will send a deletion request to the owner for approval. Continue?",
      confirmLabel: "Request Deletion",
    });
    if (!ok) return;
    try {
      const updated = await apiService.requestProjectDeletion(projectId);
      setProject(updated);
      toast.success("Deletion request sent to the owner for approval");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to request deletion"));
    }
  };

  const handleApproveDeletion = async () => {
    try {
      const updated = await apiService.approveProjectDeletion(projectId);
      setProject(updated);
      toast.success(
        "Deletion approved. The project manager can now delete it.",
      );
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to approve deletion"));
    }
  };

  const handleRejectDeletion = async () => {
    try {
      const updated = await apiService.rejectProjectDeletion(projectId);
      setProject(updated);
      toast.success("Deletion request rejected");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to reject deletion"));
    }
  };

  const isDeleteRequester = () => {
    const uid = user?.id;
    return project?.projectManager?.id === uid || project?.createdById === uid;
  };

  const canDeleteDirectly = () => user?.userRole === "super_admin" || isOwner();

  const canActOnDeletion = () =>
    canDeleteDirectly() || (canDeleteProjects() && isDeleteRequester());

  const handleProjectSave = (savedProject: Project) => {
    setProject(savedProject);
    setEditDialogOpen(false);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        );
      case ProjectStatus.IN_PROGRESS:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            In Progress
          </Badge>
        );
      case ProjectStatus.ON_HOLD:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            On Hold
          </Badge>
        );
      case ProjectStatus.CANCELLED:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: ProjectPriority) => {
    switch (priority) {
      case ProjectPriority.CRITICAL:
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Critical
          </Badge>
        );
      case ProjectPriority.HIGH:
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            High
          </Badge>
        );
      case ProjectPriority.MEDIUM:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Medium
          </Badge>
        );
      case ProjectPriority.LOW:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Low
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const canEditProject = () => {
    if (user?.userRole === "super_admin" || isOwner()) return true;
    if (!canUpdateProjects() || !project) return false;
    const uid = user?.id;
    return project.projectManager?.id === uid || project.createdById === uid;
  };

  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "in_progress",
    ).length;
    const todoTasks = tasks.filter((t) => t.status === "todo").length;

    return { totalTasks, completedTasks, inProgressTasks, todoTasks };
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
            <AlertCircle className="h-4 w-4" />
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
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/projects">Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Project Header */}
        <Card className="modern-card mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h1>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>
              </div>

              {(canEditProject() || canActOnDeletion()) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEditProject() && (
                      <DropdownMenuItem onClick={handleEditProject}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                    )}
                    {canActOnDeletion() && (
                      <>
                        {canEditProject() && <DropdownMenuSeparator />}
                        {canDeleteDirectly() ||
                        project.deletionStatus === "approved" ? (
                          <DropdownMenuItem
                            onClick={handleDeleteProject}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        ) : project.deletionStatus === "pending" ? (
                          <DropdownMenuItem disabled>
                            <Clock className="mr-2 h-4 w-4" />
                            Deletion Pending Approval
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={handleRequestDeletion}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Request Deletion
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isOwner() && project.deletionStatus === "pending" && (
              <Alert className="mb-6 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex flex-col gap-3 text-amber-800 md:flex-row md:items-center md:justify-between">
                  <span>
                    A deletion request is pending for this project. Approve to
                    allow the project manager to delete it, or reject to keep
                    it.
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRejectDeletion}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleApproveDeletion}
                    >
                      Approve Deletion
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <TrendingUp className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {project.completionPercent}%
                </div>
                <div className="text-sm text-gray-600 mb-2">Completion</div>
                <Progress value={project.completionPercent} className="h-2" />
              </Card>

              <Card className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CheckSquare className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {taskStats.totalTasks}
                </div>
                <div className="text-sm text-gray-600">Total Tasks</div>
                <div className="text-xs text-green-600 mt-1">
                  {taskStats.completedTasks} completed
                </div>
              </Card>

              <Card className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <Users className="h-10 w-10 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {project.teamMembers.length + 1}
                </div>
                <div className="text-sm text-gray-600 mb-2">Team Members</div>
                <div className="flex justify-center -space-x-2">
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarFallback className="text-xs bg-gradient-primary text-white">
                      {project.projectManager.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {project.teamMembers.slice(0, 3).map((member) => (
                    <Avatar
                      key={member.id}
                      className="h-6 w-6 border-2 border-white"
                    >
                      <AvatarFallback className="text-xs bg-gradient-primary text-white">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.teamMembers.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        +{project.teamMembers.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <TrendingUp className="h-10 w-10 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {getCurrencySymbol()}
                  {project.budget?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-600">Budget</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getCurrencySymbol()}
                  {project.actualCost?.toLocaleString() || "0"} spent
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center space-x-2">
              <CheckSquare className="h-4 w-4" />
              <span>Tasks ({taskStats.totalTasks})</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Details */}
              <div className="lg:col-span-2">
                <Card className="modern-card mb-6">
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-medium">
                            {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">End Date</p>
                          <p className="font-medium">
                            {new Date(project.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Project Manager
                          </p>
                          <p className="font-medium">
                            {project.projectManager.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Flag className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Priority</p>
                          <p className="font-medium capitalize">
                            {project.priority}
                          </p>
                        </div>
                      </div>
                    </div>

                    {project.notes && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Notes
                        </h4>
                        <p className="text-gray-600">{project.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="modern-card">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          router.push(`/projects/${projectId}/tasks`)
                        }
                        className="modern-button flex items-center space-x-2"
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span>Manage Tasks & Subtasks</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("tasks")}
                        className="flex items-center space-x-2"
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span>Quick Task View</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("timeline")}
                        className="flex items-center space-x-2"
                      >
                        <Clock className="h-4 w-4" />
                        <span>View Timeline</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Members */}
              <div>
                <Card className="modern-card">
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-primary text-white">
                            {project.projectManager.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {project.projectManager.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Project Manager
                          </p>
                        </div>
                      </div>
                      {project.teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-3"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-primary text-white">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              {member.role || "Team Member"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Project Tasks
              </h3>
              <Button
                onClick={() => router.push(`/projects/${projectId}/tasks`)}
                className="modern-button flex items-center space-x-2"
              >
                <CheckSquare className="h-4 w-4" />
                <span>View Full Task Manager</span>
              </Button>
            </div>

            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : tasks.length === 0 ? (
              <Card className="modern-card">
                <CardContent className="p-8 text-center">
                  <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No tasks found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first task to get started with this project.
                  </p>
                  <Button
                    onClick={() => router.push(`/projects/${projectId}/tasks`)}
                    className="modern-button flex items-center space-x-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Create Task</span>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.slice(0, 6).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => router.push(`/projects/${projectId}/tasks`)}
                      onDelete={() =>
                        router.push(`/projects/${projectId}/tasks`)
                      }
                      onStatusChange={() =>
                        router.push(`/projects/${projectId}/tasks`)
                      }
                      onAddSubtask={() =>
                        router.push(`/projects/${projectId}/tasks`)
                      }
                    />
                  ))}
                </div>
                {tasks.length > 6 && (
                  <Card className="modern-card">
                    <CardContent className="p-4 text-center">
                      <p className="text-gray-600 mb-3">
                        Showing 6 of {tasks.length} tasks
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/projects/${projectId}/tasks`)
                        }
                      >
                        View All Tasks
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card className="modern-card">
              <CardContent className="p-8 text-center">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Timeline View
                </h3>
                <p className="text-gray-600">
                  Timeline functionality coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Project Dialog */}
        {project && (
          <ProjectDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            onSave={handleProjectSave}
            project={project}
            mode="edit"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
