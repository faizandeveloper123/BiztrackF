"use client";

import type { Product } from "@/src/models/pos";
import type { InvoiceItemCreate } from "@/src/models/sales";
import type {
  CommerceItemNumericField,
  CommerceItemTextField,
} from "@/src/utils/sales/commerceInvoiceUtils";
import { CommerceInvoiceProductSearchTable } from "./CommerceInvoiceProductSearchTable";
import { CommerceInvoiceLineItemsTable } from "./CommerceInvoiceLineItemsTable";

type CommerceInvoiceItemsTableProps = {
  items: InvoiceItemCreate[];
  products: Product[];
  productSearch: string;
  searchResults: Product[];
  itemsError?: string;
  getItemFieldValue: (
    index: number,
    field: CommerceItemNumericField,
    fallback: number,
  ) => string;
  getItemTextFieldValue: (
    index: number,
    field: CommerceItemTextField,
    fallback: string,
  ) => string;
  onItemFieldChange: (
    index: number,
    field: CommerceItemNumericField,
    raw: string,
  ) => void;
  onItemFieldBlur: (index: number, field: CommerceItemNumericField) => void;
  onItemTextFieldChange: (
    index: number,
    field: CommerceItemTextField,
    raw: string,
  ) => void;
  onItemTextFieldBlur: (index: number, field: CommerceItemTextField) => void;
  onRemoveItem: (index: number) => void;
  onPickProduct: (product: Product) => void;
};

export function CommerceInvoiceItemsTable({
  items,
  products,
  productSearch,
  searchResults,
  itemsError,
  getItemFieldValue,
  getItemTextFieldValue,
  onItemFieldChange,
  onItemFieldBlur,
  onItemTextFieldChange,
  onItemTextFieldBlur,
  onRemoveItem,
  onPickProduct,
}: CommerceInvoiceItemsTableProps) {
  const isSearching = productSearch.trim().length > 0;

  const reservedQuantities: Record<string, number> = {};
  for (const item of items) {
    if (item.productId) {
      reservedQuantities[item.productId] =
        (reservedQuantities[item.productId] ?? 0) +
        (Number(item.quantity) || 0);
    }
  }

  if (!isSearching && items.length === 0 && !itemsError) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {isSearching && (
        <CommerceInvoiceProductSearchTable
          searchResults={searchResults}
          onPickProduct={onPickProduct}
          reservedQuantities={reservedQuantities}
        />
      )}

      <CommerceInvoiceLineItemsTable
        items={items}
        products={products}
        itemsError={itemsError}
        getItemFieldValue={getItemFieldValue}
        getItemTextFieldValue={getItemTextFieldValue}
        onItemFieldChange={onItemFieldChange}
        onItemFieldBlur={onItemFieldBlur}
        onItemTextFieldChange={onItemTextFieldChange}
        onItemTextFieldBlur={onItemTextFieldBlur}
        onRemoveItem={onRemoveItem}
      />
    </div>
  );
}
