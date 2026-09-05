import { ProductCategory, UnitOfMeasure } from '../../../../models/pos';

export const PRODUCT_CATEGORIES = Object.values(ProductCategory);
export const PRODUCT_UNITS = Object.values(UnitOfMeasure);

export function stockColor(qty: number, min: number) {
  if (qty <= 0) return '#ef4444';
  if (qty <= min) return '#f97316';
  return '#22c55e';
}
