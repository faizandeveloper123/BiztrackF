import {
  UnitOfMeasure as UnitOfMeasureEnum,
  type UnitOfMeasure,
} from "@/src/models/pos";
import type { ProductFormData } from "./types";
import { emptyProductFormData } from "./productUtils";

export type ProductEntryMode = "manual" | "qr" | "barcode";

export type ProductCodeLookupResult = {
  source: string;
  codeType: string;
  existsInCatalog: boolean;
  existingProductId?: string | null;
  suggested: Partial<ProductFormData>;
  message: string;
};

export function mergeLookupIntoFormData(
  current: ProductFormData,
  suggested: Partial<ProductFormData> & Record<string, unknown>,
): ProductFormData {
  const base = emptyProductFormData();
  const pickString = (value: unknown, fallback: string) =>
    value === null || value === undefined || value === ""
      ? fallback
      : String(value);
  const pickNumber = (value: unknown, fallback: number) => {
    if (value === null || value === undefined || value === "") return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    ...base,
    ...current,
    name: pickString(suggested.name, current.name || base.name),
    sku: pickString(suggested.sku, current.sku || base.sku),
    description: pickString(
      suggested.description,
      current.description || base.description,
    ),
    category: pickString(suggested.category, current.category || base.category),
    productType: pickString(
      suggested.productType,
      current.productType || base.productType,
    ),
    packSize: pickNumber(suggested.packSize, current.packSize ?? base.packSize),
    brand: pickString(suggested.brand, current.brand || base.brand),
    supplierId: pickString(
      suggested.supplierId,
      current.supplierId || base.supplierId,
    ),
    salePrice: pickNumber(
      suggested.salePrice,
      current.salePrice ?? base.salePrice,
    ),
    costPerUnitPrice: pickNumber(
      suggested.costPerUnitPrice,
      current.costPerUnitPrice ?? base.costPerUnitPrice,
    ),
    stockQuantity: pickNumber(
      suggested.stockQuantity,
      current.stockQuantity ?? base.stockQuantity,
    ),
    minStockLevel: pickNumber(
      suggested.minStockLevel,
      current.minStockLevel ?? base.minStockLevel,
    ),
    unitOfMeasure: pickString(
      suggested.unitOfMeasure,
      current.unitOfMeasure || base.unitOfMeasure,
    ) as UnitOfMeasure,
    barcode: pickString(suggested.barcode, current.barcode || base.barcode),
    expiryDate: pickString(
      suggested.expiryDate,
      current.expiryDate || base.expiryDate,
    ),
    batchNumber: pickString(
      suggested.batchNumber,
      current.batchNumber || base.batchNumber,
    ),
    serialNumber: pickString(
      suggested.serialNumber,
      current.serialNumber || base.serialNumber,
    ),
    mfgDate: pickString(suggested.mfgDate, current.mfgDate || base.mfgDate),
    dateOfPurchase: pickString(
      suggested.dateOfPurchase,
      current.dateOfPurchase || base.dateOfPurchase,
    ),
    modelNo: pickString(suggested.modelNo, current.modelNo || base.modelNo),
  };
}

export function mapLookupResponseToFormData(
  response: ProductCodeLookupResult,
): ProductFormData {
  const suggested = response.suggested ?? {};
  const base = emptyProductFormData();
  return mergeLookupIntoFormData(base, {
    ...suggested,
    unitOfMeasure:
      (suggested.unitOfMeasure as UnitOfMeasure) || UnitOfMeasureEnum.PIECE,
  });
}
