"use client";

import React, { useState } from "react";
import { Plus, User, X } from "lucide-react";
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
import { cn } from "@/src/lib/utils";
import { projectDateKey } from "@/src/utils/projects";
import type { ProjectFormDialogProps } from "@/src/types/projects";
import { UserAssignDialog, type UserAssignItem } from "./UserAssignDialog";

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
  const [assignOpen, setAssignOpen] = useState<"pm" | "team" | null>(null);

  const getUserId = (user: UserAssignItem) => user.id || user.userId || "";

  const getDisplayName = (user: UserAssignItem) => {
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    }
    return user.userName || user.email || "Unknown";
  };

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
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="project-form-pm">
                    Project manager <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-indigo-600"
                    onClick={() => setAssignOpen("pm")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {selectedProjectManager ? "Change" : "Add"}
                  </Button>
                </div>
                {selectedProjectManager ? (
                  <div className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-gray-500" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {getDisplayName(selectedProjectManager)}
                        </div>
                        {selectedProjectManager.email && (
                          <div className="truncate text-xs text-gray-500">
                            {selectedProjectManager.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 shrink-0 p-0"
                      onClick={() =>
                        onFormDataChange({ ...formData, projectManagerId: "" })
                      }
                      aria-label="Remove project manager"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed px-3 py-2 text-xs text-gray-400">
                    Click Add to assign a project manager.
                  </p>
                )}
                {formError === "Please select a project manager" ? (
                  <p className="text-sm text-red-500">{formError}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="project-form-team">Team members</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-indigo-600"
                    onClick={() => setAssignOpen("team")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {selectedTeamMembers.length > 0 ? "Add more" : "Add"}
                  </Button>
                </div>
                {selectedTeamMembers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTeamMembers.map((member) => (
                      <span
                        key={getUserId(member)}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-gray-50 py-1 pl-3 pr-1 text-sm text-slate-800"
                      >
                        {getDisplayName(member)}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 rounded-full p-0"
                          onClick={() =>
                            onFormDataChange({
                              ...formData,
                              teamMemberIds: formData.teamMemberIds.filter(
                                (id) => id !== getUserId(member),
                              ),
                            })
                          }
                          aria-label="Remove team member"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed px-3 py-2 text-xs text-gray-400">
                    Click Add to choose team members.
                  </p>
                )}
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
      {assignOpen && (
        <UserAssignDialog
          open={assignOpen !== null}
          onOpenChange={() => setAssignOpen(null)}
          title={assignOpen === "pm" ? "Assign Project Manager" : "Add Team Members"}
          confirmLabel={
            assignOpen === "pm" ? "Assign" : "Add selected"
          }
          mode={assignOpen}
          users={users as UserAssignItem[]}
          initialSelectedIds={
            assignOpen === "pm"
              ? formData.projectManagerId
                ? [formData.projectManagerId]
                : []
              : formData.teamMemberIds
          }
          onConfirm={(selected) => {
            if (assignOpen === "pm") {
              const pm = selected[0];
              onFormDataChange({
                ...formData,
                projectManagerId: pm ? pm.id || pm.userId || "" : "",
              });
            } else {
              onFormDataChange({
                ...formData,
                teamMemberIds: selected.map((u) => u.id || u.userId || ""),
              });
            }
          }}
        />
      )}
    </Dialog>
  );
}
