"use client";

import type { Project } from "@/src/models";
import type { ProjectDeleteMode } from "@/src/types/projects";
import { ProjectCard } from "./ProjectCard";

interface ProjectsGridProps {
  projects: Project[];
  starredProjects: string[];
  canEditProject: (project: Project) => boolean;
  getDeleteMode: (project: Project) => ProjectDeleteMode;
  onToggleStarred: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onRequestDeletion: (project: Project) => void;
  onViewProject: (projectId: string) => void;
  onViewTasks: (projectId: string) => void;
}

export function ProjectsGrid({
  projects,
  starredProjects,
  canEditProject,
  getDeleteMode,
  onToggleStarred,
  onEditProject,
  onDeleteProject,
  onRequestDeletion,
  onViewProject,
  onViewTasks,
}: ProjectsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isStarred={starredProjects.includes(project.id)}
          onToggleStarred={onToggleStarred}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onRequestDeletion={onRequestDeletion}
          onViewProject={onViewProject}
          onViewTasks={onViewTasks}
          canEdit={canEditProject(project)}
          deleteMode={getDeleteMode(project)}
        />
      ))}
    </div>
  );
}
