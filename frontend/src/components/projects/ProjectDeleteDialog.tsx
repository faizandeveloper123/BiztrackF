"use client";

import { Button } from "@/src/components/ui/button";
import type { ProjectDeleteDialogProps } from "@/src/types/projects";

export function ProjectDeleteDialog({
  open,
  project,
  onClose,
  onConfirm,
}: ProjectDeleteDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">Delete Project</h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete &quot;{project?.name}&quot;? This
          action cannot be undone.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
