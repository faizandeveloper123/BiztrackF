"use client";

import { Button } from "@/src/components/ui/button";
import { FileText } from "lucide-react";

type CommerceInvoiceFormHeaderProps = {
  mode: "create" | "edit";
  onClearInvoice: () => void;
};

export function CommerceInvoiceFormHeader({
  mode,
  onClearInvoice,
}: CommerceInvoiceFormHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold leading-none">
        <FileText className="h-5 w-5 text-primary" />
        {mode === "create" ? "Create New Invoice" : "Edit Invoice"}
      </h2>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onClearInvoice}
        className="h-8 shrink-0 px-3 text-xs font-semibold"
      >
        Clear Invoice
      </Button>
    </div>
  );
}
