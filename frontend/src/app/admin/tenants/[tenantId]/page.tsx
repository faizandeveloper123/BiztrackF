"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SuperAdminGuard } from "@/src/components/guards/PermissionGuard";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { apiService } from "@/src/services/ApiService";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { DashboardLayout } from "../../../../components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Invoice } from "@/src/models/sales";
import {
  Building2,
  Users,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Package,
  FileText,
  CreditCard,
  Trash2,
  Eye,
  UserPlus,
  Plus,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface TenantDetails {
  tenant: {
    id: string;
    name: string;
    domain: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    settings: any;
  };
  subscription?: {
    id: string;
    isActive: boolean;
    status: string;
    startDate: string;
    endDate: string;
    plan: {
      id: string;
      name: string;
      description: string;
      planType: string;
      price: number;
      billingCycle: string;
      maxProjects: number;
      maxUsers: number;
      features: string[];
      modules: string[];
    };
  };
  users: Array<{
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    userRole: string;
    isActive: boolean;
    createdAt: string;
    lastLogin: string | null;
    tenantUserActive: boolean;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    issueDate: string;
    dueDate: string;
    createdAt: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  }>;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    createdAt: string;
  }>;
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalCustomers: number;
    totalInvoices: number;
    totalInvoiceValue: number;
    lastActivity: string;
  };
}

export default function TenantDetailsPage() {
  return (
    <SuperAdminGuard>
      <TenantDetailsContent />
    </SuperAdminGuard>
  );
}

