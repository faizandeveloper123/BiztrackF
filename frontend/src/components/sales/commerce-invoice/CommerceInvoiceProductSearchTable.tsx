"use client";

import type { Product } from "@/src/models/pos";
import {
  formatSalePrice,
  PRODUCT_TABLE_COLUMNS,
  productToTableRow,
} from "@/src/utils/sales/commerceProductTableUtils";

type CommerceInvoiceProductSearchTableProps = {
  searchResults: Product[];
  onPickProduct: (product: Product) => void;
  reservedQuantities?: Record<string, number>;
};

function CatalogTableCells({
  row,
  className = "",
}: {
  row: ReturnType<typeof productToTableRow>;
  className?: string;
}) {
  return (
    <>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.code}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.name}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.type}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.pack}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.company}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.vendor}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.category}
      </td>
      <td className={`border border-border px-2 py-1 text-right ${className}`}>
        {formatSalePrice(row.salePrice)}
      </td>
      <td className={`border border-border px-2 py-1 text-right ${className}`}>
        {formatSalePrice(row.costPrice)}
      </td>
      <td className={`border border-border px-2 py-1 text-right ${className}`}>
        {row.totalQty}
      </td>
      <td className={`border border-border px-2 py-1 ${className}`}>
        {row.totalUnits}
      </td>
    </>
  );
}

export function CommerceInvoiceProductSearchTable({
  searchResults,
  onPickProduct,
  reservedQuantities,
}: CommerceInvoiceProductSearchTableProps) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 border-collapse text-sm md:min-w-[1040px]">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              {PRODUCT_TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className={`border border-primary/80 px-2 py-1.5 font-semibold ${
                    column === "Sale Price" ||
                    column === "Cost Price" ||
                    column === "Total Qty"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {searchResults.length === 0 ? (
              <tr className="bg-muted/30">
                <td
                  colSpan={PRODUCT_TABLE_COLUMNS.length}
                  className="border border-border px-3 py-2 text-center text-muted-foreground"
                >
                  No products found
                </td>
              </tr>
            ) : (
              searchResults.slice(0, 20).map((product, index) => {
                const row = productToTableRow(
                  product,
                  reservedQuantities?.[product.id] ?? 0,
                );
                return (
                  <tr
                    key={`search-${product.id}`}
                    className={`cursor-pointer hover:bg-accent ${
                      index % 2 === 0 ? "bg-card" : "bg-muted/20"
                    }`}
                    onClick={() => onPickProduct(product)}
                  >
                    <CatalogTableCells row={row} />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
