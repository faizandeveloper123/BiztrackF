"use client";

import { Input } from "@/src/components/ui/input";
import { COMMERCE_INPUT_CLS } from "./constants";
import { InlineField } from "./InlineField";
import type { CommerceInvoiceTotals } from "./types";

type CommerceInvoiceTotalsSectionProps = {
  totals: CommerceInvoiceTotals;
  totalQuantity: number;
  totalItemDiscount: number;
  paidAmount: number;
  onPaidAmountChange: (value: number) => void;
};

export function CommerceInvoiceTotalsSection({
  totals,
  totalQuantity,
  totalItemDiscount,
  paidAmount,
  onPaidAmountChange,
}: CommerceInvoiceTotalsSectionProps) {
  const billBalance = Math.max(0, totals.total - paidAmount);

  return (
    <section className="rounded-lg border border-border bg-muted/40 px-3 py-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Total Quantity:">
            <Input
              readOnly
              value={totalQuantity}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Bill Status:">
            <Input
              readOnly
              value={
                paidAmount >= totals.total && totals.total > 0
                  ? "paid"
                  : "draft"
              }
              className={`${COMMERCE_INPUT_CLS} bg-background capitalize`}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Total Discount on Items:">
            <Input
              readOnly
              value={Math.round(totalItemDiscount * 100) / 100}
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Total Amount:">
            <Input
              readOnly
              value={Math.round(totals.total * 100) / 100}
              className={`${COMMERCE_INPUT_CLS} bg-background font-semibold`}
            />
          </InlineField>
          <InlineField label="Paid Amount:">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) =>
                onPaidAmountChange(parseFloat(e.target.value) || 0)
              }
              className={`${COMMERCE_INPUT_CLS} bg-background`}
            />
          </InlineField>
          <InlineField label="Bill Balance:">
            <Input
              readOnly
              value={Math.round(billBalance * 100) / 100}
              className={`${COMMERCE_INPUT_CLS} bg-background font-semibold`}
            />
          </InlineField>
        </div>
      </div>
    </section>
  );
}
