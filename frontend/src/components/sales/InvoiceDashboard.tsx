"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Wallet,
  ShoppingCart,
  ArrowDownRight,
  Package,
  CircleDollarSign,
} from "lucide-react";
import { InvoiceDashboard as InvoiceDashboardType } from "../../models/sales";
import InvoiceService from "../../services/InvoiceService";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { cn } from "@/src/lib/utils";

interface InvoiceDashboardProps {
  dashboard: InvoiceDashboardType;
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

export function InvoiceDashboard({ dashboard }: InvoiceDashboardProps) {
  const { formatCurrency } = useCurrency();
  const {
    metrics,
    recentInvoices,
    overdueInvoices,
    topCustomers,
    monthlyRevenue,
    recentPurchaseOrders,
  } = dashboard;

  const netRevenuePositive = metrics.netRevenue >= 0;
  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((m) => m.revenue),
    1,
  );

  return (
    <div className="space-y-6">
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
              {formatCurrency(metrics.netRevenue)}
            </p>
            <p className="mt-2 text-sm text-white/85">
              After deducting{" "}
              <span className="font-semibold">
                {formatCurrency(metrics.purchaseOrderTotal)}
              </span>{" "}
              of purchase order spend
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold">
                {formatCurrency(metrics.totalRevenue)}
              </span>
              <span className="text-xs text-white/70">in revenue</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <ArrowDownRight className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold">
                {formatCurrency(metrics.purchaseOrderTotal)}
              </span>
              <span className="text-xs text-white/70">PO spend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconClass="bg-emerald-100"
          title="Total Revenue"
          amount={formatCurrency(metrics.totalRevenue)}
          caption={`From ${metrics.paidInvoices} paid invoices`}
          amountClass="text-emerald-600"
          accentClass=""
        />

        <FinancialCard
          icon={<ShoppingCart className="h-5 w-5 text-purple-600" />}
          iconClass="bg-purple-100"
          title="PO Spend"
          amount={formatCurrency(metrics.purchaseOrderTotal)}
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
          amount={formatCurrency(metrics.outstandingAmount)}
          caption="Awaiting payment"
          amountClass="text-orange-600"
          accentClass=""
        />

        <FinancialCard
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          iconClass="bg-red-100"
          title="Overdue Amount"
          amount={formatCurrency(metrics.overdueAmount)}
          caption="Past due date"
          amountClass="text-red-600"
          accentClass=""
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          iconClass="bg-blue-100"
          accent="bg-gradient-to-r from-blue-500 to-sky-400"
          label="Total Invoices"
          value={metrics.totalInvoices.toLocaleString()}
          sub="All time"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          iconClass="bg-green-100"
          accent="bg-gradient-to-r from-green-500 to-emerald-400"
          label="Paid Invoices"
          value={metrics.paidInvoices.toLocaleString()}
          sub="Settled in full"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          iconClass="bg-red-100"
          accent="bg-gradient-to-r from-red-500 to-rose-400"
          label="Overdue Invoices"
          value={metrics.overdueInvoices.toLocaleString()}
          sub="Need attention"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-gray-600" />}
          iconClass="bg-gray-100"
          accent="bg-gradient-to-r from-gray-400 to-slate-300"
          label="Draft Invoices"
          value={metrics.draftInvoices.toLocaleString()}
          sub="Not yet sent"
        />
      </div>

      {/* Purchase Order History */}
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
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(metrics.purchaseOrderTotal)}
            </span>
            <span className="text-xs text-muted-foreground">
              total committed
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {recentPurchaseOrders.length === 0 ? (
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
              {recentPurchaseOrders.map((po) => {
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
                      <Badge className={cn("border-0", statusStyle.className)}>
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
      </Card>

      {/* Recent Activity and Top Customers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                <FileText className="h-4 w-4" />
              </div>
              Recent Invoices
            </CardTitle>
            <CardDescription className="text-sm">
              Latest invoices created in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2.5">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-3.5 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/40"
                >
                  <div className="min-w-0">
                    <h4 className="truncate font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </h4>
                    <p className="truncate text-sm text-muted-foreground">
                      {invoice.customerName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </p>
                    <Badge
                      className={cn(
                        "mt-1 border-0",
                        InvoiceService.getStatusColor(invoice.status),
                      )}
                    >
                      {InvoiceService.getStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 text-white">
                <Users className="h-4 w-4" />
              </div>
              Top Customers
            </CardTitle>
            <CardDescription className="text-sm">
              Customers with highest invoice values
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2.5">
              {topCustomers.map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-3.5 transition-all duration-200 hover:border-orange-100 hover:bg-orange-50/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 text-sm font-bold text-white">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-medium text-gray-900">
                        {customer.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {customer.count} invoices
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(customer.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-400 text-white">
              <BarChart3 className="h-4 w-4" />
            </div>
            Monthly Revenue Trend
          </CardTitle>
          <CardDescription className="text-sm">
            Revenue performance over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex h-64 items-end justify-between gap-2">
            {monthlyRevenue.map((month) => (
              <div
                key={month.month}
                className="group flex flex-1 flex-col items-center"
              >
                <p className="mb-2 text-xs font-semibold text-gray-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {formatCurrency(month.revenue)}
                </p>
                <div
                  className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-300 group-hover:from-indigo-600 group-hover:to-violet-500"
                  style={{
                    height: `${Math.max((month.revenue / maxMonthlyRevenue) * 200, 12)}px`,
                  }}
                ></div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {month.month}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Invoices Alert */}
      {overdueInvoices.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Overdue Invoices Require Attention
            </CardTitle>
            <CardDescription>
              {overdueInvoices.length} invoice(s) are past their due date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-white p-3.5"
                >
                  <div className="min-w-0">
                    <h4 className="truncate font-medium text-gray-900">
                      {invoice.invoiceNumber} - {invoice.customerName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {InvoiceService.formatDate(invoice.dueDate)} •{" "}
                      {InvoiceService.getDaysOverdue(invoice.dueDate)} days
                      overdue
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-red-600">
                      {formatCurrency(invoice.total)}
                    </p>
                  </div>
                </div>
              ))}
              {overdueInvoices.length > 3 && (
                <p className="text-center text-sm text-muted-foreground">
                  And {overdueInvoices.length - 3} more overdue invoices...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
