"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import InvoiceService from "../../services/InvoiceService";
import { cn } from "@/src/lib/utils";
import {
  Factory,
  Users,
  TrendingUp,
  CheckCircle2,
  Package,
  BarChart3,
  Plus,
  Activity,
  Target,
  Zap,
  DollarSign,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Wallet,
  ArrowDownRight,
  FileText,
  Clock,
  CircleDollarSign,
  Boxes,
  Layers,
} from "lucide-react";

interface WorkshopFinancials {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
}

interface WorkshopPurchaseOrders {
  stats: {
    total: number;
    committed: number;
    received: number;
    pending: number;
    committedAmount: number;
  };
  recent: Array<{
    id: string;
    orderNumber: string;
    supplierName: string;
    orderDate: string | null;
    status: string;
    totalAmount: number;
    createdAt: string | null;
  }>;
}

interface WorkshopInvoices {
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
  amounts: {
    total: number;
    paid: number;
    outstanding: number;
  };
}

interface WorkshopStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  qualityIssues?: number;
  productionEfficiency?: number;
  totalJobCards?: number;
  activeJobCards?: number;
  completedJobCards?: number;
  financials?: WorkshopFinancials;
  invoices?: WorkshopInvoices;
  purchaseOrders?: WorkshopPurchaseOrders;
}

interface WorkshopDashboardProps {
  stats: WorkshopStats;
  onNavigate: (path: string) => void;
}

const PO_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", className: "bg-indigo-100 text-indigo-700" },
  ordered: { label: "Ordered", className: "bg-purple-100 text-purple-700" },
  arrived: { label: "Arrived", className: "bg-cyan-100 text-cyan-700" },
  partially_received: {
    label: "Partially Received",
    className: "bg-amber-100 text-amber-700",
  },
  received: { label: "Received", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

function getPoStatusStyle(status: string) {
  return (
    PO_STATUS_STYLES[status] ?? {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      className: "bg-gray-100 text-gray-700",
    }
  );
}

function CollapseToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={open ? "Collapse section" : "Expand section"}
      className="text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
    >
      {open ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </Button>
  );
}

