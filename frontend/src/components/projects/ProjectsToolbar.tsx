"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Plus, Search, RefreshCw } from "lucide-react";
import type { ProjectsToolbarProps } from "@/src/types/projects";

export function ProjectsToolbar({
  searchTerm,
  statusFilter,
  priorityFilter,
  canCreate,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onClearFilters,
  onCreateProject,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-wrap justify-between items-center">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Clear
        </Button>
      </div>
      {canCreate && (
        <Button onClick={onCreateProject} className="modern-button">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      )}
    </div>
  );
}
