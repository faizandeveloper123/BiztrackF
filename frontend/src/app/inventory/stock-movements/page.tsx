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
  Building2,
  Package,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { inventoryService } from "../../../services/InventoryService";
import {
  StockMovement,
  StockMovementCreate,
  StockMovementType,
  Warehouse,
} from "../../../models/inventory";
import { Product } from "../../../models/pos";
import { DashboardLayout } from "../../../components/layout";
import { toast } from "sonner";
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
import { apiService } from "../../../services/ApiService";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function StockMovementsPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <StockMovementsContent />
    </ModuleGuard>
  );
}

function StockMovementsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "inventory:stock_movements",
  );
  const {} = useAuth();
  const { getCurrencySymbol } = useCurrency();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] =
    useState<StockMovement | null>(null);
  const [movementToDelete, setMovementToDelete] =
    useState<StockMovement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editMovement, setEditMovement] = useState<StockMovementCreate>({
    productId: "",
    warehouseId: "",
    locationId: "",
    movementType: StockMovementType.INBOUND,
    quantity: 0,
    unitCost: 0,
    referenceNumber: "",
    referenceType: "",
    notes: "",
    batchNumber: "",
    serialNumber: "",
    expiryDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMovement, setNewMovement] = useState<StockMovementCreate>({
    productId: "",
    warehouseId: "",
    locationId: "",
    movementType: StockMovementType.INBOUND,
    quantity: 0,
    unitCost: 0,
    referenceNumber: "",
    referenceType: "",
    notes: "",
    batchNumber: "",
    serialNumber: "",
    expiryDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockMovementsResponse, warehousesResponse, productsResponse] =
        await Promise.all([
          inventoryService.getStockMovements(),
          inventoryService.getWarehouses(),
          apiService.get("/pos/products"),
        ]);
      setStockMovements(stockMovementsResponse.stockMovements);
      setWarehouses(warehousesResponse.warehouses);
      setProducts(productsResponse.products || []);

      // Set default warehouse if available
      if (
        warehousesResponse.warehouses.length > 0 &&
        !newMovement.warehouseId
      ) {
        setNewMovement((prev) => ({
          ...prev,
          warehouseId: warehousesResponse.warehouses[0].id,
        }));
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load stock movements";
      toast.error(`Load Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = stockMovements.filter((movement) => {
    const matchesSearch =
      movement.referenceNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      !typeFilter ||
      movement.movementType === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleDelete = async () => {
    if (!movementToDelete) return;

    try {
      setDeleteLoading(true);
      await inventoryService.deleteStockMovement(movementToDelete.id);
      fetchData();
      closeDeleteDialog();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to delete stock movement";
      toast.error(`Delete Error: ${errorMessage}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddMovement = async () => {
    if (
      !newMovement.productId ||
      !newMovement.warehouseId ||
      !newMovement.referenceNumber ||
      newMovement.quantity <= 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.createStockMovement(newMovement);
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create stock movement";
      toast.error(`Create Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewMovement({
      productId: "",
      warehouseId: warehouses.length > 0 ? warehouses[0].id : "",
      locationId: "",
      movementType: StockMovementType.INBOUND,
      quantity: 0,
      unitCost: 0,
      referenceNumber: "",
      referenceType: "",
      notes: "",
      batchNumber: "",
      serialNumber: "",
      expiryDate: "",
    });
  };

  const handleViewMovement = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (movement: StockMovement) => {
    setMovementToDelete(movement);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setMovementToDelete(null);
  };

  const handleEditMovement = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setEditMovement({
      productId: movement.productId,
      warehouseId: movement.warehouseId,
      locationId: movement.locationId || "",
      movementType: movement.movementType,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      referenceNumber: movement.referenceNumber || "",
      referenceType: movement.referenceType || "",
      notes: movement.notes || "",
      batchNumber: movement.batchNumber || "",
      serialNumber: movement.serialNumber || "",
      expiryDate: movement.expiryDate
        ? new Date(movement.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMovement = async () => {
    if (!selectedMovement) return;

    if (
      !editMovement.productId ||
      !editMovement.warehouseId ||
      !editMovement.referenceNumber ||
      editMovement.quantity <= 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.updateStockMovement(
        selectedMovement.id,
        editMovement,
      );
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update stock movement";
      toast.error(`Update Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: StockMovementType) => {
    const typeConfig = {
      [StockMovementType.INBOUND]: { variant: "default", label: "Inbound" },
      [StockMovementType.OUTBOUND]: {
        variant: "destructive",
        label: "Outbound",
      },
      [StockMovementType.TRANSFER]: { variant: "secondary", label: "Transfer" },
      [StockMovementType.ADJUSTMENT]: {
        variant: "outline",
        label: "Adjustment",
      },
      [StockMovementType.RETURN]: { variant: "default", label: "Return" },
      [StockMovementType.DAMAGE]: { variant: "destructive", label: "Damage" },
      [StockMovementType.EXPIRY]: { variant: "destructive", label: "Expiry" },
      [StockMovementType.CYCLE_COUNT]: {
        variant: "secondary",
        label: "Cycle Count",
      },
      [StockMovementType.INSTOCK]: {
        variant: "default",
        label: "In Stock",
      },
    };

    const config = typeConfig[type] || typeConfig[StockMovementType.INBOUND];
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Completed" },
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
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Movements
            </h1>
            <p className="text-muted-foreground">
              Track and manage inventory movements across warehouses
            </p>
          </div>
          {canCreate() && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Movement
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
                  placeholder="Search by reference number or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={StockMovementType.INBOUND}>
                    Inbound
                  </SelectItem>
                  <SelectItem value={StockMovementType.OUTBOUND}>
                    Outbound
                  </SelectItem>
                  <SelectItem value={StockMovementType.TRANSFER}>
                    Transfer
                  </SelectItem>
                  <SelectItem value={StockMovementType.ADJUSTMENT}>
                    Adjustment
                  </SelectItem>
                  <SelectItem value={StockMovementType.RETURN}>
                    Return
                  </SelectItem>
                  <SelectItem value={StockMovementType.DAMAGE}>
                    Damage
                  </SelectItem>
                  <SelectItem value={StockMovementType.EXPIRY}>
                    Expiry
                  </SelectItem>
                  <SelectItem value={StockMovementType.CYCLE_COUNT}>
                    Cycle Count
                  </SelectItem>
                  <SelectItem value={StockMovementType.INSTOCK}>
                    In Stock
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stock Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Movements List</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMovements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {getTypeBadge(movement.movementType)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{movement.productId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>Warehouse ID: {movement.warehouseId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{movement.locationId || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{movement.quantity}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {getCurrencySymbol()}
                          {movement.unitCost}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate">
                          {movement.referenceNumber || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(movement.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMovement(movement)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
{canUpdate() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMovement(movement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(movement)}
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
                  No stock movements found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || typeFilter !== "all"
                    ? "Try adjusting your search terms or filters"
                    : "Get started by recording your first stock movement"}
                </p>
                {!searchTerm && typeFilter === "all" && canCreate() && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Movement
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
                Total Movements
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockMovements.length}</div>
              <p className="text-xs text-muted-foreground">All movements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inbound</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  stockMovements.filter(
                    (m) => m.movementType === StockMovementType.INBOUND,
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Stock received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outbound</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  stockMovements.filter(
                    (m) => m.movementType === StockMovementType.OUTBOUND,
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Stock shipped</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transfers</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  stockMovements.filter(
                    (m) => m.movementType === StockMovementType.TRANSFER,
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Internal moves</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  stockMovements.filter(
                    (m) => m.movementType === StockMovementType.INSTOCK,
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Stock confirmed</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Stock Movement Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movementType">Movement Type *</Label>
                  <Select
                    value={newMovement.movementType}
                    onValueChange={(value) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        movementType: value as StockMovementType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StockMovementType.INBOUND}>
                        Inbound
                      </SelectItem>
                      <SelectItem value={StockMovementType.OUTBOUND}>
                        Outbound
                      </SelectItem>
                      <SelectItem value={StockMovementType.TRANSFER}>
                        Transfer
                      </SelectItem>
                      <SelectItem value={StockMovementType.ADJUSTMENT}>
                        Adjustment
                      </SelectItem>
                      <SelectItem value={StockMovementType.RETURN}>
                        Return
                      </SelectItem>
                      <SelectItem value={StockMovementType.DAMAGE}>
                        Damage
                      </SelectItem>
                      <SelectItem value={StockMovementType.EXPIRY}>
                        Expiry
                      </SelectItem>
                      <SelectItem value={StockMovementType.CYCLE_COUNT}>
                        Cycle Count
                      </SelectItem>
                      <SelectItem value={StockMovementType.INSTOCK}>
                        In Stock
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseId">Warehouse *</Label>
                  <Select
                    value={newMovement.warehouseId}
                    onValueChange={(value) =>
                      setNewMovement((prev) => ({
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={newMovement.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setNewMovement((prev) => ({
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
                  <Label htmlFor="locationId">Location ID</Label>
                  <Input
                    id="locationId"
                    value={newMovement.locationId}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        locationId: e.target.value,
                      }))
                    }
                    placeholder="Enter location ID (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={newMovement.quantity}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Unit Cost *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMovement.unitCost}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        unitCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter unit cost"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number *</Label>
                  <Input
                    id="referenceNumber"
                    value={newMovement.referenceNumber}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        referenceNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter reference number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceType">Reference Type</Label>
                  <Input
                    id="referenceType"
                    value={newMovement.referenceType}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        referenceType: e.target.value,
                      }))
                    }
                    placeholder="e.g., Purchase Order, Sale, Transfer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={newMovement.batchNumber}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter batch number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={newMovement.serialNumber}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newMovement.expiryDate}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newMovement.notes}
                    onChange={(e) =>
                      setNewMovement((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Enter movement notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMovement}
                disabled={
                  isSubmitting ||
                  !newMovement.productId ||
                  !newMovement.warehouseId ||
                  newMovement.quantity <= 0
                }
              >
                {isSubmitting ? "Recording..." : "Record Movement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Stock Movement Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Stock Movement Details</DialogTitle>
            </DialogHeader>
            {selectedMovement && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Movement Type</Label>
                    <div className="flex items-center">
                      {getTypeBadge(selectedMovement.movementType)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center">
                      {getStatusBadge(selectedMovement.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Product ID</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.productId}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Location ID</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.locationId || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.quantity}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Unit Cost</Label>
                    <div className="text-sm text-muted-foreground">
                      {getCurrencySymbol()}
                      {selectedMovement.unitCost}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Reference Number
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.referenceNumber || "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Reference Type
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.referenceType || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Batch Number</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.batchNumber || "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Serial Number</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedMovement.serialNumber || "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedMovement.expiryDate
                      ? formatDate(selectedMovement.expiryDate)
                      : "N/A"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedMovement.notes || "No notes"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Created At</Label>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedMovement.createdAt)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Updated At</Label>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedMovement.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Stock Movement Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Stock Movement</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-movementType">Movement Type *</Label>
                  <Select
                    value={editMovement.movementType}
                    onValueChange={(value) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        movementType: value as StockMovementType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StockMovementType.INBOUND}>
                        Inbound
                      </SelectItem>
                      <SelectItem value={StockMovementType.OUTBOUND}>
                        Outbound
                      </SelectItem>
                      <SelectItem value={StockMovementType.TRANSFER}>
                        Transfer
                      </SelectItem>
                      <SelectItem value={StockMovementType.ADJUSTMENT}>
                        Adjustment
                      </SelectItem>
                      <SelectItem value={StockMovementType.RETURN}>
                        Return
                      </SelectItem>
                      <SelectItem value={StockMovementType.DAMAGE}>
                        Damage
                      </SelectItem>
                      <SelectItem value={StockMovementType.EXPIRY}>
                        Expiry
                      </SelectItem>
                      <SelectItem value={StockMovementType.CYCLE_COUNT}>
                        Cycle Count
                      </SelectItem>
                      <SelectItem value={StockMovementType.INSTOCK}>
                        In Stock
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-warehouseId">Warehouse *</Label>
                  <Select
                    value={editMovement.warehouseId}
                    onValueChange={(value) =>
                      setEditMovement((prev) => ({
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-productId">Product *</Label>
                  <Select
                    value={editMovement.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setEditMovement((prev) => ({
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
                  <Label htmlFor="edit-locationId">Location ID</Label>
                  <Input
                    id="edit-locationId"
                    value={editMovement.locationId}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        locationId: e.target.value,
                      }))
                    }
                    placeholder="Enter location ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={editMovement.quantity}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unitCost">Unit Cost *</Label>
                  <Input
                    id="edit-unitCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editMovement.unitCost}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        unitCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter unit cost"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-referenceNumber">
                    Reference Number *
                  </Label>
                  <Input
                    id="edit-referenceNumber"
                    value={editMovement.referenceNumber}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        referenceNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter reference number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-referenceType">Reference Type</Label>
                  <Input
                    id="edit-referenceType"
                    value={editMovement.referenceType}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        referenceType: e.target.value,
                      }))
                    }
                    placeholder="Enter reference type"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-batchNumber">Batch Number</Label>
                  <Input
                    id="edit-batchNumber"
                    value={editMovement.batchNumber}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter batch number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">Serial Number</Label>
                  <Input
                    id="edit-serialNumber"
                    value={editMovement.serialNumber}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    placeholder="Enter serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                  <Input
                    id="edit-expiryDate"
                    type="date"
                    value={editMovement.expiryDate}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editMovement.notes}
                    onChange={(e) =>
                      setEditMovement((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Enter notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateMovement}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Movement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Stock Movement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this stock movement? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {movementToDelete && (
              <div className="py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <span className="font-medium">Product ID:</span>
                      <p className="text-muted-foreground">
                        {movementToDelete.productId}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span>
                      <p className="text-muted-foreground">
                        {movementToDelete.quantity}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="text-muted-foreground">
                        {movementToDelete.movementType}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Unit Cost:</span>
                      <p className="text-muted-foreground">
                        {getCurrencySymbol()}
                        {movementToDelete.unitCost}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                    Delete Movement
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
