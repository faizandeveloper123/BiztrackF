"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { DashboardLayout } from "../../../components/layout";
import InvoiceService from "../../../services/InvoiceService";
import {
  DeliveryNote,
  DeliveryNoteCreate,
  Invoice,
} from "../../../models/sales";
import { Truck, Plus, FileDown } from "lucide-react";
import { extractErrorMessage } from "../../../utils/errorUtils";
import { toast } from "sonner";

export default function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getDeliveryNotes(undefined, 0, 200);
      setNotes(data || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load delivery notes"));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      const response = await InvoiceService.getInvoices({}, 1, 500);
      setInvoices(response.invoices || []);
    } catch {
      setInvoices([]);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (createOpen) {
      loadInvoices();
      setSelectedInvoiceId("");
      setNoteText("");
      setCreateError(null);
    }
  }, [createOpen, loadInvoices]);

  const handleCreate = async () => {
    if (!selectedInvoiceId) {
      setCreateError("Please select an invoice");
      return;
    }
    setSubmitting(true);
    setCreateError(null);
    try {
      const payload: DeliveryNoteCreate = {
        invoice_id: selectedInvoiceId,
        note: noteText.trim() || undefined,
      };
      await InvoiceService.createDeliveryNote(payload);
      toast.success("Delivery note created");
      setCreateOpen(false);
      loadNotes();
    } catch (err) {
      setCreateError(
        extractErrorMessage(err, "Failed to create delivery note"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = useCallback(async (dn: DeliveryNote) => {
    setDownloadingId(dn.id);
    try {
      const blob = await InvoiceService.downloadDeliveryNotePdf(dn.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `delivery-note-${dn.invoice_number || dn.invoice_id}-${dn.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to download PDF"));
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            Loading...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-8 w-8" />
              Delivery Notes
            </h1>
            <p className="text-gray-600">
              Create and download delivery notes linked to invoices.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create delivery note
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button variant="outline" className="mt-2" onClick={loadNotes}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Delivery Notes</CardTitle>
            <CardDescription>
              All delivery notes associated with invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                No delivery notes yet. Click &quot;Create delivery note&quot; to
                add one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Invoice No</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Note</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((dn) => (
                      <tr key={dn.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">
                          {dn.invoice_number ?? dn.invoice_id}
                        </td>
                        <td className="py-2">{dn.customer_name ?? "—"}</td>
                        <td className="py-2">{formatDate(dn.created_at)}</td>
                        <td className="py-2 text-gray-600 max-w-xs truncate">
                          {dn.note || "—"}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(dn)}
                            disabled={downloadingId === dn.id}
                          >
                            <FileDown className="h-4 w-4 mr-1" />
                            {downloadingId === dn.id
                              ? "Downloading..."
                              : "Download PDF"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create delivery note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Invoice</Label>
                <Select
                  value={selectedInvoiceId}
                  onValueChange={setSelectedInvoiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {inv.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Add any note for this delivery..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
