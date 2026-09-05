"use client";

import React, { useState, useEffect } from "react";
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
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Users,
  Building,
} from "lucide-react";
import HRMService from "@/src/services/HRMService";
import {
  JobPosting,
  JobPostingCreate,
  JobStatus,
  Department,
  EmployeeType,
  HRMJobFilters,
} from "@/src/models/hrm";
import { DashboardLayout } from "@/src/components/layout";
import { useCustomDepartments } from "@/src/hooks/useCustomDepartments";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { useCachedApi } from "@/src/hooks/useCachedApi";
import { CustomOptionDialog } from "@/src/components/common/CustomOptionDialog";
import { extractErrorMessage } from "@/src/utils/errorUtils";

function validateJobPostingForm(
  data: JobPostingCreate,
  isPublished: boolean,
): Record<string, string> {
  const e: Record<string, string> = {};
  const title = data.title?.trim() ?? "";
  if (title.length < 2) e.title = "Title must be at least 2 characters";
  else if (title.length > 200) e.title = "Title must be at most 200 characters";

  const desc = data.description?.trim() ?? "";
  if (desc.length < 20)
    e.description = "Description must be at least 20 characters";
  else if (desc.length > 20000) e.description = "Description is too long";

  const loc = data.location?.trim() ?? "";
  if (loc.length < 2) e.location = "Location must be at least 2 characters";
  else if (loc.length > 200)
    e.location = "Location must be at most 200 characters";

  if (!data.openDate?.trim()) e.openDate = "Open date is required";

  if (data.openDate?.trim() && data.closeDate?.trim()) {
    const o = new Date(`${data.openDate}T12:00:00`);
    const c = new Date(`${data.closeDate}T12:00:00`);
    if (!Number.isNaN(o.getTime()) && !Number.isNaN(c.getTime()) && c < o) {
      e.closeDate = "Close date must be on or after open date";
    }
  }

  const sal = data.salaryRange?.trim();
  if (sal && sal.length > 500) {
    e.salaryRange = "Salary range must be at most 500 characters";
  }

  if (data.hiringManagerId?.trim()) {
    const u = data.hiringManagerId.trim();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        u,
      )
    ) {
      e.hiringManagerId = "Hiring manager must be a valid UUID";
    }
  }

  if (isPublished) {
    const reqs = (data.requirements || []).filter((x) => String(x).trim());
    const resps = (data.responsibilities || []).filter((x) => String(x).trim());
    if (reqs.length < 1) {
      e.requirements = "Add at least one requirement to publish";
    }
    if (resps.length < 1) {
      e.responsibilities = "Add at least one responsibility to publish";
    }
  }

  return e;
}

export default function HRMJobPostingsPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMJobPostingsContent />
    </ModuleGuard>
  );
}

function HRMJobPostingsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions("hrm:jobs");
  const { getCurrencySymbol } = useCurrency();
  const [filters, setFilters] = useState<HRMJobFilters>({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJobPosting, setEditingJobPosting] = useState<JobPosting | null>(
    null,
  );
  const [viewingJobPosting, setViewingJobPosting] = useState<JobPosting | null>(
    null,
  );
  const [deletingJobPosting, setDeletingJobPosting] =
    useState<JobPosting | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCustomDepartmentDialog, setShowCustomDepartmentDialog] =
    useState(false);

  // Custom departments hook with caching
  const {
    customDepartments,
    createCustomDepartment,
    loading: customOptionsLoading,
  } = useCustomDepartments();

  // Cached job postings with shorter TTL since they change more frequently
  const {
    data: jobPostingsData,
    loading: jobPostingsLoading,
    error: jobPostingsError,
    refetch: refetchJobPostings,
  } = useCachedApi<{ jobPostings: JobPosting[] }>(
    `job-postings-${JSON.stringify(filters)}`,
    () => HRMService.getJobPostings(filters, 1, 100),
    { ttl: 2 * 60 * 1000 }, // 2 minutes cache
  );

  const jobPostings = jobPostingsData?.jobPostings || [];
  const loading = jobPostingsLoading || customOptionsLoading;

  // Set error from API if there's an error
  useEffect(() => {
    if (jobPostingsError) {
      setError("Failed to load job postings");
    }
  }, [jobPostingsError]);
  const [formData, setFormData] = useState<JobPostingCreate>({
    title: "",
    department: Department.ENGINEERING,
    description: "",
    requirements: [] as string[],
    responsibilities: [] as string[],
    location: "",
    type: EmployeeType.FULL_TIME,
    salaryRange: "",
    benefits: [] as string[],
    status: JobStatus.DRAFT,
    openDate: new Date().toISOString().split("T")[0],
    closeDate: "",
    hiringManagerId: "",
    tags: [] as string[],
  });

  // Job postings are now loaded automatically via cached API

  const handleSearch = () => {
    setFilters((prev: HRMJobFilters) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const handleCreateCustomDepartment = async (
    name: string,
    description: string,
  ) => {
    try {
      await createCustomDepartment(name, description);
    } catch (error) {}
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: Department.ENGINEERING,
      description: "",
      requirements: [] as string[],
      responsibilities: [] as string[],
      location: "",
      type: EmployeeType.FULL_TIME,
      salaryRange: "",
      benefits: [] as string[],
      status: JobStatus.DRAFT,
      openDate: new Date().toISOString().split("T")[0],
      closeDate: "",
      hiringManagerId: "",
      tags: [] as string[],
    });
    setEditingJobPosting(null);
    setError(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const published = formData.status === JobStatus.PUBLISHED;
      const fieldErrs = validateJobPostingForm(formData, published);
      setFormErrors(fieldErrs);
      if (Object.keys(fieldErrs).length > 0) {
        setError("Please fix the highlighted fields.");
        setSubmitting(false);
        return;
      }

      if (editingJobPosting) {
        await HRMService.updateJobPosting(editingJobPosting.id, formData);
        setSuccessMessage("Job posting updated successfully!");
      } else {
        await HRMService.createJobPosting(formData);
        setSuccessMessage("Job posting created successfully!");
      }

      setShowCreateDialog(false);
      resetForm();
      refetchJobPostings();
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Failed to save job posting. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (jobPosting: JobPosting) => {
    setEditingJobPosting(jobPosting);
    setFormData({
      title: jobPosting.title,
      department: jobPosting.department,
      description: jobPosting.description,
      requirements: jobPosting.requirements,
      responsibilities: jobPosting.responsibilities,
      location: jobPosting.location,
      type: jobPosting.type,
      salaryRange: jobPosting.salaryRange || "",
      benefits: jobPosting.benefits,
      status: jobPosting.status,
      openDate: jobPosting.openDate.split("T")[0],
      closeDate: jobPosting.closeDate?.split("T")[0] || "",
      hiringManagerId: jobPosting.hiringManagerId || "",
      tags: jobPosting.tags,
    });
    setFormErrors({});
    setShowCreateDialog(true);
  };

  const handleView = (jobPosting: JobPosting) => {
    setViewingJobPosting(jobPosting);
  };

  const handleDelete = (jobPosting: JobPosting) => {
    setDeletingJobPosting(jobPosting);
  };

  const confirmDelete = async () => {
    if (!deletingJobPosting) return;

    try {
      setDeleting(true);
      await HRMService.deleteJobPosting(deletingJobPosting.id);
      setSuccessMessage("Job posting deleted successfully!");
      setDeletingJobPosting(null);
      refetchJobPostings();
    } catch (err) {
      setError("Failed to delete job posting. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    const statusColors: { [key: string]: string } = {
      draft: "bg-gray-100 text-gray-800",
      published: "bg-green-100 text-green-800",
      closed: "bg-red-100 text-red-800",
      on_hold: "bg-yellow-100 text-yellow-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getDepartmentColor = (department: Department) => {
    const deptColors: { [key: string]: string } = {
      engineering: "bg-blue-100 text-blue-800",
      sales: "bg-green-100 text-green-800",
      marketing: "bg-purple-100 text-purple-800",
      hr: "bg-pink-100 text-pink-800",
      finance: "bg-yellow-100 text-yellow-800",
      operations: "bg-indigo-100 text-indigo-800",
      customer_support: "bg-orange-100 text-orange-800",
      legal: "bg-red-100 text-red-800",
      it: "bg-cyan-100 text-cyan-800",
      other: "bg-gray-100 text-gray-800",
    };
    return deptColors[department] || "bg-gray-100 text-gray-800";
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
            <div className="text-lg">Loading job postings...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-gray-600">
              Manage your job openings and recruitment
            </p>
          </div>
          {canCreate() && (
            <Button
              onClick={() => {
                setFormErrors({});
                setShowCreateDialog(true);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Job Posting
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search job postings..."
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
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={filters.department || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: HRMJobFilters) => ({
                      ...prev,
                      department:
                        value === "all" ? undefined : (value as Department),
                    }))
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: HRMJobFilters) => ({
                      ...prev,
                      status:
                        value === "all" ? undefined : (value as JobStatus),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(JobStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: HRMJobFilters) => ({
                      ...prev,
                      type:
                        value === "all" ? undefined : (value as EmployeeType),
                    }))
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
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobPostings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  jobPostings.filter(
                    (job) => job.status === JobStatus.PUBLISHED,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  jobPostings.filter((job) => job.status === JobStatus.DRAFT)
                    .length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  jobPostings.filter((job) => job.status === JobStatus.CLOSED)
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Postings List */}
        <Card>
          <CardHeader>
            <CardTitle>Job Postings ({jobPostings.length})</CardTitle>
            <CardDescription>
              Manage your job openings and recruitment process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobPostings.map((jobPosting) => (
                <div
                  key={jobPosting.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-lg">
                            {jobPosting.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {jobPosting.description &&
                            jobPosting.description.length > 100
                              ? `${jobPosting.description.substring(0, 100)}...`
                              : jobPosting.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge
                        className={getDepartmentColor(jobPosting.department)}
                      >
                        {jobPosting.department.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(jobPosting.status)}>
                        {jobPosting.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {jobPosting.type.replace("_", " ").toUpperCase()}
                      </Badge>
                      {jobPosting.salaryRange && (
                        <Badge variant="outline">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {jobPosting.salaryRange}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{jobPosting.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Opens:{" "}
                          {new Date(jobPosting.openDate).toLocaleDateString()}
                        </span>
                      </div>
                      {jobPosting.closeDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Closes:{" "}
                            {new Date(
                              jobPosting.closeDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Building className="w-3 h-3" />
                        <span>
                          Created:{" "}
                          {new Date(jobPosting.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(jobPosting)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canUpdate() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(jobPosting)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(jobPosting)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {jobPostings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No job postings found. Create your first job posting to get
                  started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Job Posting Dialog */}
        <Dialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setFormErrors({});
              setError(null);
            }
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJobPosting ? "Edit Job Posting" : "New Job Posting"}
              </DialogTitle>
              <DialogDescription>
                {editingJobPosting
                  ? "Update job posting information"
                  : "Create a new job posting for recruitment"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Senior Software Engineer"
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => {
                    if (value === "create_new") {
                      setShowCustomDepartmentDialog(true);
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        department: value as Department,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Department).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}

                    {/* Custom Departments */}
                    {customDepartments &&
                      customDepartments.length > 0 &&
                      customDepartments.map((customDept) => (
                        <SelectItem key={customDept.id} value={customDept.id}>
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
              <div className="col-span-2">
                <Label htmlFor="type">Employment Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value as EmployeeType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EmployeeType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="e.g., New York, NY"
                  className={formErrors.location ? "border-red-500" : ""}
                />
                {formErrors.location && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.location}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  value={formData.salaryRange}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salaryRange: e.target.value,
                    }))
                  }
                  placeholder={`e.g., ${getCurrencySymbol()}80,000 - ${getCurrencySymbol()}120,000`}
                  className={formErrors.salaryRange ? "border-red-500" : ""}
                />
                {formErrors.salaryRange && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.salaryRange}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as JobStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(JobStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="openDate">Open Date *</Label>
                <Input
                  id="openDate"
                  type="date"
                  value={formData.openDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      openDate: e.target.value,
                    }))
                  }
                  className={formErrors.openDate ? "border-red-500" : ""}
                />
                {formErrors.openDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.openDate}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="closeDate">Close Date</Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      closeDate: e.target.value,
                    }))
                  }
                  className={formErrors.closeDate ? "border-red-500" : ""}
                />
                {formErrors.closeDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.closeDate}
                  </p>
                )}
              </div>
              <div className="col-span-4">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Detailed job description..."
                  rows={4}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="requirements">
                  Requirements (one per line)
                </Label>
                <Textarea
                  id="requirements"
                  value={(formData.requirements || []).join("\n")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requirements: e.target.value
                        .split("\n")
                        .filter((line) => line.trim()),
                    }))
                  }
                  placeholder="Enter requirements, one per line..."
                  rows={3}
                  className={formErrors.requirements ? "border-red-500" : ""}
                />
                {formErrors.requirements && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.requirements}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="responsibilities">
                  Responsibilities (one per line)
                </Label>
                <Textarea
                  id="responsibilities"
                  value={(formData.responsibilities || []).join("\n")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      responsibilities: e.target.value
                        .split("\n")
                        .filter((line) => line.trim()),
                    }))
                  }
                  placeholder="Enter responsibilities, one per line..."
                  rows={3}
                  className={
                    formErrors.responsibilities ? "border-red-500" : ""
                  }
                />
                {formErrors.responsibilities && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.responsibilities}
                  </p>
                )}
              </div>
              <div className="col-span-4">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  value={(formData.benefits || []).join("\n")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      benefits: e.target.value
                        .split("\n")
                        .filter((line) => line.trim()),
                    }))
                  }
                  placeholder="Enter benefits, one per line..."
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
                  : editingJobPosting
                    ? "Update Job Posting"
                    : "Create Job Posting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Job Posting Dialog */}
        <Dialog
          open={!!viewingJobPosting}
          onOpenChange={() => setViewingJobPosting(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Job Posting</DialogTitle>
              <DialogDescription>Job posting details</DialogDescription>
            </DialogHeader>

            {viewingJobPosting && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Job Title
                  </Label>
                  <p className="text-lg font-medium">
                    {viewingJobPosting.title}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Department
                    </Label>
                    <Badge
                      className={getDepartmentColor(
                        viewingJobPosting.department,
                      )}
                    >
                      {viewingJobPosting.department
                        .replace("_", " ")
                        .toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Employment Type
                    </Label>
                    <Badge variant="outline">
                      {viewingJobPosting.type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <Badge className={getStatusColor(viewingJobPosting.status)}>
                      {viewingJobPosting.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Location
                    </Label>
                    <p className="text-gray-900">
                      {viewingJobPosting.location}
                    </p>
                  </div>
                </div>
                {viewingJobPosting.salaryRange && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Salary Range
                    </Label>
                    <p className="text-gray-900 font-medium">
                      {viewingJobPosting.salaryRange}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Job Description
                  </Label>
                  <p className="text-gray-900">
                    {viewingJobPosting.description}
                  </p>
                </div>
                {viewingJobPosting.requirements.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Requirements
                    </Label>
                    <ul className="list-disc list-inside space-y-1">
                      {viewingJobPosting.requirements.map((req, index) => (
                        <li key={index} className="text-gray-900">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {viewingJobPosting.responsibilities.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Responsibilities
                    </Label>
                    <ul className="list-disc list-inside space-y-1">
                      {viewingJobPosting.responsibilities.map((resp, index) => (
                        <li key={index} className="text-gray-900">
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {viewingJobPosting.benefits.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Benefits
                    </Label>
                    <ul className="list-disc list-inside space-y-1">
                      {viewingJobPosting.benefits.map((benefit, index) => (
                        <li key={index} className="text-gray-900">
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Open Date
                    </Label>
                    <p>
                      {new Date(
                        viewingJobPosting.openDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {viewingJobPosting.closeDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Close Date
                      </Label>
                      <p>
                        {new Date(
                          viewingJobPosting.closeDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p>
                      {new Date(
                        viewingJobPosting.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Updated
                    </Label>
                    <p>
                      {new Date(
                        viewingJobPosting.updatedAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingJobPosting(null)}
              >
                Close
              </Button>
              {viewingJobPosting && canUpdate() && (
                <Button
                  onClick={() => {
                    setViewingJobPosting(null);
                    handleEdit(viewingJobPosting);
                  }}
                >
                  Edit Job Posting
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingJobPosting}
          onOpenChange={() => setDeletingJobPosting(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job Posting</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;
                {deletingJobPosting?.title}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingJobPosting(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Job Posting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Department Dialog */}
        <CustomOptionDialog
          open={showCustomDepartmentDialog}
          onOpenChange={setShowCustomDepartmentDialog}
          title="Create New Department"
          description="Create a custom department that will be available for your tenant."
          optionName="Department"
          placeholder="e.g., Data Science, DevOps"
          onSubmit={handleCreateCustomDepartment}
          loading={customOptionsLoading}
        />
      </div>
    </DashboardLayout>
  );
}
