"use client";

import React, { useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
import {
  Star,
  MoreVertical,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Clock,
  FolderOpen,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { ProjectCardProps } from "@/src/types/projects";

export const ProjectCard = React.memo(function ProjectCard({
  project,
  isStarred,
  onToggleStarred,
  onEditProject,
  onDeleteProject,
  onRequestDeletion,
  onViewProject,
  onViewTasks,
  canEdit,
  deleteMode,
}: ProjectCardProps) {
  const handleStarClick = useCallback(() => {
    onToggleStarred(project.id);
  }, [project.id, onToggleStarred]);

  const handleEditClick = useCallback(() => {
    onEditProject(project);
  }, [project, onEditProject]);

  const handleDeleteClick = useCallback(() => {
    onDeleteProject(project);
  }, [project, onDeleteProject]);

  const handleRequestDeletionClick = useCallback(() => {
    onRequestDeletion(project);
  }, [project, onRequestDeletion]);

  const handleViewClick = useCallback(() => {
    onViewProject(project.id);
  }, [project.id, onViewProject]);

  const handleTasksClick = useCallback(() => {
    onViewTasks(project.id);
  }, [project.id, onViewTasks]);

  return (
    <Card className="modern-card card-hover group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-900 flex-1 pr-2 group-hover:text-blue-600 transition-colors line-clamp-1">
            {project.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStarClick}
              className="h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  isStarred
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400",
                )}
              />
            </Button>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  <DropdownMenuItem onClick={handleEditClick}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {(deleteMode === "direct" || deleteMode === "approved") && (
                    <DropdownMenuItem
                      onClick={handleDeleteClick}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                  {deleteMode === "pending" && (
                    <DropdownMenuItem disabled>
                      <Clock className="h-3 w-3 mr-2" />
                      Deletion Pending
                    </DropdownMenuItem>
                  )}
                  {deleteMode === "request" && (
                    <DropdownMenuItem
                      onClick={handleRequestDeletionClick}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Request Deletion
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
          {project.description || "No description provided"}
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                project.status === "completed"
                  ? "default"
                  : project.status === "in_progress"
                    ? "secondary"
                    : project.status === "on_hold"
                      ? "outline"
                      : "destructive"
              }
            >
              {project.status.replace("_", " ")}
            </Badge>
            <Badge
              variant={
                project.priority === "high"
                  ? "destructive"
                  : project.priority === "medium"
                    ? "secondary"
                    : "outline"
              }
            >
              {project.priority}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {project.completionPercent}%
          </div>
        </div>
        <Progress value={project.completionPercent} className="h-2" />
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "No start date"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              <span>
                {project.budget
                  ? `$${project.budget.toLocaleString()}`
                  : "No budget"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.projectManager.name} />
              <AvatarFallback className="text-xs bg-gradient-secondary text-white">
                {project.projectManager.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              PM: {project.projectManager.name}
            </span>
          </div>
          <div className="flex -space-x-2">
            {project.teamMembers.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={member.name} />
                <AvatarFallback className="text-xs bg-gradient-secondary text-white">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.teamMembers.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  +{project.teamMembers.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewClick}
            className="flex-1 modern-button"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTasksClick}
            className="flex-1 modern-button"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            View Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
