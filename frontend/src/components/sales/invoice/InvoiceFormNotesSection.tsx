"use client";

import { Textarea } from "@/src/components/ui/textarea";
import type { InvoiceCreate } from "@/src/models/sales";
import { InlineField } from "../commerce-invoice/InlineField";

type InvoiceFormNotesSectionProps = {
  formData: InvoiceCreate;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
};

export function InvoiceFormNotesSection({
  formData,
  onInputChange,
}: InvoiceFormNotesSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 py-2">
      <InlineField label="Terms:">
        <Textarea
          id="terms"
          value={formData.terms || ""}
          onChange={(e) => onInputChange("terms", e.target.value)}
          rows={2}
          placeholder="Terms & conditions (optional)"
          className="min-h-[56px] resize-none text-sm shadow-none"
        />
      </InlineField>
    </section>
  );
}
