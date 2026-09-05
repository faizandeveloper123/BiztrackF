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
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Globe,
  Phone,
  MapPin,
} from "lucide-react";
import CRMService from "@/src/services/CRMService";
import { toast } from "sonner";
import {
  Company,
  Industry,
  CompanySize,
  CRMCompanyFilters,
  CompanyCreate,
} from "@/src/models/crm";
import { DashboardLayout } from "../../../components/layout";
import { useCustomOptions } from "../../../hooks/useCustomOptions";
import { CustomOptionDialog } from "../../../components/common/CustomOptionDialog";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function CRMCompaniesPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <CRMCompaniesContent />
    </ModuleGuard>
  );
}

function CRMCompaniesContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "crm:companies",
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CRMCompanyFilters>({});
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCustomIndustryDialog, setShowCustomIndustryDialog] =
    useState(false);

  // Custom options hook
  const {
    customIndustries,
    createCustomIndustry,
    loading: customOptionsLoading,
  } = useCustomOptions();

  const [formData, setFormData] = useState<CompanyCreate>({
    name: "",
    industry: undefined,
    size: undefined,
    website: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    description: "",
    notes: "",
    tags: [],
    isActive: true,
    annualRevenue: undefined,
    employeeCount: undefined,
    foundedYear: undefined,
  });

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CRMService.getCompanies(filters, 1, 100);
      setCompanies(response.companies);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSearch = () => {
    setFilters((prev: CRMCompanyFilters) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch("");
  };

  const handleCreateCustomIndustry = async (
    name: string,
    description: string,
  ) => {
    try {
      await createCustomIndustry(name, description);
    } catch (error) {}
  };

  const resetForm = () => {
    setFormData({
      name: "",
      industry: undefined,
      size: undefined,
      website: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      description: "",
      notes: "",
      tags: [],
      isActive: true,
      annualRevenue: undefined,
      employeeCount: undefined,
      foundedYear: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCompany) {
        await CRMService.updateCompany(editingCompany.id, formData);
        setSuccessMessage("Company updated successfully!");
        setShowCreateDialog(false);
        setEditingCompany(null);
        resetForm();
        loadCompanies();
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        await CRMService.createCompany(formData);
        setSuccessMessage("Company created successfully!");
        setShowCreateDialog(false);
        resetForm();
        loadCompanies();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Error saving company. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({
      name: company.name,
      industry: company.industry,
      size: company.size,
      website: company.website || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      country: company.country || "",
      postalCode: company.postalCode || "",
      description: company.description || "",
      notes: company.notes || "",
      tags: company.tags || [],
      isActive: company.isActive,
      annualRevenue: company.annualRevenue,
      employeeCount: company.employeeCount,
      foundedYear: company.foundedYear,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (company: Company) => {
    setDeletingCompany(company);
  };

  const confirmDelete = async () => {
    if (!deletingCompany) return;

    setDeleting(true);
    try {
      await CRMService.deleteCompany(deletingCompany.id);
      setSuccessMessage("Company deleted successfully!");
      setDeletingCompany(null);
      loadCompanies();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Error deleting company. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (company: Company) => {
    setViewingCompany(company);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading Companies...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Companies</h1>
            <p className="text-gray-600">
              Manage your company database and relationships
            </p>
            {successMessage && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">{successMessage}</p>
              </div>
            )}
          </div>
          {canCreate() && (
            <Button
              onClick={() => {
                setEditingCompany(null);
                resetForm();
                setErrorMessage("");
                setSuccessMessage("");
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Company
            </Button>
          )}
        </div>

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
                    placeholder="Search companies..."
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
                <label className="text-sm font-medium">Industry</label>
                <Select
                  value={filters.industry || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: CRMCompanyFilters) => ({
                      ...prev,
                      industry:
                        value === "all" ? undefined : (value as Industry),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {Object.values(Industry).map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry.charAt(0).toUpperCase() + industry.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Size</label>
                <Select
                  value={filters.size || "all"}
                  onValueChange={(value) =>
                    setFilters((prev: CRMCompanyFilters) => ({
                      ...prev,
                      size:
                        value === "all" ? undefined : (value as CompanySize),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    {Object.values(CompanySize).map((size) => (
                      <SelectItem key={size} value={size}>
                        {size.charAt(0).toUpperCase() + size.slice(1)}
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

        {/* Companies List */}
        <Card>
          <CardHeader>
            <CardTitle>Companies ({companies.length})</CardTitle>
            <CardDescription>
              Manage your company database and track business relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">
                            {company.industry && (
                              <span className="mr-2">{company.industry}</span>
                            )}
                            {company.size && <span>• {company.size}</span>}
                          </div>
                        </div>
                      </div>
                      {company.website && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Globe className="w-4 h-4" />
                          <span>{company.website}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {company.industry && (
                        <Badge variant="outline">
                          {company.industry.charAt(0).toUpperCase() +
                            company.industry.slice(1)}
                        </Badge>
                      )}
                      {company.size && (
                        <Badge variant="secondary">
                          {company.size.charAt(0).toUpperCase() +
                            company.size.slice(1)}
                        </Badge>
                      )}
                      <Badge
                        variant={company.isActive ? "default" : "secondary"}
                      >
                        {company.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {company.description && (
                      <div className="text-sm text-gray-600 mt-2">
                        {company.description}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        Created: {CRMService.formatDate(company.createdAt)}
                      </span>
                      {company.city && company.state && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {company.city}, {company.state}
                          </span>
                        </div>
                      )}
                      {company.employeeCount && (
                        <span>{company.employeeCount} employees</span>
                      )}
                      {company.annualRevenue && (
                        <span>
                          Revenue:{" "}
                          {CRMService.formatCurrency(company.annualRevenue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(company)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canUpdate() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(company)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(company)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Company Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Edit Company" : "Create New Company"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry || "all"}
                    onValueChange={(value) => {
                      if (value === "create_new") {
                        setShowCustomIndustryDialog(true);
                      } else {
                        setFormData({
                          ...formData,
                          industry:
                            value === "all" ? undefined : (value as Industry),
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Industry</SelectItem>
                      {Object.values(Industry).map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry.charAt(0).toUpperCase() + industry.slice(1)}
                        </SelectItem>
                      ))}

                      {/* Custom Industries */}
                      {customIndustries &&
                        customIndustries.length > 0 &&
                        customIndustries.map((customIndustry) => (
                          <SelectItem
                            key={customIndustry.id}
                            value={customIndustry.id}
                          >
                            {customIndustry.name}
                          </SelectItem>
                        ))}

                      <SelectItem
                        value="create_new"
                        className="font-semibold text-blue-600"
                      >
                        + Create New Industry
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="size">Company Size</Label>
                  <Select
                    value={formData.size || "all"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        size:
                          value === "all" ? undefined : (value as CompanySize),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Size</SelectItem>
                      {Object.values(CompanySize).map((size) => (
                        <SelectItem key={size} value={size}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Business St"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Country"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="12345"
                  />
                </div>

                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    value={formData.annualRevenue || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annualRevenue: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="1000000"
                    type="number"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <Label htmlFor="employeeCount">Employee Count</Label>
                  <Input
                    id="employeeCount"
                    value={formData.employeeCount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeCount: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="50"
                    type="number"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    value={formData.foundedYear || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        foundedYear: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="2020"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the company"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes about the company"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          ? e.target.value.split(",").map((tag) => tag.trim())
                          : [],
                      })
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === "active" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingCompany(null);
                    resetForm();
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingCompany
                      ? "Update Company"
                      : "Create Company"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Company Dialog */}
        <Dialog
          open={!!viewingCompany}
          onOpenChange={() => setViewingCompany(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Company Details</DialogTitle>
            </DialogHeader>

            {viewingCompany && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Company Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {viewingCompany.name}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Industry
                    </Label>
                    <p>
                      {viewingCompany.industry
                        ? viewingCompany.industry.charAt(0).toUpperCase() +
                          viewingCompany.industry.slice(1)
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Company Size
                    </Label>
                    <p>
                      {viewingCompany.size
                        ? viewingCompany.size.charAt(0).toUpperCase() +
                          viewingCompany.size.slice(1)
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Website
                    </Label>
                    <p>{viewingCompany.website || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone
                    </Label>
                    <p>{viewingCompany.phone || "Not specified"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Address
                    </Label>
                    <p>{viewingCompany.address || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      City
                    </Label>
                    <p>{viewingCompany.city || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      State/Province
                    </Label>
                    <p>{viewingCompany.state || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Country
                    </Label>
                    <p>{viewingCompany.country || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Postal Code
                    </Label>
                    <p>{viewingCompany.postalCode || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Annual Revenue
                    </Label>
                    <p>
                      {viewingCompany.annualRevenue
                        ? CRMService.formatCurrency(
                            viewingCompany.annualRevenue,
                          )
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Employee Count
                    </Label>
                    <p>{viewingCompany.employeeCount || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Founded Year
                    </Label>
                    <p>{viewingCompany.foundedYear || "Not specified"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Description
                    </Label>
                    <p>{viewingCompany.description || "Not specified"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Notes
                    </Label>
                    <p>{viewingCompany.notes || "Not specified"}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingCompany.tags && viewingCompany.tags.length > 0 ? (
                        viewingCompany.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p>No tags</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge
                      variant={
                        viewingCompany.isActive ? "default" : "secondary"
                      }
                    >
                      {viewingCompany.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Created
                    </Label>
                    <p>{CRMService.formatDate(viewingCompany.createdAt)}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </Label>
                    <p>{CRMService.formatDate(viewingCompany.updatedAt)}</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewingCompany(null)}
                  >
                    Close
                  </Button>
                  {canUpdate() && (
                    <Button
                      type="button"
                      onClick={() => {
                        setViewingCompany(null);
                        handleEdit(viewingCompany);
                      }}
                    >
                      Edit Company
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingCompany}
          onOpenChange={() => setDeletingCompany(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
            </DialogHeader>

            {deletingCompany && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to delete{" "}
                  <strong>&quot;{deletingCompany.name}&quot;</strong>? This
                  action cannot be undone.
                </p>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeletingCompany(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Company"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom Industry Dialog */}
        <CustomOptionDialog
          open={showCustomIndustryDialog}
          onOpenChange={setShowCustomIndustryDialog}
          title="Create New Industry"
          description="Create a custom industry that will be available for your tenant."
          optionName="Industry"
          placeholder="e.g., Fintech, EdTech"
          onSubmit={handleCreateCustomIndustry}
          loading={customOptionsLoading.industry}
        />
      </div>
    </DashboardLayout>
  );
}
