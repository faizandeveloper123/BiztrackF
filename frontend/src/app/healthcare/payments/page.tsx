"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import { Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import healthcareService from "@/src/services/HealthcareService";
import { apiService } from "@/src/services/ApiService";
import type { AdmissionInvoiceSummary } from "@/src/models/healthcare";
import { toast } from "sonner";
import Link from "next/link";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "paypal", label: "PayPal" },
] as const;

export default function HospitalPaymentsPage() {
  return (
    <DashboardLayout>
      <HospitalPaymentsContent />
    </DashboardLayout>
  );
}

function HospitalPaymentsContent() {
  const { canCreate } = useCrudPermissions("healthcare:expenses");
  const [invoices, setInvoices] = useState<AdmissionInvoiceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;
  const totalPages = Math.ceil(total / limit) || 1;
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<AdmissionInvoiceSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await healthcareService.getAdmissionInvoices({ page, limit });
      setInvoices(res.invoices);
      setTotal(res.total);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load admission invoices",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const openRecordPayment = (inv: AdmissionInvoiceSummary) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balance > 0 ? String(inv.balance) : "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("cash");
    setPaymentReference("");
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > selectedInvoice.balance) {
      toast.error("Amount cannot exceed balance");
      return;
    }
    try {
      setPaymentLoading(true);
      await apiService.post(`/invoices/${selectedInvoice.id}/payments`, {
        invoiceId: selectedInvoice.id,
        amount,
        paymentMethod: paymentMethod,
        paymentDate: paymentDate,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      toast.success("Payment recorded");
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      loadInvoices();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response
          ? (e.response as { data?: { detail?: string } }).data?.detail
          : e instanceof Error
            ? e.message
            : "Failed to record payment";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hospital Payments
          </h1>
          <p className="text-gray-600">Admission bills and payments</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/healthcare/admitted-patients">Admitted Patients</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admission Invoices</CardTitle>
          <CardDescription>
            Invoices generated from admitted patients (order ADM-). Record
            payments below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total > 0 && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No admission invoices yet. Generate a bill from Admitted Patients
              to see them here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order (Admission)</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>{inv.order_number ?? "—"}</TableCell>
                    <TableCell>{inv.customer_name}</TableCell>
                    <TableCell className="text-right">
                      {inv.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.total_paid.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.balance.toFixed(2)}
                    </TableCell>
                    <TableCell>{inv.status}</TableCell>
                    <TableCell className="text-right">
                      {canCreate() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRecordPayment(inv)}
                          disabled={inv.balance <= 0}
                        >
                          <Banknote className="w-4 h-4 mr-1" />
                          Record payment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Invoice {selectedInvoice.invoice_number} –{" "}
                  {selectedInvoice.customer_name}. Balance:{" "}
                  {selectedInvoice.balance.toFixed(2)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Check no., transaction id..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={paymentLoading}>
              {paymentLoading ? "Recording..." : "Record payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
