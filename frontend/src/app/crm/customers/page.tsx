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
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { CountrySelect } from "@/src/components/ui/country-select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertCircle,
  Building2,
  Camera,
  CheckCircle,
  Edit,
  ExternalLink,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import crmService, {
  CustomerService,
  type Customer,
  type CustomerAttachment,
  type CustomerCreate,
  type CustomerStats,
  type CustomerUpdate,
  type Guarantor,
  type GuarantorCreate,
  type LabeledEmailItem,
  type LabeledPhoneItem,
} from "@/src/services/CRMService";
import {
  LabeledContactFields,
  defaultEmailRowsFromEntity,
  defaultPhoneRowsFromEntity,
} from "@/src/components/crm/LabeledContactFields";
import fileUploadService from "@/src/services/FileUploadService";
import { DashboardLayout } from "../../../components/layout";
import { toast } from "sonner";
import CustomerImportDialog from "../../../components/crm/CustomerImportDialog";
import { CreateCustomerDialog } from "@/src/components/crm/CreateCustomerDialog";
import { CustomerTypeNameFields } from "@/src/components/crm/CustomerTypeNameFields";
import {
  buildCustomerCreatePayload,
  getCustomerDisplayName,
  isBusinessPlaceholderLastName,
  validateCustomerNameFields,
} from "@/src/utils/customerUtils";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { Textarea } from "@/src/components/ui/textarea";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function CustomersPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <CustomersContent />
    </ModuleGuard>
  );
}

function CustomersContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "crm:customers",
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [formData, setFormData] = useState<CustomerCreate>({
    firstName: "",
    lastName: "",
    emails: [{ value: "", label: "personal" }] as LabeledEmailItem[],
    phones: [{ value: "", label: "work" }] as LabeledPhoneItem[],
    cnic: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    customerType: "individual",
    customerStatus: "active",
    creditLimit: undefined,
    currentBalance: undefined,
    paymentTerms: "Cash",
    tags: [],
    description: "",
    attachments: [] as CustomerAttachment[],
  });
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<
    string | null
  >(null);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [guarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [guarantorForm, setGuarantorForm] = useState<GuarantorCreate>({
    name: "",
    mobile: "",
    cnic: "",
    residential_address: "",
    official_address: "",
    occupation: "",
    relation: "",
  });
  const [editingGuarantorId, setEditingGuarantorId] = useState<string | null>(
    null,
  );
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const customerPhotoInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentFileInputEditRef = React.useRef<HTMLInputElement>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await CustomerService.getCustomers(
        skip,
        itemsPerPage,
        searchTerm || undefined,
        statusFilter === "all" ? undefined : statusFilter,
        typeFilter === "all" ? undefined : typeFilter,
      );
      const customersData = response.customers ?? [];
      const total = response.total ?? 0;
      setCustomers(customersData);
      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load customers"));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CustomerService.getCustomerStats();
      setStats(statsData);
    } catch (error: any) {}
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    const nameError = validateCustomerNameFields(
      formData.customerType,
      formData.firstName,
      formData.lastName,
    );
    if (nameError) {
      toast.error(nameError);
      return;
    }
    try {
      if (photoRemoved && selectedCustomer.image_url) {
        try {
          await CustomerService.deleteCustomerPhoto(selectedCustomer.id);
        } catch (e) {
          toast.warning(extractErrorMessage(e, "Photo could not be removed"));
        }
      }
      if (customerPhotoPreview) {
        try {
          await CustomerService.uploadCustomerPhoto(
            selectedCustomer.id,
            customerPhotoPreview,
          );
        } catch (e) {
          toast.warning(extractErrorMessage(e, "Photo upload failed"));
        }
      }
      const updatePayload: CustomerUpdate = buildCustomerCreatePayload(
        formData as CustomerCreate,
      );
      await CustomerService.updateCustomer(selectedCustomer.id, updatePayload);
      toast.success("Customer updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      loadCustomers();
      loadStats();
    } catch (error: any) {
      toast.error(extractErrorMessage(error, "Failed to update customer"));
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await CustomerService.deleteCustomer(customerId);
      toast.success("Customer deleted successfully");
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
      loadCustomers();
      loadStats();
    } catch (error: any) {
      toast.error(extractErrorMessage(error, "Failed to delete customer"));
    }
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      emails: [{ value: "", label: "personal" }],
      phones: [{ value: "", label: "work" }],
      cnic: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      customerType: "individual",
      customerStatus: "active",
      creditLimit: undefined,
      currentBalance: undefined,
      paymentTerms: "Cash",
      tags: [],
      description: "",
      attachments: [],
    });
    setSelectedCustomer(null);
    setCustomerPhotoPreview(null);
    setPhotoRemoved(false);
    setGuarantors([]);
  };

  const openEditDialog = async (customer: Customer) => {
    setSelectedCustomer(customer);
    const isBusiness = customer.customerType === "business";
    setFormData({
      firstName: customer.firstName,
      lastName:
        isBusiness && isBusinessPlaceholderLastName(customer.lastName)
          ? ""
          : customer.lastName,
      emails: defaultEmailRowsFromEntity(customer),
      phones: defaultPhoneRowsFromEntity(customer),
      cnic: customer.cnic || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "",
      postalCode: customer.postalCode || "",
      customerType: customer.customerType,
      customerStatus: customer.customerStatus,
      creditLimit: customer.creditLimit,
      currentBalance: customer.currentBalance,
      paymentTerms: customer.paymentTerms,
      tags: customer.tags,
      description: customer.description || "",
      attachments: customer.attachments || [],
    });
    setCustomerPhotoPreview(null);
    setPhotoRemoved(false);
    setIsEditDialogOpen(true);
    try {
      const list = await crmService.getGuarantors(customer.id);
      setGuarantors(list || []);
    } catch {
      setGuarantors([]);
    }
  };

  const handleCustomerPhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCustomerPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setPhotoRemoved(false);
  };

  const handleAttachmentFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentUploading(true);
    try {
      const res = await fileUploadService.uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          {
            url: res.file_url,
            original_filename: res.original_filename,
            s3_key: res.s3_key,
          },
        ],
      }));
      toast.success("File attached");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Upload failed"));
    } finally {
      setAttachmentUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachmentAt = async (index: number) => {
    const list = formData.attachments || [];
    const att = list[index];
    if (att) {
      const key = att.s3_key || fileUploadService.extractS3KeyFromUrl(att.url);
      if (key) {
        try {
          await fileUploadService.deleteFile(key);
        } catch {
          toast.warning("Removed from list; storage delete may have failed");
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddGuarantor = async () => {
    if (!selectedCustomer || !guarantorForm.name.trim()) return;
    try {
      const g = await crmService.createGuarantor(
        selectedCustomer.id,
        guarantorForm,
      );
      setGuarantors((prev) => [...prev, g]);
      setGuarantorForm(emptyGuarantorForm);
      setGuarantorDialogOpen(false);
      toast.success("Guarantor added");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to add guarantor"));
    }
  };

  const handleUpdateGuarantor = async () => {
    if (!editingGuarantorId) return;
    try {
      const updated = await crmService.updateGuarantor(
        editingGuarantorId,
        guarantorForm,
      );
      setGuarantors((prev) =>
        prev.map((g) => (g.id === editingGuarantorId ? updated : g)),
      );
      setEditingGuarantorId(null);
      setGuarantorForm(emptyGuarantorForm);
      setGuarantorDialogOpen(false);
      toast.success("Guarantor updated");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update guarantor"));
    }
  };

  const handleDeleteGuarantor = async (id: string) => {
    try {
      await crmService.deleteGuarantor(id);
      setGuarantors((prev) => prev.filter((g) => g.id !== id));
      toast.success("Guarantor removed");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to remove guarantor"));
    }
  };

  const emptyGuarantorForm: GuarantorCreate = {
    name: "",
    mobile: "",
    cnic: "",
    residential_address: "",
    official_address: "",
    occupation: "",
    relation: "",
  };

  const openAddGuarantor = () => {
    setGuarantorForm(emptyGuarantorForm);
    setEditingGuarantorId(null);
    setGuarantorDialogOpen(true);
  };

  const openEditGuarantor = (g: Guarantor) => {
    setGuarantorForm({
      name: g.name,
      mobile: g.mobile || "",
      cnic: g.cnic || "",
      residential_address: g.residential_address || "",
      official_address: g.official_address || "",
      occupation: g.occupation || "",
      relation: g.relation || "",
    });
    setEditingGuarantorId(g.id);
    setGuarantorDialogOpen(true);
  };

  const handleGuarantorDialogSubmit = () => {
    if (editingGuarantorId) handleUpdateGuarantor();
    else handleAddGuarantor();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      inactive: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      blocked: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      individual: { color: "bg-blue-100 text-blue-800", icon: User },
      business: { color: "bg-purple-100 text-purple-800", icon: Building2 },
    };
    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.individual;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">
              Manage your customer relationships and information
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canCreate() && (
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Customers
              </Button>
            )}
            {canCreate() && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
            <CreateCustomerDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onCreated={() => {
                loadCustomers();
                loadStats();
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.active_customers} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (stats.active_customers / stats.total_customers) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Individual Customers
                </CardTitle>
                <User className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.individual_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (stats.individual_customers / stats.total_customers) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Business Customers
                </CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.business_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (stats.business_customers / stats.total_customers) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, phone, CNIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              {totalCount > 0
                ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} customers`
                : "No customers found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No customers found. Create your first customer to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">
                          {customer.customerId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {getCustomerDisplayName(customer)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                const ev = (customer.emails || []).filter((e) =>
                                  e.value.trim(),
                                );
                                if (ev.length > 0) {
                                  return ev.map((e) => e.value).join(", ");
                                }
                                return customer.email || "—";
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {(() => {
                              const pv = (customer.phones || []).filter((p) =>
                                p.value.trim(),
                              );
                              const rows =
                                pv.length > 0
                                  ? pv
                                  : [
                                      ...(customer.phone
                                        ? [
                                            {
                                              value: customer.phone,
                                              label: "work" as const,
                                            },
                                          ]
                                        : []),
                                      ...(customer.mobile
                                        ? [
                                            {
                                              value: customer.mobile,
                                              label: "personal" as const,
                                            },
                                          ]
                                        : []),
                                    ];
                              return rows.map((p, i) => (
                                <div
                                  key={i}
                                  className="flex items-center text-sm flex-wrap gap-x-1"
                                >
                                  <Phone className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="text-muted-foreground text-xs">
                                    ({p.label})
                                  </span>
                                  {p.value}
                                </div>
                              ));
                            })()}
                            {customer.cnic && (
                              <div className="text-sm text-muted-foreground">
                                CNIC: {customer.cnic}
                              </div>
                            )}
                            {(customer.address || customer.city) && (
                              <div className="text-sm text-muted-foreground">
                                {customer.address && customer.address}
                                {customer.address && customer.city && ", "}
                                {customer.city}
                                {customer.state && `, ${customer.state}`}
                                {customer.postalCode &&
                                  ` ${customer.postalCode}`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(customer.customerType)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.customerStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">
                              Rs. {(customer.creditLimit ?? 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Balance: Rs.{" "}
                              {(customer.currentBalance ?? 0).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {canUpdate() && (
                                <DropdownMenuItem
                                  onClick={() => openEditDialog(customer)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {canDelete() && (
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(customer)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-4 pb-4 border-b">
              <div
                className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center bg-muted cursor-pointer overflow-hidden"
                onClick={() => customerPhotoInputRef.current?.click()}
              >
                {customerPhotoPreview ? (
                  <img
                    src={customerPhotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : photoRemoved ? (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                ) : selectedCustomer?.image_url ? (
                  <img
                    src={selectedCustomer.image_url}
                    alt="Customer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Customer photo
                </Label>
                <input
                  ref={customerPhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomerPhotoChange}
                />
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => customerPhotoInputRef.current?.click()}
                  >
                    Change
                  </Button>
                  {(selectedCustomer?.image_url || customerPhotoPreview) &&
                    !photoRemoved && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomerPhotoPreview(null);
                          setPhotoRemoved(true);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomerTypeNameFields
                customerType={formData.customerType || "individual"}
                firstName={formData.firstName}
                lastName={formData.lastName}
                typeFieldId="editCustomerType"
                firstNameFieldId="editFirstName"
                lastNameFieldId="editLastName"
                businessNameFieldId="editBusinessName"
                onCustomerTypeChange={(type) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerType: type,
                    ...(type === "business"
                      ? { lastName: "" }
                      : prev.customerType === "business"
                        ? { firstName: "", lastName: "" }
                        : {}),
                  }))
                }
                onFirstNameChange={(firstName) =>
                  setFormData((prev) => ({ ...prev, firstName }))
                }
                onLastNameChange={(lastName) =>
                  setFormData((prev) => ({ ...prev, lastName }))
                }
              />
              <LabeledContactFields
                emails={formData.emails || [{ value: "", label: "personal" }]}
                phones={formData.phones || [{ value: "", label: "work" }]}
                onEmailsChange={(emails) =>
                  setFormData({ ...formData, emails })
                }
                onPhonesChange={(phones) =>
                  setFormData({ ...formData, phones })
                }
              />
              <div>
                <Label htmlFor="editCnic">CNIC</Label>
                <Input
                  id="editCnic"
                  value={formData.cnic}
                  onChange={(e) =>
                    setFormData({ ...formData, cnic: e.target.value })
                  }
                  placeholder="12345-1234567-1"
                />
              </div>
              <div>
                <Label htmlFor="editCustomerStatus">Status</Label>
                <Select
                  value={formData.customerStatus}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      customerStatus: value as
                        | "active"
                        | "inactive"
                        | "blocked",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCreditLimit">Credit Limit</Label>
                <Input
                  id="editCreditLimit"
                  type="number"
                  value={formData.creditLimit ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditLimit:
                        e.target.value === ""
                          ? undefined
                          : parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <Label htmlFor="editPaymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      paymentTerms: value as
                        | "Credit"
                        | "Card"
                        | "Cash"
                        | "Due Payments",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Due Payments">Due Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="editAddress">Billing Address</Label>
                <Input
                  id="editAddress"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street address, building number"
                />
              </div>
              <div>
                <Label htmlFor="editCity">City</Label>
                <Input
                  id="editCity"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="editState">State/Province</Label>
                <Input
                  id="editState"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="Enter state/province"
                />
              </div>
              <div>
                <CountrySelect
                  value={formData.country}
                  onChange={(country) => setFormData({ ...formData, country })}
                  placeholder="Select country"
                />
              </div>
              <div>
                <Label htmlFor="editPostalCode">Postal Code</Label>
                <Input
                  id="editPostalCode"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                  placeholder="75000"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editTags">Tags (comma separated)</Label>
                <Input
                  id="editTags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="vip, regular, premium"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Notes or profile summary for this customer"
                  rows={4}
                  className="resize-y min-h-[80px]"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Attachments</Label>
                <input
                  ref={attachmentFileInputEditRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleAttachmentFile}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={attachmentUploading}
                    onClick={() => attachmentFileInputEditRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    {attachmentUploading ? "Uploading…" : "Add file"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX (max 10MB)
                  </span>
                </div>
                {(formData.attachments || []).length > 0 && (
                  <ul className="border rounded-md divide-y text-sm">
                    {(formData.attachments || []).map((att, idx) => (
                      <li
                        key={`${att.url}-${idx}`}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <span
                          className="truncate flex-1"
                          title={att.original_filename || att.url}
                        >
                          {att.original_filename || "Attachment"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center"
                            aria-label="Open file"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => removeAttachmentAt(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  Guarantors / Friends
                </Label>
                {canCreate() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openAddGuarantor}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> Add
                  </Button>
                )}
              </div>
              {guarantors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No guarantors added.
                </p>
              ) : (
                <div className="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>CNIC</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guarantors.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">
                            {g.name}
                          </TableCell>
                          <TableCell>{g.mobile || "-"}</TableCell>
                          <TableCell>{g.cnic || "-"}</TableCell>
                          <TableCell>{g.relation || "-"}</TableCell>
                          <TableCell>
                            {canUpdate() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditGuarantor(g)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {canDelete() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteGuarantor(g.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateCustomer}>Update Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={guarantorDialogOpen}
          onOpenChange={setGuarantorDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGuarantorId ? "Edit Guarantor" : "Add Guarantor"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={guarantorForm.name}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input
                  value={guarantorForm.mobile}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({ ...p, mobile: e.target.value }))
                  }
                  placeholder="03XX-XXXXXXX"
                />
              </div>
              <div>
                <Label>CNIC</Label>
                <Input
                  value={guarantorForm.cnic}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({ ...p, cnic: e.target.value }))
                  }
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </div>
              <div>
                <Label>Residential Address</Label>
                <Input
                  value={guarantorForm.residential_address}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({
                      ...p,
                      residential_address: e.target.value,
                    }))
                  }
                  placeholder="Address"
                />
              </div>
              <div>
                <Label>Official Address</Label>
                <Input
                  value={guarantorForm.official_address}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({
                      ...p,
                      official_address: e.target.value,
                    }))
                  }
                  placeholder="Office address"
                />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input
                  value={guarantorForm.occupation}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({
                      ...p,
                      occupation: e.target.value,
                    }))
                  }
                  placeholder="Job"
                />
              </div>
              <div>
                <Label>Relation</Label>
                <Input
                  value={guarantorForm.relation}
                  onChange={(e) =>
                    setGuarantorForm((p) => ({
                      ...p,
                      relation: e.target.value,
                    }))
                  }
                  placeholder="e.g. FRIEND"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setGuarantorDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGuarantorDialogSubmit}
                disabled={!guarantorForm.name.trim()}
              >
                {editingGuarantorId ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <strong>
                  {customerToDelete
                    ? getCustomerDisplayName(customerToDelete)
                    : ""}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
              <Button
                variant="outline"
                onClick={closeDeleteDialog}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  customerToDelete && handleDeleteCustomer(customerToDelete.id)
                }
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <CustomerImportDialog
          open={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportComplete={() => {
            loadCustomers();
            loadStats();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
