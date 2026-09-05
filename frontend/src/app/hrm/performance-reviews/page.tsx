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
  Award,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import HRMService from "@/src/services/HRMService";
import {
  PerformanceReview,
  PerformanceReviewCreate,
  ReviewType,
  ReviewStatus,
  HRMReviewFilters,
  Employee,
} from "@/src/models/hrm";
import { DashboardLayout } from "@/src/components/layout";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function HRMPerformanceReviewsPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMPerformanceReviewsContent />
    </ModuleGuard>
  );
}

function HRMPerformanceReviewsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions("hrm:reviews");
  const [performanceReviews, setPerformanceReviews] = useState<
    PerformanceReview[]
  >([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HRMReviewFilters>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(
    null,
  );
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(
    null,
  );
  const [deletingReview, setDeletingReview] =
    useState<PerformanceReview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<PerformanceReviewCreate>({
    employeeId: "",
    reviewerId: "",
    reviewType: ReviewType.ANNUAL,
    reviewPeriod: "",
    reviewDate: new Date().toISOString().split("T")[0],
    status: ReviewStatus.DRAFT,
    goals: [] as string[],
    achievements: [] as string[],
    areasOfImprovement: [] as string[],
    overallRating: 0,
    technicalRating: 0,
    communicationRating: 0,
    teamworkRating: 0,
    leadershipRating: 0,
    comments: "",
    nextReviewDate: "",
  });

  useEffect(() => {
    loadPerformanceReviews();
    loadEmployees();
    return;
  }, [filters]);

  const loadPerformanceReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await HRMService.getPerformanceReviews(filters, 1, 100);
      setPerformanceReviews(response.reviews);
    } catch (err) {
      setError("Failed to load performance reviews");
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
    setFilters((prev: HRMReviewFilters) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      reviewerId: "",
      reviewType: ReviewType.ANNUAL,
      reviewPeriod: "",
      reviewDate: new Date().toISOString().split("T")[0],
      status: ReviewStatus.DRAFT,
      goals: [] as string[],
      achievements: [] as string[],
      areasOfImprovement: [] as string[],
      overallRating: 0,
      technicalRating: 0,
      communicationRating: 0,
      teamworkRating: 0,
      leadershipRating: 0,
      comments: "",
      nextReviewDate: "",
    });
    setEditingReview(null);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      if (
        !formData.employeeId ||
        !formData.reviewerId ||
        !formData.reviewDate
      ) {
        setError(
          "Please fill in all required fields (Employee, Reviewer, and Review Date)",
        );
        return;
      }

      if (editingReview) {
        const updateData = {
          reviewerId: formData.reviewerId,
          reviewType: formData.reviewType,
          reviewPeriod: formData.reviewPeriod,
          reviewDate: formData.reviewDate,
          status: formData.status,
          goals: formData.goals,
          achievements: formData.achievements,
          areasOfImprovement: formData.areasOfImprovement,
          overallRating: formData.overallRating,
          technicalRating: formData.technicalRating,
          communicationRating: formData.communicationRating,
          teamworkRating: formData.teamworkRating,
          leadershipRating: formData.leadershipRating,
          comments: formData.comments,
          nextReviewDate: formData.nextReviewDate,
        };
        await HRMService.updatePerformanceReview(editingReview.id, updateData);
        setSuccessMessage("Performance review updated successfully!");
      } else {
        await HRMService.createPerformanceReview(formData);
        setSuccessMessage("Performance review created successfully!");
      }

      setShowCreateDialog(false);
      setEditingReview(null);
      resetForm();
      setTimeout(async () => {
        await loadPerformanceReviews();
      }, 100);
    } catch (err) {
      setError("Failed to save performance review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: PerformanceReview) => {
    setEditingReview(review);
    setFormData({
      employeeId: review.employeeId,
      reviewerId: review.reviewerId,
      reviewType: review.reviewType,
      reviewPeriod: review.reviewPeriod || "",
      reviewDate: review.reviewDate.split("T")[0],
      status: review.status,
      goals: review.goals || [],
      achievements: review.achievements || [],
      areasOfImprovement: review.areasOfImprovement || [],
      overallRating: review.overallRating || 0,
      technicalRating: review.technicalRating || 0,
      communicationRating: review.communicationRating || 0,
      teamworkRating: review.teamworkRating || 0,
      leadershipRating: review.leadershipRating || 0,
      comments: review.comments || "",
      nextReviewDate: review.nextReviewDate || "",
    });
    setShowCreateDialog(true);
  };

  const handleView = (review: PerformanceReview) => {
    setViewingReview(review);
  };

  const handleDelete = (review: PerformanceReview) => {
    setDeletingReview(review);
  };

  const confirmDelete = async () => {
    if (!deletingReview) return;

    try {
      setDeleting(true);
      await HRMService.deletePerformanceReview(deletingReview.id);
      setSuccessMessage("Performance review deleted successfully!");
      setDeletingReview(null);
      loadPerformanceReviews();
    } catch (err) {
      setError("Failed to delete performance review. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: ReviewStatus) => {
    const statusColors: { [key: string]: string } = {
      draft: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      approved: "bg-purple-100 text-purple-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getReviewTypeColor = (type: ReviewType) => {
    const typeColors: { [key: string]: string } = {
      annual: "bg-blue-100 text-blue-800",
      quarterly: "bg-green-100 text-green-800",
      monthly: "bg-yellow-100 text-yellow-800",
      project_based: "bg-purple-100 text-purple-800",
      probation: "bg-orange-100 text-orange-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "bg-green-100 text-green-800";
    if (rating >= 3.5) return "bg-blue-100 text-blue-800";
    if (rating >= 2.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
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
            <div className="text-lg">Loading performance reviews...</div>
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
              Performance Reviews
            </h1>
            <p className="text-gray-600">
              Manage employee performance evaluations and feedback
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
              New Performance Review
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
                    placeholder="Search reviews..."
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
                <label className="text-sm font-medium">Review Type</label>
                <Select
                  value={filters.reviewType || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: HRMReviewFilters) => ({
                      ...prev,
                      reviewType:
                        value === "all" ? undefined : (value as ReviewType),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(ReviewType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ").toUpperCase()}
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
                    setFilters((prev: HRMReviewFilters) => ({
                      ...prev,
                      status:
                        value === "all" ? undefined : (value as ReviewStatus),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(ReviewStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ").toUpperCase()}
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
                    setFilters((prev: HRMReviewFilters) => ({
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
                Total Reviews
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceReviews.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  performanceReviews.filter(
                    (review) => review.status === ReviewStatus.COMPLETED,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  performanceReviews.filter(
                    (review) => review.status === ReviewStatus.IN_PROGRESS,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  performanceReviews.filter(
                    (review) => review.status === ReviewStatus.DRAFT,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Reviews List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Performance Reviews ({performanceReviews.length})
            </CardTitle>
            <CardDescription>
              Manage employee performance evaluations and feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-lg">
                            {getEmployeeName(review.employeeId)} -{" "}
                            {review.reviewType.replace("_", " ").toUpperCase()}{" "}
                            Review
                          </div>
                          <div className="text-sm text-gray-500">
                            {review.reviewPeriod &&
                              `Period: ${review.reviewPeriod}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getReviewTypeColor(review.reviewType)}>
                        {review.reviewType.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(review.status)}>
                        {review.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge
                        className={getRatingColor(review.overallRating || 0)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {review.overallRating || 0}/5.0
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Review Date:{" "}
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>
                          Employee: {getEmployeeName(review.employeeId)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>
                          Reviewer: {getEmployeeName(review.reviewerId)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Created:{" "}
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {review.goals && review.goals.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Goals:</strong> {review.goals.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(review)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canUpdate() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(review)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(review)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {performanceReviews.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No performance reviews found. Create your first review to get
                  started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Performance Review Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReview
                  ? "Edit Performance Review"
                  : "New Performance Review"}
              </DialogTitle>
              <DialogDescription>
                {editingReview
                  ? "Update performance review information"
                  : "Create a new performance review for an employee"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2">
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
              <div className="col-span-2">
                <Label htmlFor="reviewerId">Reviewer *</Label>
                <Select
                  value={formData.reviewerId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, reviewerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reviewer" />
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
                <Label htmlFor="reviewType">Review Type *</Label>
                <Select
                  value={formData.reviewType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      reviewType: value as ReviewType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReviewType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reviewPeriod">Review Period</Label>
                <Input
                  id="reviewPeriod"
                  value={formData.reviewPeriod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reviewPeriod: e.target.value,
                    }))
                  }
                  placeholder="e.g., Q1 2024, January 2024"
                />
              </div>
              <div>
                <Label htmlFor="reviewDate">Review Date *</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={formData.reviewDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reviewDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as ReviewStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ReviewStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="overallRating">Overall Rating (0-5) *</Label>
                <Select
                  value={formData.overallRating?.toString() || "0"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      overallRating: parseFloat(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Poor</SelectItem>
                    <SelectItem value="1">1 - Below Average</SelectItem>
                    <SelectItem value="2">2 - Average</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="goals">Goals & Objectives (one per line)</Label>
                <Textarea
                  id="goals"
                  value={(formData.goals || []).join("\n")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      goals: e.target.value
                        .split("\n")
                        .filter((line) => line.trim()),
                    }))
                  }
                  placeholder="Enter employee goals, one per line..."
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="achievements">
                  Key Achievements (one per line)
                </Label>
                <Textarea
                  id="achievements"
                  value={(formData.achievements || []).join("\n")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      achievements: e.target.value
                        .split("\n")
                        .filter((line) => line.trim()),
                    }))
                  }
                  placeholder="Enter achievements, one per line..."
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="areasOfImprovement">
                  Areas for Improvement (one per line)
                </Label>
                <Textarea
                  id="areasOfImprovement"
                  value={(formData.areasOfImprovement || []).join("\n")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      areasOfImprovement: e.target.value
                        .split("\n")
                        .filter((line) => line.trim()),
                    }))
                  }
                  placeholder="Enter areas for improvement, one per line..."
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comments: e.target.value,
                    }))
                  }
                  placeholder="Overall comments and feedback..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="technicalRating">Technical Rating (0-5)</Label>
                <Select
                  value={formData.technicalRating?.toString() || "0"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      technicalRating: parseFloat(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Poor</SelectItem>
                    <SelectItem value="1">1 - Below Average</SelectItem>
                    <SelectItem value="2">2 - Average</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="communicationRating">
                  Communication Rating (0-5)
                </Label>
                <Select
                  value={formData.communicationRating?.toString() || "0"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      communicationRating: parseFloat(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Poor</SelectItem>
                    <SelectItem value="1">1 - Below Average</SelectItem>
                    <SelectItem value="2">2 - Average</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="teamworkRating">Teamwork Rating (0-5)</Label>
                <Select
                  value={formData.teamworkRating?.toString() || "0"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      teamworkRating: parseFloat(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Poor</SelectItem>
                    <SelectItem value="1">1 - Below Average</SelectItem>
                    <SelectItem value="2">2 - Average</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leadershipRating">
                  Leadership Rating (0-5)
                </Label>
                <Select
                  value={formData.leadershipRating?.toString() || "0"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      leadershipRating: parseFloat(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Poor</SelectItem>
                    <SelectItem value="1">1 - Below Average</SelectItem>
                    <SelectItem value="2">2 - Average</SelectItem>
                    <SelectItem value="3">3 - Good</SelectItem>
                    <SelectItem value="4">4 - Very Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="nextReviewDate">Next Review Date</Label>
                <Input
                  id="nextReviewDate"
                  type="date"
                  value={formData.nextReviewDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nextReviewDate: e.target.value,
                    }))
                  }
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
                  : editingReview
                    ? "Update Review"
                    : "Create Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Performance Review Dialog */}
        <Dialog
          open={!!viewingReview}
          onOpenChange={() => setViewingReview(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Performance Review</DialogTitle>
              <DialogDescription>Performance review details</DialogDescription>
            </DialogHeader>

            {viewingReview && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Employee
                    </Label>
                    <p className="text-lg font-medium">
                      {getEmployeeName(viewingReview.employeeId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Reviewer
                    </Label>
                    <p className="text-lg font-medium">
                      {getEmployeeName(viewingReview.reviewerId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Review Type
                    </Label>
                    <Badge
                      className={getReviewTypeColor(viewingReview.reviewType)}
                    >
                      {viewingReview.reviewType.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <Badge className={getStatusColor(viewingReview.status)}>
                      {viewingReview.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Overall Rating
                    </Label>
                    <Badge
                      className={getRatingColor(
                        viewingReview.overallRating || 0,
                      )}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {viewingReview.overallRating || 0}/5.0
                    </Badge>
                  </div>
                </div>
                {viewingReview.reviewPeriod && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Review Period
                    </Label>
                    <p className="text-gray-900">
                      {viewingReview.reviewPeriod}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Review Date
                  </Label>
                  <p className="text-gray-900">
                    {new Date(viewingReview.reviewDate).toLocaleDateString()}
                  </p>
                </div>
                {viewingReview.goals && viewingReview.goals.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Goals & Objectives
                    </Label>
                    <ul className="list-disc list-inside space-y-1">
                      {viewingReview.goals.map((goal, index) => (
                        <li key={index} className="text-gray-900">
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {viewingReview.achievements &&
                  viewingReview.achievements.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Key Achievements
                      </Label>
                      <ul className="list-disc list-inside space-y-1">
                        {viewingReview.achievements.map(
                          (achievement, index) => (
                            <li key={index} className="text-gray-900">
                              {achievement}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                {viewingReview.areasOfImprovement &&
                  viewingReview.areasOfImprovement.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Areas for Improvement
                      </Label>
                      <ul className="list-disc list-inside space-y-1">
                        {viewingReview.areasOfImprovement.map((area, index) => (
                          <li key={index} className="text-gray-900">
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {viewingReview.comments && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Comments
                    </Label>
                    <p className="text-gray-900">{viewingReview.comments}</p>
                  </div>
                )}
                {viewingReview.technicalRating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Technical Rating
                    </Label>
                    <Badge
                      className={getRatingColor(viewingReview.technicalRating)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {viewingReview.technicalRating}/5.0
                    </Badge>
                  </div>
                )}
                {viewingReview.communicationRating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Communication Rating
                    </Label>
                    <Badge
                      className={getRatingColor(
                        viewingReview.communicationRating,
                      )}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {viewingReview.communicationRating}/5.0
                    </Badge>
                  </div>
                )}
                {viewingReview.teamworkRating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Teamwork Rating
                    </Label>
                    <Badge
                      className={getRatingColor(viewingReview.teamworkRating)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {viewingReview.teamworkRating}/5.0
                    </Badge>
                  </div>
                )}
                {viewingReview.leadershipRating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Leadership Rating
                    </Label>
                    <Badge
                      className={getRatingColor(viewingReview.leadershipRating)}
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {viewingReview.leadershipRating}/5.0
                    </Badge>
                  </div>
                )}
                {viewingReview.nextReviewDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Next Review Date
                    </Label>
                    <p className="text-gray-900">
                      {new Date(
                        viewingReview.nextReviewDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p>
                      {new Date(viewingReview.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Updated
                    </Label>
                    <p>
                      {new Date(viewingReview.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingReview(null)}>
                Close
              </Button>
              {viewingReview && canUpdate() && (
                <Button
                  onClick={() => {
                    setViewingReview(null);
                    handleEdit(viewingReview);
                  }}
                >
                  Edit Review
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingReview}
          onOpenChange={() => setDeletingReview(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Performance Review</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this performance review for
                &quot;
                {deletingReview
                  ? getEmployeeName(deletingReview.employeeId)
                  : ""}
                &quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingReview(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
