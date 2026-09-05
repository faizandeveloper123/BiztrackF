"use client";

import { Input } from "@/src/components/ui/input";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import type { InvoiceCreate } from "@/src/models/sales";
import type {
  InvoiceFormMode,
  InvoiceFormTotals,
} from "@/src/types/sales/invoiceForm";
import { COMMERCE_INPUT_CLS } from "../commerce-invoice/constants";
import { InlineField } from "../commerce-invoice/InlineField";

type InvoiceFormTotalsSummaryProps = {
  mode: InvoiceFormMode;
  totals: InvoiceFormTotals;
  labourCost?: number;
  vatRate?: number;
  onLabourCostChange: (
    field: keyof InvoiceCreate,
    value: string | number,
  ) => void;
};

function CurrencyInput({
  value,
  disabled,
  onChange,
  className,
}: {
  value: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}) {
  const { getCurrencySymbol } = useCurrency();
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
        {getCurrencySymbol()}
      </span>
      <Input
        type="number"
        step="0.01"
        min="0"
        readOnly={!onChange}
        disabled={disabled}
        value={value}
        onChange={
          onChange
            ? (e) => onChange(parseFloat(e.target.value) || 0)
            : undefined
        }
        className={`${COMMERCE_INPUT_CLS} bg-background pl-7 ${className ?? ""}`}
      />
    </div>
  );
}

export function InvoiceFormTotalsSummary({
  mode,
  totals,
  labourCost,
  vatRate,
  onLabourCostChange,
}: InvoiceFormTotalsSummaryProps) {
  return (
    <section className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Subtotal:">
            <CurrencyInput value={totals.subtotal} />
          </InlineField>
          {totals.discountAmount > 0 && (
            <InlineField label="Total Discount:">
              <CurrencyInput
                value={-totals.discountAmount}
                className="text-destructive"
              />
            </InlineField>
          )}
          <InlineField label="Labour Cost:">
            <CurrencyInput
              value={labourCost ?? 0}
              disabled={mode === "view"}
              onChange={(value) => onLabourCostChange("labourCost", value)}
            />
          </InlineField>
          <InlineField label="VAT Rate (%):">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              readOnly={mode === "view"}
              disabled={mode === "view"}
              value={vatRate ? Math.round(vatRate * 1000) / 10 : 0}
              onChange={(e) =>
                onLabourCostChange(
                  "vatRate",
                  Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) /
                    100,
                )
              }
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          {totals.taxAmount > 0 && (
            <InlineField label="VAT Amount:">
              <CurrencyInput value={totals.taxAmount} />
            </InlineField>
          )}
        </div>

        <div className="space-y-1.5" />

        <div className="space-y-1.5">
          <InlineField label="Total Amount:">
            <CurrencyInput value={totals.total} className="font-semibold" />
          </InlineField>
        </div>
      </div>
    </section>
  );
}
