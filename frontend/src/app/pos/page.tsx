"use client";

import React, { useState, useEffect } from "react";
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
import {
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { apiService } from "@/src/services/ApiService";
import {
  POSMetrics,
  POSShift,
  POSTransaction,
  Product,
} from "@/src/models/pos";
import { DashboardLayout } from "../../components/layout";
import { useRouter } from "next/navigation";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function POSDashboard() {
  return <POSDashboardContent />;
}

const POSDashboardContent = () => {
  const {} = useAuth();
  const { canCreate } = useCrudPermissions("pos:sale");
  const { canCreate: canCreateShift, canUpdate: canUpdateShift } =
    useCrudPermissions("pos:shifts");
  const { formatCurrency } = useCurrency();
  const router = useRouter();
  const [metrics, setMetrics] = useState<POSMetrics | null>(null);
  const [openShift, setOpenShift] = useState<POSShift | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    POSTransaction[]
  >([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftLoading, setShiftLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkOpenShift();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.get("/pos/dashboard");
      setMetrics(response.metrics);
      setRecentTransactions(response.recentTransactions || []);
      setLowStockProducts(response.lowStockProducts || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const checkOpenShift = async () => {
    try {
      const response = await apiService.get("/pos/shifts/current/open");
      if (response.shift) {
        setOpenShift(response.shift);
      }
    } catch (error) {}
  };

  const handleOpenShift = async () => {
    setShiftLoading(true);
    try {
      const response = await apiService.post("/pos/shifts", {
        openingBalance: 0,
        notes: "Shift opened",
      });
      setOpenShift(response.shift);
    } catch (error) {
    } finally {
      setShiftLoading(false);
    }
  };

  const closeShift = async () => {
    if (!openShift) return;

    setShiftLoading(true);
    try {
      await apiService.put(`/pos/shifts/${openShift.id}`, {
        status: "closed",
        closingBalance: openShift.openingBalance + openShift.totalSales,
      });
      setOpenShift(null);
      fetchDashboardData(); // Refresh dashboard data
    } catch (error) {
    } finally {
      setShiftLoading(false);
    }
  };

  const navigateToNewSale = () => {
    router.push("/pos/sale");
  };

  const navigateToProducts = () => {
    router.push("/pos/products");
  };

  const navigateToReports = () => {
    router.push("/pos/reports");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <h1 className="text-3xl font-bold tracking-tight">POS Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your point of sale operations and monitor sales performance
            </p>
          </div>

          {/* Shift Management */}
          <div className="flex items-center space-x-4">
            {openShift ? (
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Shift Open
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {openShift.shiftNumber}
                </span>
                {canUpdateShift() && (
                  <Button
                    variant="outline"
                    onClick={closeShift}
                    disabled={shiftLoading}
                  >
                    {shiftLoading ? "Closing..." : "Close Shift"}
                  </Button>
                )}
              </div>
            ) : (
              canCreateShift() && (
                <Button
                  onClick={handleOpenShift}
                  disabled={shiftLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {shiftLoading ? "Opening..." : "Open Shift"}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics?.totalSales || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All time sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.totalTransactions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Transaction
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics?.averageTransactionValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Low Stock Items
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lowStockProducts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Items below threshold
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="inventory">Low Stock Alert</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Daily Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales (Last 7 Days)</CardTitle>
                  <CardDescription>
                    Sales performance over the past week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics?.dailySales && metrics.dailySales.length > 0 ? (
                    <div className="space-y-2">
                      {metrics.dailySales.map((day, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            {day.date}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(day.sales)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No sales data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common POS operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canCreate() && (
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={navigateToNewSale}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Sale
                    </Button>
                  )}
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={navigateToProducts}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={navigateToReports}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest sales transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Receipt className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {transaction.transactionNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.customerName || "Walk-in Customer"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(transaction.total)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {transaction.paymentMethod}
                            </Badge>
                            <Badge
                              variant={
                                transaction.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No transactions found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
                <CardDescription>Products that need restocking</CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(product.salePrice)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive">
                              Stock: {product.stockQuantity}
                            </Badge>
                            <Badge variant="outline">
                              Min: {product.minStockLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    All products are well stocked
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
