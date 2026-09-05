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
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { UserPlus, Filter, Eye, Edit, Save, Trash2, X } from "lucide-react";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import HRMService from "@/src/services/HRMService";
import FileUploadService from "@/src/services/FileUploadService";
import {
  Employee,
  Department,
  EmploymentStatus,
  EmployeeType,
  EmployeeUpdate,
} from "@/src/models/hrm";
import Link from "next/link";
import { DashboardLayout } from "@/src/components/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { useCustomDepartments } from "@/src/hooks/useCustomDepartments";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { CustomOptionDialog } from "@/src/components/common/CustomOptionDialog";

function formatDepartmentLabel(department: string) {
  if (Object.values(Department).includes(department as Department)) {
    return (
      department.charAt(0).toUpperCase() + department.slice(1).replace("_", " ")
    );
  }
  return department;
}

export default function HRMEmployeesPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMEmployeesContent />
    </ModuleGuard>
  );
}

function HRMEmployeesContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "hrm:employees",
  );
  const { getCurrencySymbol } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    employeeType: "",
    search: "",
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState<EmployeeUpdate>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [showCustomDepartmentDialog, setShowCustomDepartmentDialog] =
    useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const { customDepartments, createCustomDepartment } = useCustomDepartments();

  useEffect(() => {
    loadEmployees();
  }, [filters]);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HRMService.getEmployees(filters);
      setEmployees(response.employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  // Modal handlers
  const openViewModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth,
      hireDate: employee.hireDate,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      employeeType: employee.employeeType,
      employmentStatus: employee.employmentStatus,
      managerId: employee.managerId,
      salary: employee.salary,
      address: employee.address,
      emergencyContact: employee.emergencyContact,
      emergencyPhone: employee.emergencyPhone,
      skills: employee.skills,
      certifications: employee.certifications,
      notes: employee.notes,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    setEditFormData({});
    setNewResumeFile(null);
    setNewAttachments([]);
  };

  const handleEditInputChange = (
    field: keyof EmployeeUpdate,
    value: string | number,
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateCustomDepartment = async (
    name: string,
    description: string,
  ) => {
    try {
      setCreatingDepartment(true);
      await createCustomDepartment(name, description);
      handleEditInputChange("department", name);
      toast.success("Department created");
    } catch (err) {
      toast.error(extractErrorMessage(err) || "Failed to create department");
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      setEditLoading(true);

      let resumeUrl = selectedEmployee.resume_url;
      const attachmentUrls: string[] = [
        ...(selectedEmployee.attachments || []),
      ];

      if (newResumeFile) {
        toast.info("Uploading new resume...");

        const resumeResponse = await FileUploadService.uploadEmployeeFile(
          newResumeFile,
          "resume",
        );
        resumeUrl = resumeResponse.file_url;
        toast.success("Resume updated successfully");
      }

      if (newAttachments.length > 0) {
        toast.info(`Uploading ${newAttachments.length} attachment(s)...`);
        for (const attachment of newAttachments) {
          try {
            const attachmentResponse =
              await FileUploadService.uploadEmployeeFile(
                attachment,
                "attachment",
              );
            attachmentUrls.push(attachmentResponse.file_url);
          } catch (error) {
            toast.error(`Failed to upload ${attachment.name}`);
          }
        }
        toast.success("Attachments uploaded successfully");
      }

      const updateData = {
        ...editFormData,
        resume_url: resumeUrl,
        attachments: attachmentUrls,
      };

      await HRMService.updateEmployee(selectedEmployee.id, updateData);
      toast.success("Employee updated successfully");
      loadEmployees();
      closeEditModal();
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to update employee",
      );
      toast.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete modal handlers
  const openDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setDeleteLoading(true);
      await HRMService.deleteEmployee(selectedEmployee.id);
      toast.success("Employee deleted successfully");
      loadEmployees();
      closeDeleteModal();
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to delete employee",
      );
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading employees...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={loadEmployees}>Retry</Button>
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
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600">Manage your workforce</p>
          </div>
          {canCreate() && (
            <Button asChild>
              <Link href="/hrm/employees/new">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Department
                </label>
                <Select
                  value={filters.department || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("department", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {Object.values(Department).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                    {customDepartments.map((customDept) => (
                      <SelectItem key={customDept.id} value={customDept.name}>
                        {customDept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(EmploymentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={filters.employeeType || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("employeeType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(EmployeeType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={employee.avatar || undefined}
                        alt={`${employee.firstName} ${employee.lastName}`}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-lg font-semibold text-white">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-lg">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-gray-600">{employee.position}</div>
                      <div className="text-sm text-gray-500">
                        {employee.email} • {employee.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{employee.employeeId}</div>
                      <div className="text-sm text-gray-500">
                        {formatDepartmentLabel(employee.department)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge
                        className={HRMService.getEmploymentStatusColor(
                          employee.employmentStatus,
                        )}
                      >
                        {employee.employmentStatus}
                      </Badge>
                      <Badge
                        className={HRMService.getEmployeeTypeColor(
                          employee.employeeType,
                        )}
                      >
                        {employee.employeeType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(employee)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {canUpdate() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(employee)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(employee)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* View Employee Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>
                View complete information for {selectedEmployee?.firstName}{" "}
                {selectedEmployee?.lastName}
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedEmployee.avatar || undefined}
                      alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-xl font-semibold text-white">
                      {selectedEmployee.firstName[0]}
                      {selectedEmployee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedEmployee.position}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        First Name
                      </Label>
                      <p className="text-sm">{selectedEmployee.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Last Name
                      </Label>
                      <p className="text-sm">{selectedEmployee.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Email
                      </Label>
                      <p className="text-sm">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Phone
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Date of Birth
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.dateOfBirth || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Hire Date
                      </Label>
                      <p className="text-sm">{selectedEmployee.hireDate}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Employment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Employee ID
                      </Label>
                      <p className="text-sm">{selectedEmployee.employeeId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Position
                      </Label>
                      <p className="text-sm">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Department
                      </Label>
                      <p className="text-sm">
                        {formatDepartmentLabel(selectedEmployee.department)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Employee Type
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.employeeType.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Employment Status
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.employmentStatus}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Salary
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.salary
                          ? `${getCurrencySymbol()}${selectedEmployee.salary.toLocaleString()}`
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Additional Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Address
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.address || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Emergency Contact
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.emergencyContact || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Emergency Phone
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.emergencyPhone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Skills
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEmployee.skills &&
                        selectedEmployee.skills.length > 0 ? (
                          selectedEmployee.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            No skills listed
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Certifications
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEmployee.certifications &&
                        selectedEmployee.certifications.length > 0 ? (
                          selectedEmployee.certifications.map((cert, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {cert}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            No certifications listed
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Notes
                      </Label>
                      <p className="text-sm">
                        {selectedEmployee.notes || "No notes"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <div className="space-y-4">
                    {selectedEmployee.resume_url ? (
                      <div className="border rounded-lg p-4">
                        <Label className="text-sm font-medium text-gray-500">
                          Resume
                        </Label>
                        <div className="mt-2">
                          <a
                            href={selectedEmployee.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-2"
                          >
                            View Resume
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <Label className="text-sm font-medium text-gray-500">
                          Resume
                        </Label>
                        <p className="text-sm text-gray-500 mt-2">
                          No resume uploaded
                        </p>
                      </div>
                    )}

                    {selectedEmployee.attachments &&
                    selectedEmployee.attachments.length > 0 ? (
                      <div className="border rounded-lg p-4">
                        <Label className="text-sm font-medium text-gray-500">
                          Additional Attachments (
                          {selectedEmployee.attachments.length})
                        </Label>
                        <div className="mt-2 space-y-2">
                          {selectedEmployee.attachments.map((url, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-2"
                              >
                                Attachment {index + 1}
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <Label className="text-sm font-medium text-gray-500">
                          Attachments
                        </Label>
                        <p className="text-sm text-gray-500 mt-2">
                          No attachments
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Employee Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update information for {selectedEmployee?.firstName}{" "}
                {selectedEmployee?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name *</Label>
                    <Input
                      id="edit-firstName"
                      value={editFormData.firstName || ""}
                      onChange={(e) =>
                        handleEditInputChange("firstName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name *</Label>
                    <Input
                      id="edit-lastName"
                      value={editFormData.lastName || ""}
                      onChange={(e) =>
                        handleEditInputChange("lastName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) =>
                        handleEditInputChange("email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone || ""}
                      onChange={(e) =>
                        handleEditInputChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                    <Input
                      id="edit-dateOfBirth"
                      type="date"
                      value={editFormData.dateOfBirth || ""}
                      onChange={(e) =>
                        handleEditInputChange("dateOfBirth", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hireDate">Hire Date *</Label>
                    <Input
                      id="edit-hireDate"
                      type="date"
                      value={editFormData.hireDate || ""}
                      onChange={(e) =>
                        handleEditInputChange("hireDate", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Employment Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeId">Employee ID *</Label>
                    <Input
                      id="edit-employeeId"
                      value={editFormData.employeeId || ""}
                      onChange={(e) =>
                        handleEditInputChange("employeeId", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position">Position *</Label>
                    <Input
                      id="edit-position"
                      value={editFormData.position || ""}
                      onChange={(e) =>
                        handleEditInputChange("position", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Select
                      value={editFormData.department || ""}
                      onValueChange={(value) => {
                        if (value === "create_new") {
                          setShowCustomDepartmentDialog(true);
                        } else {
                          handleEditInputChange("department", value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Department).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept.charAt(0).toUpperCase() +
                              dept.slice(1).replace("_", " ")}
                          </SelectItem>
                        ))}
                        {customDepartments.map((customDept) => (
                          <SelectItem
                            key={customDept.id}
                            value={customDept.name}
                          >
                            {customDept.name}
                          </SelectItem>
                        ))}
                        {editFormData.department &&
                          !Object.values(Department).includes(
                            editFormData.department as Department,
                          ) &&
                          !customDepartments.some(
                            (d) => d.name === editFormData.department,
                          ) && (
                            <SelectItem value={editFormData.department}>
                              {editFormData.department}
                            </SelectItem>
                          )}
                        <SelectItem
                          value="create_new"
                          className="font-semibold text-blue-600"
                        >
                          + Create New Department
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeType">Employee Type</Label>
                    <Select
                      value={editFormData.employeeType || ""}
                      onValueChange={(value) =>
                        handleEditInputChange(
                          "employeeType",
                          value as EmployeeType,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EmployeeType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() +
                              type.slice(1).replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employmentStatus">
                      Employment Status
                    </Label>
                    <Select
                      value={editFormData.employmentStatus || ""}
                      onValueChange={(value) =>
                        handleEditInputChange(
                          "employmentStatus",
                          value as EmploymentStatus,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EmploymentStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-salary">Salary</Label>
                    <Input
                      id="edit-salary"
                      type="number"
                      value={editFormData.salary || ""}
                      onChange={(e) =>
                        handleEditInputChange(
                          "salary",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      value={editFormData.address || ""}
                      onChange={(e) =>
                        handleEditInputChange("address", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyContact">
                        Emergency Contact
                      </Label>
                      <Input
                        id="edit-emergencyContact"
                        value={editFormData.emergencyContact || ""}
                        onChange={(e) =>
                          handleEditInputChange(
                            "emergencyContact",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyPhone">
                        Emergency Phone
                      </Label>
                      <Input
                        id="edit-emergencyPhone"
                        value={editFormData.emergencyPhone || ""}
                        onChange={(e) =>
                          handleEditInputChange(
                            "emergencyPhone",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      value={editFormData.notes || ""}
                      onChange={(e) =>
                        handleEditInputChange("notes", e.target.value)
                      }
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedEmployee && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Resume</Label>
                      {selectedEmployee?.resume_url ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={selectedEmployee?.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View Current Resume
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No resume uploaded
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-resume">
                        Upload New Resume (Optional)
                      </Label>
                      <Input
                        id="edit-resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          setNewResumeFile(e.target.files?.[0] || null)
                        }
                        disabled={editLoading}
                      />
                      {newResumeFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>New: {newResumeFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewResumeFile(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Current Attachments</Label>
                      {selectedEmployee?.attachments &&
                      selectedEmployee?.attachments.length > 0 ? (
                        <div className="space-y-1">
                          {selectedEmployee?.attachments.map((url, index) => (
                            <div key={index} className="text-sm">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Attachment {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No attachments</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-attachments">
                        Add More Attachments (Optional)
                      </Label>
                      <Input
                        id="edit-attachments"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        multiple
                        onChange={(e) =>
                          setNewAttachments(Array.from(e.target.files || []))
                        }
                        disabled={editLoading}
                      />
                      {newAttachments.length > 0 && (
                        <div className="space-y-1">
                          {newAttachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <span>{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setNewAttachments(
                                    newAttachments.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading} className="w-full sm:w-auto">
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Employee</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <strong>
                  {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteEmployee}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Employee
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <CustomOptionDialog
          open={showCustomDepartmentDialog}
          onOpenChange={setShowCustomDepartmentDialog}
          title="Create New Department"
          description="Create a custom department that will be available for your tenant."
          optionName="Department"
          placeholder="e.g., Data Science, DevOps"
          onSubmit={handleCreateCustomDepartment}
          loading={creatingDepartment}
        />
      </div>
    </DashboardLayout>
  );
}
