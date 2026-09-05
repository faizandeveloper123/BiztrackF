"use client";

import React, { useEffect, useState } from "react";
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
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Building2,
  ClipboardList,
  Package,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { inventoryService } from "../../../services/InventoryService";
import {
  Receiving,
  ReceivingCreate,
  ReceivingStatus,
  ReceivingUpdate,
  PurchaseOrder,
  Warehouse,
} from "../../../models/inventory";
import { DashboardLayout } from "../../../components/layout";
import { formatDate } from "../../../lib/utils";
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
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function ReceivingPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <ReceivingContent />
    </ModuleGuard>
  );
}

function ReceivingContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "inventory:receiving",
  );
  const {} = useAuth();
  const [receivings, setReceivings] = useState<Receiving[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewReceiving, setViewReceiving] = useState<Receiving | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [editReceiving, setEditReceiving] = useState<Receiving | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedReceiving, setSelectedReceiving] = useState<Receiving | null>(
    null,
  );
  const [newReceiving, setNewReceiving] = useState<ReceivingCreate>({
    receivingNumber: "",
    purchaseOrderId: "",
    warehouseId: "",
    receivedDate: "",
    notes: "",
    items: [],
  });
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receivingsResponse, purchaseOrdersResponse, warehousesResponse] =
        await Promise.all([
          inventoryService.getReceivings(),
          inventoryService.getPurchaseOrders(),
          inventoryService.getWarehouses(),
        ]);
      setReceivings(receivingsResponse.receivings);
      setPurchaseOrders(purchaseOrdersResponse.purchaseOrders);
      setWarehouses(warehousesResponse.warehouses);

      // Set default warehouse if available
      if (
        warehousesResponse.warehouses.length > 0 &&
        !newReceiving.warehouseId
      ) {
        setNewReceiving((prev) => ({
          ...prev,
          warehouseId: warehousesResponse.warehouses[0].id,
        }));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredReceivings = receivings.filter((receiving) => {
    const matchesSearch =
      receiving.receivingNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receiving.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      !statusFilter ||
      receiving.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openDeleteModal = (receiving: Receiving) => {
    setSelectedReceiving(receiving);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedReceiving(null);
  };

  const handleDelete = async () => {
    if (!selectedReceiving) return;

    try {
      setDeleteLoading(true);
      await inventoryService.deleteReceiving(selectedReceiving.id);
      toast.success("Receiving deleted successfully");
      fetchData();
      closeDeleteModal();
    } catch (error) {
      toast.error("Failed to delete receiving. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePurchaseOrderChange = (poId: string) => {
    const po = purchaseOrders.find((order) => order.id === poId);
    setSelectedPO(po || null);
    setNewReceiving((prev) => ({
      ...prev,
      purchaseOrderId: poId,
      items: [],
    }));
  };

  const handleReceivedQuantityChange = (index: number, quantity: number) => {
    setNewReceiving((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, receivedQuantity: quantity } : item,
      ),
    }));
  };

  const handleProcessReceiving = async () => {
    if (
      !newReceiving.purchaseOrderId ||
      !newReceiving.warehouseId ||
      !newReceiving.receivedDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (newReceiving.items.length > 0) {
      const invalidItems = newReceiving.items.filter(
        (item) => item.receivedQuantity > item.quantity,
      );

      if (invalidItems.length > 0) {
        toast.error("Received quantities cannot exceed ordered quantities");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await inventoryService.createReceiving(newReceiving);
      toast.success("Receiving processed successfully");
      setIsProcessModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to process receiving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewReceiving({
      receivingNumber: "",
      warehouseId: warehouses.length > 0 ? warehouses[0].id : "",
      receivedDate: new Date().toISOString().split("T")[0], // Today's date
      purchaseOrderId: "",
      notes: "",
      items: [],
    });
    setSelectedPO(null);
  };

  const poLabel = (poId: string) =>
    purchaseOrders.find((p) => p.id === poId)?.orderNumber ?? poId;

  const warehouseLabel = (warehouseId: string) =>
    warehouses.find((w) => w.id === warehouseId)?.name ?? warehouseId;

  const openViewModal = async (receiving: Receiving) => {
    setIsViewModalOpen(true);
    setViewLoading(true);
    setViewReceiving(receiving);
    try {
      const res = await inventoryService.getReceiving(receiving.id);
      setViewReceiving(res.receiving);
    } catch {
      toast.error("Failed to load receiving details");
      setIsViewModalOpen(false);
      setViewReceiving(null);
    } finally {
      setViewLoading(false);
    }
  };

  const openEditModal = async (receiving: Receiving) => {
    setIsEditModalOpen(true);
    setEditSaving(false);
    try {
      const res = await inventoryService.getReceiving(receiving.id);
      const r = res.receiving;
      setEditReceiving(r);
      setEditNotes(r.notes ?? "");
      setEditStatus(String(r.status));
    } catch {
      toast.error("Failed to load receiving for edit");
      setIsEditModalOpen(false);
      setEditReceiving(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editReceiving) return;
    try {
      setEditSaving(true);
      const payload: ReceivingUpdate = {
        notes: editNotes,
        status: editStatus as ReceivingStatus,
      };
      await inventoryService.updateReceiving(editReceiving.id, payload);
      toast.success("Receiving updated");
      setIsEditModalOpen(false);
      setEditReceiving(null);
      fetchData();
    } catch {
      toast.error("Failed to update receiving");
    } finally {
      setEditSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
      partial: { variant: "outline", label: "Partial" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold tracking-tight">Receiving</h1>
            <p className="text-muted-foreground">
              Manage incoming shipments and process received goods
            </p>
          </div>
          {canCreate() && (
            <Button onClick={() => setIsProcessModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Process Receiving
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
                  placeholder="Search by receiving number or notes..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Receivings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Receiving List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReceivings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receiving #</TableHead>
                    <TableHead>Purchase Order</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivings.map((receiving) => (
                    <TableRow key={receiving.id}>
                      <TableCell>
                        <div className="font-medium">
                          {receiving.receivingNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            PO: {poLabel(receiving.purchaseOrderId)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{warehouseLabel(receiving.warehouseId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(receiving.receivedDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(receiving.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate">
                          {receiving.notes || "No notes"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(receiving.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(receiving)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
{canUpdate() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(receiving)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(receiving)}
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
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  No receivings found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search terms or filters"
                    : "Get started by processing your first receiving"}
                </p>
                {!searchTerm && statusFilter === "all" && canCreate() && (
                  <Button onClick={() => setIsProcessModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Process Receiving
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
              <CardTitle className="text-sm font-medium">
                Total Receivings
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receivings.length}</div>
              <p className="text-xs text-muted-foreground">All receivings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {receivings.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {receivings.filter((r) => r.status === "in_progress").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {receivings.filter((r) => r.status === "completed").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully received
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Process Receiving Modal */}
        <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Process Incoming Receiving</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderId">Purchase Order *</Label>
                  <Select
                    value={newReceiving.purchaseOrderId}
                    onValueChange={handlePurchaseOrderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders
                        .filter(
                          (po) =>
                            po.status === "ordered" || po.status === "approved",
                        )
                        .map((po) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.orderNumber} - {po.supplierName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseId">Warehouse *</Label>
                  <Select
                    value={newReceiving.warehouseId}
                    onValueChange={(value) =>
                      setNewReceiving((prev) => ({
                        ...prev,
                        warehouseId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate">Received Date *</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={newReceiving.receivedDate}
                  onChange={(e) =>
                    setNewReceiving((prev) => ({
                      ...prev,
                      receivedDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newReceiving.notes}
                  onChange={(e) =>
                    setNewReceiving((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Enter receiving notes"
                  rows={3}
                />
              </div>

              {/* Purchase Order Items */}
              {selectedPO && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium">
                      Receiving Items from PO: {selectedPO.orderNumber}
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Supplier: {selectedPO.supplierName}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {newReceiving.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {item.sku}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Unit Cost: {item.unitCost}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Ordered Quantity</Label>
                            <div className="text-sm font-medium">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">
                              Received Quantity *
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.receivedQuantity}
                              onChange={(e) =>
                                handleReceivedQuantityChange(
                                  index,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              placeholder="Qty received"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Total Value</Label>
                            <div className="text-sm font-medium">
                              {(item.receivedQuantity * item.unitCost).toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsProcessModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessReceiving}
                disabled={
                  isSubmitting ||
                  !newReceiving.purchaseOrderId ||
                  !newReceiving.warehouseId ||
                  !newReceiving.receivedDate
                }
              >
                {isSubmitting ? "Processing..." : "Process Receiving"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isViewModalOpen}
          onOpenChange={(open) => {
            setIsViewModalOpen(open);
            if (!open) setViewReceiving(null);
          }}
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Receiving {viewReceiving?.receivingNumber ?? ""}
              </DialogTitle>
              <DialogDescription>
                Incoming shipment details and line items
              </DialogDescription>
            </DialogHeader>
            {viewLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : viewReceiving ? (
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Purchase order
                    </Label>
                    <p className="font-medium">
                      {poLabel(viewReceiving.purchaseOrderId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Warehouse</Label>
                    <p className="font-medium">
                      {warehouseLabel(viewReceiving.warehouseId)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Received date
                    </Label>
                    <p className="font-medium">
                      {formatDate(viewReceiving.receivedDate)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(viewReceiving.status)}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">
                      {viewReceiving.notes?.trim() ? viewReceiving.notes : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="text-sm">
                      {formatDate(viewReceiving.createdAt)}
                    </p>
                  </div>
                </div>

                {viewReceiving.items && viewReceiving.items.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Line items
                    </Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Ordered</TableHead>
                          <TableHead className="text-right">Received</TableHead>
                          <TableHead className="text-right">
                            Unit cost
                          </TableHead>
                          <TableHead className="text-right">
                            Line total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewReceiving.items.map((item, idx) => (
                          <TableRow key={`${item.productId}-${idx}`}>
                            <TableCell className="font-medium">
                              {item.productName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.sku}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.receivedQuantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.unitCost}
                            </TableCell>
                            <TableCell className="text-right">
                              {(
                                (item.receivedQuantity ?? 0) *
                                (item.unitCost ?? 0)
                              ).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No line items</p>
                )}
              </div>
            ) : null}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setEditReceiving(null);
              setEditNotes("");
              setEditStatus("");
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Edit receiving {editReceiving?.receivingNumber ?? ""}
              </DialogTitle>
              <DialogDescription>
                Update status and notes for this receiving record
              </DialogDescription>
            </DialogHeader>
            {editReceiving ? (
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveEdit()}
                disabled={editSaving || !editReceiving}
              >
                {editSaving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Receiving</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete receiving{" "}
                <strong>{selectedReceiving?.receivingNumber}</strong>? This
                action cannot be undone.
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
      </div>
    </DashboardLayout>
  );
}
