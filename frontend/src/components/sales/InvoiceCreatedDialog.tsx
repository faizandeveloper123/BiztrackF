"use client";

import { useState } from "react";
import {
  Check,
  Download,
  FileText,
  Hash,
  Loader2,
  Package,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import InvoiceService from "@/src/services/InvoiceService";
import { extractErrorMessage } from "@/src/utils/errorUtils";
import { formatDate } from "@/src/lib/utils";
import { toast } from "sonner";
import type { Invoice } from "@/src/models/sales";

interface InvoiceCreatedDialogProps {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceCreatedDialog({
  invoice,
  onOpenChange,
}: InvoiceCreatedDialogProps) {
  const { formatCurrency } = useCurrency();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoice || downloading) return;
    try {
      setDownloading(true);
      const blob = await InvoiceService.downloadInvoice(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Invoice downloaded successfully!");
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = extractErrorMessage(
          error,
          "Error downloading invoice",
        );
        if (errorMessage.includes("customization is required")) {
          toast.error(
            "Please customize your invoice template first using the 'Customize Invoice' button.",
            { duration: 5000 },
          );
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error("Error downloading invoice");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={invoice !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div
          className={[
            "relative overflow-hidden",
            "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700",
            "px-6 pb-16 pt-8 text-center",
          ].join(" ")}
        >
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-14 -left-12 h-44 w-44 rounded-full bg-white/5 blur-sm" />
          <div className="absolute right-8 top-6">
            <Sparkles className="h-5 w-5 animate-pulse text-white/70" />
          </div>
          <div className="absolute left-10 top-10">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-white/40" />
          </div>

          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
            <span
              className={[
                "absolute inset-0 rounded-full",
                "bg-gradient-to-br from-emerald-400 to-teal-500",
                "shadow-lg shadow-teal-900/40",
              ].join(" ")}
            />
            <span
              className={[
                "relative flex h-16 w-16 items-center justify-center",
                "rounded-full bg-gradient-to-br from-emerald-400 to-teal-500",
                "ring-4 ring-white/40",
              ].join(" ")}
            >
              <Check className="h-9 w-9 text-white" strokeWidth={3} />
            </span>
          </div>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Invoice Created!
            </DialogTitle>
            <DialogDescription className="text-sm text-blue-100">
              Your invoice has been created successfully and is ready to share.
            </DialogDescription>
          </DialogHeader>
        </div>

        {invoice && (
          <div className="relative -mt-8 space-y-4 px-6 pb-6">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                  Invoice Summary
                </span>
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-700"
                >
                  {invoice.status ? invoice.status.replace(/_/g, " ") : "Draft"}
                </Badge>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Hash className="h-4 w-4 text-blue-500" />
                    Invoice No.
                  </span>
                  <span className="font-semibold text-gray-900">
                    {invoice.invoiceNumber || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-500">
                    <User className="h-4 w-4 text-blue-500" />
                    Customer
                  </span>
                  <span className="max-w-[180px] truncate font-medium text-gray-900">
                    {invoice.customerName || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-500">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Issue Date
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatDate(invoice.issueDate || invoice.createdAt)}
                  </span>
                </div>
                {invoice.subtotal ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Package className="h-4 w-4 text-blue-500" />
                      Parts Estimate
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>
                ) : null}
                {invoice.labourCost ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      Labour Cost
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(invoice.labourCost)}
                    </span>
                  </div>
                ) : null}
                {invoice.taxAmount > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Package className="h-4 w-4 text-blue-500" />
                      {invoice.vatRate && invoice.vatRate > 0
                        ? `VAT (${Math.round(invoice.vatRate * 100)}%)`
                        : "VAT"}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(invoice.taxAmount)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 flex items-center justify-between border-t border-dashed pt-2.5">
                  <span className="text-sm font-medium text-gray-500">
                    Total Amount
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
