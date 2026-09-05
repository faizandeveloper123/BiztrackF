"use client";

import { Card, CardContent } from "../ui/card";

import { InvoiceDialog, InstallmentPlanCreateOption } from "./InvoiceDialog";

import { InvoiceCreate } from "../../models/sales";

type CreateInvoiceSectionProps = {
  onSubmit: (
    data: InvoiceCreate,

    options?: { installmentPlan?: InstallmentPlanCreateOption },
  ) => void | Promise<void>;

  error?: string | null;
};

export function CreateInvoiceSection({
  onSubmit,
  error,
}: CreateInvoiceSectionProps) {
  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden shadow-md">
      <CardContent className="w-full min-w-0 p-0">
        <InvoiceDialog
          inline
          open
          onOpenChange={() => {}}
          mode="create"
          onSubmit={onSubmit}
          error={error}
        />
      </CardContent>
    </Card>
  );
}
