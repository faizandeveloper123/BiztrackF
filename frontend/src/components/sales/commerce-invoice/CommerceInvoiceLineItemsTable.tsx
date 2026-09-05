"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { Product } from "@/src/models/pos";
import type { InvoiceItemCreate } from "@/src/models/sales";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  lineGross,
  lineNet,
  resolveItemUnit,
  type CommerceItemNumericField,
  type CommerceItemTextField,
} from "@/src/utils/sales/commerceInvoiceUtils";
import { UnitOfMeasureSelect } from "../UnitOfMeasureSelect";
import { Trash2 } from "lucide-react";
import { COMMERCE_INLINE_EDIT_CLS } from "./constants";

type CommerceInvoiceLineItemsTableProps = {
  items: InvoiceItemCreate[];
  products: Product[];
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
};

export function CommerceInvoiceLineItemsTable({
  items,
  products,
  itemsError,
  getItemFieldValue,
  getItemTextFieldValue,
  onItemFieldChange,
  onItemFieldBlur,
  onItemTextFieldChange,
  onItemTextFieldBlur,
  onRemoveItem,
}: CommerceInvoiceLineItemsTableProps) {
  const { formatCurrency } = useCurrency();

  if (items.length === 0) {
    if (!itemsError) return null;
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
        {itemsError}
      </p>
    );
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-border">
      {itemsError && (
        <p className="bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
          {itemsError}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm lg:min-w-0">
          <colgroup>
            <col className="w-10" />
            <col className="w-[40%] min-w-[200px]" />
            <col className="w-20" />
            <col className="w-[110px]" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-12" />
          </colgroup>
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                S No
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                Name
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                Qty
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-left font-semibold">
                Units
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                Rate
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                G Amount
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                Extra Discount %
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-right font-semibold">
                Net Amount
              </th>
              <th className="border border-primary/80 px-2 py-1.5 text-center font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`item-${item.productId}-${index}`} className="bg-card">
                <td className="border border-border px-2 py-1">{index + 1}</td>
                <td className="border border-border px-2 py-1">
                  <Input
                    type="text"
                    value={getItemTextFieldValue(
                      index,
                      "description",
                      item.description,
                    )}
                    onChange={(e) =>
                      onItemTextFieldChange(
                        index,
                        "description",
                        e.target.value,
                      )
                    }
                    onBlur={() => onItemTextFieldBlur(index, "description")}
                    className={`${COMMERCE_INLINE_EDIT_CLS} w-full min-w-[120px]`}
                  />
                </td>
                <td className="border border-border px-2 py-1 text-right">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getItemFieldValue(index, "quantity", item.quantity)}
                    onChange={(e) =>
                      onItemFieldChange(index, "quantity", e.target.value)
                    }
                    onBlur={() => onItemFieldBlur(index, "quantity")}
                    className={`${COMMERCE_INLINE_EDIT_CLS} ml-auto w-20 text-right`}
                  />
                </td>
                <td className="border border-border px-2 py-1">
                  <UnitOfMeasureSelect
                    value={getItemTextFieldValue(
                      index,
                      "unit",
                      resolveItemUnit(item, products) || "piece",
                    )}
                    onChange={(unit) =>
                      onItemTextFieldChange(index, "unit", unit)
                    }
                    className={`${COMMERCE_INLINE_EDIT_CLS} h-8 w-full min-w-[88px]`}
                  />
                </td>
                <td className="border border-border px-2 py-1 text-right">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getItemFieldValue(
                      index,
                      "salePrice",
                      item.salePrice,
                    )}
                    onChange={(e) =>
                      onItemFieldChange(index, "salePrice", e.target.value)
                    }
                    onBlur={() => onItemFieldBlur(index, "salePrice")}
                    className={`${COMMERCE_INLINE_EDIT_CLS} ml-auto w-24 text-right`}
                  />
                </td>
                <td className="border border-border px-2 py-1 text-right">
                  {formatCurrency(lineGross(item))}
                </td>
                <td className="border border-border px-2 py-1 text-right">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getItemFieldValue(index, "discount", item.discount)}
                    onChange={(e) =>
                      onItemFieldChange(index, "discount", e.target.value)
                    }
                    onBlur={() => onItemFieldBlur(index, "discount")}
                    className={`${COMMERCE_INLINE_EDIT_CLS} ml-auto w-20 text-right`}
                  />
                </td>
                <td className="border border-border px-2 py-1 text-right font-medium">
                  {formatCurrency(lineNet(item))}
                </td>
                <td className="border border-border px-2 py-1 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(index)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
