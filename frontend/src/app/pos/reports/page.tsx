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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useAuth } from "@/src/hooks/useAuth";
import { apiService } from "@/src/services/ApiService";
import { POSPaymentMethod } from "@/src/models/pos";
import {
  BarChart3,
  TrendingUp,
  Package,
  Clock,
  ShoppingCart,
  Calendar,
  Download,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout";
import { toast } from "sonner";
import { useCurrency } from "../../../contexts/CurrencyContext";

interface SalesReport {
  summary: {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    dateRange: {
      from?: string;
      to?: string;
    };
  };
  paymentMethods: Record<string, { count: number; total: number }>;
  dailySales: Record<string, { sales: number; transactions: number }>;
  transactions: any[];
}

interface InventoryReport {
  summary: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  categorySummary: Record<
    string,
    { count: number; totalValue: number; lowStock: number }
  >;
  lowStockProducts: any[];
  products: any[];
}

interface ShiftsReport {
  summary: {
    totalShifts: number;
    openShifts: number;
    closedShifts: number;
    totalSales: number;
    totalTransactions: number;
    dateRange: {
      from?: string;
      to?: string;
    };
  };
  cashierSummary: Record<
    string,
    { shifts: number; totalSales: number; totalTransactions: number }
  >;
  shifts: any[];
}

const POSReports = () => {
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [cashierId, setCashierId] = useState<string>("");
  const [category, setCategory] = useState<string>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] =
    useState<InventoryReport | null>(null);
  const [shiftsReport, setShiftsReport] = useState<ShiftsReport | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "sales") {
      fetchSalesReport();
    } else if (activeTab === "inventory") {
      fetchInventoryReport();
    } else if (activeTab === "shifts") {
      fetchShiftsReport();
    }
  }, [
    activeTab,
    dateFrom,
    dateTo,
    paymentMethod,
    cashierId,
    category,
    lowStockOnly,
  ]);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (paymentMethod && paymentMethod !== "all")
        params.append("payment_method", paymentMethod);
      if (cashierId) params.append("cashier_id", cashierId);

      const response = await apiService.get(
        `/pos/reports/sales?${params.toString()}`,
      );
      setSalesReport(response);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lowStockOnly) params.append("low_stock_only", "true");
      if (category && category !== "all") params.append("category", category);

      const response = await apiService.get(
        `/pos/reports/inventory?${params.toString()}`,
      );
      setInventoryReport(response);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftsReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (cashierId) params.append("cashier_id", cashierId);

      const response = await apiService.get(
        `/pos/reports/shifts?${params.toString()}`,
      );
      setShiftsReport(response);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setPaymentMethod("all");
    setCashierId("");
    setCategory("all");
    setLowStockOnly(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US");
  };

  const exportReport = (type: string) => {
    // This would implement actual export functionality
    toast.info(`${type} report export is not implemented yet.`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">POS Reports</h1>
            <p className="text-muted-foreground">
              View detailed analytics and reports for your POS operations
            </p>
          </div>

          <Button onClick={() => exportReport(activeTab)} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {activeTab === "sales" && (
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {Object.values(POSPaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lowStockOnly"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                    />
                    <Label htmlFor="lowStockOnly">Low Stock Only</Label>
                  </div>
                </div>
              )}

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sales Report
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Report
            </TabsTrigger>
            <TabsTrigger value="shifts" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Shifts Report
            </TabsTrigger>
          </TabsList>

          {/* Sales Report */}
          <TabsContent value="sales" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : salesReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Sales
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesReport.summary.totalSales)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesReport.summary.totalTransactions} transactions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Avg Transaction
                      </CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesReport.summary.averageTransaction)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Per transaction
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Date Range
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {salesReport.summary.dateRange.from || "All time"} -{" "}
                        {salesReport.summary.dateRange.to || "Today"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Report period
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Methods Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Breakdown</CardTitle>
                    <CardDescription>
                      Sales distribution by payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(salesReport.paymentMethods).map(
                        ([method, data]) => (
                          <div
                            key={method}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {method.replace("_", " ")}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {data.count} transactions
                              </span>
                            </div>
                            <span className="font-semibold">
                              {formatCurrency(data.total)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Sales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Sales</CardTitle>
                    <CardDescription>
                      Sales performance over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(salesReport.dailySales).map(
                        ([date, data]) => (
                          <div
                            key={date}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="font-medium">
                              {formatDate(date)}
                            </span>
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatCurrency(data.sales)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {data.transactions} transactions
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No sales data available
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : inventoryReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Products
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {inventoryReport.summary.totalProducts}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        In inventory
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Value
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          inventoryReport.summary.totalInventoryValue,
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Inventory worth
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Low Stock
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">
                        {inventoryReport.summary.lowStockItems}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Need restocking
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Out of Stock
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {inventoryReport.summary.outOfStockItems}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No stock available
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Summary</CardTitle>
                    <CardDescription>
                      Inventory breakdown by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(inventoryReport.categorySummary).map(
                        ([cat, data]) => (
                          <div
                            key={cat}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <div className="font-medium capitalize">
                                {cat}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {data.count} products
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatCurrency(data.totalValue)}
                              </div>
                              <div className="text-sm text-amber-600">
                                {data.lowStock} low stock
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Low Stock Products */}
                {inventoryReport.lowStockProducts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Low Stock Products</CardTitle>
                      <CardDescription>
                        Products that need restocking
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {inventoryReport.lowStockProducts
                          .slice(0, 10)
                          .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-3 border rounded"
                            >
                              <div>
                                <div className="font-medium">
                                  {product.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  SKU: {product.sku} | Category:{" "}
                                  {product.category}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(product.salePrice)}
                                </div>
                                <div className="text-sm text-red-600">
                                  Stock: {product.stockQuantity} (Min:{" "}
                                  {product.minStockLevel})
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No inventory data available
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </TabsContent>

          {/* Shifts Report */}
          <TabsContent value="shifts" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : shiftsReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Shifts
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {shiftsReport.summary.totalShifts}
                      </div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Open Shifts
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {shiftsReport.summary.openShifts}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Currently active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Closed Shifts
                      </CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">
                        {shiftsReport.summary.closedShifts}
                      </div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Sales
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(shiftsReport.summary.totalSales)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From shifts
                      </p>
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
                        {shiftsReport.summary.totalTransactions}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total count
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cashier Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cashier Performance</CardTitle>
                    <CardDescription>
                      Sales performance by cashier
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(shiftsReport.cashierSummary).map(
                        ([cashier, data]) => (
                          <div
                            key={cashier}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <div className="font-medium">{cashier}</div>
                              <div className="text-sm text-muted-foreground">
                                {data.shifts} shifts
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatCurrency(data.totalSales)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {data.totalTransactions} transactions
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No shifts data available
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default POSReports;
