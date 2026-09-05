import type { Product } from "@/src/models/pos";
import type { InvoiceItemCreate } from "@/src/models/sales";
import { lineItemTotal } from "@/src/utils/sales/invoiceFormUtils";

export type CommerceItemNumericField = "quantity" | "salePrice" | "discount";
export type CommerceItemTextField = "description" | "unit";

export function lineGross(item: InvoiceItemCreate): number {
  return item.quantity * item.salePrice;
}

export function lineNet(item: InvoiceItemCreate): number {
  return lineItemTotal(item);
}

export function filterProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.productType && p.productType.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)),
  );
}

export function resolveItemUnit(
  item: InvoiceItemCreate,
  products: Product[],
): string {
  if (item.unit) return item.unit;
  if (item.productId) {
    const p = products.find((x) => x.id === item.productId);
    return p?.unitOfMeasure || "";
  }
  return "";
}

export function sumItemQuantities(items: InvoiceItemCreate[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function sumItemDiscountAmount(items: InvoiceItemCreate[]): number {
  return items.reduce(
    (sum, item) => sum + lineGross(item) * (item.discount / 100),
    0,
  );
}

export function itemFieldKey(
  index: number,
  field: CommerceItemNumericField | CommerceItemTextField,
): string {
  return `${index}-${field}`;
}

export function parseDraftNumber(raw: string): number | null {
  if (raw === "" || raw === ".") return null;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? null : parsed;
}
