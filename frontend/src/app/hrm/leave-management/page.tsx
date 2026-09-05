"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Clock3,
  FileText,
  Plane,
  Heart,
  UserCheck,
  Baby,
  Users,
  HelpCircle,
} from "lucide-react";
import HRMService from "@/src/services/HRMService";
import {
  LeaveRequest,
  LeaveRequestCreate,
  LeaveType,
  LeaveStatus,
  Employee,
} from "@/src/models/hrm";
import { DashboardLayout } from "@/src/components/layout";
import { useCustomOptions } from "@/src/hooks/useCustomOptions";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { CustomOptionDialog } from "@/src/components/common/CustomOptionDialog";

export default function HRMLeaveManagementPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMLeaveManagementContent />
    </ModuleGuard>
  );
}

function HRMLeaveManagementContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "hrm:leave_requests",
  );
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    leaveType?: string;
    status?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [deletingRequest, setDeletingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCustomLeaveTypeDialog, setShowCustomLeaveTypeDialog] =
    useState(false);

  // Custom options hook
  const {
    customLeaveTypes,
    createCustomLeaveType,
    loading: customOptionsLoading,
  } = useCustomOptions();
  const [formData, setFormData] = useState<LeaveRequestCreate>({
    employeeId: "",
    leaveType: LeaveType.ANNUAL,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    totalDays: 1,
    reason: "",
    status: LeaveStatus.PENDING,
    notes: "",
  });

  useEffect(() => {
    loadLeaveRequests();
    loadEmployees();
    return;
  }, [filters]);

  const loadLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HRMService.getLeaveRequests(filters, 1, 100);
      setLeaveRequests(response.leaveRequests);
    } catch (err) {
      setError("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadEmployees = async () => {
    try {
      const response = await HRMService.getEmployees({}, 1, 100);
      setEmployees(response.employees);
    } catch (err) {}
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const handleCreateCustomLeaveType = async (
    name: string,
    description: string,
  ) => {
    try {
      await createCustomLeaveType(name, description);
    } catch (error) {}
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      leaveType: LeaveType.ANNUAL,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      totalDays: 1,
      reason: "",
      status: LeaveStatus.PENDING,
      notes: "",
    });
    setEditingRequest(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      if (
        !formData.employeeId ||
        !formData.reason ||
        !formData.startDate ||
        !formData.endDate
      ) {
        setError(
          "Please fill in all required fields (Employee, Reason, Start Date, and End Date)",
        );
        return;
      }

      // Calculate total days
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const updatedFormData = { ...formData, totalDays: diffDays };

      if (editingRequest) {
        await HRMService.updateLeaveRequest(editingRequest.id, updatedFormData);
        setSuccessMessage("Leave request updated successfully!");
      } else {
        await HRMService.createLeaveRequest(updatedFormData);
        setSuccessMessage("Leave request created successfully!");
      }

      setShowCreateDialog(false);
      resetForm();
      loadLeaveRequests();
    } catch (err: any) {
      setError("Failed to save leave request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (request: LeaveRequest) => {
    setEditingRequest(request);
    setFormData({
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      startDate: request.startDate.split("T")[0],
      endDate: request.endDate.split("T")[0],
      totalDays: request.totalDays,
      reason: request.reason,
      status: request.status,
      notes: request.notes || "",
    });
    setShowCreateDialog(true);
  };

  const handleView = (request: LeaveRequest) => {
    setViewingRequest(request);
  };

  const handleDelete = (request: LeaveRequest) => {
    setDeletingRequest(request);
  };

  const confirmDelete = async () => {
    if (!deletingRequest) return;

    try {
      setDeleting(true);
      await HRMService.deleteLeaveRequest(deletingRequest.id);
      setSuccessMessage("Leave request deleted successfully!");
      setDeletingRequest(null);
      loadLeaveRequests();
    } catch (err) {
      setError("Failed to delete leave request. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    const typeColors: { [key: string]: string } = {
      vacation: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      personal: "bg-purple-100 text-purple-800",
      maternity: "bg-pink-100 text-pink-800",
      paternity: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  const getLeaveTypeIcon = (type: LeaveType) => {
    const icons: { [key: string]: React.ElementType } = {
      vacation: Plane,
      sick: Heart,
      personal: UserCheck,
      maternity: Baby,
      paternity: Users,
      other: HelpCircle,
    };
    return icons[type] || FileText;
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    return employee
      ? `${employee.firstName} ${employee.lastName}`
      : "Unknown Employee";
  };

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return;
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
    return;
  }, [error]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading leave requests...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Leave Management
            </h1>
            <p className="text-gray-600">
              Manage employee leave requests and approvals
            </p>
          </div>
          {canCreate() && (
            <Button
              onClick={() => {
                setShowCreateDialog(true);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Leave Request
            </Button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search requests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Leave Type</label>
                <Select
                  value={filters.leaveType || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      leaveType: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(LeaveType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(LeaveStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Employee</label>
                <Select
                  value={filters.employeeId || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      employeeId: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaveRequests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  leaveRequests.filter(
                    (request) => request.status === LeaveStatus.PENDING,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  leaveRequests.filter(
                    (request) => request.status === LeaveStatus.APPROVED,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  leaveRequests.filter(
                    (request) => request.status === LeaveStatus.REJECTED,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests ({leaveRequests.length})</CardTitle>
            <CardDescription>
              Manage employee leave requests and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.map((request) => {
                const LeaveTypeIcon = getLeaveTypeIcon(request.leaveType);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <LeaveTypeIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-lg">
                              {getEmployeeName(request.employeeId)} -{" "}
                              {request.leaveType.charAt(0).toUpperCase() +
                                request.leaveType.slice(1)}{" "}
                              Leave
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.totalDays} day
                              {request.totalDays !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType.charAt(0).toUpperCase() +
                            request.leaveType.slice(1)}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          <Clock3 className="w-3 h-3 mr-1" />
                          {request.totalDays} day
                          {request.totalDays !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Start:{" "}
                            {new Date(request.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            End:{" "}
                            {new Date(request.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>
                            Employee: {getEmployeeName(request.employeeId)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Created:{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {request.reason && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Reason:</strong>{" "}
                          {request.reason.length > 100
                            ? `${request.reason.substring(0, 100)}...`
                            : request.reason}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canUpdate() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(request)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(request)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {leaveRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No leave requests found. Create your first request to get
                  started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Leave Request Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRequest ? "Edit Leave Request" : "New Leave Request"}
              </DialogTitle>
              <DialogDescription>
                {editingRequest
                  ? "Update leave request information"
                  : "Create a new leave request for an employee"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, employeeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leaveType">Leave Type *</Label>
                <Select
                  value={formData.leaveType}
                  onValueChange={(value) => {
                    if (value === "create_new") {
                      setShowCustomLeaveTypeDialog(true);
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        leaveType: value as LeaveType,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeaveType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}

                    {/* Custom Leave Types */}
                    {customLeaveTypes &&
                      customLeaveTypes.length > 0 &&
                      customLeaveTypes.map((customType) => (
                        <SelectItem key={customType.id} value={customType.id}>
                          {customType.name}
                        </SelectItem>
                      ))}

                    <SelectItem
                      value="create_new"
                      className="font-semibold text-blue-600"
                    >
                      + Create New Leave Type
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as LeaveStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeaveStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="totalDays">Total Days</Label>
                <Input
                  id="totalDays"
                  type="number"
                  min="1"
                  value={formData.totalDays}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalDays: parseInt(e.target.value) || 1,
                    }))
                  }
                  disabled
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="Please provide a reason for the leave request..."
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Additional notes or comments..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingRequest
                    ? "Update Request"
                    : "Create Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Leave Request Dialog */}
        <Dialog
          open={!!viewingRequest}
          onOpenChange={() => setViewingRequest(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Leave Request</DialogTitle>
              <DialogDescription>Leave request details</DialogDescription>
            </DialogHeader>

            {viewingRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Employee
                    </Label>
                    <p className="text-lg font-medium">
                      {getEmployeeName(viewingRequest.employeeId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Leave Type
                    </Label>
                    <Badge
                      className={getLeaveTypeColor(viewingRequest.leaveType)}
                    >
                      {viewingRequest.leaveType.charAt(0).toUpperCase() +
                        viewingRequest.leaveType.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <Badge className={getStatusColor(viewingRequest.status)}>
                      {viewingRequest.status.charAt(0).toUpperCase() +
                        viewingRequest.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Total Days
                    </Label>
                    <p className="text-gray-900">
                      {viewingRequest.totalDays} day
                      {viewingRequest.totalDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                    <p className="text-gray-900">
                      {new Date(viewingRequest.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      End Date
                    </Label>
                    <p className="text-gray-900">
                      {new Date(viewingRequest.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Reason
                  </Label>
                  <p className="text-gray-900">{viewingRequest.reason}</p>
                </div>
                {viewingRequest.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Notes
                    </Label>
                    <p className="text-gray-900">{viewingRequest.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p>
                      {new Date(viewingRequest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Updated
                    </Label>
                    <p>
                      {new Date(viewingRequest.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingRequest(null)}>
                Close
              </Button>
              {viewingRequest && canUpdate() && (
                <Button
                  onClick={() => {
                    setViewingRequest(null);
                    handleEdit(viewingRequest);
                  }}
                >
                  Edit Request
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingRequest}
          onOpenChange={() => setDeletingRequest(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Leave Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this leave request for &quot;
                {deletingRequest
                  ? getEmployeeName(deletingRequest.employeeId)
                  : ""}
                &quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingRequest(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Leave Type Dialog */}
        <CustomOptionDialog
          open={showCustomLeaveTypeDialog}
          onOpenChange={setShowCustomLeaveTypeDialog}
          title="Create New Leave Type"
          description="Create a custom leave type that will be available for your tenant."
          optionName="Leave Type"
          placeholder="e.g., Sabbatical, Study Leave"
          onSubmit={handleCreateCustomLeaveType}
          loading={customOptionsLoading.leaveType}
        />
      </div>
    </DashboardLayout>
  );
}
