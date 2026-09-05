"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Banknote,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../lib/utils";
import { apiService } from "../../../services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";

interface BankTransaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  is_reconciled: boolean;
  reconciled_date?: string;
  reconciled_by?: string;
  bank_account_id: string;
  bank_account?: {
    account_name: string;
    bank_name: string;
  };
}

interface ReconciliationSummary {
  total_transactions: number;
  reconciled_transactions: number;
  unreconciled_transactions: number;
  reconciliation_percentage: number;
  last_reconciliation_date?: string;
}

export default function ReconciliationPage() {
  return (
    <ModuleGuard
      module="banking"
      fallback={<div>You don&apos;t have access to Banking module</div>}
    >
      <ReconciliationContent />
    </ModuleGuard>
  );
}

const ReconciliationContent = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] =
    useState<BankTransaction | null>(null);
  const [reconciliationNotes, setReconciliationNotes] = useState("");
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const statuses = [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled",
    "reversed",
  ];

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [currentPage, accountFilter, statusFilter, dateFrom, dateTo]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        skip: ((currentPage - 1) * 20).toString(),
        limit: "20",
        ...(accountFilter &&
          accountFilter !== "all" && { account_id: accountFilter }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(dateFrom && { start_date: dateFrom.toISOString() }),
        ...(dateTo && { end_date: dateTo.toISOString() }),
      });

      const response = await apiService.get(`/banking/transactions?${params}`);

      if (response.success) {
        setTransactions(response.bank_transactions || []);
        setTotalCount(response.total || 0);
        setTotalPages(Math.ceil((response.total || 0) / 20));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await apiService.get("/banking/reconciliation/summary");
      if (response.success) {
        setSummary(response);
      }
    } catch (error) {}
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleReconcile = async (transactionId: string) => {
    try {
      const response = await apiService.post(
        `/banking/transactions/${transactionId}/reconcile`,
        {
          bank_transaction_id: transactionId,
          is_reconciled: true,
          notes: reconciliationNotes,
        },
      );

      if (response.success) {
        setReconcileDialogOpen(false);
        setReconciliationNotes("");
        setSelectedTransaction(null);
        fetchTransactions();
        fetchSummary();
      }
    } catch (error) {}
  };

  const handleUnreconcile = async (transactionId: string) => {
    try {
      const response = await apiService.post(
        `/banking/transactions/${transactionId}/reconcile`,
        {
          bank_transaction_id: transactionId,
          is_reconciled: false,
          notes: "Unreconciled",
        },
      );

      if (response.success) {
        fetchTransactions();
        fetchSummary();
      }
    } catch (error) {}
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setAccountFilter("");
    setStatusFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: RefreshCw },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      reversed: { color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn("flex items-center gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "deposit":
      case "transfer_in":
      case "refund":
      case "interest":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "withdrawal":
      case "transfer_out":
      case "payment":
      case "fee":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bank Reconciliation
            </h1>
            <p className="text-gray-600 mt-1">
              Reconcile bank transactions with your records
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", refreshing && "animate-spin")}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.total_transactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Reconciled
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.reconciled_transactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Unreconciled
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.unreconciled_transactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Reconciliation %
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.reconciliation_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateFrom ? dateFrom.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setDateFrom(
                      e.target.value ? new Date(e.target.value) : undefined,
                    )
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateTo ? dateTo.toISOString().split("T")[0] : ""}
                  onChange={(e) =>
                    setDateTo(
                      e.target.value ? new Date(e.target.value) : undefined,
                    )
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reconciliation</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All transactions</SelectItem>
                    <SelectItem value="unreconciled">
                      Unreconciled only
                    </SelectItem>
                    <SelectItem value="reconciled">Reconciled only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mt-4">
              <Button onClick={handleSearch}>Apply Filters</Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Transactions ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reconciled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getTransactionTypeIcon(
                              transaction.transaction_type,
                            )}
                            <span className="text-sm">
                              {transaction.transaction_number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(transaction.transaction_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.transaction_type
                              .replace("_", " ")
                              .toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "font-medium",
                            [
                              "deposit",
                              "transfer_in",
                              "refund",
                              "interest",
                            ].includes(
                              transaction.transaction_type.toLowerCase(),
                            )
                              ? "text-green-600"
                              : "text-red-600",
                          )}
                        >
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency,
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {transaction.bank_account?.account_name || "N/A"}
                            </div>
                            <div className="text-gray-500">
                              {transaction.bank_account?.bank_name || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {transaction.is_reconciled ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Reconciled
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!transaction.is_reconciled ? (
                            <Dialog
                              open={reconcileDialogOpen}
                              onOpenChange={setReconcileDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedTransaction(transaction)
                                  }
                                >
                                  Reconcile
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Reconcile Transaction
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm font-medium">
                                      Transaction Details
                                    </p>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                      <p>
                                        <strong>ID:</strong>{" "}
                                        {
                                          selectedTransaction?.transaction_number
                                        }
                                      </p>
                                      <p>
                                        <strong>Amount:</strong>{" "}
                                        {formatCurrency(
                                          selectedTransaction?.amount || 0,
                                          selectedTransaction?.currency ||
                                            "USD",
                                        )}
                                      </p>
                                      <p>
                                        <strong>Description:</strong>{" "}
                                        {selectedTransaction?.description}
                                      </p>
                                      <p>
                                        <strong>Date:</strong>{" "}
                                        {selectedTransaction &&
                                          formatDate(
                                            selectedTransaction.transaction_date,
                                          )}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Reconciliation Notes
                                    </label>
                                    <Textarea
                                      placeholder="Add notes about this reconciliation..."
                                      value={reconciliationNotes}
                                      onChange={(e) =>
                                        setReconciliationNotes(e.target.value)
                                      }
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <Button
                                      onClick={() =>
                                        selectedTransaction &&
                                        handleReconcile(selectedTransaction.id)
                                      }
                                      className="flex-1"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Confirm Reconciliation
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        setReconcileDialogOpen(false)
                                      }
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnreconcile(transaction.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Unreconcile
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {transactions.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * 20 + 1} to{" "}
                  {Math.min(currentPage * 20, totalCount)} of {totalCount}{" "}
                  transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
