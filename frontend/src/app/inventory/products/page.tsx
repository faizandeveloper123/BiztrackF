"use client";

import React, { useState, useEffect } from "react";
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
import { Label } from "../../../components/ui/label";
import {
  Package,
  Plus,
  Search,
  Eye,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { DashboardLayout } from "../../../components/layout";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { apiService } from "../../../services/ApiService";
import { Product, UnitOfMeasure } from "../../../models/pos";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function ProductsPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <ProductsContent />
    </ModuleGuard>
  );
}

function ProductsContent() {
  const { canCreate } = useCrudPermissions("inventory:products");
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/pos/products");
      setProducts(response.products || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0)
      return {
        status: "out_of_stock",
        color: "destructive",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    if (quantity <= threshold)
      return {
        status: "low_stock",
        color: "secondary",
        icon: <TrendingUp className="h-4 w-4" />,
      };
    return {
      status: "in_stock",
      color: "default",
      icon: <CheckCircle className="h-4 w-4" />,
    };
  };

  const getStockStatusLabel = (quantity: number, threshold: number) => {
    if (quantity === 0) return "Out of Stock";
    if (quantity <= threshold) return "Low Stock";
    return "In Stock";
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading products...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              View and manage your product catalog and inventory levels
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/pos/products")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Manage in POS
            </Button>
            {canCreate() && (
              <Button onClick={() => router.push("/pos/products?openAdd=true")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(
                      product.stockQuantity,
                      product.minStockLevel,
                    );
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {stockStatus.icon}
                              <span className="font-medium">
                                {product.stockQuantity}{" "}
                                {product.unitOfMeasure || UnitOfMeasure.PIECE}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                / {product.minStockLevel || 0} min
                              </span>
                            </div>
                            <Badge variant={stockStatus.color as any}>
                              {getStockStatusLabel(
                                product.stockQuantity,
                                product.minStockLevel,
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(product.salePrice || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Cost:{" "}
                              {formatCurrency(product.costPerUnitPrice || 0)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            {product.stockQuantity <=
                              (product.minStockLevel || 0) && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/inventory/purchase-orders?openAdd=1&productId=${product.id}`,
                                  )
                                }
                              >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Order
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by adding your first product"}
                </p>
                {!searchTerm && canCreate() && (
                  <Button
                    onClick={() => router.push("/pos/products?openAdd=true")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
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
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">All products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {
                  products.filter((p) => p.stockQuantity > p.minStockLevel)
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Well stocked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {
                  products.filter(
                    (p) =>
                      p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel,
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Need reordering</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {products.filter((p) => p.stockQuantity === 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Critical items</p>
            </CardContent>
          </Card>
        </div>

        {/* Note about POS Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                Products are managed in the POS module
              </h3>
              <p className="text-muted-foreground mb-4">
                To add, edit, or manage products, please use the POS module
                which provides full product management capabilities.
              </p>
              <Button onClick={() => router.push("/pos/products")}>
                Go to POS Products
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Product Modal */}
        <Dialog
          open={!!viewingProduct}
          onOpenChange={() => setViewingProduct(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the product
              </DialogDescription>
            </DialogHeader>

            {viewingProduct && (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Product Name
                      </Label>
                      <p className="text-lg font-semibold">
                        {viewingProduct.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        SKU
                      </Label>
                      <p className="text-lg font-mono">{viewingProduct.sku}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Description
                    </Label>
                    <p className="text-gray-900 mt-1">
                      {viewingProduct.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Category
                      </Label>
                      <Badge variant="outline" className="mt-1">
                        {viewingProduct.category}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Unit of Measure
                      </Label>
                      <p className="text-gray-900 mt-1">
                        {viewingProduct.unitOfMeasure || UnitOfMeasure.PIECE}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Pricing Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Sale Price
                        </Label>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(viewingProduct.salePrice || 0)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Cost Per Unit Price
                        </Label>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(viewingProduct.costPerUnitPrice || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Profit Margin
                      </Label>
                      <p className="text-lg font-semibold text-purple-600">
                        {formatCurrency(
                          (viewingProduct.salePrice || 0) -
                            (viewingProduct.costPerUnitPrice || 0),
                        )}
                        (
                        {viewingProduct.costPerUnitPrice
                          ? (
                              (((viewingProduct.salePrice || 0) -
                                (viewingProduct.costPerUnitPrice || 0)) /
                                (viewingProduct.costPerUnitPrice || 0)) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %)
                      </p>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Stock Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Current Stock
                        </Label>
                        <p className="text-2xl font-bold text-blue-600">
                          {viewingProduct.stockQuantity}{" "}
                          {viewingProduct.unitOfMeasure || UnitOfMeasure.PIECE}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Minimum Stock Level
                        </Label>
                        <p className="text-2xl font-bold text-orange-600">
                          {viewingProduct.minStockLevel || 0}{" "}
                          {viewingProduct.unitOfMeasure || UnitOfMeasure.PIECE}
                        </p>
                      </div>
                    </div>
                    {viewingProduct.stockQuantity <=
                      (viewingProduct.minStockLevel || 0) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800">
                            Low Stock Alert
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          This product is{" "}
                          {viewingProduct.stockQuantity <
                          (viewingProduct.minStockLevel || 0)
                            ? "below"
                            : "at"}{" "}
                          the minimum stock level. Consider restocking soon.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional Information */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Additional Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Barcode
                        </Label>
                        <p className="text-gray-900 mt-1 font-mono">
                          {viewingProduct.barcode || "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Batch Number
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.batchNumber || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Serial Number
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.serialNumber || "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Expiry Date
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.expiryDate
                            ? new Date(
                                viewingProduct.expiryDate,
                              ).toLocaleDateString("en-US")
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Model No.
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.modelNo || "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Mfg. Date
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.mfgDate
                            ? new Date(
                                viewingProduct.mfgDate,
                              ).toLocaleDateString("en-US")
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Date of Purchase
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.dateOfPurchase
                            ? new Date(
                                viewingProduct.dateOfPurchase,
                              ).toLocaleDateString("en-US")
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Status */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Product Status
                        </Label>
                        <div className="mt-1">
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <Label className="text-sm font-medium text-gray-600">
                          Created
                        </Label>
                        <p className="text-gray-900 mt-1">
                          {viewingProduct.createdAt
                            ? new Date(
                                viewingProduct.createdAt,
                              ).toLocaleDateString("en-US")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setViewingProduct(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setViewingProduct(null);
                  router.push("/pos/products");
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Manage in POS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
