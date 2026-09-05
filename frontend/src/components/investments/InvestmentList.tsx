"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  investmentService,
  Investment,
  InvestmentDashboardStats,
} from "../../services/InvestmentService";
import { toast } from "sonner";
import InvestmentForm from "./InvestmentForm";
import InvestmentDetails from "./InvestmentDetails";
import {
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  CreditCard,
  Building,
  Check,
  X,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";

export default function InvestmentList() {
  const { getCurrencySymbol } = useCurrency();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<InvestmentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null,
  );
  const [viewingInvestment, setViewingInvestment] = useState<Investment | null>(
    null,
  );
  const [deletingInvestment, setDeletingInvestment] =
    useState<Investment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchInvestments();
    fetchStats();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await investmentService.getInvestments();
      setInvestments(response.investments);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await investmentService.getInvestmentDashboardStats();
      setStats(response);
    } catch (error) {}
  };

  const handleApproveInvestment = async (investmentId: string) => {
    try {
      await investmentService.approveInvestment(investmentId);
      await fetchInvestments();
      await fetchStats();
    } catch (error) {}
  };

  const handleCancelInvestment = async (investmentId: string) => {
    try {
      await investmentService.updateInvestment(investmentId, {
        status: "cancelled",
      });
      await fetchInvestments();
      await fetchStats();
    } catch (error) {}
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      cancelled: "destructive",
      failed: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cash_investment":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "card_transfer":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank_transfer":
        return <Building className="h-4 w-4 text-purple-600" />;
      case "equipment_purchase":
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      cash_investment: "Cash Investment",
      card_transfer: "Card Transfer",
      bank_transfer: "Bank Transfer",
      equipment_purchase: "Equipment Purchase",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredInvestments = investments.filter((investment) => {
    const matchesSearch =
      investment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.investment_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      investment.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || investment.status === statusFilter;
    const matchesType =
      typeFilter === "all" || investment.investment_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleFormSuccess = () => {
    fetchInvestments();
    fetchStats();
    setEditingInvestment(null);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsFormOpen(true);
  };

  const handleView = (investment: Investment) => {
    setViewingInvestment(investment);
  };

  const handleDelete = (investment: Investment) => {
    setDeletingInvestment(investment);
  };

  const confirmDelete = async () => {
    if (!deletingInvestment) return;

    try {
      await investmentService.deleteInvestment(deletingInvestment.id);
      await fetchInvestments();
      await fetchStats();
      setDeletingInvestment(null);
    } catch (error) {
      toast.error("Failed to delete investment. Please try again.");
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingInvestment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading investments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
          <p className="text-muted-foreground">
            Track external capital investments and equipment purchases
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Investment
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Investments
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_investments}
              </div>
              <p className="text-xs text-muted-foreground">
                {getCurrencySymbol()}
                {stats.total_amount.toLocaleString()} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pending_investments}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCurrencySymbol()}
                {stats.monthly_investments.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly investment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.equipment_investments}
              </div>
              <p className="text-xs text-muted-foreground">
                Equipment purchases
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by description, reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cash_investment">Cash Investment</SelectItem>
                <SelectItem value="card_transfer">Card Transfer</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="equipment_purchase">
                  Equipment Purchase
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvestments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">
                    {investment.investment_number}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(investment.investment_type)}
                      <span>{getTypeLabel(investment.investment_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(
                        investment.investment_date,
                      ).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getCurrencySymbol()}
                    {investment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {investment.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(investment.status)}
                      {getStatusBadge(investment.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {investment.reference_number && (
                      <div className="text-sm text-muted-foreground">
                        {investment.reference_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(investment)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {investment.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(investment)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                      {investment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleApproveInvestment(investment.id)
                            }
                            className="h-8 px-2 text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCancelInvestment(investment.id)
                            }
                            className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {investment.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(investment)}
                          className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                      {investment.status === "completed" && (
                        <>
                          <span className="text-sm text-green-600 font-medium whitespace-nowrap">
                            Approved
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(investment)}
                            className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      {investment.status === "cancelled" && (
                        <span className="text-sm text-red-600 font-medium">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvestments.length === 0 && (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No investments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first investment"}
              </p>
              {!searchTerm &&
                statusFilter === "all" &&
                typeFilter === "all" && (
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Investment
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment Form Modal */}
      <InvestmentForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        editingInvestment={editingInvestment}
      />

      {/* Investment Details Modal */}
      <InvestmentDetails
        investment={viewingInvestment}
        isOpen={!!viewingInvestment}
        onClose={() => setViewingInvestment(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingInvestment}
        onOpenChange={() => setDeletingInvestment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Investment</DialogTitle>
            <DialogDescription>
              {deletingInvestment?.status === "completed"
                ? "This approved investment will be removed and its linked investment transactions will be deleted. This cannot be undone."
                : "Are you sure you want to delete this investment? This action cannot be undone."}
              {deletingInvestment && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">
                    {deletingInvestment.investment_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deletingInvestment.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {getCurrencySymbol()}
                    {deletingInvestment.amount.toLocaleString()}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingInvestment(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Investment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