function TenantDetailsContent() {
  const confirm = useConfirm();
  const params = useParams();
  const router = useRouter();
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  const tenantId = params.tenantId as string;

  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Invoice details modal state
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);

  // Delete tenant modal state
  const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
  const [deleteAllData, setDeleteAllData] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiService.get(
        `/admin/tenants/${tenantId}/complete`,
      );
      setTenantDetails(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to load tenant details"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTenantStatus = async () => {
    if (!tenantDetails) return;

    try {
      setActionLoading("toggle-status");
      await apiService.put(`/admin/tenants/${tenantId}/status`, {
        is_active: !tenantDetails.tenant.isActive,
      });
      await fetchTenantDetails(); // Refresh data
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to update tenant status"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const ok = await confirm({
      description: "Are you sure you want to remove this user from the tenant?",
      destructive: true,
      confirmLabel: "Remove",
    });
    if (!ok) return;

    try {
      setActionLoading(`delete-user-${userId}`);
      await apiService.delete(`/admin/tenants/${tenantId}/users/${userId}`);
      await fetchTenantDetails(); // Refresh data
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to remove user"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this invoice?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      setActionLoading(`delete-invoice-${invoiceId}`);
      await apiService.delete(
        `/admin/tenants/${tenantId}/invoices/${invoiceId}`,
      );
      await fetchTenantDetails(); // Refresh data
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete invoice"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewInvoiceDetails = async (invoiceId: string) => {
    setInvoiceDetailsLoading(true);
    try {
      const response = await apiService.get(
        `/admin/tenants/${tenantId}/invoices/${invoiceId}`,
      );
      setSelectedInvoice(response.invoice);
      setShowInvoiceDetails(true);
    } catch (error: any) {
      setError(extractErrorMessage(error, "Failed to load invoice details"));
    } finally {
      setInvoiceDetailsLoading(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenantDetails) return;

    setActionLoading("delete-tenant");
    try {
      await apiService.delete(`/admin/tenants/${tenantId}`, {
        data: {
          deleteAllData: deleteAllData,
        },
      });
      setShowDeleteTenantModal(false);
      setDeleteAllData(false);
      // Redirect to tenants list after successful deletion
      router.push("/admin/tenants");
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete tenant"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this project?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      setActionLoading(`delete-project-${projectId}`);
      await apiService.delete(
        `/admin/tenants/${tenantId}/projects/${projectId}`,
      );
      await fetchTenantDetails(); // Refresh data
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete project"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this customer?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      setActionLoading(`delete-customer-${customerId}`);
      await apiService.delete(
        `/admin/tenants/${tenantId}/customers/${customerId}`,
      );
      await fetchTenantDetails(); // Refresh data
    } catch (err: any) {
      setError(extractErrorMessage(err, "Failed to delete customer"));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "active":
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800";
      case "inactive":
      case "draft":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tenant details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tenantDetails) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <Card className="w-96 mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Error</CardTitle>
              <CardDescription className="text-center">
                {error || "Failed to load tenant details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/admin/tenants")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tenants
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/tenants")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tenants
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tenantDetails.tenant.name}
              </h1>
              <p className="text-gray-600">{tenantDetails.tenant.domain}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              className={
                tenantDetails.tenant.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {tenantDetails.tenant.isActive ? "Active" : "Inactive"}
            </Badge>
            <Button
              onClick={handleToggleTenantStatus}
              disabled={actionLoading === "toggle-status"}
              variant="outline"
              className="gap-2"
            >
              {actionLoading === "toggle-status" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : tenantDetails.tenant.isActive ? (
                <ToggleLeft className="h-4 w-4" />
              ) : (
                <ToggleRight className="h-4 w-4" />
              )}
              {tenantDetails.tenant.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              onClick={() => setShowDeleteTenantModal(true)}
              disabled={actionLoading === "delete-tenant"}
              variant="destructive"
              className="gap-2"
            >
              {actionLoading === "delete-tenant" ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Tenant
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantDetails.statistics.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                {tenantDetails.statistics.activeUsers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantDetails.statistics.totalProjects}
              </div>
              <p className="text-xs text-muted-foreground">Total projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantDetails.statistics.totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground">Total customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantDetails.statistics.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCurrencySymbol()}
                {tenantDetails.statistics.totalInvoiceValue.toLocaleString()}{" "}
                total value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tenant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Tenant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Name
                    </label>
                    <p className="text-lg">{tenantDetails.tenant.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Domain
                    </label>
                    <p className="text-lg">{tenantDetails.tenant.domain}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-lg">
                      {tenantDetails.tenant.description || "No description"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created
                    </label>
                    <p className="text-lg">
                      {new Date(
                        tenantDetails.tenant.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tenantDetails.subscription ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Plan
                        </label>
                        <p className="text-lg">
                          {tenantDetails.subscription.plan.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Type
                        </label>
                        <p className="text-lg">
                          {tenantDetails.subscription.plan.planType}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Price
                        </label>
                        <p className="text-lg">
                          {getCurrencySymbol()}
                          {tenantDetails.subscription.plan.price}/
                          {tenantDetails.subscription.plan.billingCycle}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Status
                        </label>
                        <Badge
                          className={
                            tenantDetails.subscription.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {tenantDetails.subscription.status === "active"
                            ? "Active"
                            : tenantDetails.subscription.status || "Inactive"}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No subscription found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({tenantDetails.users.length})
                  </span>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantDetails.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">
                            Role: {user.userRole}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={getStatusColor(
                            user.isActive ? "active" : "inactive",
                          )}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={actionLoading === `delete-user-${user.id}`}
                        >
                          {actionLoading === `delete-user-${user.id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tenantDetails.users.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No users found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoices ({tenantDetails.invoices.length})
                  </span>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Invoice
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantDetails.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">
                            #{invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.customerName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.customerEmail}
                          </p>
                          <p className="text-sm text-gray-500">
                            Issue Date:{" "}
                            {new Date(invoice.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">
                          {getCurrencySymbol()}
                          {invoice.total.toLocaleString()}
                        </p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoiceDetails(invoice.id)}
                          disabled={invoiceDetailsLoading}
                        >
                          {invoiceDetailsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          disabled={
                            actionLoading === `delete-invoice-${invoice.id}`
                          }
                        >
                          {actionLoading === `delete-invoice-${invoice.id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tenantDetails.invoices.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No invoices found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Projects ({tenantDetails.projects.length})
                  </span>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantDetails.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-500">
                            {project.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            Start:{" "}
                            {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          disabled={
                            actionLoading === `delete-project-${project.id}`
                          }
                        >
                          {actionLoading === `delete-project-${project.id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tenantDetails.projects.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No projects found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customers ({tenantDetails.customers.length})
                  </span>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tenantDetails.customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-500">
                            {customer.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.phone}
                          </p>
                          <p className="text-sm text-gray-500">
                            {customer.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          disabled={
                            actionLoading === `delete-customer-${customer.id}`
                          }
                        >
                          {actionLoading ===
                          `delete-customer-${customer.id}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tenantDetails.customers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No customers found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Tenant Confirmation Modal */}
      <Dialog
        open={showDeleteTenantModal}
        onOpenChange={setShowDeleteTenantModal}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Tenant</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this
              tenant?
            </DialogDescription>
          </DialogHeader>

          {tenantDetails && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">
                  Do you confirm deleting this tenant:{" "}
                  <span className="font-bold">{tenantDetails.tenant.name}</span>
                  ?
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deleteAllData"
                    checked={deleteAllData}
                    onCheckedChange={(checked: boolean) =>
                      setDeleteAllData(checked)
                    }
                  />
                  <label
                    htmlFor="deleteAllData"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Delete all users and complete data of this tenant
                  </label>
                </div>

                {deleteAllData && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Warning:</strong> This will permanently delete
                      all users, invoices, projects, customers, and all other
                      data associated with this tenant. This action cannot be
                      undone.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteTenantModal(false);
                setDeleteAllData(false);
              }}
              disabled={actionLoading === "delete-tenant"}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTenant}
              disabled={actionLoading === "delete-tenant"}
            >
              {actionLoading === "delete-tenant" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </div>
              ) : (
                "Delete Tenant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Modal */}
      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Invoice Details - #{selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Complete invoice information including items, parts, discounts,
              and taxes
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Invoice Information</span>
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Invoice Number:</span>
                      <p className="text-sm text-gray-600">
                        #{selectedInvoice.invoiceNumber}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Issue Date:</span>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedInvoice.issueDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Order Number:</span>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.orderNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedInvoice.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedInvoice.updatedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Customer Name:</span>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.customerName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.customerEmail}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.customerPhone || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Billing Address:</span>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedInvoice.billingAddress}
                      </p>
                    </div>
                    {selectedInvoice.shippingAddress && (
                      <div>
                        <span className="font-medium">Shipping Address:</span>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {selectedInvoice.shippingAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedInvoice.vehicleReg && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium">Registration:</span>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.vehicleReg}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Description</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Sale Price</th>
                          <th className="text-right p-2">Discount</th>
                          <th className="text-right p-2">Tax Rate</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={item.id || index} className="border-b">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">
                                  {item.description}
                                </p>
                                {item.productId && (
                                  <p className="text-xs text-gray-500">
                                    Product ID: {item.productId}
                                  </p>
                                )}
                                {item.projectId && (
                                  <p className="text-xs text-gray-500">
                                    Project ID: {item.projectId}
                                  </p>
                                )}
                                {item.taskId && (
                                  <p className="text-xs text-gray-500">
                                    Task ID: {item.taskId}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="text-right p-2">{item.quantity}</td>
                            <td className="text-right p-2">
                              {formatCurrency(item.salePrice)}
                            </td>
                            <td className="text-right p-2">{item.discount}%</td>
                            <td className="text-right p-2">{item.taxRate}%</td>
                            <td className="text-right p-2 font-medium">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {(selectedInvoice.vehicleReg || selectedInvoice.jobCardId) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Workshop Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedInvoice.vehicleReg && (
                      <div>
                        <span className="font-medium">Registration:</span>
                        <p className="text-sm text-gray-600">
                          {selectedInvoice.vehicleReg}
                        </p>
                      </div>
                    )}
                    {selectedInvoice.jobCardId && (
                      <div>
                        <span className="font-medium">Job Card:</span>
                        <p className="text-sm text-gray-600">
                          {selectedInvoice.jobCardId}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Invoice Totals */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      {selectedInvoice.labourCost ? (
                        <div className="flex justify-between">
                          <span>Labour Cost:</span>
                          <span>
                            {formatCurrency(selectedInvoice.labourCost)}
                          </span>
                        </div>
                      ) : null}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Paid:</span>
                        <span>
                          {formatCurrency(selectedInvoice.totalPaid || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance:</span>
                        <span>
                          {formatCurrency(
                            selectedInvoice.balance || selectedInvoice.total,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              {selectedInvoice.terms && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedInvoice.terms && (
                      <div>
                        <span className="font-medium">Terms & Conditions:</span>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {selectedInvoice.terms}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
