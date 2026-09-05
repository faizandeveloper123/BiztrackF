"use client";

import { InvoicesPlanRedirect } from "@/src/components/sales/InvoicesPlanRedirect";
import { CreateInvoicePage } from "@/src/components/sales/CreateInvoicePage";

export default function InvoicesPage() {
  return (
    <InvoicesPlanRedirect>
      <CreateInvoicePage />
    </InvoicesPlanRedirect>
  );
}
