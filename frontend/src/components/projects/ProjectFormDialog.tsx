"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { UserSearch } from "@/src/components/ui/user-search";
import { UserMultiSearch } from "@/src/components/ui/user-multi-search";
import { cn } from "@/src/lib/utils";
import { projectDateKey } from "@/src/utils/projects";
import type { ProjectFormDialogProps } from "@/src/types/projects";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

export function ProjectFormDialog({
  open,
  mode,
  formData,
  formError,
  formLoading,
  users,
  selectedProjectManager,
  selectedTeamMembers,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[85vh] min-h-0 w-[calc(100vw-1.5rem)] max-w-6xl flex-col " +
            "gap-0 overflow-hidden p-0 sm:max-h-[90vh]",
        )}
        onInteractOutside={(e) => {
          if (formLoading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (formLoading) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 space-y-3 border-b px-6 pb-4 pt-6 pr-14 text-left">
          <DialogTitle>
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </DialogTitle>
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          ) : null}
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-form-name">Project name *</Label>
                <Input
                  id="project-form-name"
                  value={formData.name}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <UserSearch
                  users={users}
                  value={selectedProjectManager}
                  onSelect={(user) =>
                    onFormDataChange({
                      ...formData,
                      projectManagerId: user ? user.id || user.userId || "" : "",
                    })
                  }
                  placeholder="Search by name or email..."
                  label="Project manager *"
                  required
                  error={
                    formError === "Please select a project manager"
                      ? formError
                      : undefined
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <UserMultiSearch
                  users={users}
                  value={selectedTeamMembers}
                  onChange={(selected) =>
                    onFormDataChange({
                      ...formData,
                      teamMemberIds: selected.map((u) => u.id || u.userId || ""),
                    })
                  }
                  placeholder="Search to add team members..."
                  label="Team members"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-form-status">Status</Label>
                <select
                  id="project-form-status"
                  className={selectClassName}
                  value={formData.status}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, status: e.target.value })
                  }
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In progress</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-form-priority">Priority</Label>
                <select
                  id="project-form-priority"
                  className={selectClassName}
                  value={formData.priority}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-form-start">Start date *</Label>
                <Input
                  id="project-form-start"
                  type="date"
                  required
                  max={
                    formData.endDate
                      ? projectDateKey(formData.endDate)
                      : undefined
                  }
                  value={formData.startDate || ""}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-form-end">End date *</Label>
                <Input
                  id="project-form-end"
                  type="date"
                  required
                  value={formData.endDate || ""}
                  min={
                    formData.startDate
                      ? projectDateKey(formData.startDate)
                      : undefined
                  }
                  onChange={(e) =>
                    onFormDataChange({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-form-budget">Budget</Label>
                <Input
                  id="project-form-budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      budget: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-form-client-email">Client email</Label>
                <Input
                  id="project-form-client-email"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, clientEmail: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-form-notes">Notes</Label>
                <Textarea
                  id="project-form-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-form-description">Description</Label>
                <Textarea
                  id="project-form-description"
                  value={formData.description}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formLoading}
              className="modern-button"
            >
              {formLoading
                ? "Saving..."
                : mode === "create"
                  ? "Create project"
                  : "Update project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
