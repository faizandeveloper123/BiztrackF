"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  UserSearch,
  type UserSearchItem,
} from "@/src/components/ui/user-search";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Target,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import CRMService from "@/src/services/CRMService";
import {
  Opportunity,
  OpportunityStage,
  CRMOpportunityFilters,
  OpportunityCreate,
} from "@/src/models/crm";
import { User } from "@/src/models";
import { apiService } from "@/src/services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function CRMOpportunitiesPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <CRMOpportunitiesContent />
    </ModuleGuard>
  );
}

function CRMOpportunitiesContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "crm:opportunities",
  );
  const { formatCurrency } = useCurrency();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CRMOpportunityFilters>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<Opportunity | null>(null);
  const [viewingOpportunity, setViewingOpportunity] =
    useState<Opportunity | null>(null);
  const [deletingOpportunity, setDeletingOpportunity] =
    useState<Opportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<OpportunityCreate>({
    title: "",
    description: "",
    stage: OpportunityStage.PROSPECTING,
    amount: undefined,
    probability: 50,
    expectedCloseDate: "",
    leadId: "",
    contactId: "",
    companyId: "",
    assignedTo: "",
    notes: "",
    tags: [],
  });
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      let tenantId: string | null = null;
      const selectedTenant = localStorage.getItem("selectedTenant");
      if (selectedTenant) {
        try {
          const parsed = JSON.parse(selectedTenant);
          tenantId = parsed.id || parsed.tenantId;
        } catch {}
      }
      if (!tenantId) {
        tenantId = localStorage.getItem("currentTenantId");
      }
      if (tenantId) {
        const response = await apiService.getTenantUsers(tenantId);
        const uniqueUsers = (response.users || []).reduce(
          (acc: User[], user: User) => {
            const existing = acc.find(
              (u) => u.userId === user.userId || u.id === user.userId,
            );
            if (!existing) acc.push(user);
            return acc;
          },
          [],
        );
        setUsers(uniqueUsers);
      } else {
        setUsers([]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (showCreateDialog) {
      CRMService.getCompanies({}, 1, 100)
        .then((r) => setCompanies(r.companies || []))
        .catch(() => setCompanies([]));
    }
  }, [showCreateDialog]);

  const selectedAssignee = useMemo((): UserSearchItem | null => {
    if (!formData.assignedTo) return null;
    const found = users.find((u) => (u.id || u.userId) === formData.assignedTo);
    if (found) return found;
    return {
      id: formData.assignedTo,
      userId: formData.assignedTo,
      userName: formData.assignedTo,
    };
  }, [users, formData.assignedTo]);

  const assigneeDisplay = useCallback(
    (opportunity: Opportunity) => {
      if (!opportunity.assignedTo) return null;
      const u = users.find(
        (x) => (x.id || x.userId) === opportunity.assignedTo,
      );
      if (u) {
        if (u.firstName || u.lastName) {
          return [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
        }
        return u.userName || u.email || opportunity.assignedTo;
      }
      return opportunity.assignedTo;
    },
    [users],
  );

  const viewingAssigneeLabel = useMemo(() => {
    if (!viewingOpportunity) return null;
    return assigneeDisplay(viewingOpportunity);
  }, [viewingOpportunity, assigneeDisplay]);

  const loadOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CRMService.getOpportunities(filters, 1, 100);
      setOpportunities(response.opportunities);
    } catch (err) {
      setErrorMessage("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = () => {
    setFilters((prev: CRMOpportunityFilters) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      stage: OpportunityStage.PROSPECTING,
      amount: undefined,
      probability: 50,
      expectedCloseDate: "",
      leadId: "",
      contactId: "",
      companyId: "",
      assignedTo: "",
      notes: "",
      tags: [],
    });
    setEditingOpportunity(null);
    setErrorMessage(null);
    setFormErrorMessage(null);
  };

  const handleSubmit = async () => {
    const title = (formData.title || "").trim();
    if (!title) {
      setFormErrorMessage("Title is required.");
      return;
    }
    if (formData.amount !== undefined && formData.amount < 0) {
      setFormErrorMessage("Amount cannot be negative.");
      return;
    }
    if (
      formData.probability !== undefined &&
      (formData.probability < 0 || formData.probability > 100)
    ) {
      setFormErrorMessage("Probability must be between 0 and 100.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMessage(null);
      setFormErrorMessage(null);
      const payload: OpportunityCreate = {
        ...formData,
        title,
      };

      if (editingOpportunity) {
        await CRMService.updateOpportunity(editingOpportunity.id, payload);
        setSuccessMessage("Opportunity updated successfully!");
      } else {
        await CRMService.createOpportunity(payload);
        setSuccessMessage("Opportunity created successfully!");
      }

      setShowCreateDialog(false);
      resetForm();
      loadOpportunities();
    } catch (err) {
      setErrorMessage("Failed to save opportunity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || "",
      stage: opportunity.stage,
      amount: opportunity.amount,
      probability: opportunity.probability,
      expectedCloseDate: opportunity.expectedCloseDate || "",
      leadId: opportunity.leadId || "",
      contactId: opportunity.contactId || "",
      companyId: opportunity.companyId || "",
      assignedTo: opportunity.assignedTo || "",
      notes: opportunity.notes || "",
      tags: opportunity.tags || [],
    });
    setShowCreateDialog(true);
  };

  const handleView = (opportunity: Opportunity) => {
    setViewingOpportunity(opportunity);
  };

  const handleDelete = (opportunity: Opportunity) => {
    setDeletingOpportunity(opportunity);
  };

  const confirmDelete = async () => {
    if (!deletingOpportunity) return;

    try {
      setDeleting(true);
      await CRMService.deleteOpportunity(deletingOpportunity.id);
      setSuccessMessage("Opportunity deleted successfully!");
      setDeletingOpportunity(null);
      loadOpportunities();
    } catch (err) {
      setErrorMessage("Failed to delete opportunity. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [errorMessage]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-lg">Loading Opportunities...</p>
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
              CRM Opportunities
            </h1>
            <p className="text-gray-600">
              Manage your sales opportunities and pipeline
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
              New Opportunity
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

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search opportunities..."
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
                <label className="text-sm font-medium">Stage</label>
                <Select
                  value={filters.stage || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: CRMOpportunityFilters) => ({
                      ...prev,
                      stage:
                        value === "all"
                          ? undefined
                          : (value as OpportunityStage),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {Object.values(OpportunityStage).map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace("_", " ").charAt(0).toUpperCase() +
                          stage.replace("_", " ").slice(1)}
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

        {/* Opportunities List */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunities ({opportunities.length})</CardTitle>
            <CardDescription>
              Manage your sales opportunities and track progress through the
              pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opportunity) => {
                const assignedLabel = assigneeDisplay(opportunity);
                return (
                  <div
                    key={opportunity.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {opportunity.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {opportunity.description &&
                              opportunity.description.length > 100
                                ? `${opportunity.description.substring(0, 100)}...`
                                : opportunity.description}
                            </div>
                          </div>
                        </div>
                        {opportunity.amount && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Target className="w-4 h-4" />
                            <span className="font-medium">
                              {formatCurrency(opportunity.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          className={CRMService.getOpportunityStageColor(
                            opportunity.stage,
                          )}
                        >
                          {opportunity.stage
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                            opportunity.stage.replace("_", " ").slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {opportunity.probability}% probability
                        </Badge>
                        {opportunity.expectedCloseDate && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Closes:{" "}
                              {CRMService.formatDate(
                                opportunity.expectedCloseDate,
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>
                          Created:{" "}
                          {CRMService.formatDate(opportunity.createdAt)}
                        </span>
                        {opportunity.leadId && (
                          <span>Lead ID: {opportunity.leadId}</span>
                        )}
                        {opportunity.contactId && (
                          <span>Contact ID: {opportunity.contactId}</span>
                        )}
                        {opportunity.companyId && (
                          <span>Company ID: {opportunity.companyId}</span>
                        )}
                        {assignedLabel && (
                          <span>Assigned: {assignedLabel}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(opportunity)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canUpdate() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(opportunity)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(opportunity)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Summary</CardTitle>
            <CardDescription>
              Overview of opportunities by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Object.values(OpportunityStage).map((stage) => {
                const stageOpportunities = opportunities.filter(
                  (o) => o.stage === stage,
                );
                const totalValue = stageOpportunities.reduce(
                  (sum, o) => sum + (o.amount || 0),
                  0,
                );

                return (
                  <div
                    key={stage}
                    className="text-center p-3 border rounded-lg"
                  >
                    <div className="text-sm font-medium text-gray-600 capitalize">
                      {stage.replace("_", " ")}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stageOpportunities.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(totalValue)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Opportunity Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="flex max-h-[min(calc(100dvh_-_2rem),calc(100vh_-_2rem))] max-w-2xl flex-col gap-0 overflow-hidden p-0">
            <div className="shrink-0 border-b px-6 pb-4 pt-6 pr-14">
              <DialogHeader>
                <DialogTitle>
                  {editingOpportunity ? "Edit Opportunity" : "New Opportunity"}
                </DialogTitle>
                <DialogDescription>
                  {editingOpportunity
                    ? "Update opportunity information"
                    : "Create a new sales opportunity"}
                </DialogDescription>
              </DialogHeader>
            </div>

            {errorMessage && (
              <div className="shrink-0 px-6 pt-3">
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-full sm:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value.trim(),
                      }))
                    }
                    placeholder="Opportunity title"
                  />
                </div>
                <div className="col-span-full sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Opportunity description"
                  />
                </div>
                <div>
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        stage: value as OpportunityStage,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(OpportunityStage).map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage.replace("_", " ").charAt(0).toUpperCase() +
                            stage.replace("_", " ").slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        probability: Math.max(
                          0,
                          Math.min(100, parseInt(e.target.value) || 0),
                        ),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expectedCloseDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="leadId">Lead ID</Label>
                  <Input
                    id="leadId"
                    value={formData.leadId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        leadId: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="contactId">Contact ID</Label>
                  <Input
                    id="contactId"
                    value={formData.contactId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactId: e.target.value,
                      }))
                    }
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="companyId">Company</Label>
                  <Select
                    value={formData.companyId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <UserSearch
                    users={users}
                    value={selectedAssignee}
                    onSelect={(user) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: user ? user.id || user.userId || "" : "",
                      }))
                    }
                    placeholder="Search by name or email..."
                    label="Assigned To"
                  />
                </div>
                <div className="col-span-full sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              {formErrorMessage && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{formErrorMessage}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingOpportunity
                    ? "Update Opportunity"
                    : "Create Opportunity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Opportunity Dialog */}
        <Dialog
          open={!!viewingOpportunity}
          onOpenChange={() => setViewingOpportunity(null)}
        >
          <DialogContent className="flex max-h-[min(calc(100dvh_-_2rem),calc(100vh_-_2rem))] max-w-2xl flex-col gap-0 overflow-hidden p-0">
            <div className="shrink-0 border-b px-6 pb-4 pt-6 pr-14">
              <DialogHeader>
                <DialogTitle>View Opportunity</DialogTitle>
                <DialogDescription>Opportunity details</DialogDescription>
              </DialogHeader>
            </div>

            {viewingOpportunity && (
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Title
                  </Label>
                  <p className="text-lg font-medium">
                    {viewingOpportunity.title}
                  </p>
                </div>
                {viewingOpportunity.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Description
                    </Label>
                    <p className="text-gray-900">
                      {viewingOpportunity.description}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Stage
                    </Label>
                    <Badge
                      className={CRMService.getOpportunityStageColor(
                        viewingOpportunity.stage,
                      )}
                    >
                      {viewingOpportunity.stage
                        .replace("_", " ")
                        .charAt(0)
                        .toUpperCase() +
                        viewingOpportunity.stage.replace("_", " ").slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Probability
                    </Label>
                    <p className="text-gray-900">
                      {viewingOpportunity.probability}%
                    </p>
                  </div>
                  {viewingOpportunity.amount && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Amount
                      </Label>
                      <p className="text-gray-900 font-medium">
                        {formatCurrency(viewingOpportunity.amount)}
                      </p>
                    </div>
                  )}
                  {viewingOpportunity.expectedCloseDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Expected Close Date
                      </Label>
                      <p className="text-gray-900">
                        {CRMService.formatDate(
                          viewingOpportunity.expectedCloseDate,
                        )}
                      </p>
                    </div>
                  )}
                  {viewingAssigneeLabel && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Assigned To
                      </Label>
                      <p className="text-gray-900">{viewingAssigneeLabel}</p>
                    </div>
                  )}
                </div>
                {viewingOpportunity.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Notes
                    </Label>
                    <p className="text-gray-900">{viewingOpportunity.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Created
                    </Label>
                    <p>{CRMService.formatDate(viewingOpportunity.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Updated
                    </Label>
                    <p>{CRMService.formatDate(viewingOpportunity.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setViewingOpportunity(null)}
              >
                Close
              </Button>
              {viewingOpportunity && canUpdate() && (
                <Button
                  onClick={() => {
                    setViewingOpportunity(null);
                    handleEdit(viewingOpportunity);
                  }}
                >
                  Edit Opportunity
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingOpportunity}
          onOpenChange={() => setDeletingOpportunity(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Opportunity</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;
                {deletingOpportunity?.title}&quot;? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeletingOpportunity(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Opportunity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
