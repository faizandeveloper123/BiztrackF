import type { UnitOfMeasure } from '../../../../models/pos';
import { UnitOfMeasure as UnitOfMeasureEnum } from '../../../../models/pos';
import { BLANK_PRODUCT_FORM, type ProductFormState } from './types';

export type ProductEntryMode = 'manual' | 'qr' | 'barcode';

export type ProductCodeLookupResult = {
  source: string;
  codeType: string;
  existsInCatalog: boolean;
  existingProductId?: string | null;
  suggested: Partial<Record<keyof ProductFormState, string | number>>;
  message: string;
};

function toFormString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function mergeLookupIntoForm(
  current: ProductFormState,
  suggested: Partial<Record<keyof ProductFormState, string | number>>,
): ProductFormState {
  const pick = (key: keyof ProductFormState, fallback: string) => {
    const value = suggested[key];
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
  };

  return {
    ...BLANK_PRODUCT_FORM,
    ...current,
    name: pick('name', current.name),
    sku: pick('sku', current.sku),
    description: pick('description', current.description),
    salePrice: pick('salePrice', current.salePrice),
    costPerUnitPrice: pick('costPerUnitPrice', current.costPerUnitPrice),
    stockQuantity: pick('stockQuantity', current.stockQuantity),
    minStockLevel: pick('minStockLevel', current.minStockLevel),
    category: pick('category', current.category),
    unitOfMeasure: (pick('unitOfMeasure', current.unitOfMeasure) as UnitOfMeasure) || UnitOfMeasureEnum.PIECE,
    barcode: pick('barcode', current.barcode),
    expiryDate: pick('expiryDate', current.expiryDate),
    batchNumber: pick('batchNumber', current.batchNumber),
    serialNumber: pick('serialNumber', current.serialNumber),
    mfgDate: pick('mfgDate', current.mfgDate),
    dateOfPurchase: pick('dateOfPurchase', current.dateOfPurchase),
    modelNo: pick('modelNo', current.modelNo),
  };
}

export function mapLookupResponseToForm(response: ProductCodeLookupResult): ProductFormState {
  const suggested = response.suggested ?? {};
  const normalized = Object.fromEntries(
    Object.entries(suggested).map(([key, value]) => [key, toFormString(value)]),
  ) as Partial<Record<keyof ProductFormState, string>>;
  return mergeLookupIntoForm(BLANK_PRODUCT_FORM, normalized);
}
