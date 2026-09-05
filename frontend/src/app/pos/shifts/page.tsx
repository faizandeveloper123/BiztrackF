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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useAuth } from "@/src/hooks/useAuth";
import { apiService } from "@/src/services/ApiService";
import { POSShift, POSShiftStatus } from "@/src/models/pos";
import { Clock, Plus, Search, Filter, Eye } from "lucide-react";
import { DashboardLayout } from "../../../components/layout";
import { useConfirm } from "@/src/contexts/ConfirmContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

const POSShifts = () => {
  const { canCreate, canUpdate } = useCrudPermissions("pos:shifts");
  const confirm = useConfirm();
  const {} = useAuth();
  const { formatCurrency } = useCurrency();
  const [shifts, setShifts] = useState<POSShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<POSShiftStatus | "all">(
    "all",
  );
  const [selectedShift, setSelectedShift] = useState<POSShift | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewShiftOpen, setIsNewShiftOpen] = useState(false);
  const [newShiftData, setNewShiftData] = useState({
    openingBalance: 0,
    notes: "",
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await apiService.get("/pos/shifts");
      setShifts(response.shifts || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    try {
      await apiService.post("/pos/shifts", {
        openingBalance: newShiftData.openingBalance,
        notes: newShiftData.notes,
      });

      setNewShiftData({
        openingBalance: 0,
        notes: "",
      });
      setIsNewShiftOpen(false);
      fetchShifts();
    } catch (error) {}
  };

  const handleCloseShift = async (shiftId: string) => {
    const ok = await confirm({
      description: "Are you sure you want to close this shift?",
      confirmLabel: "Close shift",
    });
    if (!ok) return;

    try {
      await apiService.put(`/pos/shifts/${shiftId}`, {
        status: "closed",
        closingBalance: 0, // This should be calculated from actual cash in drawer
        notes: "Shift closed",
      });
      fetchShifts();
    } catch (error) {}
  };

  const handleViewDetails = (shift: POSShift) => {
    setSelectedShift(shift);
    setIsDetailsOpen(true);
  };

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch =
      shift.shiftNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.cashierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || shift.status === selectedStatus;

    return matchesSearch && matchesStatus;
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

  const getStatusColor = (status: POSShiftStatus) => {
    switch (status) {
      case POSShiftStatus.OPEN:
        return "bg-green-100 text-green-800";
      case POSShiftStatus.CLOSED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">POS Shifts</h1>
            <p className="text-muted-foreground">
              Manage cashier shifts and track daily operations
            </p>
          </div>

          {canCreate() && (
            <Button onClick={() => setIsNewShiftOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Open New Shift
            </Button>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search shifts..."
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
                    setSelectedStatus(value as POSShiftStatus | "all")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(POSShiftStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shifts List */}
        <div className="space-y-4">
          {filteredShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">
                          Shift #{shift.shiftNumber}
                        </h3>
                        <Badge className={getStatusColor(shift.status)}>
                          {shift.status}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Cashier:</span>
                          <span className="font-medium">
                            {shift.cashierName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span>Opened:</span>
                          <span className="font-medium">
                            {formatDate(shift.openedAt)}
                          </span>
                        </div>

                        {shift.closedAt && (
                          <div className="flex items-center space-x-1">
                            <span>Closed:</span>
                            <span className="font-medium">
                              {formatDate(shift.closedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="text-lg font-semibold">
                      Opening: {formatCurrency(shift.openingBalance)}
                    </div>

                    {shift.closingBalance && (
                      <div className="text-lg font-semibold text-green-600">
                        Closing: {formatCurrency(shift.closingBalance)}
                      </div>
                    )}

                    {shift.status === POSShiftStatus.OPEN && (
                      <div className="text-sm text-muted-foreground">
                        Duration:{" "}
                        {Math.floor(
                          (Date.now() - new Date(shift.openedAt).getTime()) /
                            (1000 * 60 * 60),
                        )}
                        h
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(shift)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>

                    {shift.status === POSShiftStatus.OPEN && canUpdate() && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCloseShift(shift.id)}
                      >
                        Close Shift
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredShifts.length === 0 && (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No shifts found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm || selectedStatus !== "all"
                ? "Try adjusting your filters or search terms."
                : "No shifts have been created yet."}
            </p>
            {!searchTerm &&
              selectedStatus === "all" &&
              canCreate() && (
                <Button
                  onClick={() => setIsNewShiftOpen(true)}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Open First Shift
                </Button>
              )}
          </div>
        )}

        {/* New Shift Dialog */}
        <Dialog open={isNewShiftOpen} onOpenChange={setIsNewShiftOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open New Shift</DialogTitle>
              <DialogDescription>
                Start a new cashier shift with opening cash amount
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Cash Amount *</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newShiftData.openingBalance}
                  onChange={(e) =>
                    setNewShiftData({
                      ...newShiftData,
                      openingBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newShiftData.notes}
                  onChange={(e) =>
                    setNewShiftData({ ...newShiftData, notes: e.target.value })
                  }
                  placeholder="Optional shift notes..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewShiftOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleOpenShift}
                disabled={!newShiftData.openingBalance}
              >
                Open Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shift Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Shift Details - #{selectedShift?.shiftNumber}
              </DialogTitle>
              <DialogDescription>
                Complete information about this shift
              </DialogDescription>
            </DialogHeader>

            {selectedShift && (
              <div className="space-y-6">
                {/* Shift Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Shift Number
                    </Label>
                    <p className="font-semibold">
                      #{selectedShift.shiftNumber}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <Badge className={getStatusColor(selectedShift.status)}>
                      {selectedShift.status}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Cashier
                    </Label>
                    <p>{selectedShift.cashierName}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Opened At
                    </Label>
                    <p>{formatDate(selectedShift.openedAt)}</p>
                  </div>

                  {selectedShift.closedAt && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Closed At
                      </Label>
                      <p>{formatDate(selectedShift.closedAt)}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Opening Amount
                    </Label>
                    <p className="font-semibold">
                      {formatCurrency(selectedShift.openingBalance)}
                    </p>
                  </div>
                </div>

                {selectedShift.closingBalance && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Closing Amount
                    </Label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(selectedShift.closingBalance)}
                    </p>
                  </div>
                )}

                {selectedShift.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Notes
                    </Label>
                    <p className="p-3 bg-gray-50 rounded-lg">
                      {selectedShift.notes}
                    </p>
                  </div>
                )}

                {/* Transactions Summary */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Transactions Summary
                  </Label>
                  <div className="grid grid-cols-1 gap-4 mt-2 p-4 bg-gray-50 rounded-lg sm:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedShift.totalTransactions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Transactions
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedShift.totalSales || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Sales
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Refunds
                      </div>
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

export default POSShifts;
