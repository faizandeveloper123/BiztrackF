"use client";

import type { Invoice } from "@/src/models/sales";
import type { UseInvoiceFormReturn } from "@/src/hooks/useInvoiceForm";
import type { InvoiceFormMode } from "@/src/types/sales/invoiceForm";
import { InvoiceViewContent } from "./InvoiceViewContent";
import { CommerceInvoiceFormSection } from "./CommerceInvoiceFormSection";
import { WorkshopInvoiceForm } from "./WorkshopInvoiceForm";

type InvoiceFormBodyProps = {
  mode: InvoiceFormMode;
  invoice?: Invoice | null;
  form: UseInvoiceFormReturn;
  error?: string | null;
};

export function InvoiceFormBody({
  mode,
  invoice,
  form,
  error,
}: InvoiceFormBodyProps) {
  if (mode === "view" && invoice) {
    return (
      <InvoiceViewContent invoice={invoice} onClose={form.handleDismiss} />
    );
  }

  if (form.useCommerceInvoiceLayout) {
    return <CommerceInvoiceFormSection mode={mode} form={form} error={error} />;
  }

  return <WorkshopInvoiceForm mode={mode} form={form} error={error} />;
}
