"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Clock, Trash2, Check, X, Search } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { timeTrackingService } from "../../services/TimeTrackingService";
import { TimeEntry, TimeEntryFilters } from "../../models/timeTracking";

interface TimeEntryListProps {
  onDelete?: (timeEntry: TimeEntry) => void;
  projects?: Array<{ id: string; name: string }>;
  tasks?: Array<{ id: string; name: string; projectId: string }>;
}

export function TimeEntryList({
  onDelete,
  projects = [],
  tasks = [],
}: TimeEntryListProps) {
  const confirm = useConfirm();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TimeEntryFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingRejectEntry, setPendingRejectEntry] =
    useState<TimeEntry | null>(null);

  useEffect(() => {
    fetchTimeEntries();
  }, [currentPage, filters]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      // Clean filters to remove "all" values
      const cleanFilters = { ...filters };
      if (cleanFilters.status === "all") {
        delete cleanFilters.status;
      }
      if (cleanFilters.projectId === "all") {
        delete cleanFilters.projectId;
      }

      const response = await timeTrackingService.getTimeEntries(
        currentPage,
        10,
        cleanFilters,
      );
      setTimeEntries(response.timeEntries);
      setTotalPages(response.pagination.pages);
      setTotalEntries(response.pagination.total);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (timeEntry: TimeEntry) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this time entry?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      await timeTrackingService.deleteTimeEntry(timeEntry.id);
      await fetchTimeEntries();
      if (onDelete) onDelete(timeEntry);
    } catch (error) {}
  };

  const handleApprove = async (timeEntry: TimeEntry) => {
    try {
      await timeTrackingService.approveTimeEntry(timeEntry.id);
      await fetchTimeEntries();
    } catch (error) {}
  };

  const openRejectDialog = (timeEntry: TimeEntry) => {
    setPendingRejectEntry(timeEntry);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!pendingRejectEntry) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    try {
      await timeTrackingService.rejectTimeEntry(pendingRejectEntry.id, reason);
      setRejectOpen(false);
      setPendingRejectEntry(null);
      setRejectReason("");
      await fetchTimeEntries();
    } catch (error) {
      toast.error("Failed to reject time entry");
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return "No Project";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getTaskName = (taskId?: string) => {
    if (!taskId) return "No Task";
    const task = tasks.find((t) => t.id === taskId);
    return task?.name || "Unknown Task";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredEntries = timeEntries.filter(
    (entry) =>
      entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectName(entry.projectId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getTaskName(entry.taskId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Entries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search time entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.status || undefined}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value || undefined })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.projectId || undefined}
                onValueChange={(value) =>
                  setFilters({ ...filters, projectId: value || undefined })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{getProjectName(entry.projectId)}</TableCell>
                    <TableCell>{getTaskName(entry.taskId)}</TableCell>
                    <TableCell>{formatTime(entry.clockIn)}</TableCell>
                    <TableCell>
                      {entry.clockOut ? formatTime(entry.clockOut) : "-"}
                    </TableCell>
                    <TableCell>
                      {entry.totalHours
                        ? formatDuration(entry.totalHours)
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {entry.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(entry)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectDialog(entry)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalEntries)} of {totalEntries}{" "}
                entries
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setPendingRejectEntry(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject time entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter reason…"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={submitReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
