"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";

interface ProjectsEmptyStateProps {
  hasFilters: boolean;
  canCreate: boolean;
  onCreateProject: () => void;
}

export function ProjectsEmptyState({
  hasFilters,
  canCreate,
  onCreateProject,
}: ProjectsEmptyStateProps) {
  return (
    <Card className="modern-card">
      <CardContent className="p-8 text-center">
        <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No projects found
        </h3>
        <p className="text-gray-600 mb-4">
          {hasFilters
            ? "Try adjusting your filters"
            : "Create your first project to get started"}
        </p>
        {canCreate && (
          <Button onClick={onCreateProject} className="modern-button">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
