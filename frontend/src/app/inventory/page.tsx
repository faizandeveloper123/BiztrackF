"use client";

import React, { useEffect, useState } from "react";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Warehouse,
  Package,
  Truck,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
  Building2,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { inventoryService } from "../../services/InventoryService";
import { InventoryDashboardStats } from "../../models/inventory";
import { DashboardLayout } from "../../components/layout";
import { useCurrency } from "../../contexts/CurrencyContext";

export default function InventoryDashboardPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <InventoryDashboardContent />
    </ModuleGuard>
  );
}

function InventoryDashboardContent() {
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const dashboardData = await inventoryService.getInventoryDashboard();
      setStats(dashboardData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case "out_of_stock":
        return "destructive";
      case "low_stock":
        return "secondary";
      case "expiry_warning":
        return "default";
      default:
        return "default";
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "out_of_stock":
        return <AlertTriangle className="h-4 w-4" />;
      case "low_stock":
        return <Package className="h-4 w-4" />;
      case "expiry_warning":
        return <Truck className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
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
              Inventory Management
            </h1>
            <p className="text-muted-foreground">
              Manage your warehouses, track stock levels, and monitor inventory
              operations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/inventory/warehouses")}>
              <Warehouse className="mr-2 h-4 w-4" />
              Manage Warehouses
            </Button>
            <Button onClick={() => router.push("/inventory/products")}>
              <Package className="mr-2 h-4 w-4" />
              View Products
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active inventory items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Warehouses
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalWarehouses || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Storage facilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalSuppliers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Vendor partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalStockValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Status */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stats.lowStockAlerts.slice(0, 5).map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.alertType)}
                        <div>
                          <p className="font-medium text-sm">
                            {alert.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {alert.sku}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getAlertColor(alert.alertType) as any}>
                        {alert.currentStock} / {alert.minStockLevel}
                      </Badge>
                    </div>
                  ))}
                  {stats.lowStockAlerts.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/inventory/alerts")}
                    >
                      View All Alerts ({stats.lowStockAlerts.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No stock alerts at the moment</p>
                  <p className="text-sm">All products are well stocked</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/inventory/stock-movements")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Record Stock Movement
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/inventory/purchase-orders")}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/inventory/receiving")}
              >
                <Truck className="mr-2 h-4 w-4" />
                Process Receiving
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/inventory/products")}
              >
                <Package className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Stock movement recorded</p>
                    <p className="text-sm text-muted-foreground">
                      Inbound movement for Product XYZ
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  2 hours ago
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Purchase order created</p>
                    <p className="text-sm text-muted-foreground">
                      PO-2024-001 for Supplier ABC
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Low stock alert</p>
                    <p className="text-sm text-muted-foreground">
                      Product DEF running low on stock
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  2 days ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/inventory/warehouses")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Warehouses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage warehouse locations, storage capacity, and facility
                information
              </p>
              <Button variant="outline" className="w-full">
                Manage Warehouses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/inventory/products")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and manage product catalog, stock levels, and inventory
                details
              </p>
              <Button variant="outline" className="w-full">
                View Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/hrm/suppliers")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage supplier relationships, contact information, and
                performance
              </p>
              <Button variant="outline" className="w-full">
                Manage Suppliers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