function FinancialCard({
  icon,
  title,
  amount,
  caption,
  iconClass,
  amountClass,
  accentClass,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  amount: string;
  caption: string;
  iconClass: string;
  amountClass: string;
  accentClass: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        accentClass,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              iconClass,
            )}
          >
            {icon}
          </div>
          {badge}
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p
          className={cn("mt-1 text-2xl font-bold tracking-tight", amountClass)}
        >
          {amount}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  iconClass,
  valueClass,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  iconClass: string;
  valueClass?: string;
  accent: string;
}) {
  return (
    <Card className="group overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={cn("h-1 w-full", accent)} />
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              iconClass,
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "mt-1 truncate text-2xl font-bold tracking-tight text-gray-900",
                valueClass,
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {sub}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkshopDashboard({
  stats,
  onNavigate,
}: WorkshopDashboardProps) {
  const { formatCurrency } = useCurrency();
  const productionEfficiency = stats.productionEfficiency ?? 0;
  const qualityIssues = stats.qualityIssues || 0;
  const [poHistoryOpen, setPoHistoryOpen] = useState(false);
  const [invoiceOverviewOpen, setInvoiceOverviewOpen] = useState(false);
  const [recentActivityOpen, setRecentActivityOpen] = useState(false);

  const financials = stats.financials ?? {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    monthlyTrend: [],
  };
  const purchaseOrders = stats.purchaseOrders ?? {
    stats: {
      total: 0,
      committed: 0,
      received: 0,
      pending: 0,
      committedAmount: 0,
    },
    recent: [],
  };
  const invoices = stats.invoices ?? {
    invoices: { total: 0, draft: 0, sent: 0, paid: 0, overdue: 0 },
    amounts: { total: 0, paid: 0, outstanding: 0 },
  };

  const netRevenuePositive = financials.netIncome >= 0;
  const maxTrendValue = Math.max(
    ...financials.monthlyTrend.flatMap((m) => [m.revenue, m.expenses]),
    1,
  );

  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  const handleCreateProject = () => onNavigate("/projects");
  const handleAddInvestment = () => onNavigate("/ledger/investments");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Workshop Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time manufacturing operations & analytics
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCreateProject}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Hero: Net Revenue */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-0 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl",
          netRevenuePositive
            ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
            : "bg-gradient-to-br from-rose-600 via-red-600 to-orange-600",
        )}
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-white/90" />
              <p className="text-sm font-medium uppercase tracking-widest text-white/80">
                Net Revenue
              </p>
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {formatCurrency(financials.netIncome)}
            </p>
            <p className="mt-2 text-sm text-white/85">
              After deducting{" "}
              <span className="font-semibold">
                {formatCurrency(financials.totalExpenses)}
              </span>{" "}
              of purchase order spend
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold">
                {formatCurrency(financials.totalRevenue)}
              </span>
              <span className="text-xs text-white/70">in revenue</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <ArrowDownRight className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold">
                {formatCurrency(financials.totalExpenses)}
              </span>
              <span className="text-xs text-white/70">PO spend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconClass="bg-emerald-100"
          title="Total Revenue"
          amount={formatCurrency(financials.totalRevenue)}
          caption={`From ${invoices.invoices.paid} paid invoices`}
          amountClass="text-emerald-600"
          accentClass=""
        />

        <FinancialCard
          icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          iconClass="bg-purple-100"
          title="PO Spend"
          amount={formatCurrency(purchaseOrders.stats.committedAmount)}
          caption="Committed purchase orders"
          amountClass="text-purple-600"
          accentClass=""
          badge={
            <Badge className="border-0 bg-purple-50 text-purple-700">
              Cash out
            </Badge>
          }
        />

        <FinancialCard
          icon={<FileText className="h-5 w-5 text-orange-600" />}
          iconClass="bg-orange-100"
          title="Outstanding Amount"
          amount={formatCurrency(invoices.amounts.outstanding)}
          caption="Awaiting payment"
          amountClass="text-orange-600"
          accentClass=""
        />

        <FinancialCard
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          iconClass="bg-red-100"
          title="Overdue Invoices"
          amount={invoices.invoices.overdue.toLocaleString()}
          caption="Past due date"
          amountClass="text-red-600"
          accentClass=""
        />
      </div>

      {/* Project & operations stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Activity className="h-5 w-5 text-indigo-600" />}
          iconClass="bg-indigo-100"
          accent="bg-gradient-to-r from-indigo-500 to-violet-400"
          label="Active Job Cards"
          value={(stats.activeJobCards ?? 0).toLocaleString()}
          sub={`${stats.totalJobCards ?? 0} total job cards`}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
          iconClass="bg-blue-100"
          accent="bg-gradient-to-r from-blue-500 to-sky-400"
          label="Completed"
          value={(stats.completedJobCards ?? 0).toLocaleString()}
          sub="Finished job cards"
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-emerald-600" />}
          iconClass="bg-emerald-100"
          accent="bg-gradient-to-r from-emerald-500 to-green-400"
          label="Efficiency"
          value={`${productionEfficiency}%`}
          sub={`Target: 90% • average progress ${stats.averageProgress}%`}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          iconClass="bg-purple-100"
          accent="bg-gradient-to-r from-purple-500 to-pink-400"
          label="Team Size"
          value={stats.totalTeamMembers.toLocaleString()}
          sub="Active members"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly cash flow chart */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-400 text-white">
                  <BarChart3 className="h-4 w-4" />
                </div>
                Monthly Cash Flow
              </CardTitle>
              <CardDescription className="text-sm">
                Revenue vs purchase order spend over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {financials.monthlyTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                    <BarChart3 className="h-6 w-6 text-indigo-400" />
                  </div>
                  <p className="mt-2 font-medium text-gray-900">
                    No financial data yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Revenue and purchase order activity will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      Revenue
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                      PO Spend
                    </div>
                  </div>
                  <div className="flex h-56 items-end justify-between gap-2">
                    {financials.monthlyTrend.map((month) => (
                      <div
                        key={month.month}
                        className="group flex flex-1 flex-col items-center"
                      >
                        <div className="flex w-full flex-1 items-end justify-center gap-1">
                          <div
                            className="w-full max-w-[24px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-300 group-hover:from-indigo-600 group-hover:to-violet-500"
                            style={{
                              height: `${Math.max((month.revenue / maxTrendValue) * 140, 8)}px`,
                            }}
                            title={`Revenue: ${formatCurrency(month.revenue)}`}
                          ></div>
                          <div
                            className="w-full max-w-[24px] rounded-t-lg bg-gradient-to-t from-purple-400 to-fuchsia-300 transition-all duration-300 group-hover:from-purple-500 group-hover:to-fuchsia-400"
                            style={{
                              height: `${Math.max((month.expenses / maxTrendValue) * 140, 8)}px`,
                            }}
                            title={`PO Spend: ${formatCurrency(month.expenses)}`}
                          ></div>
                        </div>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          {month.month}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality overview */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 text-white">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    Quality Overview
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Quality issues requiring attention
                  </CardDescription>
                </div>
                <Button
                  onClick={() =>
                    onNavigate("/workshop-management/quality-control")
                  }
                  variant="ghost"
                  size="sm"
                  className="text-amber-600"
                >
                  Manage
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg hover:bg-amber-50 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">
                    Open Quality Issues
                  </span>
                </div>
                <Badge variant="destructive">{qualityIssues}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => onNavigate("/workshop-management/job-cards")}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-indigo-50 hover:border-indigo-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Factory className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Job Cards</div>
                    <div className="text-xs text-muted-foreground">
                      Workshop jobs
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={() => onNavigate("/inventory/purchase-orders")}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-purple-50 hover:border-purple-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Purchase Orders</div>
                    <div className="text-xs text-muted-foreground">
                      {purchaseOrders.stats.total} total orders
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={() => onNavigate("/inventory")}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-blue-50 hover:border-blue-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Inventory</div>
                    <div className="text-xs text-muted-foreground">
                      Stock management
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              <Button
                onClick={handleAddInvestment}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Add Investment</div>
                    <div className="text-xs text-muted-foreground">
                      Track expenses
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Performance overview */}
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100">Overall Progress</span>
                  <span className="font-bold text-lg">
                    {stats.averageProgress}%
                  </span>
                </div>
                <Progress
                  value={stats.averageProgress}
                  className="h-2 bg-indigo-400/30"
                />

                <div className="flex items-center justify-between pt-2 border-t border-indigo-400/30">
                  <span className="text-indigo-100">This Week</span>
                  <span className="font-bold">{productionEfficiency}%</span>
                </div>
                <Progress
                  value={productionEfficiency}
                  className="h-2 bg-indigo-400/30"
                />

                <div className="flex items-center justify-between pt-2 border-t border-indigo-400/30">
                  <span className="text-indigo-100">Completion Rate</span>
                  <span className="font-bold">{completionRate}%</span>
                </div>
                <Progress
                  value={completionRate}
                  className="h-2 bg-indigo-400/30"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Purchase order history */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                <Package className="h-4 w-4" />
              </div>
              Purchase Order History
            </CardTitle>
            <CardDescription className="text-sm">
              Track where the cash is going — every committed PO at a glance
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(purchaseOrders.stats.committedAmount)}
              </span>
              <span className="text-xs text-muted-foreground">
                total committed
              </span>
            </div>
            <Button
              onClick={() => onNavigate("/inventory/purchase-orders")}
              variant="outline"
              size="sm"
              className="text-purple-600"
            >
              View all
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <CollapseToggle
              open={poHistoryOpen}
              onClick={() => setPoHistoryOpen((o) => !o)}
            />
          </div>
        </CardHeader>
        {poHistoryOpen && (
          <CardContent className="p-5">
            {purchaseOrders.recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                  <ShoppingCart className="h-6 w-6 text-purple-400" />
                </div>
                <p className="mt-2 font-medium text-gray-900">
                  No purchase orders yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Committed purchase orders will show up here so you can follow
                  company cash flow
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {purchaseOrders.recent.map((po) => {
                  const statusStyle = getPoStatusStyle(po.status);
                  return (
                    <div
                      key={po.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-3.5 transition-all duration-200 hover:border-purple-100 hover:bg-purple-50/40 hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {po.orderNumber}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {po.supplierName || "Unknown supplier"}
                          </p>
                        </div>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(po.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {po.orderDate
                            ? InvoiceService.formatDate(po.orderDate)
                            : "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          className={cn("border-0", statusStyle.className)}
                        >
                          {statusStyle.label}
                        </Badge>
                        <span className="text-sm font-bold text-gray-900 sm:hidden">
                          {formatCurrency(po.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Invoice snapshot */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                <FileText className="h-4 w-4" />
              </div>
              Invoice Overview
            </CardTitle>
            <CardDescription className="text-sm">
              Billing health across all invoices
            </CardDescription>
          </div>
          <Button
            onClick={() => onNavigate("/sales/invoice-dashboard")}
            variant="outline"
            size="sm"
            className="text-blue-600"
          >
            View dashboard
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <CollapseToggle
            open={invoiceOverviewOpen}
            onClick={() => setInvoiceOverviewOpen((o) => !o)}
          />
        </CardHeader>
        {invoiceOverviewOpen && (
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" />
                  Total
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {invoices.invoices.total}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  Sent
                </div>
                <div className="text-xl font-bold text-blue-700">
                  {invoices.invoices.sent}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Paid
                </div>
                <div className="text-xl font-bold text-emerald-700">
                  {invoices.invoices.paid}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 mb-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Overdue
                </div>
                <div className="text-xl font-bold text-red-700">
                  {invoices.invoices.overdue}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-orange-600 mb-1">
                  <Target className="h-3.5 w-3.5" />
                  Outstanding
                </div>
                <div className="text-base font-bold text-orange-700">
                  {formatCurrency(invoices.amounts.outstanding)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Boxes className="h-3.5 w-3.5" />
                  Draft
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {invoices.invoices.draft}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recent activity summary */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Recent Activity Summary
              </CardTitle>
              <CardDescription>Latest updates and milestones</CardDescription>
            </div>
            <CollapseToggle
              open={recentActivityOpen}
              onClick={() => setRecentActivityOpen((o) => !o)}
            />
          </div>
        </CardHeader>
        {recentActivityOpen && (
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">
                    Job Cards Completed
                  </span>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {stats.completedJobCards ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  All time
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Active Job Cards</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.activeJobCards ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  In progress now
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Purchase Orders</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {purchaseOrders.stats.total}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {purchaseOrders.stats.pending} pending
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">Net Revenue</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(financials.netIncome)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  After PO spend
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
