"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useAuth } from "@/src/hooks/useAuth";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { apiService } from "@/src/services/ApiService";
import {
  POSTransaction,
  POSTransactionStatus,
  POSPaymentMethod,
} from "@/src/models/pos";
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Calendar,
  ShoppingCart,
  Package,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout";
import { toast } from "sonner";

const POSTransactions = () => {
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    POSTransactionStatus | "all"
  >("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    POSPaymentMethod | "all"
  >("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<POSTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await apiService.get("/pos/transactions");
      setTransactions(response.transactions || []);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to load transactions";
      toast.error(`Load Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (transaction: POSTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.transactionNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.cashierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;

    const matchesPaymentMethod =
      selectedPaymentMethod === "all" ||
      transaction.paymentMethod === selectedPaymentMethod;

    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: POSTransactionStatus) => {
    switch (status) {
      case POSTransactionStatus.COMPLETED:
        return "bg-green-100 text-green-800";
      case POSTransactionStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case POSTransactionStatus.CANCELLED:
        return "bg-red-100 text-red-800";
      case POSTransactionStatus.REFUNDED:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method: POSPaymentMethod) => {
    switch (method) {
      case POSPaymentMethod.CASH:
        return <ShoppingCart className="h-4 w-4" />;
      case POSPaymentMethod.CREDIT_CARD:
      case POSPaymentMethod.DEBIT_CARD:
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              POS Transactions
            </h1>
            <p className="text-muted-foreground">
              View and manage all point of sale transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value: string) =>
                    setSelectedStatus(value as POSTransactionStatus | "all")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(POSTransactionStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={(value: string) =>
                    setSelectedPaymentMethod(value as POSPaymentMethod | "all")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {Object.values(POSPaymentMethod).map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() +
                          method.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                    setSelectedPaymentMethod("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Receipt className="h-6 w-6 text-blue-600" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">
                          #{transaction.transactionNumber}
                        </h3>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span>Cashier:</span>
                          <span className="font-medium">
                            {transaction.cashierName}
                          </span>
                        </div>

                        {transaction.customerName && (
                          <div className="flex items-center space-x-1">
                            <span>Customer:</span>
                            <span className="font-medium">
                              {transaction.customerName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(transaction.total)}
                    </div>

                    <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span>{transaction.paymentMethod.replace("_", " ")}</span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {transaction.items.length} items
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(transaction)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No transactions found
            </h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ||
              selectedStatus !== "all" ||
              selectedPaymentMethod !== "all"
                ? "Try adjusting your filters or search terms."
                : "No transactions have been made yet."}
            </p>
          </div>
        )}

        {/* Transaction Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Transaction Details - #{selectedTransaction?.transactionNumber}
              </DialogTitle>
              <DialogDescription>
                Complete information about this transaction
              </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Transaction Number
                    </Label>
                    <p className="font-semibold">
                      #{selectedTransaction.transactionNumber}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <Badge
                      className={getStatusColor(selectedTransaction.status)}
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Date & Time
                    </Label>
                    <p>{formatDate(selectedTransaction.createdAt)}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Cashier
                    </Label>
                    <p>{selectedTransaction.cashierName}</p>
                  </div>

                  {selectedTransaction.customerName && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Customer
                      </Label>
                      <p>{selectedTransaction.customerName}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Payment Method
                    </Label>
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <span>
                        {selectedTransaction.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Items
                  </Label>
                  <div className="space-y-2 mt-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.unitPrice)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total: {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>
                        {formatCurrency(selectedTransaction.subtotal)}
                      </span>
                    </div>

                    {selectedTransaction.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>
                          -{formatCurrency(selectedTransaction.discount)}
                        </span>
                      </div>
                    )}

                    {selectedTransaction.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>
                          {formatCurrency(selectedTransaction.taxAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedTransaction.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default POSTransactions;
