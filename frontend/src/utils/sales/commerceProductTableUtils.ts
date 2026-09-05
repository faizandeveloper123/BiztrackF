import type { Product } from "@/src/models/pos";

export type ProductTableRow = {
  code: string;
  name: string;
  type: string;
  pack: string;
  company: string;
  vendor: string;
  category: string;
  salePrice: number;
  costPrice: number;
  totalQty: number;
  totalUnits: string;
};

export const PRODUCT_TABLE_COLUMNS = [
  "Code",
  "Name",
  "Type",
  "Pack",
  "Company",
  "Vendor",
  "Category",
  "Sale Price",
  "Cost Price",
  "Total Qty",
  "Total Units",
] as const;

function formatUnitLabel(unit?: string): string {
  if (!unit) return "PIECE";
  return unit.replace(/_/g, " ").toUpperCase();
}

function formatTotalUnits(
  stockQuantity: number,
  packSize: number,
  unit?: string,
): string {
  const total = stockQuantity * packSize;
  return `${total} ${formatUnitLabel(unit)}`;
}

export function productToTableRow(
  product: Product,
  reservedQty = 0,
): ProductTableRow {
  const packSize = product.packSize ?? 1;
  const availableQty = Math.max(0, (product.stockQuantity ?? 0) - reservedQty);

  return {
    code: product.sku || "—",
    name: product.name || "—",
    type: product.productType || "—",
    pack: String(packSize),
    company: product.brand || "—",
    vendor: product.supplierName || "—",
    category: product.category || "—",
    salePrice: product.salePrice ?? 0,
    costPrice: product.costPerUnitPrice ?? 0,
    totalQty: availableQty,
    totalUnits: formatTotalUnits(availableQty, packSize, product.unitOfMeasure),
  };
}

export function formatSalePrice(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2);
}
