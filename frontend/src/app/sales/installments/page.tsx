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
import { Input } from "../../../components/ui/input";
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
  InstallmentPlan,
  Installment,
  PaymentMethod,
} from "../../../models/sales";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { useCrudPermissions } from "../../../hooks/usePermissions";
import { Calendar, Eye, DollarSign, FileDown } from "lucide-react";
import { extractErrorMessage } from "../../../utils/errorUtils";
import Link from "next/link";
import { toast } from "sonner";

export default function InstallmentsPage() {
  const { canCreate } = useCrudPermissions("sales:installments");
  const { formatCurrency } = useCurrency();
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInstallment, setPaymentInstallment] =
    useState<Installment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const handleDownloadCustomerInfoPdf = useCallback(async () => {
    if (!selectedPlan) return;
    setPdfDownloading(true);
    try {
      const blob = await InvoiceService.getCustomerInfoPdf(selectedPlan.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer-info-${selectedPlan.invoice_id}-${selectedPlan.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to download PDF"));
    } finally {
      setPdfDownloading(false);
    }
  }, [selectedPlan]);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvoiceService.getAllInstallmentPlans(0, 200);
      setPlans(data || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load installment plans"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openDetail = (plan: InstallmentPlan) => {
    setSelectedPlan(plan);
    setDetailOpen(true);
  };

  const openRecordPayment = (installment: Installment) => {
    setPaymentInstallment(installment);
    setPaymentAmount(
      (installment.amount - (installment.paid_amount || 0)).toString(),
    );
    setPaymentMethod("cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentError(null);
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedPlan || !paymentInstallment) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError("Enter a valid amount");
      return;
    }
    setPaymentSubmitting(true);
    setPaymentError(null);
    try {
      const payment = await InvoiceService.createPayment(
        selectedPlan.invoice_id,
        {
          invoiceId: selectedPlan.invoice_id,
          amount,
          paymentMethod: paymentMethod as PaymentMethod,
          paymentDate: paymentDate + "T12:00:00Z",
        },
      );
      await InvoiceService.applyPaymentToInstallment(
        selectedPlan.id,
        paymentInstallment.id,
        { amount, payment_id: payment.id },
      );
      setPaymentDialogOpen(false);
      setPaymentInstallment(null);
      const updated = await InvoiceService.getInstallmentPlan(selectedPlan.id);
      setSelectedPlan(updated);
      loadPlans();
    } catch (err) {
      setPaymentError(extractErrorMessage(err, "Failed to record payment"));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Installments
          </h1>
          <p className="text-gray-600">
            View and manage installment plans linked to invoices.
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button variant="outline" className="mt-2" onClick={loadPlans}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Installment Plans</CardTitle>
            <CardDescription>
              All active and completed installment plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                No installment plans yet. Create one from an invoice (Invoices →
                Create Invoice → Installments section).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Invoice</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Installments</th>
                      <th className="text-left py-2">Frequency</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">First due</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          <Link
                            href={`/sales/invoice-dashboard?tab=invoices&invoice=${plan.invoice_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {plan.invoice_id.slice(0, 8)}...
                          </Link>
                        </td>
                        <td className="py-2">
                          {formatCurrency(plan.total_amount, plan.currency)}
                        </td>
                        <td className="py-2">{plan.number_of_installments}</td>
                        <td className="py-2 capitalize">{plan.frequency}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getStatusColor(plan.status)}`}
                          >
                            {plan.status}
                          </span>
                        </td>
                        <td className="py-2">
                          {formatDate(plan.first_due_date)}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(plan)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
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

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Installment Plan</DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>
                    Invoice:{" "}
                    <Link
                      href={`/sales/invoice-dashboard?tab=invoices&invoice=${selectedPlan.invoice_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedPlan.invoice_id}
                    </Link>
                    {" · "}
                    {formatCurrency(
                      selectedPlan.total_amount,
                      selectedPlan.currency,
                    )}{" "}
                    · {selectedPlan.number_of_installments} installments (
                    {selectedPlan.frequency})
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCustomerInfoPdf}
                    disabled={pdfDownloading}
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    {pdfDownloading ? "Downloading..." : "Download PDF"}
                  </Button>
                </div>
                <div className="border rounded overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-2">#</th>
                        <th className="text-left py-2 px-2">Due date</th>
                        <th className="text-right py-2 px-2">Amount</th>
                        <th className="text-right py-2 px-2">Paid</th>
                        <th className="text-left py-2 px-2">Status</th>
                        <th className="text-right py-2 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPlan.installments.map((inst) => (
                        <tr key={inst.id} className="border-b">
                          <td className="py-2 px-2">{inst.sequence_number}</td>
                          <td className="py-2 px-2">
                            {formatDate(inst.due_date)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {formatCurrency(inst.amount, selectedPlan.currency)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {formatCurrency(
                              inst.paid_amount || 0,
                              selectedPlan.currency,
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${getStatusColor(inst.status)}`}
                            >
                              {inst.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right">
                            {inst.status !== "paid" && canCreate() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRecordPayment(inst)}
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Record payment
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record payment</DialogTitle>
            </DialogHeader>
            {paymentInstallment && (
              <div className="space-y-4">
                <p>
                  Installment #{paymentInstallment.sequence_number} · Due{" "}
                  {formatDate(paymentInstallment.due_date)} · Remaining:{" "}
                  {formatCurrency(
                    paymentInstallment.amount -
                      (paymentInstallment.paid_amount || 0),
                    selectedPlan?.currency || "USD",
                  )}
                </p>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Payment method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment date</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                {paymentError && (
                  <p className="text-sm text-red-600">{paymentError}</p>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecordPayment}
                    disabled={paymentSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {paymentSubmitting ? "Saving..." : "Record payment"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
