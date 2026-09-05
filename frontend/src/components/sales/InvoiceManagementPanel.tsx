"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { Filter, Settings } from "lucide-react";
import InvoiceService from "../../services/InvoiceService";
import { Invoice, InvoiceCreate, InvoiceFilters } from "../../models/sales";
import { InvoiceDialog, InstallmentPlanCreateOption } from "./InvoiceDialog";
import { InvoiceList } from "./InvoiceList";
import { InvoiceCustomizationDialog } from "./InvoiceCustomizationDialog";
import { usePermissions } from "@/src/hooks/usePermissions";
import { extractErrorMessage } from "@/src/utils/errorUtils";

export type InvoiceListScope = "paid" | "outstanding";

const OUTSTANDING_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
  { value: "void", label: "Void" },
] as const;

type InvoiceManagementPanelProps = {
  onInvoicesChange?: () => void;
  scope?: InvoiceListScope;
};

export function InvoiceManagementPanel({
  onInvoicesChange,
  scope = "paid",
}: InvoiceManagementPanelProps) {
  const { canViewInvoices, isOwner } = usePermissions();
  const canCustomizeInvoice = isOwner() && scope === "paid";
  const isOutstanding = scope === "outstanding";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [orderPrefix, setOrderPrefix] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const hasViewPermission = useMemo(() => canViewInvoices(), [canViewInvoices]);
  const loadingRef = useRef(false);
  const resolvedStatus = isOutstanding
    ? statusFilter === "all"
      ? "outstanding"
      : statusFilter
    : "paid";

  const notifyChange = useCallback(() => {
    onInvoicesChange?.();
  }, [onInvoicesChange]);

  const loadData = useCallback(async () => {
    if (loadingRef.current || !hasViewPermission) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await InvoiceService.getInvoices(
        {
          ...filters,
          search: searchTerm || undefined,
          orderPrefix: orderPrefix.trim() || undefined,
          status: resolvedStatus,
        },
        currentPage,
        10,
      );
      setInvoices(response.invoices || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load data"));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [
    filters,
    searchTerm,
    orderPrefix,
    resolvedStatus,
    currentPage,
    hasViewPermission,
  ]);

  const filtersString = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!hasViewPermission) return;
    loadData();
  }, [
    currentPage,
    filtersString,
    searchTerm,
    orderPrefix,
    resolvedStatus,
    loadData,
    hasViewPermission,
  ]);

  const handleUpdateInvoice = async (
    invoiceId: string,
    invoiceData: Partial<InvoiceCreate>,
    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => {
    try {
      setUpdateError(null);
      await InvoiceService.updateInvoice(invoiceId, invoiceData);
      if (options?.installmentPlan) {
        const existingPlan =
          await InvoiceService.getInvoiceInstallmentPlan(invoiceId);
        if (!existingPlan) {
          await InvoiceService.createInstallmentPlan({
            ...options.installmentPlan,
            invoice_id: invoiceId,
          });
        }
      }
      setShowEditDialog(false);
      setSelectedInvoice(null);
      setUpdateError(null);
      loadData();
      notifyChange();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "Failed to update invoice");
      setUpdateError(errorMessage);
      setError(errorMessage);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      setDeleteError(null);
      await InvoiceService.deleteInvoice(invoiceId);
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
      setDeleteError(null);
      loadData();
      notifyChange();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "Failed to delete invoice");
      setDeleteError(errorMessage);
      setError(errorMessage);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await InvoiceService.sendInvoice(invoiceId);
      loadData();
      notifyChange();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to send invoice"));
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await InvoiceService.markInvoiceAsPaid(invoiceId);
      loadData();
      notifyChange();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to mark invoice as paid"));
    }
  };

  const handleBulkSend = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkSendInvoices(invoiceIds);
      loadData();
      notifyChange();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to send invoices"));
    }
  };

  const handleBulkMarkAsPaid = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkMarkAsPaid(invoiceIds);
      loadData();
      notifyChange();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to mark invoices as paid"));
    }
  };

  const handleBulkMarkAsUnpaid = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkMarkAsUnpaid(invoiceIds);
      loadData();
      notifyChange();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to mark invoices as unpaid"));
    }
  };

  const handleBulkDelete = async (invoiceIds: string[]) => {
    try {
      await InvoiceService.bulkDeleteInvoices(invoiceIds);
      loadData();
      notifyChange();
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to delete invoices"));
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(false);
    setUpdateError(null);
    setShowEditDialog(true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewDialog(true);
  };

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const handleFilterChange = (newFilters: Partial<InvoiceFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  if (!hasViewPermission) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        You do not have permission to view invoices.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canCustomizeInvoice && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowCustomizeDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Customize Invoice
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid grid-cols-1 gap-4 ${
              isOutstanding ? "md:grid-cols-5" : "md:grid-cols-4"
            }`}
          >
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Customer, invoice #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <Label htmlFor="orderPrefix">Order Number</Label>
              <Input
                id="orderPrefix"
                placeholder="ORD-20250608"
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            {isOutstanding && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTSTANDING_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  handleFilterChange({ dateFrom: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <InvoiceList
        invoices={invoices}
        loading={loading}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onSend={handleSendInvoice}
        onMarkAsPaid={handleMarkAsPaid}
        onBulkSend={handleBulkSend}
        onBulkMarkAsPaid={handleBulkMarkAsPaid}
        onBulkMarkAsUnpaid={handleBulkMarkAsUnpaid}
        onBulkDelete={handleBulkDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {canCustomizeInvoice && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Settings className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Customize Your Invoice Template
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Before downloading invoices, please customize your invoice
                  template with your company details, payment information, and
                  styling preferences using the Customize Invoice button above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <InvoiceDialog
        open={showEditDialog && !!selectedInvoice}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setUpdateError(null);
          }
        }}
        onSubmit={(data, options) => {
          if (selectedInvoice) {
            void handleUpdateInvoice(selectedInvoice.id, data, options);
          }
        }}
        mode="edit"
        invoice={selectedInvoice}
        error={updateError}
      />

      <InvoiceDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        onSubmit={() => {}}
        mode="view"
        invoice={selectedInvoice}
      />

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete invoice{" "}
              <strong>{selectedInvoice?.invoiceNumber}</strong>? This action
              cannot be undone.
            </p>
            {deleteError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteError(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedInvoice && handleDeleteInvoice(selectedInvoice.id)
              }
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {canCustomizeInvoice && (
        <InvoiceCustomizationDialog
          open={showCustomizeDialog}
          onOpenChange={setShowCustomizeDialog}
        />
      )}
    </div>
  );
}
