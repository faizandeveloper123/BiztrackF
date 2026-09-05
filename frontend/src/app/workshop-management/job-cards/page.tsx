"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModuleGuard } from "../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  ClipboardList,
  FileDown,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../../../services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { JobCard, type Vehicle } from "../../../models/workshop";
import JobCardDialog from "../../../components/workshop/JobCardDialog";
import {
  InvoiceDialog,
  type InstallmentPlanCreateOption,
} from "../../../components/sales/InvoiceDialog";
import InvoiceService from "../../../services/InvoiceService";
import type { Customer } from "../../../services/CustomerService";
import type { InvoiceCreate } from "../../../models/sales";
import { extractErrorMessage } from "../../../utils/errorUtils";
import { useCrudPermissions } from "../../../hooks/usePermissions";
import { invoiceItemsFromJobCard, jobCardLabourEstimate, jobCardToVehicle } from "../../../utils/sales/invoiceFormUtils";

function JobCardsContent() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(
    "production:job_cards",
  );
  const invoices = useCrudPermissions("sales:invoices");
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobCardToDelete, setJobCardToDelete] = useState<JobCard | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoicePrefill, setInvoicePrefill] =
    useState<Partial<InvoiceCreate> | null>(null);
  const [invoiceCustomer, setInvoiceCustomer] = useState<Customer | null>(null);
  const [invoiceVehicle, setInvoiceVehicle] = useState<Vehicle | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [preparingInvoiceId, setPreparingInvoiceId] = useState<string | null>(
    null,
  );

  const buildInvoicePrefill = useCallback(
    (jc: JobCard): Partial<InvoiceCreate> => {
      const vi = (jc.vehicle_info || {}) as Record<string, unknown>;
      const str = (v: unknown) =>
        v === null || v === undefined ? "" : String(v);
      let items = invoiceItemsFromJobCard(jc);
      if (items.length === 0 && jc.parts_estimate) {
        items = [
          ...items,
          {
            description: "Parts",
            quantity: 1,
            salePrice: jc.parts_estimate,
            discount: 0,
            taxRate: 0,
            unit: "piece",
          },
        ];
      }

      return {
        customerId: jc.customer_id || "",
        customerName: jc.customer_name || "",
        customerPhone: jc.customer_phone || "",
        vehicleReg: str(vi.registration_number),
        orderNumber: jc.job_card_number || "",
        jobCardId: jc.id,
        labourCost: jobCardLabourEstimate(jc),
        items,
      };
    },
    [],
  );

  const openCreateInvoice = useCallback(
    async (jc: JobCard) => {
      setPreparingInvoiceId(jc.id);
      try {
        let customer: Customer | null = null;
        if (jc.customer_id) {
          try {
            customer = await InvoiceService.getCustomerById(jc.customer_id);
          } catch {
            customer = null;
          }
        }
        setInvoicePrefill(buildInvoicePrefill(jc));
        setInvoiceCustomer(customer);
        setInvoiceVehicle(jobCardToVehicle(jc));
        setInvoiceError(null);
        setInvoiceDialogOpen(true);
      } finally {
        setPreparingInvoiceId(null);
      }
    },
    [buildInvoicePrefill],
  );

  const handleCreateInvoice = useCallback(
    async (
      invoiceData: InvoiceCreate,
      options?: { installmentPlan?: InstallmentPlanCreateOption },
    ) => {
      try {
        const created = await InvoiceService.createInvoice(invoiceData);
        if (options?.installmentPlan) {
          await InvoiceService.createInstallmentPlan({
            ...options.installmentPlan,
            invoice_id: created.id,
          });
        }
        setInvoiceError(null);
        setInvoiceDialogOpen(false);
        toast.success(
          `Invoice ${created.invoiceNumber || ""} created successfully`.trim(),
        );
      } catch (err) {
        const message = extractErrorMessage(err, "Failed to create invoice");
        setInvoiceError(message);
        toast.error(message);
      }
    },
    [],
  );

  const handleDownloadPdf = useCallback(async (jc: JobCard) => {
    setDownloadingPdfId(jc.id);
    try {
      const blob = await apiService.get<Blob>(`/job-cards/${jc.id}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-card-${jc.job_card_number || jc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setDownloadingPdfId(null);
    }
  }, []);

  const fetchJobCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get("/job-cards?limit=500");
      setJobCards(Array.isArray(data) ? data : []);
    } catch {
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const filtered = jobCards.filter((jc) => {
    const matchStatus = statusFilter === "all" || jc.status === statusFilter;
    const matchSearch =
      !searchTerm ||
      jc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jc.job_card_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (jc.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openCreate = () => {
    setSelectedJobCard(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (jc: JobCard) => {
    setSelectedJobCard(jc);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteJobCard = (jc: JobCard) => {
    setJobCardToDelete(jc);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteJobCard = async () => {
    if (!jobCardToDelete) return;
    try {
      await apiService.delete(`/job-cards/${jobCardToDelete.id}`);
      setJobCards(jobCards.filter((jc) => jc.id !== jobCardToDelete.id));
      setDeleteDialogOpen(false);
      setJobCardToDelete(null);
    } catch {
      setDeleteDialogOpen(false);
      setJobCardToDelete(null);
    }
  };

  const formatDate = (d: string | undefined) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "–";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const vehicleSummary = (vi: Record<string, unknown> | undefined) => {
    if (!vi) return "–";
    const parts = [vi.make, vi.model, vi.year].filter(Boolean);
    return parts.length ? parts.join(" ") : "–";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              Job Cards
            </h1>
            <p className="text-gray-600">Manage workshop job cards.</p>
          </div>
          {canCreate() && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Job Card
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by title, number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No job cards found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Number</th>
                      <th className="text-left py-2">Title</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Vehicle</th>
                      <th className="text-left py-2">Assigned to</th>
                      <th className="text-left py-2">Planned</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((jc) => (
                      <tr key={jc.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{jc.job_card_number}</td>
                        <td className="py-2">{jc.title}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getStatusColor(jc.status)}`}
                          >
                            {jc.status}
                          </span>
                        </td>
                        <td className="py-2">{jc.customer_name || "–"}</td>
                        <td className="py-2">
                          {vehicleSummary(jc.vehicle_info)}
                        </td>
                        <td className="py-2">{jc.assigned_to_name || "–"}</td>
                        <td className="py-2">{formatDate(jc.planned_date)}</td>
                        <td className="py-2 text-right">
                          {invoices.canCreate() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCreateInvoice(jc)}
                              disabled={preparingInvoiceId === jc.id}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {preparingInvoiceId === jc.id
                                ? "Preparing..."
                                : "Create Invoice"}
                            </Button>
                          )}
                          {invoices.canView() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(jc)}
                              disabled={downloadingPdfId === jc.id}
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              {downloadingPdfId === jc.id
                                ? "Downloading..."
                                : "Download PDF"}
                            </Button>
                          )}
                          {canUpdate() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(jc)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {canDelete() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteJobCard(jc)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <JobCardDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          jobCard={selectedJobCard}
          onSuccess={fetchJobCards}
        />
        {invoiceDialogOpen && (
          <InvoiceDialog
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            mode="create"
            onSubmit={handleCreateInvoice}
            error={invoiceError}
            initialData={invoicePrefill}
            initialCustomer={invoiceCustomer}
            initialVehicle={invoiceVehicle}
          />
        )}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Job Card</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{jobCardToDelete?.title}
                &quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setJobCardToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteJobCard}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function JobCardsPage() {
  return (
    <ModuleGuard
      module="production"
      fallback={<div>You don&apos;t have access to this module</div>}
    >
      <JobCardsContent />
    </ModuleGuard>
  );
}
