"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { FileText } from "lucide-react";
import { CreateCustomerDialog } from "../crm/CreateCustomerDialog";
import { useInvoiceForm } from "@/src/hooks/useInvoiceForm";
import { getInvoiceDialogContentClassName } from "@/src/utils/sales/invoiceFormUtils";
import type { InvoiceDialogProps } from "@/src/types/sales/invoiceForm";
import { InvoiceFormBody } from "./invoice/InvoiceFormBody";

export type { InstallmentPlanCreateOption } from "@/src/types/sales/invoiceForm";

export function InvoiceDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  invoice,
  error,
  inline = false,
  initialData,
  initialCustomer,
  initialVehicle,
}: InvoiceDialogProps) {
  const form = useInvoiceForm({
    open,
    inline,
    mode,
    invoice,
    initialData,
    initialCustomer,
    initialVehicle,
    onSubmit,
    onOpenChange,
  });

  const contentClassName = getInvoiceDialogContentClassName(
    form.useCommerceInvoiceLayout,
    mode === "view",
    inline,
  );

  const body = (
    <InvoiceFormBody mode={mode} invoice={invoice} form={form} error={error} />
  );

  return (
    <>
      {inline ? (
        <div className={contentClassName}>{body}</div>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            className={contentClassName}
            onInteractOutside={(event: Event) => {
              if (mode !== "view") {
                event.preventDefault();
              }
            }}
          >
            <DialogHeader className={mode !== "view" ? "sr-only" : undefined}>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {mode === "create"
                  ? "Create New Invoice"
                  : mode === "edit"
                    ? "Edit Invoice"
                    : "View Invoice"}
              </DialogTitle>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      )}

      <CreateCustomerDialog
        open={form.showCreateCustomerDialog}
        onOpenChange={form.setShowCreateCustomerDialog}
        onCreated={form.handleCustomerSelect}
      />
    </>
  );
}
