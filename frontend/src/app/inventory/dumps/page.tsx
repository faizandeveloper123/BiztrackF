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
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Package,
  TrendingDown,
  Loader2,
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
import { toast } from "sonner";
import { apiService } from "../../../services/ApiService";
import { Product } from "../../../models/pos";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function DumpsPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <DumpsContent />
    </ModuleGuard>
  );
}

function DumpsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "inventory:dumps",
  );
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [dumps, setDumps] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedDump, setSelectedDump] = useState<StockMovement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecordDamageOpen, setIsRecordDamageOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dumpToDelete, setDumpToDelete] = useState<StockMovement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editDamage, setEditDamage] = useState<StockMovementCreate>({
    productId: "",
    warehouseId: "",
    locationId: "",
    movementType: StockMovementType.DAMAGE,
    quantity: 0,
    unitCost: 0,
    referenceNumber: "",
    referenceType: "damage",
    notes: "",
    batchNumber: "",
    serialNumber: "",
    expiryDate: "",
  });
  const [newDamage, setNewDamage] = useState<StockMovementCreate>({
    productId: "",
    warehouseId: "",
    locationId: "",
    movementType: StockMovementType.DAMAGE,
    quantity: 0,
    unitCost: 0,
    referenceNumber: "",
    referenceType: "damage",
    notes: "",
    batchNumber: "",
    serialNumber: "",
    expiryDate: "",
  });

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadDumps();
      loadWarehouses();
      loadProducts();
    }
  }, [mounted, isAuthenticated, warehouseFilter, statusFilter]);

  const loadWarehouses = async () => {
    try {
      const response = await inventoryService.getWarehouses();
      setWarehouses(response.warehouses);
      if (response.warehouses.length > 0 && !newDamage.warehouseId) {
        setNewDamage((prev) => ({
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

  const loadDumps = async () => {
    try {
      setLoading(true);
      const warehouseId =
        warehouseFilter === "all" ? undefined : warehouseFilter;
      const response = await inventoryService.getDumps(warehouseId);
      setDumps(response.stockMovements);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredDumps = dumps.filter((dump) => {
    const matchesSearch =
      dump.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dump.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dump.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dump.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dump.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !statusFilter || statusFilter === "all" || dump.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalLoss = dumps.reduce(
    (sum, dump) => sum + dump.quantity * dump.unitCost,
    0,
  );
  const totalQuantity = dumps.reduce((sum, dump) => sum + dump.quantity, 0);

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

  const handleRecordDamage = async () => {
    if (
      !newDamage.productId ||
      !newDamage.warehouseId ||
      newDamage.quantity <= 0
    ) {
      toast.error(
        "Please fill in all required fields (Product, Warehouse, and Quantity)",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.createStockMovement(newDamage);
      setIsRecordDamageOpen(false);
      resetDamageForm();
      loadDumps();
      toast.success("Damage recorded successfully");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to record damage";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDamageForm = () => {
    setNewDamage({
      productId: "",
      warehouseId: warehouses.length > 0 ? warehouses[0].id : "",
      locationId: "",
      movementType: StockMovementType.DAMAGE,
      quantity: 0,
      unitCost: 0,
      referenceNumber: "",
      referenceType: "damage",
      notes: "",
      batchNumber: "",
      serialNumber: "",
      expiryDate: "",
    });
  };

  const openDeleteDialog = (dump: StockMovement) => {
    setDumpToDelete(dump);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDumpToDelete(null);
  };

  const handleDelete = async () => {
    if (!dumpToDelete) return;

    try {
      setDeleteLoading(true);
      await inventoryService.deleteStockMovement(dumpToDelete.id);
      loadDumps();
      closeDeleteDialog();
    } catch (error) {
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditDamage = (damage: StockMovement) => {
    setSelectedDump(damage);
    setEditDamage({
      productId: damage.productId,
      warehouseId: damage.warehouseId,
      locationId: damage.locationId || "",
      movementType: damage.movementType,
      quantity: damage.quantity,
      unitCost: damage.unitCost,
      referenceNumber: damage.referenceNumber || "",
      referenceType: damage.referenceType || "damage",
      notes: damage.notes || "",
      batchNumber: damage.batchNumber || "",
      serialNumber: damage.serialNumber || "",
      expiryDate: damage.expiryDate
        ? new Date(damage.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDamage = async () => {
    if (!selectedDump) return;

    if (
      !editDamage.productId ||
      !editDamage.warehouseId ||
      editDamage.quantity <= 0
    ) {
      toast.error(
        "Please fill in all required fields (Product, Warehouse, and Quantity)",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await inventoryService.updateStockMovement(selectedDump.id, editDamage);
      setIsEditModalOpen(false);
      loadDumps();
      toast.success("Damage record updated successfully");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to update damage record";
      toast.error(`Error: ${errorMessage}`);
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
              <Trash2 className="h-8 w-8 text-red-500" />
              Damaged Items (Dumps)
            </h1>
            <p className="text-muted-foreground">
              Track and manage items that were damaged while in your possession
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
              <Button onClick={() => setIsRecordDamageOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Damage
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Damaged Items
              </CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dumps.length}</div>
              <p className="text-xs text-muted-foreground">
                {totalQuantity} units total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Loss Value
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalLoss)}
              </div>
              <p className="text-xs text-muted-foreground">Financial impact</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dumps.filter((d) => d.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  dumps.filter((d) => {
                    const dumpDate = new Date(d.createdAt);
                    const now = new Date();
                    return (
                      dumpDate.getMonth() === now.getMonth() &&
                      dumpDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Recent incidents</p>
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
                    placeholder="Search by product, notes, or batch..."
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
                    {/* Add warehouse options here */}
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

        {/* Dumps Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Damaged Items</CardTitle>
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
                  <TableHead>Total Loss</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDumps.map((dump) => (
                  <TableRow key={dump.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {dump.productName || "Unknown Product"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {dump.productSku || dump.productId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dump.quantity}</TableCell>
                    <TableCell>{formatCurrency(dump.unitCost)}</TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {formatCurrency(dump.quantity * dump.unitCost)}
                    </TableCell>
                    <TableCell>{getStatusBadge(dump.status)}</TableCell>
                    <TableCell>{dump.batchNumber || "-"}</TableCell>
                    <TableCell>{formatDate(dump.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDump(dump);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canUpdate() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDamage(dump)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(dump)}
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
            {filteredDumps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No damaged items found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dump Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Damage Details</DialogTitle>
              <DialogDescription>
                Detailed information about the damaged item
              </DialogDescription>
            </DialogHeader>
            {selectedDump && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Product</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDump.productName || "Unknown Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {selectedDump.productSku || selectedDump.productId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDump.quantity}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit Cost</label>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(selectedDump.unitCost)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Loss</label>
                    <p className="text-sm font-medium text-red-600">
                      {formatCurrency(
                        selectedDump.quantity * selectedDump.unitCost,
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedDump.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Batch Number</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDump.batchNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Serial Number</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDump.serialNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Expiry Date</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDump.expiryDate
                        ? formatDate(selectedDump.expiryDate)
                        : "-"}
                    </p>
                  </div>
                </div>
                {selectedDump.notes && (
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedDump.notes}
                    </p>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Created Date</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedDump.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedDump.updatedAt)}
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
                    router.push(`/inventory/stock-movements/${selectedDump?.id}`);
                  }}
                >
                  Edit Details
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Record Damage Modal */}
        <Dialog open={isRecordDamageOpen} onOpenChange={setIsRecordDamageOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record Damage</DialogTitle>
              <DialogDescription>
                Record items that were damaged while in your possession
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={newDamage.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setNewDamage((prev) => ({
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
                    value={newDamage.warehouseId}
                    onValueChange={(value) =>
                      setNewDamage((prev) => ({ ...prev, warehouseId: value }))
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
                    value={newDamage.quantity}
                    onChange={(e) =>
                      setNewDamage((prev) => ({
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
                    value={newDamage.unitCost}
                    onChange={(e) =>
                      setNewDamage((prev) => ({
                        ...prev,
                        unitCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    placeholder="Enter batch number"
                    value={newDamage.batchNumber}
                    onChange={(e) =>
                      setNewDamage((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="Enter serial number"
                    value={newDamage.serialNumber}
                    onChange={(e) =>
                      setNewDamage((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Damage Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe the damage and circumstances..."
                  value={newDamage.notes}
                  onChange={(e) =>
                    setNewDamage((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="Optional reference number"
                  value={newDamage.referenceNumber}
                  onChange={(e) =>
                    setNewDamage((prev) => ({
                      ...prev,
                      referenceNumber: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRecordDamageOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRecordDamage} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Record Damage
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Damage Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Damage Record</DialogTitle>
              <DialogDescription>
                Update the damage record information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-productId">Product *</Label>
                  <Select
                    value={editDamage.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setEditDamage((prev) => ({
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
                    value={editDamage.warehouseId}
                    onValueChange={(value) =>
                      setEditDamage((prev) => ({ ...prev, warehouseId: value }))
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
                    value={editDamage.quantity}
                    onChange={(e) =>
                      setEditDamage((prev) => ({
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
                    value={editDamage.unitCost}
                    onChange={(e) =>
                      setEditDamage((prev) => ({
                        ...prev,
                        unitCost: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-batchNumber">Batch Number</Label>
                  <Input
                    id="edit-batchNumber"
                    placeholder="Enter batch number"
                    value={editDamage.batchNumber}
                    onChange={(e) =>
                      setEditDamage((prev) => ({
                        ...prev,
                        batchNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">Serial Number</Label>
                  <Input
                    id="edit-serialNumber"
                    placeholder="Enter serial number"
                    value={editDamage.serialNumber}
                    onChange={(e) =>
                      setEditDamage((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Damage Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Describe the damage and circumstances..."
                  value={editDamage.notes}
                  onChange={(e) =>
                    setEditDamage((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-referenceNumber">Reference Number</Label>
                <Input
                  id="edit-referenceNumber"
                  placeholder="Optional reference number"
                  value={editDamage.referenceNumber}
                  onChange={(e) =>
                    setEditDamage((prev) => ({
                      ...prev,
                      referenceNumber: e.target.value,
                    }))
                  }
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
              <Button onClick={handleUpdateDamage} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Damage
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
              <DialogTitle>Delete Damaged Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this damaged item record? This
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
                    Delete Item
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
