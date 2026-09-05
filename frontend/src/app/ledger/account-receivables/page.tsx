"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/layout";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { AlertCircle, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { accountReceivableService } from "@/src/services/AccountReceivableService";
import {
  AccountReceivable,
  AccountReceivableStatus,
  getAccountReceivableStatusLabel,
  getAccountReceivableStatusColor,
} from "@/src/models/ledger";
import { toast } from "sonner";
import { formatDate } from "@/src/lib/utils";
import { extractErrorMessage } from "@/src/utils/errorUtils";

export default function AccountReceivablesPage() {
  return (
    <ModuleGuard
      module="ledger"
      fallback={<div>You don&apos;t have access to Ledger module</div>}
    >
      <AccountReceivablesContent />
    </ModuleGuard>
  );
}

function AccountReceivablesContent() {
  const { formatCurrency } = useCurrency();
  const [accountReceivables, setAccountReceivables] = useState<
    AccountReceivable[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    AccountReceivableStatus | "all"
  >("all");

  useEffect(() => {
    loadAccountReceivables();
  }, [filterStatus]);

  const loadAccountReceivables = async () => {
    try {
      setLoading(true);
      const status = filterStatus === "all" ? undefined : filterStatus;
      const response = await accountReceivableService.getAccountReceivables(
        status as AccountReceivableStatus,
      );
      setAccountReceivables(response.account_receivables || []);
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to load account receivables"),
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalOutstanding = accountReceivables.reduce(
      (sum, ar) =>
        sum +
        (ar.status !== AccountReceivableStatus.PAID
          ? ar.outstanding_balance
          : 0),
      0,
    );
    const totalOverdue = accountReceivables.reduce(
      (sum, ar) =>
        sum +
        (ar.status === AccountReceivableStatus.OVERDUE
          ? ar.outstanding_balance
          : 0),
      0,
    );
    const totalPaid = accountReceivables.reduce(
      (sum, ar) =>
        sum +
        (ar.status === AccountReceivableStatus.PAID ? ar.invoice_amount : 0),
      0,
    );

    return { totalOutstanding, totalOverdue, totalPaid };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Credit book (Account Receivable)
            </h1>
            <p className="text-muted-foreground">
              Track outstanding payments from customers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Outstanding
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground">Unpaid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalOverdue)}
              </div>
              <p className="text-xs text-muted-foreground">Past due payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed payments
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Account Receivables</CardTitle>
              <Select
                value={filterStatus}
                onValueChange={(value) =>
                  setFilterStatus(value as AccountReceivableStatus | "all")
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={AccountReceivableStatus.PENDING}>
                    Pending
                  </SelectItem>
                  <SelectItem value={AccountReceivableStatus.PARTIALLY_PAID}>
                    Partially Paid
                  </SelectItem>
                  <SelectItem value={AccountReceivableStatus.OVERDUE}>
                    Overdue
                  </SelectItem>
                  <SelectItem value={AccountReceivableStatus.PAID}>
                    Paid
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountReceivables.map((ar) => (
                  <TableRow key={ar.id}>
                    <TableCell className="font-medium">
                      {ar.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ar.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {ar.customer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(ar.invoice_date)}</TableCell>
                    <TableCell>{formatDate(ar.due_date)}</TableCell>
                    <TableCell>{formatCurrency(ar.invoice_amount)}</TableCell>
                    <TableCell>{formatCurrency(ar.amount_paid)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(ar.outstanding_balance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getAccountReceivableStatusColor(ar.status)}
                      >
                        {getAccountReceivableStatusLabel(ar.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ar.days_overdue > 0 ? (
                        <span className="text-red-600 font-medium">
                          {ar.days_overdue} days
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {accountReceivables.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No account receivables found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Credit invoices will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
