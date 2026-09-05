"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { Product } from "@/src/models/pos";
import type { InvoiceItemCreate } from "@/src/models/sales";
import { resolveItemUnit } from "@/src/utils/sales/commerceInvoiceUtils";
import { UnitOfMeasureSelect } from "../UnitOfMeasureSelect";
import { COMMERCE_INPUT_CLS } from "./constants";
import { InlineField } from "./InlineField";
import type { CommerceInvoiceTotals } from "./types";

type CommerceInvoiceProductEntrySectionProps = {
  mode: "create" | "edit";
  loading: boolean;
  errors: Record<string, string>;
  newItem: InvoiceItemCreate;
  products: Product[];
  productSearch: string;
  totals: CommerceInvoiceTotals;
  onProductSearchChange: (value: string) => void;
  onNewItemChange: (item: InvoiceItemCreate) => void;
  onAddItem: () => void;
  onAddExtraItem: () => void | Promise<void>;
  onSetPaidAmount: (value: number) => void;
  clearFieldError: (key: string) => void;
};

export function CommerceInvoiceProductEntrySection({
  mode,
  loading,
  errors,
  newItem,
  products,
  productSearch,
  totals,
  onProductSearchChange,
  onNewItemChange,
  onAddItem,
  onAddExtraItem,
  onSetPaidAmount,
  clearFieldError,
}: CommerceInvoiceProductEntrySectionProps) {
  const router = useRouter();

  const updateNewItem = (patch: Partial<InvoiceItemCreate>) => {
    onNewItemChange({ ...newItem, ...patch });
  };

  return (
    <section className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
        <div className="space-y-1.5">
          <InlineField label="Product:" required>
            <Input
              value={productSearch}
              onChange={(e) => {
                onProductSearchChange(e.target.value);
                if (errors.newItemProduct) clearFieldError("newItemProduct");
              }}
              placeholder="Search by Name / Item code"
              className={`${COMMERCE_INPUT_CLS} ${errors.newItemProduct ? "border-destructive" : ""}`}
            />
          </InlineField>
          {errors.newItemProduct && (
            <p className="pl-[116px] text-xs text-destructive">
              {errors.newItemProduct}
            </p>
          )}
          <InlineField label="Extra Discount %:">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={newItem.discount}
              onChange={(e) =>
                updateNewItem({ discount: parseFloat(e.target.value) || 0 })
              }
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Units / Packs:">
            <UnitOfMeasureSelect
              value={
                newItem.unit || resolveItemUnit(newItem, products) || "piece"
              }
              onChange={(unit) => updateNewItem({ unit })}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="Item Name:">
            <Input
              value={newItem.description}
              onChange={(e) => {
                updateNewItem({ description: e.target.value });
                clearFieldError("newItemDescription");
              }}
              className={`${COMMERCE_INPUT_CLS} ${errors.newItemDescription ? "border-destructive" : ""}`}
            />
          </InlineField>
          <InlineField label="Quantity:">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={newItem.quantity}
              onChange={(e) => {
                updateNewItem({ quantity: parseFloat(e.target.value) || 0 });
                clearFieldError("newItemQuantity");
              }}
              className={`${COMMERCE_INPUT_CLS} ${errors.newItemQuantity ? "border-destructive" : ""}`}
            />
          </InlineField>
          <InlineField label="Sale Price:">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newItem.salePrice}
              onChange={(e) => {
                updateNewItem({ salePrice: parseFloat(e.target.value) || 0 });
                clearFieldError("newItemSalePrice");
              }}
              className={`${COMMERCE_INPUT_CLS} ${errors.newItemSalePrice ? "border-destructive" : ""}`}
            />
          </InlineField>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-[300px] lg:w-[280px]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={() => router.push("/sales/quotes")}
          >
            Save as Quotation
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={() => router.push("/sales/quotes")}
          >
            Quotation List
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={onAddItem}
          >
            Add
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={onAddExtraItem}
          >
            Add Extra Item
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={() => {
              onSetPaidAmount(totals.total);
            }}
          >
            Fully Paid
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={loading}
            className="h-9 text-xs font-semibold"
          >
            {loading
              ? "Saving..."
              : mode === "create"
                ? "Generate Invoice"
                : "Update Invoice"}
          </Button>
        </div>
      </div>
    </section>
  );
}
