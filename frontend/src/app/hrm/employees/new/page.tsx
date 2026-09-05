"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleGuard } from "../../../../components/guards/PermissionGuard";
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
} from "@/src/components/ui/dialog";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/src/components/layout";
import HRMService from "@/src/services/HRMService";
import FileUploadService from "@/src/services/FileUploadService";
import {
  EmployeeCreate,
  Department,
  EmploymentStatus,
  EmployeeType,
} from "@/src/models/hrm";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { useCustomDepartments } from "@/src/hooks/useCustomDepartments";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { CustomOptionDialog } from "@/src/components/common/CustomOptionDialog";

export default function NewEmployeePage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <NewEmployeeContent />
    </ModuleGuard>
  );
}

function NewEmployeeContent() {
  const { canCreate } = useCrudPermissions("hrm:employees");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCustomDepartmentDialog, setShowCustomDepartmentDialog] =
    useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const { customDepartments, createCustomDepartment } = useCustomDepartments();
  const [formData, setFormData] = useState<EmployeeCreate>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    hireDate: new Date().toISOString().split("T")[0],
    employeeId: "",
    department: Department.OTHER,
    position: "",
    employeeType: EmployeeType.FULL_TIME,
    employmentStatus: EmploymentStatus.ACTIVE,
    managerId: "",
    salary: 0,
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    skills: [],
    certifications: [],
    notes: "",
  });

  const [skillsInput, setSkillsInput] = useState("");
  const [certificationsInput, setCertificationsInput] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleInputChange = (
    field: keyof EmployeeCreate,
    value: string | number,
  ) => {
    if (formError) setFormError(null);
    setFormData((prev) => ({
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
      handleInputChange("department", name);
      toast.success("Department created");
    } catch (error) {
      toast.error(extractErrorMessage(error) || "Failed to create department");
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleSkillsAdd = () => {
    if (skillsInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skillsInput.trim()],
      }));
      setSkillsInput("");
    }
  };

  const handleSkillsRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleCertificationsAdd = () => {
    if (certificationsInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [
          ...(prev.certifications || []),
          certificationsInput.trim(),
        ],
      }));
      setCertificationsInput("");
    }
  };

  const handleCertificationsRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.employeeId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setFormError(null);

      let resumeUrl = "";
      const attachmentUrls: string[] = [];

      if (resumeFile) {
        toast.info("Uploading resume...");
        const resumeResponse = await FileUploadService.uploadEmployeeFile(
          resumeFile,
          "resume",
        );
        resumeUrl = resumeResponse.file_url;
        toast.success("Resume uploaded successfully");
      }

      if (attachments.length > 0) {
        toast.info(`Uploading ${attachments.length} attachment(s)...`);
        for (const attachment of attachments) {
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

      const employeeData = {
        ...formData,
        resume_url: resumeUrl || undefined,
        attachments: attachmentUrls,
      };

      await HRMService.createEmployee(employeeData);
      toast.success("Employee created successfully");
      router.push("/hrm/employees");
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to create employee",
      );
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files);
      const validFiles = newAttachments.filter(
        (file) => file.size <= 10 * 1024 * 1024,
      );
      if (validFiles.length !== newAttachments.length) {
        toast.error("Some files exceed 10MB limit");
      }
      setAttachments((prev) => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    router.push("/hrm/employees");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/hrm/employees">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Employee
            </h1>
            <p className="text-gray-600">Create a new employee record</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Employee&apos;s personal and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) =>
                      handleInputChange("hireDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
              <CardDescription>
                Job details and employment status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) =>
                      handleInputChange("employeeId", e.target.value)
                    }
                    placeholder="Enter employee ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      handleInputChange("position", e.target.value)
                    }
                    placeholder="Enter job position"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => {
                      if (value === "create_new") {
                        setShowCustomDepartmentDialog(true);
                      } else {
                        handleInputChange("department", value);
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
                        <SelectItem key={customDept.id} value={customDept.name}>
                          {customDept.name}
                        </SelectItem>
                      ))}
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
                  <Label htmlFor="employeeType">Employee Type</Label>
                  <Select
                    value={formData.employeeType}
                    onValueChange={(value) =>
                      handleInputChange("employeeType", value as EmployeeType)
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
                  <Label htmlFor="employmentStatus">Employment Status</Label>
                  <Select
                    value={formData.employmentStatus}
                    onValueChange={(value) =>
                      handleInputChange(
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ""}
                  onChange={(e) =>
                    handleInputChange("salary", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter salary amount"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills and Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Skills and Certifications</CardTitle>
              <CardDescription>
                Employee&apos;s skills and professional certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="Enter a skill"
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleSkillsAdd())
                    }
                  />
                  <Button
                    type="button"
                    onClick={handleSkillsAdd}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills?.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleSkillsRemove(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certifications</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={certificationsInput}
                    onChange={(e) => setCertificationsInput(e.target.value)}
                    placeholder="Enter a certification"
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleCertificationsAdd())
                    }
                  />
                  <Button
                    type="button"
                    onClick={handleCertificationsAdd}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.certifications?.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleCertificationsRemove(index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Emergency contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact || ""}
                    onChange={(e) =>
                      handleInputChange("emergencyContact", e.target.value)
                    }
                    placeholder="Enter emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone || ""}
                    onChange={(e) =>
                      handleInputChange("emergencyPhone", e.target.value)
                    }
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional information about the employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resume and Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Upload resume and additional attachments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume">Resume (Optional)</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  disabled={loading}
                />
                {resumeFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <span>Selected: {resumeFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  PDF, DOC, or DOCX files up to 10MB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">
                  Additional Attachments (Optional)
                </Label>
                <Input
                  id="attachments"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleAttachmentsChange}
                  disabled={loading}
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        <span>{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  PDF, DOC, or DOCX files up to 10MB each
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {canCreate() && (
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Employee
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Employee Creation</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel? All unsaved changes will be
                lost.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="w-full sm:w-auto"
              >
                Continue Editing
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancel}
                className="w-full sm:w-auto"
              >
                Cancel
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
