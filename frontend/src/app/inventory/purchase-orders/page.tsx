"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCachedApi } from "../../../hooks/useCachedApi";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  ClipboardList,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { inventoryService } from "../../../services/InventoryService";
import HRMService from "../../../services/HRMService";
import {
  PurchaseOrder,
  PurchaseOrderUpdate,
  PurchaseOrderStatus,
} from "../../../models/inventory";
import { DashboardLayout } from "../../../components/layout";
import { formatDate } from "../../../lib/utils";
import { getApiErrorMessage } from "../../../lib/apiError";
import { useCurrency } from "../../../contexts/CurrencyContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "sonner";
import PurchaseOrderModal from "../../../components/inventory/PurchaseOrderModal";
import PurchaseOrderViewModal from "../../../components/inventory/PurchaseOrderViewModal";
import { usePlanInfo } from "../../../hooks/usePlanInfo";
import { VehicleSearch } from "../../../components/ui/vehicle-search";
import { Vehicle } from "../../../models/workshop";
import {
  WorkshopDocumentLinks,
  WorkshopDocumentLinksValue,
} from "../../../components/workshop/WorkshopDocumentLinks";
import { SupplierFormDialog } from "../../../components/hrm/suppliers/SupplierFormDialog";
import {
  emptySupplierForm,
  validateSupplierForm,
} from "../../../components/hrm/suppliers/supplierUtils";
import type { SupplierFormData } from "../../../components/hrm/suppliers/types";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function PurchaseOrdersPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <Suspense fallback={null}>
        <PurchaseOrdersContent />
      </Suspense>
    </ModuleGuard>
  );
}

function PurchaseOrdersContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "inventory:purchase_orders",
  );
  const {} = useAuth();
  const { planInfo } = usePlanInfo();
  const isHealthcare = planInfo?.planType === "healthcare";
  const isWorkshop = planInfo?.planType === "workshop";
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prefill, setPrefill] = useState<{
    productId: string;
    quantity: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to reduce filtering operations
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Open the create modal pre-filled when arriving from a low-stock product
  useEffect(() => {
    const openAdd = searchParams.get("openAdd");
    const productId = searchParams.get("productId");
    if (openAdd === "1" && productId) {
      setPrefill({ productId, quantity: 1 });
      setIsAddModalOpen(true);
      router.replace("/inventory/purchase-orders", { scroll: false });
    }
  }, [searchParams, router]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Use cached API calls with longer TTL for static data
  const {
    data: suppliersData,
    loading: suppliersLoading,
    refetch: refetchSuppliers,
  } = useCachedApi(
    "suppliers",
    () => HRMService.getSuppliers(),
    { ttl: 15 * 60 * 1000 }, // 15 minutes cache for suppliers
  );

  const { data: warehousesData, loading: warehousesLoading } = useCachedApi(
    "warehouses",
    () => inventoryService.getWarehouses(),
    { ttl: 15 * 60 * 1000 },
  );

  const {
    data: purchaseOrdersData,
    loading: purchaseOrdersLoading,
    refetch: refetchPurchaseOrders,
  } = useCachedApi(
    "purchase-orders",
    () => inventoryService.getPurchaseOrders(),
    { ttl: 2 * 60 * 1000 },
  );

  const suppliers = suppliersData?.suppliers || [];
  const warehouses = warehousesData?.warehouses || [];
  const purchaseOrders = purchaseOrdersData?.purchaseOrders || [];
  const isDataLoading =
    purchaseOrdersLoading || suppliersLoading || warehousesLoading;
  const [editOrder, setEditOrder] = useState<PurchaseOrderUpdate>({
    orderNumber: "",
    batchNumber: "",
    supplierId: "",
    supplierName: "",
    warehouseId: "",
    orderDate: "",
    expectedDeliveryDate: "",
    notes: "",
    vehicleReg: "",
    purchaseForType: undefined,
    vehicleId: undefined,
    jobCardId: undefined,
    department: "",
    deliveryLocation: "",
    requisitionNumber: "",
  });
  const [editDocumentLinks, setEditDocumentLinks] =
    useState<WorkshopDocumentLinksValue>({});
  const [editSelectedVehicle, setEditSelectedVehicle] =
    useState<Vehicle | null>(null);
  const [isEditAddSupplierOpen, setIsEditAddSupplierOpen] = useState(false);
  const [editSupplierFormData, setEditSupplierFormData] =
    useState<SupplierFormData>(emptySupplierForm());
  const [isSavingEditSupplier, setIsSavingEditSupplier] = useState(false);

  const editOrderStatus = editOrder.status ?? PurchaseOrderStatus.DRAFT;
  const editRequiresDelivery =
    editOrderStatus !== PurchaseOrderStatus.ARRIVED &&
    editOrderStatus !== PurchaseOrderStatus.CANCELLED;

  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((order) => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.supplierName.toLowerCase().includes(searchLower) ||
        (order.vehicleReg &&
          order.vehicleReg.toLowerCase().includes(searchLower)) ||
        (order.department &&
          order.department.toLowerCase().includes(searchLower)) ||
        (order.deliveryLocation &&
          order.deliveryLocation.toLowerCase().includes(searchLower)) ||
        (order.requisitionNumber &&
          order.requisitionNumber.toLowerCase().includes(searchLower));

      const matchesStatus =
        statusFilter === "all" ||
        !statusFilter ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, debouncedSearchTerm, statusFilter]);

  const openViewModal = (order: PurchaseOrder) => {
    setViewingOrder(order);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingOrder(null);
  };

  const openDeleteModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    try {
      setDeleteLoading(true);
      await inventoryService.deletePurchaseOrder(selectedOrder.id);
      toast.success("Purchase order deleted successfully");
      refetchPurchaseOrders();
      closeDeleteModal();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to delete purchase order. Please try again.",
        ),
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updateData: PurchaseOrderUpdate = {
        status: newStatus as any,
      };

      await inventoryService.updatePurchaseOrder(orderId, updateData);
      toast.success(`Purchase order status updated to ${newStatus}`);
      refetchPurchaseOrders();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to update purchase order status. Please try again.",
        ),
      );
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setEditOrder({
      orderNumber: order.orderNumber,
      batchNumber: order.batchNumber || "",
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      warehouseId: order.warehouseId,
      orderDate: order.orderDate ? order.orderDate.split("T")[0] : "",
      expectedDeliveryDate: order.expectedDeliveryDate
        ? order.expectedDeliveryDate.split("T")[0]
        : "",
      status: order.status,
      notes: order.notes || "",
      vehicleReg: order.vehicleReg || "",
      purchaseForType: order.purchaseForType,
      vehicleId: order.vehicleId,
      jobCardId: order.jobCardId,
      department: order.department || "",
      deliveryLocation: order.deliveryLocation || "",
      requisitionNumber: order.requisitionNumber || "",
    });
    setEditDocumentLinks({
      jobCardId: order.jobCardId ?? undefined,
    });
    setEditSelectedVehicle(null);
    setIsEditModalOpen(true);
  };

  const openEditAddSupplier = () => {
    setEditSupplierFormData(emptySupplierForm());
    setIsEditAddSupplierOpen(true);
  };

  const handleEditSupplierFormChange = (
    field: keyof SupplierFormData,
    value: string | number | boolean | undefined,
  ) => {
    setEditSupplierFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateEditSupplier = async () => {
    const validationError = validateSupplierForm(editSupplierFormData);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsSavingEditSupplier(true);
    try {
      const response = await HRMService.createSupplier(editSupplierFormData);
      toast.success("Supplier created successfully");
      setIsEditAddSupplierOpen(false);
      setEditSupplierFormData(emptySupplierForm());
      refetchSuppliers();
      setEditOrder((prev) => ({
        ...prev,
        supplierId: response.supplier.id,
        supplierName: response.supplier.name,
      }));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create supplier"));
    } finally {
      setIsSavingEditSupplier(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    const editStatus = editOrder.status ?? PurchaseOrderStatus.DRAFT;
    const editRequiresDelivery =
      editStatus !== PurchaseOrderStatus.ARRIVED &&
      editStatus !== PurchaseOrderStatus.CANCELLED;

    if (
      !editOrder.supplierId ||
      !editOrder.warehouseId ||
      !editOrder.orderDate ||
      (editRequiresDelivery && !editOrder.expectedDeliveryDate)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const updatePayload: PurchaseOrderUpdate = { ...editOrder };
      if (!editRequiresDelivery) {
        delete updatePayload.expectedDeliveryDate;
      }
      if (!isHealthcare) {
        delete updatePayload.department;
        delete updatePayload.deliveryLocation;
        delete updatePayload.requisitionNumber;
        if (isWorkshop) {
          updatePayload.jobCardId = editDocumentLinks.jobCardId ?? null;
        }
        updatePayload.vehicleId =
          editOrder.purchaseForType === "vehicle" ? editOrder.vehicleId : null;
        if (editOrder.purchaseForType !== "vehicle") {
          updatePayload.vehicleReg = null;
        }
      } else {
        delete updatePayload.vehicleReg;
        delete updatePayload.purchaseForType;
        delete updatePayload.vehicleId;
        delete updatePayload.jobCardId;
      }
      await inventoryService.updatePurchaseOrder(
        selectedOrder.id,
        updatePayload,
      );
      toast.success("Purchase order updated successfully");
      setIsEditModalOpen(false);
      refetchPurchaseOrders();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to update purchase order. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = useMemo(() => {
    return function StatusBadge(status: string) {
      const statusConfig = {
        draft: { variant: "secondary", label: "Draft" },
        submitted: { variant: "default", label: "Submitted" },
        approved: { variant: "default", label: "Approved" },
        ordered: { variant: "default", label: "Ordered" },
        arrived: { variant: "default", label: "Arrived" },
        received: { variant: "default", label: "Received" },
        cancelled: { variant: "destructive", label: "Cancelled" },
      };

      const config =
        statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
      return <Badge variant={config.variant as any}>{config.label}</Badge>;
    };
  }, []);

  const summaryStats = useMemo(() => {
    const totalPOs = purchaseOrders.length;
    const pendingApproval = purchaseOrders.filter(
      (po) => po.status === "submitted",
    ).length;
    const totalValue = purchaseOrders.reduce(
      (sum, po) => sum + po.totalAmount,
      0,
    );
    const thisMonth = purchaseOrders.filter((po) => {
      const created = new Date(po.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;

    return { totalPOs, pendingApproval, totalValue, thisMonth };
  }, [purchaseOrders]);

  if (isDataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">
              {isHealthcare ? "Medical supplies orders" : "Purchase Orders"}
            </h1>
            <p className="text-muted-foreground">
              {isHealthcare
                ? "Raise and track purchase orders for wards, pharmacy, and clinical stock"
                : "Manage purchase orders and supplier procurement"}
            </p>
          </div>
          {canCreate() && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={
                    isHealthcare
                      ? "Search PO, supplier, department, location, requisition…"
                      : "Search by PO number or supplier name..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="arrived">Arrived</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPurchaseOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.orderNumber}</div>
                        {order.batchNumber && (
                          <div className="text-sm text-muted-foreground">
                            Batch: {order.batchNumber}
                          </div>
                        )}
                        {order.notes && (
                          <div className="text-sm text-muted-foreground truncate max-w-32">
                            {order.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {order.supplierName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {order.expectedDeliveryDate
                              ? formatDate(order.expectedDeliveryDate)
                              : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
{canUpdate() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                          {order.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(order.id, "ordered")
                              }
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                            >
                              Order
                            </Button>
                          )}
                          {order.status === "ordered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleStatusChange(order.id, "approved")
                              }
                              className="bg-green-50 hover:bg-green-100 text-green-700"
                            >
                              Approve
                            </Button>
                          )}
                          {canDelete() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No purchase orders found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search terms or filters"
                    : "Get started by creating your first purchase order"}
                </p>
                {!searchTerm && statusFilter === "all" && canCreate() && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Purchase Order
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalPOs}</div>
              <p className="text-xs text-muted-foreground">
                All purchase orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approval
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryStats.pendingApproval}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryStats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                All purchase orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Created this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Create Purchase Order Modal */}
        <PurchaseOrderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={refetchPurchaseOrders}
          title={
            isHealthcare
              ? "Create medical supplies purchase order"
              : "Create New Purchase Order"
          }
          showOrderDate={true}
          showSupplierCount={true}
          showAddSupplierButton={true}
          useToastNotifications={true}
          prefillProductId={prefill?.productId}
          prefillQuantity={prefill?.quantity ?? 1}
        />

        {/* View Purchase Order Modal */}
        <PurchaseOrderViewModal
          isOpen={isViewModalOpen}
          onClose={closeViewModal}
          purchaseOrder={viewingOrder}
        />

        {/* Delete Purchase Order Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Purchase Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete purchase order{" "}
                <strong>{selectedOrder?.orderNumber}</strong>? This action
                cannot be undone.
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
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Purchase Order Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-orderNumber">Order Number</Label>
                  <Input
                    id="edit-orderNumber"
                    value={editOrder.orderNumber}
                    disabled
                    className="bg-muted"
                    placeholder="Auto-generated"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-batchNumber">
                    {isHealthcare ? "Lot / batch reference" : "Batch Number"}
                  </Label>
                  <Input
                    id="edit-batchNumber"
                    value={editOrder.batchNumber}
                    onChange={(e) =>
                      setEditOrder((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                    placeholder={
                      isHealthcare
                        ? "e.g. cold chain lot, supplier batch"
                        : "Enter batch number"
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-orderDate">Order Date *</Label>
                  <Input
                    id="edit-orderDate"
                    type="date"
                    value={editOrder.orderDate}
                    onChange={(e) =>
                      setEditOrder((prev) => ({
                        ...prev,
                        orderDate: e.target.value,
                      }))
                    }
                  />
                </div>
                {editRequiresDelivery && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-expectedDeliveryDate">
                      Expected Delivery *
                    </Label>
                    <Input
                      id="edit-expectedDeliveryDate"
                      type="date"
                      value={editOrder.expectedDeliveryDate}
                      onChange={(e) =>
                        setEditOrder((prev) => ({
                          ...prev,
                          expectedDeliveryDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editOrder.status ?? PurchaseOrderStatus.DRAFT}
                    onValueChange={(value) =>
                      setEditOrder((prev) => {
                        const nextStatus = value as PurchaseOrderStatus;
                        const nextRequiresDelivery =
                          nextStatus !== PurchaseOrderStatus.ARRIVED &&
                          nextStatus !== PurchaseOrderStatus.CANCELLED;
                        return {
                          ...prev,
                          status: nextStatus,
                          expectedDeliveryDate: nextRequiresDelivery
                            ? prev.expectedDeliveryDate
                            : "",
                        };
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PurchaseOrderStatus.DRAFT}>
                        Draft
                      </SelectItem>
                      <SelectItem value={PurchaseOrderStatus.ORDERED}>
                        Ordered
                      </SelectItem>
                      <SelectItem value={PurchaseOrderStatus.ARRIVED}>
                        Arrived
                      </SelectItem>
                      <SelectItem value={PurchaseOrderStatus.CANCELLED}>
                        Cancelled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-warehouseId">
                  {isWorkshop ? "Garage / Warehouse *" : "Warehouse *"} (
                  {warehouses.length} available)
                </Label>
                <Select
                  value={editOrder.warehouseId}
                  onValueChange={(value) => {
                    setEditOrder((prev) => ({
                      ...prev,
                      warehouseId: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.length === 0 ? (
                      <SelectItem value="no-warehouses" disabled>
                        No warehouses available
                      </SelectItem>
                    ) : (
                      warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplierId">
                  Supplier * ({suppliers.length} available)
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={editOrder.supplierId}
                    onValueChange={(value) => {
                      const supplier = suppliers.find((s) => s.id === value);
                      setEditOrder((prev) => ({
                        ...prev,
                        supplierId: value,
                        supplierName: supplier?.name || "",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <SelectItem value="no-suppliers" disabled>
                          No suppliers available
                        </SelectItem>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openEditAddSupplier}
                    className="whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </div>
              </div>

              {isHealthcare && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Input
                      id="edit-department"
                      value={editOrder.department ?? ""}
                      onChange={(e) =>
                        setEditOrder((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      placeholder="e.g. Pharmacy, ICU"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-deliveryLocation">
                      Delivery location
                    </Label>
                    <Input
                      id="edit-deliveryLocation"
                      value={editOrder.deliveryLocation ?? ""}
                      onChange={(e) =>
                        setEditOrder((prev) => ({
                          ...prev,
                          deliveryLocation: e.target.value,
                        }))
                      }
                      placeholder="e.g. Main store, Ward 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-requisitionNumber">
                      Internal requisition #
                    </Label>
                    <Input
                      id="edit-requisitionNumber"
                      value={editOrder.requisitionNumber ?? ""}
                      onChange={(e) =>
                        setEditOrder((prev) => ({
                          ...prev,
                          requisitionNumber: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {!isHealthcare && (
                <>
                  <div className="space-y-2">
                    <Label>Purchase for</Label>
                    <Select
                      value={editOrder.purchaseForType || "none"}
                      onValueChange={(v) => {
                        const purchaseForType =
                          v === "none"
                            ? undefined
                            : (v as "vehicle" | "garage");
                        setEditOrder((prev) => ({
                          ...prev,
                          purchaseForType,
                          vehicleId:
                            purchaseForType === "vehicle"
                              ? prev.vehicleId
                              : undefined,
                          vehicleReg:
                            purchaseForType === "vehicle"
                              ? prev.vehicleReg
                              : "",
                        }));
                        if (v !== "vehicle") {
                          setEditSelectedVehicle(null);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="vehicle">
                          Existing vehicle
                        </SelectItem>
                        <SelectItem value="garage">Garage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editOrder.purchaseForType === "vehicle" && (
                    <>
                      <div className="space-y-2">
                        <VehicleSearch
                          label="Vehicle"
                          value={editSelectedVehicle}
                          onSelect={(v) => {
                            setEditSelectedVehicle(v);
                            if (v) {
                              setEditOrder((prev) => ({
                                ...prev,
                                vehicleId: v.id,
                                vehicleReg: v.registration_number ?? "",
                              }));
                            }
                          }}
                          placeholder="Search by reg, VIN, make, model..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-vehicleReg">
                          Vehicle Registration
                        </Label>
                        <Input
                          id="edit-vehicleReg"
                          value={editOrder.vehicleReg ?? ""}
                          onChange={(e) =>
                            setEditOrder((prev) => ({
                              ...prev,
                              vehicleReg: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                  {editOrder.purchaseForType === "garage" && (
                    <p className="text-sm text-muted-foreground">
                      Parts will be delivered to the selected garage/warehouse
                      above.
                    </p>
                  )}
                </>
              )}

              {isWorkshop && (
                <WorkshopDocumentLinks
                  excludeType="purchase_order"
                  value={editDocumentLinks}
                  onChange={setEditDocumentLinks}
                />
              )}

              {selectedOrder && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Order Total</Label>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <div className="font-medium">
                      {formatCurrency(selectedOrder.totalAmount || 0)}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editOrder.notes}
                  onChange={(e) =>
                    setEditOrder((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Enter order notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateOrder} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Purchase Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SupplierFormDialog
          open={isEditAddSupplierOpen}
          editingSupplier={null}
          formData={editSupplierFormData}
          submitting={isSavingEditSupplier}
          onOpenChange={setIsEditAddSupplierOpen}
          onFormChange={handleEditSupplierFormChange}
          onSubmit={handleCreateEditSupplier}
          onCancel={() => setIsEditAddSupplierOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
