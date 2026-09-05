"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { InvoiceItemCreate } from "@/src/models/sales";
import type { Product } from "@/src/models/pos";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { lineItemTotal } from "@/src/utils/sales/invoiceFormUtils";
import { useCommerceInvoiceFormUi } from "@/src/hooks/useCommerceInvoiceFormUi";
import type {
  InvoiceFormErrors,
  InvoiceFormMode,
} from "@/src/types/sales/invoiceForm";
import { CommerceInvoiceItemsTable } from "../commerce-invoice/CommerceInvoiceItemsTable";
import { COMMERCE_INPUT_CLS } from "../commerce-invoice/constants";
import { InlineField } from "../commerce-invoice/InlineField";

type InvoiceFormItemsSectionProps = {
  mode: InvoiceFormMode;
  loading: boolean;
  items: InvoiceItemCreate[];
  newItem: InvoiceItemCreate;
  products: Product[];
  errors: InvoiceFormErrors;
  onNewItemChange: (item: InvoiceItemCreate) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, patch: Partial<InvoiceItemCreate>) => void;
  onProductSelect: (productId: string) => void;
  clearNewItemErrors: () => void;
};

export function InvoiceFormItemsSection({
  mode,
  loading,
  items,
  newItem,
  products,
  errors,
  onNewItemChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onProductSelect,
  clearNewItemErrors,
}: InvoiceFormItemsSectionProps) {
  const { formatCurrency } = useCurrency();
  const ui = useCommerceInvoiceFormUi({ items, products, onUpdateItem });

  const patchNewItem = (partial: Partial<InvoiceItemCreate>) => {
    onNewItemChange({ ...newItem, ...partial });
  };

  const pickProduct = (product: Product) => {
    onProductSelect(product.id);
    ui.setProductSearch("");
    clearNewItemErrors();
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <section className="rounded-lg border border-border bg-card px-3 py-2">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-1.5">
            <InlineField label="Product:" required>
              <Input
                id="productSearch"
                value={ui.productSearch}
                onChange={(e) => ui.setProductSearch(e.target.value)}
                placeholder="Search by Name / Item code"
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemProduct ? "border-destructive" : ""}`}
              />
            </InlineField>
            {errors.newItemProduct && (
              <p className="pl-[116px] text-xs text-destructive">
                {errors.newItemProduct}
              </p>
            )}
            <InlineField label="Description:" required>
              <Input
                id="description"
                value={newItem.description}
                onChange={(e) => {
                  patchNewItem({ description: e.target.value });
                  if (errors.newItemDescription) clearNewItemErrors();
                }}
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemDescription ? "border-destructive" : ""}`}
              />
            </InlineField>
            {errors.newItemDescription && (
              <p className="pl-[116px] text-xs text-destructive">
                {errors.newItemDescription}
              </p>
            )}
            <InlineField label="Discount %:">
              <Input
                id="itemDiscount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newItem.discount}
                onChange={(e) =>
                  patchNewItem({ discount: parseFloat(e.target.value) || 0 })
                }
                className={COMMERCE_INPUT_CLS}
              />
            </InlineField>
          </div>

          <div className="space-y-1.5">
            <InlineField label="Quantity:" required>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={newItem.quantity}
                onChange={(e) => {
                  patchNewItem({ quantity: parseFloat(e.target.value) || 0 });
                  if (errors.newItemQuantity) clearNewItemErrors();
                }}
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemQuantity ? "border-destructive" : ""}`}
              />
            </InlineField>
            {errors.newItemQuantity && (
              <p className="pl-[116px] text-xs text-destructive">
                {errors.newItemQuantity}
              </p>
            )}
            <InlineField label="Sale Price:" required>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="0.01"
                value={newItem.salePrice}
                onChange={(e) => {
                  patchNewItem({ salePrice: parseFloat(e.target.value) || 0 });
                  if (errors.newItemSalePrice) clearNewItemErrors();
                }}
                className={`${COMMERCE_INPUT_CLS} ${errors.newItemSalePrice ? "border-destructive" : ""}`}
              />
            </InlineField>
            {errors.newItemSalePrice && (
              <p className="pl-[116px] text-xs text-destructive">
                {errors.newItemSalePrice}
              </p>
            )}
            <InlineField label="Line Total:">
              <Input
                readOnly
                value={formatCurrency(lineItemTotal(newItem))}
                className={`${COMMERCE_INPUT_CLS} bg-muted font-medium`}
              />
            </InlineField>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:w-[300px] lg:w-[280px]">
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
              type="submit"
              variant="gradient"
              size="sm"
              disabled={loading || mode === "view"}
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

      <CommerceInvoiceItemsTable
        items={items}
        products={products}
        productSearch={ui.productSearch}
        searchResults={ui.filteredProducts}
        itemsError={errors.items}
        getItemFieldValue={ui.getItemFieldValue}
        getItemTextFieldValue={ui.getItemTextFieldValue}
        onItemFieldChange={ui.handleItemFieldChange}
        onItemFieldBlur={ui.handleItemFieldBlur}
        onItemTextFieldChange={ui.handleItemTextFieldChange}
        onItemTextFieldBlur={ui.handleItemTextFieldBlur}
        onRemoveItem={onRemoveItem}
        onPickProduct={pickProduct}
      />
    </div>
  );
}
