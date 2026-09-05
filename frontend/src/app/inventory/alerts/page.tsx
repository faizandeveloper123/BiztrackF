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
import {
  AlertTriangle,
  Package,
  TrendingDown,
  Clock,
  RefreshCw,
  Eye,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { inventoryService } from "../../../services/InventoryService";
import { InventoryDashboardStats } from "../../../models/inventory";
import { DashboardLayout } from "../../../components/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";

export default function AlertsPage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <AlertsContent />
    </ModuleGuard>
  );
}

function AlertsContent() {
  const {} = useAuth();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] =
    useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [viewingAlert, setViewingAlert] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsResponse = await inventoryService.getInventoryDashboard();
      setDashboardStats(statsResponse);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const stats = await inventoryService.getInventoryDashboard();
      setDashboardStats(stats);
    } catch (error) {}
  };

  const filteredAlerts =
    dashboardStats?.lowStockAlerts?.filter((alert) => {
      if (filterType === "all") return true;
      return alert.alertType === filterType;
    }) || [];

  const handleViewAlert = (alert: any) => {
    setViewingAlert(alert);
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "out_of_stock":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "low_stock":
        return <Package className="h-5 w-5 text-orange-500" />;
      case "expiry_warning":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBadge = (alertType: string) => {
    const badgeConfig = {
      out_of_stock: { variant: "destructive", label: "Out of Stock" },
      low_stock: { variant: "secondary", label: "Low Stock" },
      expiry_warning: { variant: "default", label: "Expiry Warning" },
    };

    const config =
      badgeConfig[alertType as keyof typeof badgeConfig] ||
      badgeConfig.low_stock;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPriorityColor = (alertType: string) => {
    switch (alertType) {
      case "out_of_stock":
        return "border-l-red-500 bg-red-50";
      case "low_stock":
        return "border-l-orange-500 bg-orange-50";
      case "expiry_warning":
        return "border-l-yellow-500 bg-yellow-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
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
              Inventory Alerts
            </h1>
            <p className="text-muted-foreground">
              Monitor stock levels and inventory warnings
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchAlerts}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.lowStockAlerts?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Out of Stock
              </CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {dashboardStats?.outOfStockProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Critical items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {dashboardStats?.lowStockProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Warning items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Inventory items</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
              >
                All Alerts ({dashboardStats?.lowStockAlerts?.length || 0})
              </Button>
              <Button
                variant={filterType === "out_of_stock" ? "default" : "outline"}
                onClick={() => setFilterType("out_of_stock")}
              >
                Out of Stock ({dashboardStats?.outOfStockProducts || 0})
              </Button>
              <Button
                variant={filterType === "low_stock" ? "default" : "outline"}
                onClick={() => setFilterType("low_stock")}
              >
                Low Stock ({dashboardStats?.lowStockProducts || 0})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAlerts.length > 0 ? (
              <div className="space-y-4">
                {filteredAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${getPriorityColor(alert.alertType)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.alertType)}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">
                              {alert.productName}
                            </h3>
                            {getAlertBadge(alert.alertType)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            SKU: {alert.sku}
                          </p>
                          <p className="text-sm mb-3">{alert.message}</p>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>
                                Current: <strong>{alert.currentStock}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Minimum: <strong>{alert.minStockLevel}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAlert(alert)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push("/inventory/purchase-orders")
                          }
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Order
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                <p className="text-muted-foreground mb-4">
                  {filterType === "all"
                    ? "All inventory items are properly stocked"
                    : `No ${filterType.replace("_", " ")} alerts at the moment`}
                </p>
                {filterType !== "all" && (
                  <Button
                    variant="outline"
                    onClick={() => setFilterType("all")}
                  >
                    View All Alerts
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/inventory/stock-movements")}
              >
                <Package className="h-6 w-6" />
                <span>Record Stock Movement</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/inventory/products")}
              >
                <Eye className="h-6 w-6" />
                <span>View All Products</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Alert Modal */}
        <Dialog
          open={!!viewingAlert}
          onOpenChange={() => setViewingAlert(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewingAlert && getAlertIcon(viewingAlert.alertType)}
                Stock Alert Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about the stock alert
              </DialogDescription>
            </DialogHeader>

            {viewingAlert && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Product Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {viewingAlert.productName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      SKU
                    </Label>
                    <p className="text-lg font-mono">{viewingAlert.sku}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Alert Type
                  </Label>
                  <div className="mt-1">
                    {getAlertBadge(viewingAlert.alertType)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Alert Message
                  </Label>
                  <p className="text-gray-900 mt-1">{viewingAlert.message}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Current Stock
                    </Label>
                    <p className="text-2xl font-bold text-red-600">
                      {viewingAlert.currentStock}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Minimum Stock Level
                    </Label>
                    <p className="text-2xl font-bold text-orange-600">
                      {viewingAlert.minStockLevel}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      Stock Level Warning
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    This product is{" "}
                    {viewingAlert.currentStock < viewingAlert.minStockLevel
                      ? "below"
                      : "at"}{" "}
                    the minimum stock level. Consider placing a new order to
                    replenish inventory.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingAlert(null)}>
                Close
              </Button>
              <Button onClick={() => router.push("/inventory/purchase-orders")}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
