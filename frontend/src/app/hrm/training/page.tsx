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
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  CheckCircle,
  Clock3,
  FileText,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  MapPin,
  UserCheck,
} from "lucide-react";
import HRMService from "@/src/services/HRMService";
import {
  Training,
  TrainingCreate,
  TrainingType,
  TrainingStatus,
} from "@/src/models/hrm";
import { DashboardLayout } from "@/src/components/layout";
import { useCrudPermissions } from "@/src/hooks/usePermissions";
import { toast } from "sonner";

export default function HRMTrainingPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMTrainingContent />
    </ModuleGuard>
  );
}

function HRMTrainingContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "hrm:training",
  );
  const { getCurrencySymbol } = useCurrency();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    trainingType?: string;
    status?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [viewingTraining, setViewingTraining] = useState<Training | null>(null);
  const [deletingTraining, setDeletingTraining] = useState<Training | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<TrainingCreate>({
    title: "",
    description: "",
    trainingType: TrainingType.SKILL_DEVELOPMENT,
    duration: "",
    cost: 0,
    provider: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    maxParticipants: 20,
    status: TrainingStatus.NOT_STARTED,
    materials: [],
    objectives: [],
    prerequisites: [],
  });

  useEffect(() => {
    loadTrainings();
    loadEmployees();
    return;
  }, [filters]);

  const loadTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HRMService.getTraining(filters, 1, 100);
      setTrainings(response.training);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load training programs";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadEmployees = async () => {
    try {
      await HRMService.getEmployees({}, 1, 100);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load employees";
      toast.error(`Load Error: ${errorMessage}`);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      trainingType: TrainingType.SKILL_DEVELOPMENT,
      duration: "",
      cost: 0,
      provider: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      maxParticipants: 20,
      status: TrainingStatus.NOT_STARTED,
      materials: [],
      objectives: [],
      prerequisites: [],
    });
    setEditingTraining(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      if (
        !formData.title ||
        !formData.description ||
        !formData.provider ||
        !formData.startDate ||
        !formData.endDate
      ) {
        setError(
          "Please fill in all required fields (Title, Description, Provider, Start Date, and End Date)",
        );
        return;
      }

      if (editingTraining) {
        await HRMService.updateTraining(editingTraining.id, formData);
        setSuccessMessage("Training program updated successfully!");
      } else {
        await HRMService.createTraining(formData);
        setSuccessMessage("Training program created successfully!");
      }

      setShowCreateDialog(false);
      resetForm();
      loadTrainings();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save training program";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setFormData({
      title: training.title,
      description: training.description,
      trainingType: training.trainingType,
      duration: training.duration,
      cost: training.cost,
      provider: training.provider,
      startDate: training.startDate.split("T")[0],
      endDate: training.endDate.split("T")[0],
      maxParticipants: training.maxParticipants || 20,
      status: training.status,
      materials: training.materials || [],
      objectives: training.objectives || [],
      prerequisites: training.prerequisites || [],
    });
    setShowCreateDialog(true);
  };

  const handleView = (training: Training) => {
    setViewingTraining(training);
  };

  const handleDelete = (training: Training) => {
    setDeletingTraining(training);
  };

  const confirmDelete = async () => {
    if (!deletingTraining) return;

    try {
      setDeleting(true);
      await HRMService.deleteTraining(deletingTraining.id);
      setSuccessMessage("Training program deleted successfully!");
      setDeletingTraining(null);
      loadTrainings();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to delete training program";
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: TrainingStatus) => {
    const statusColors: { [key: string]: string } = {
      not_started: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getTrainingTypeColor = (type: TrainingType) => {
    const typeColors: { [key: string]: string } = {
      technical: "bg-purple-100 text-purple-800",
      soft_skills: "bg-pink-100 text-pink-800",
      leadership: "bg-indigo-100 text-indigo-800",
      compliance: "bg-orange-100 text-orange-800",
      onboarding: "bg-teal-100 text-teal-800",
      skill_development: "bg-blue-100 text-blue-800",
      certification: "bg-green-100 text-green-800",
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  const getTrainingTypeIcon = (type: TrainingType) => {
    const icons: { [key: string]: React.ElementType } = {
      technical: GraduationCap,
      soft_skills: UserCheck,
      leadership: Target,
      compliance: BookOpen,
      onboarding: GraduationCap,
      skill_development: Target,
      certification: BookOpen,
    };
    return icons[type] || FileText;
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
            <div className="text-lg">Loading training programs...</div>
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
              Training Management
            </h1>
            <p className="text-gray-600">
              Manage employee training programs and enrollments
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
              New Training Program
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
                    placeholder="Search programs..."
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
                <label className="text-sm font-medium">Training Type</label>
                <Select
                  value={filters.trainingType || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      trainingType: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(TrainingType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() +
                          type.slice(1).replace("_", " ")}
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
                    {Object.values(TrainingStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Provider</label>
                <Input
                  placeholder="Provider name"
                  value={filters.provider || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      provider: e.target.value,
                    }))
                  }
                />
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
                Total Programs
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainings.length}</div>
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
                  trainings.filter(
                    (training) =>
                      training.status === TrainingStatus.IN_PROGRESS,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Not Started</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  trainings.filter(
                    (training) =>
                      training.status === TrainingStatus.NOT_STARTED,
                  ).length
                }
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
                  trainings.filter(
                    (training) => training.status === TrainingStatus.COMPLETED,
                  ).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Programs List */}
        <Card>
          <CardHeader>
            <CardTitle>Training Programs ({trainings.length})</CardTitle>
            <CardDescription>
              Manage employee training programs and schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainings.map((training) => {
                const TrainingTypeIcon = getTrainingTypeIcon(
                  training.trainingType,
                );
                return (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <TrainingTypeIcon className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium text-lg">
                              {training.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {training.description}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          className={getTrainingTypeColor(
                            training.trainingType,
                          )}
                        >
                          {training.trainingType.charAt(0).toUpperCase() +
                            training.trainingType.slice(1).replace("_", " ")}
                        </Badge>
                        <Badge className={getStatusColor(training.status)}>
                          {training.status.charAt(0).toUpperCase() +
                            training.status.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          <Clock3 className="w-3 h-3 mr-1" />
                          {training.duration}
                        </Badge>
                        <Badge variant="outline">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {training.cost}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>Provider: {training.provider}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Start:{" "}
                            {new Date(training.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            End:{" "}
                            {new Date(training.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Max: {training.maxParticipants}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            Created:{" "}
                            {new Date(training.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {training.objectives &&
                        training.objectives.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Objectives:</strong>{" "}
                            {training.objectives.join(", ")}
                          </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(training)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canUpdate() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(training)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(training)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {trainings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No training programs found. Create your first program to get
                  started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Training Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTraining
                  ? "Edit Training Program"
                  : "New Training Program"}
              </DialogTitle>
              <DialogDescription>
                {editingTraining
                  ? "Update training program information"
                  : "Create a new training program for employees"}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Training program title"
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Training program description"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="trainingType">Training Type *</Label>
                <Select
                  value={formData.trainingType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      trainingType: value as TrainingType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TrainingType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() +
                          type.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as TrainingStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TrainingStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  placeholder="e.g., 2 days, 16 hours"
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost ({getCurrencySymbol()})</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cost: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider *</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      provider: e.target.value,
                    }))
                  }
                  placeholder="Training provider name"
                />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxParticipants: parseInt(e.target.value) || 20,
                    }))
                  }
                />
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
              <div className="col-span-2">
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea
                  id="objectives"
                  value={formData.objectives?.join("\n") || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      objectives: e.target.value
                        .split("\n")
                        .filter((obj) => obj.trim()),
                    }))
                  }
                  placeholder="Enter learning objectives (one per line)"
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites?.join("\n") || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prerequisites: e.target.value
                        .split("\n")
                        .filter((prereq) => prereq.trim()),
                    }))
                  }
                  placeholder="Enter prerequisites (one per line)"
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
                  : editingTraining
                    ? "Update Program"
                    : "Create Program"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Training Dialog */}
        <Dialog
          open={!!viewingTraining}
          onOpenChange={() => setViewingTraining(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Training Program</DialogTitle>
              <DialogDescription>Training program details</DialogDescription>
            </DialogHeader>

            {viewingTraining && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Title
                    </Label>
                    <p className="text-lg font-medium">
                      {viewingTraining.title}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Type
                    </Label>
                    <Badge
                      className={getTrainingTypeColor(
                        viewingTraining.trainingType,
                      )}
                    >
                      {viewingTraining.trainingType.charAt(0).toUpperCase() +
                        viewingTraining.trainingType.slice(1).replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <Badge className={getStatusColor(viewingTraining.status)}>
                      {viewingTraining.status.charAt(0).toUpperCase() +
                        viewingTraining.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Provider
                    </Label>
                    <p className="text-gray-900">{viewingTraining.provider}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Duration
                    </Label>
                    <p className="text-gray-900">{viewingTraining.duration}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Cost
                    </Label>
                    <p className="text-gray-900">
                      {getCurrencySymbol()}
                      {viewingTraining.cost}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Max Participants
                    </Label>
                    <p className="text-gray-900">
                      {viewingTraining.maxParticipants}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                    <p className="text-gray-900">
                      {new Date(viewingTraining.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Description
                  </Label>
                  <p className="text-gray-900">{viewingTraining.description}</p>
                </div>
                {viewingTraining.objectives &&
                  viewingTraining.objectives.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Learning Objectives
                      </Label>
                      <ul className="list-disc list-inside text-gray-900">
                        {viewingTraining.objectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                {viewingTraining.prerequisites &&
                  viewingTraining.prerequisites.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Prerequisites
                      </Label>
                      <ul className="list-disc list-inside text-gray-900">
                        {viewingTraining.prerequisites.map((prereq, index) => (
                          <li key={index}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p>
                      {new Date(viewingTraining.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Updated
                    </Label>
                    <p>
                      {new Date(viewingTraining.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingTraining(null)}
              >
                Close
              </Button>
              {viewingTraining && (
                <Button
                  onClick={() => {
                    setViewingTraining(null);
                    handleEdit(viewingTraining);
                  }}
                >
                  Edit Program
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingTraining}
          onOpenChange={() => setDeletingTraining(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Training Program</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{deletingTraining?.title}
                &quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingTraining(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Program"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
