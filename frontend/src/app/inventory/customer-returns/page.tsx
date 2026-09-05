"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Package,
  TrendingUp,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { inventoryService } from "../../../services/InventoryService";
import {
  StockMovement,
  StockMovementStatus,
  StockMovementCreate,
  StockMovementType,
  Warehouse,
} from "../../../models/inventory";
import { DashboardLayout } from "../../../components/layout";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { apiService } from "../../../services/ApiService";
import { Product } from "../../../models/pos";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function CustomerReturnsPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <CustomerReturnsContent />
    </ModuleGuard>
  );
}

function CustomerReturnsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "inventory:customer_returns",
  );
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [returns, setReturns] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedReturn, setSelectedReturn] = useState<StockMovement | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecordReturnOpen, setIsRecordReturnOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<StockMovement | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editReturn, setEditReturn] = useState<StockMovementCreate>({
    productId: "",
    warehouseId: "",
    locationId: "",
    movementType: StockMovementType.RETURN,
    quantity: 0,
    unitCost: 0,
    referenceNumber: "",
    referenceType: "customer_return",
    notes: "",
    batchNumber: "",
    serialNumber: "",
    expiryDate: "",
  });
  const [newReturn, setNewReturn] = useState<StockMovementCreate>({
    productId: "",
    warehouseId: "",
    locationId: "",
    movementType: StockMovementType.RETURN,
    quantity: 0,
    unitCost: 0,
    referenceNumber: "",
    referenceType: "customer_return",
    notes: "",
    batchNumber: "",
    serialNumber: "",
    expiryDate: "",
  });

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadReturns();
      loadWarehouses();
      loadProducts();
    }
  }, [mounted, isAuthenticated, warehouseFilter, statusFilter]);

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.getWarehouses();
      setWarehouses(response.warehouses);
      if (response.warehouses.length > 0 && !newReturn.warehouseId) {
        setNewReturn((prev) => ({
          ...prev,
          warehouseId: response.warehouses[0].id,
        }));
      }
    } catch (error) {}
  };

  const loadProducts = async () => {
    try {
      const response = await apiService.get("/pos/products");
      setProducts(response.products || []);
    } catch (error) {}
  };

  const loadReturns = async () => {
    try {
      setLoading(true);
      const warehouseId =
        warehouseFilter === "all" ? undefined : warehouseFilter;
      const response = await inventoryService.getCustomerReturns(warehouseId);
      setReturns(response.stockMovements);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter((returnItem) => {
    const matchesSearch =
      returnItem.productName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      returnItem.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.batchNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      returnItem.referenceNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      statusFilter === "all" ||
      returnItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRefundValue = returns.reduce(
    (sum, returnItem) => sum + returnItem.quantity * returnItem.unitCost,
    0,
  );
  const totalQuantity = returns.reduce(
    (sum, returnItem) => sum + returnItem.quantity,
    0,
  );

  const getStatusBadge = (status: StockMovementStatus) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
      failed: { color: "bg-gray-100 text-gray-800", label: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRecordReturn = async () => {
    if (
      !newReturn.productId ||
      !newReturn.warehouseId ||
      newReturn.quantity <= 0
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.createCustomerReturn(newReturn);
      setIsRecordReturnOpen(false);
      resetReturnForm();
      loadReturns();
    } catch (error: any) {
      // Error handling without alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetReturnForm = () => {
    setNewReturn({
      productId: "",
      warehouseId: warehouses.length > 0 ? warehouses[0].id : "",
      locationId: "",
      movementType: StockMovementType.RETURN,
      quantity: 0,
      unitCost: 0,
      referenceNumber: "",
      referenceType: "customer_return",
      notes: "",
      batchNumber: "",
      serialNumber: "",
      expiryDate: "",
    });
  };

  const openDeleteDialog = (returnItem: StockMovement) => {
    setReturnToDelete(returnItem);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setReturnToDelete(null);
  };

  const handleDelete = async () => {
    if (!returnToDelete) return;

    try {
      setDeleteLoading(true);
      await inventoryService.deleteStockMovement(returnToDelete.id);
      loadReturns();
      closeDeleteDialog();
    } catch (error) {
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditReturn = (returnItem: StockMovement) => {
    setSelectedReturn(returnItem);
    setEditReturn({
      productId: returnItem.productId,
      warehouseId: returnItem.warehouseId,
      locationId: returnItem.locationId || "",
      movementType: returnItem.movementType,
      quantity: returnItem.quantity,
      unitCost: returnItem.unitCost,
      referenceNumber: returnItem.referenceNumber || "",
      referenceType: returnItem.referenceType || "customer_return",
      notes: returnItem.notes || "",
      batchNumber: returnItem.batchNumber || "",
      serialNumber: returnItem.serialNumber || "",
      expiryDate: returnItem.expiryDate
        ? new Date(returnItem.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateReturn = async () => {
    if (!selectedReturn) return;

    if (
      !editReturn.productId ||
      !editReturn.warehouseId ||
      editReturn.quantity <= 0
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.updateStockMovement(selectedReturn.id, editReturn);
      setIsEditModalOpen(false);
      loadReturns();
    } catch (error: any) {
      // Error handling without alert
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArrowLeft className="h-8 w-8 text-blue-500" />
              Customer Returns
            </h1>
            <p className="text-muted-foreground">
              Track and manage items returned by customers
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/inventory/stock-movements")}
            >
              <Package className="mr-2 h-4 w-4" />
              View All Movements
            </Button>
            {canCreate() && (
              <Button onClick={() => setIsRecordReturnOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Return
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Returns
              </CardTitle>
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{returns.length}</div>
              <p className="text-xs text-muted-foreground">
                {totalQuantity} units total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Refund Value
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRefundValue)}
              </div>
              <p className="text-xs text-muted-foreground">Refund amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Processing
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {returns.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  returns.filter((r) => {
                    const returnDate = new Date(r.createdAt);
                    const now = new Date();
                    return (
                      returnDate.getMonth() === now.getMonth() &&
                      returnDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Recent returns</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name, SKU, notes, batch, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Warehouse</label>
                <Select
                  value={warehouseFilter}
                  onValueChange={setWarehouseFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All warehouses</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customer Returns</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Refund Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((returnItem) => (
                  <TableRow key={returnItem.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {returnItem.productName || "Unknown Product"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {returnItem.productSku || returnItem.productId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{returnItem.quantity}</TableCell>
                    <TableCell>{formatCurrency(returnItem.unitCost)}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(
                        returnItem.quantity * returnItem.unitCost,
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                    <TableCell>{returnItem.referenceNumber || "-"}</TableCell>
                    <TableCell>{formatDate(returnItem.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(returnItem);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdate() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReturn(returnItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(returnItem)}
                            className="text-red-600 hover:text-red-700"
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
            {filteredReturns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No customer returns found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Return Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Return Details</DialogTitle>
              <DialogDescription>
                Detailed information about the customer return
              </DialogDescription>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Product</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReturn.productName || "Unknown Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SKU:{" "}
                      {selectedReturn.productSku || selectedReturn.productId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReturn.quantity}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Cost</label>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(selectedReturn.unitCost)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Refund Value</label>
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(
                        selectedReturn.quantity * selectedReturn.unitCost,
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedReturn.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Reference Number
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReturn.referenceNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Batch Number</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReturn.batchNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Serial Number</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedReturn.serialNumber || "-"}
                    </p>
                  </div>
                </div>
                {selectedReturn.notes && (
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReturn.notes}
                    </p>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Created Date</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedReturn.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedReturn.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              {canUpdate() && (
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    handleEditReturn(selectedReturn!);
                  }}
                >
                  Edit Details
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Return Modal */}
        <Dialog open={isRecordReturnOpen} onOpenChange={setIsRecordReturnOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Customer Return</DialogTitle>
              <DialogDescription>
                Record items returned by a customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={newReturn.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setNewReturn((prev) => ({
                        ...prev,
                        productId: value,
                        unitCost: product?.costPerUnitPrice || 0,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="no-products" disabled>
                          No products available
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse *</Label>
                  <Select
                    value={newReturn.warehouseId}
                    onValueChange={(value) =>
                      setNewReturn((prev) => ({ ...prev, warehouseId: value }))
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
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={newReturn.quantity}
                    onChange={(e) =>
                      setNewReturn((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter unit cost"
                    value={newReturn.unitCost}
                    onChange={(e) =>
                      setNewReturn((prev) => ({
                        ...prev,
                        unitCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="Order number or reference"
                    value={newReturn.referenceNumber}
                    onChange={(e) =>
                      setNewReturn((prev) => ({
                        ...prev,
                        referenceNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    placeholder="Enter batch number"
                    value={newReturn.batchNumber}
                    onChange={(e) =>
                      setNewReturn((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Return Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe the return reason and circumstances..."
                  value={newReturn.notes}
                  onChange={(e) =>
                    setNewReturn((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRecordReturnOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRecordReturn} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Record Return
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Return Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Customer Return</DialogTitle>
              <DialogDescription>
                Update the customer return information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-productId">Product *</Label>
                  <Select
                    value={editReturn.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setEditReturn((prev) => ({
                        ...prev,
                        productId: value,
                        unitCost: product?.costPerUnitPrice || 0,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="no-products" disabled>
                          No products available
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-warehouse">Warehouse *</Label>
                  <Select
                    value={editReturn.warehouseId}
                    onValueChange={(value) =>
                      setEditReturn((prev) => ({ ...prev, warehouseId: value }))
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
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={editReturn.quantity}
                    onChange={(e) =>
                      setEditReturn((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unitCost">Unit Cost</Label>
                  <Input
                    id="edit-unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter unit cost"
                    value={editReturn.unitCost}
                    onChange={(e) =>
                      setEditReturn((prev) => ({
                        ...prev,
                        unitCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-referenceNumber">Reference Number</Label>
                  <Input
                    id="edit-referenceNumber"
                    placeholder="Order number or reference"
                    value={editReturn.referenceNumber}
                    onChange={(e) =>
                      setEditReturn((prev) => ({
                        ...prev,
                        referenceNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-batchNumber">Batch Number</Label>
                  <Input
                    id="edit-batchNumber"
                    placeholder="Enter batch number"
                    value={editReturn.batchNumber}
                    onChange={(e) =>
                      setEditReturn((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Return Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Describe the return reason and circumstances..."
                  value={editReturn.notes}
                  onChange={(e) =>
                    setEditReturn((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateReturn} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Return
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer Return</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this customer return? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-4">
              <Button
                variant="outline"
                onClick={closeDeleteDialog}
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
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Return
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
