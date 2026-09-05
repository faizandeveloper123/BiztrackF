"use client";

import React, { useState } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  TrendingUp,
  Calculator,
  ShoppingCart,
  RefreshCw,
  MessageCircle,
  Download,
  Mail,
} from "lucide-react";
import { LedgerService } from "@/src/services/ledgerService";
import DashboardLayout from "@/src/components/layout/DashboardLayout";
import {
  ProfitLossDashboard,
  ProfitLossPeriod,
  getProfitLossPeriodLabel,
} from "@/src/models/ledger";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { useCachedApi } from "@/src/hooks/useCachedApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { SendProfitLossEmailDialog } from "@/src/components/ledger/SendProfitLossEmailDialog";
import { SendProfitLossWhatsAppDialog } from "@/src/components/ledger/SendProfitLossWhatsAppDialog";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";

export default function ProfitLossDashboardPage() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <ProfitLossDashboardContent />
    </ModuleGuard>
  );
}

function ProfitLossDashboardContent() {
  const { formatCurrency, loading: currencyLoading } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<ProfitLossPeriod>(
    ProfitLossPeriod.MONTH,
  );
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  const {
    data: dashboardData,
    loading,
    refetch,
  } = useCachedApi<ProfitLossDashboard>(
    `profit_loss_dashboard_${selectedPeriod}_${customDateRange?.start || ""}_${customDateRange?.end || ""}`,
    () =>
      LedgerService.getProfitLossDashboard(
        selectedPeriod,
        customDateRange?.start,
        customDateRange?.end,
      ),
    { ttl: 300000 },
  );

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as ProfitLossPeriod);
    setCustomDateRange(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSendEmail = async (toEmail: string, message?: string) => {
    try {
      const response = await LedgerService.sendProfitLossReportEmail(
        selectedPeriod,
        customDateRange?.start,
        customDateRange?.end,
        toEmail,
        message,
      );

      if (response?.warning) {
        toast.warning(
          response.message ||
            "Report could not be sent. Please check SMTP configuration.",
        );
      } else {
        toast.success(
          response?.message || `Report sent successfully to ${toEmail}`,
        );
      }
    } catch (error: any) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to send report via email",
      );
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleSendWhatsApp = async (phoneNumber: string) => {
    try {
      const response = await LedgerService.sendProfitLossReportWhatsApp(
        selectedPeriod,
        customDateRange?.start,
        customDateRange?.end,
        phoneNumber,
      );
      window.open(response.whatsapp_url, "_blank");
      toast.success("Opening WhatsApp...");
    } catch (error: any) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to generate WhatsApp link",
      );
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDownloadReport = () => {
    if (!dashboardData) return;

    const reportData = {
      reportPeriod: getProfitLossPeriodLabel(selectedPeriod),
      dateRange: `${dashboardData.start_date || "N/A"} to ${dashboardData.end_date || "N/A"}`,
      generatedAt: new Date().toISOString(),
      ...dashboardData,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profit-loss-report-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartData =
    dashboardData?.daily_breakdown?.map(
      (item: {
        date: string;
        revenue: number;
        expenses: number;
        net_income: number;
      }) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sales: item.revenue,
        purchases: item.expenses,
        profit: item.net_income,
      }),
    ) || [];

  const pieData = dashboardData
    ? [
        {
          name: "Sales",
          value: dashboardData.summary?.total_sales || 0,
          color: "#10b981",
        },
        {
          name: "Purchases",
          value: dashboardData.summary?.total_purchases || 0,
          color: "#ef4444",
        },
        {
          name: "Inventory",
          value: dashboardData.summary?.inventory_value || 0,
          color: "#3b82f6",
        },
      ]
    : [];

  if (loading || currencyLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
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
            <h1 className="text-3xl font-bold tracking-tight">
              Profit & Loss Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive financial overview with sales, purchases, and
              inventory data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProfitLossPeriod.DAY}>Today</SelectItem>
                <SelectItem value={ProfitLossPeriod.WEEK}>This Week</SelectItem>
                <SelectItem value={ProfitLossPeriod.MONTH}>
                  This Month
                </SelectItem>
                <SelectItem value={ProfitLossPeriod.YEAR}>This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {dashboardData && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Sales
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData.summary?.total_sales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.sales?.total_invoices || 0} invoices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Purchases
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      dashboardData.summary?.total_purchases || 0,
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.purchases?.total_purchase_orders || 0} orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Investments
                  </CardTitle>
                  <Calculator className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      dashboardData.summary?.total_investments || 0,
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Capital invested
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Profit
                  </CardTitle>
                  <Calculator className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${(dashboardData.summary?.net_profit || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    {formatCurrency(dashboardData.summary?.net_profit || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payments - Purchases
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Profit After Investment
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${(dashboardData.summary?.profit_after_investment || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(
                      dashboardData.summary?.profit_after_investment || 0,
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Net Profit - Investments
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>
                    Invoice and payment statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.sales?.paid_invoices || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Paid Invoices
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData.sales?.pending_invoices || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pending Invoices
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.sales?.overdue_invoices || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Overdue Invoices
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          dashboardData.sales?.total_payments_received || 0,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Payments Received
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Overview</CardTitle>
                  <CardDescription>Purchase order statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.purchases?.completed_purchases || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Completed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData.purchases?.pending_purchases || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pending
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.purchases?.total_purchase_orders || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Orders
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(
                          dashboardData.purchases?.total_purchases || 0,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Value
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Overview</CardTitle>
                  <CardDescription>Current inventory status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.inventory?.total_products || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Products
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(
                          dashboardData.inventory?.total_inventory_value || 0,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Inventory Value
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.inventory?.inbound_movements || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Inbound Movements
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.inventory?.outbound_movements || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Outbound Movements
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quotes & Contracts</CardTitle>
                  <CardDescription>Sales pipeline overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.quotes_contracts?.total_quotes || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Quotes
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(
                          dashboardData.quotes_contracts?.quotes_value || 0,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Quotes Value
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.quotes_contracts?.total_contracts || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Contracts
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(
                          dashboardData.quotes_contracts?.contracts_value || 0,
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Contracts Value
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Performance</CardTitle>
                  <CardDescription>
                    Sales, purchases, and profit trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                  <CardDescription>
                    Sales vs purchases vs inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Share Report</CardTitle>
                <CardDescription>
                  Export or share this profit/loss report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setEmailDialogOpen(true)}
                    variant="outline"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send via Email
                  </Button>
                  <Button
                    onClick={() => setWhatsappDialogOpen(true)}
                    variant="outline"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send via WhatsApp
                  </Button>
                  <Button onClick={handleDownloadReport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <SendProfitLossEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          period={selectedPeriod}
          startDate={customDateRange?.start}
          endDate={customDateRange?.end}
          onSend={handleSendEmail}
        />

        <SendProfitLossWhatsAppDialog
          open={whatsappDialogOpen}
          onOpenChange={setWhatsappDialogOpen}
          period={selectedPeriod}
          startDate={customDateRange?.start}
          endDate={customDateRange?.end}
          onSend={handleSendWhatsApp}
        />
      </div>
    </DashboardLayout>
  );
}
