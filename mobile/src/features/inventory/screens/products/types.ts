import { ProductCategory, UnitOfMeasure, type Product } from '../../../../models/pos';

export type ProductFormState = {
  name: string;
  sku: string;
  description: string;
  salePrice: string;
  costPerUnitPrice: string;
  stockQuantity: string;
  minStockLevel: string;
  category: string;
  unitOfMeasure: UnitOfMeasure;
  barcode: string;
  expiryDate: string;
  batchNumber: string;
  serialNumber: string;
  mfgDate: string;
  dateOfPurchase: string;
  modelNo: string;
};

export const BLANK_PRODUCT_FORM: ProductFormState = {
  name: '',
  sku: '',
  description: '',
  salePrice: '',
  costPerUnitPrice: '',
  stockQuantity: '0',
  minStockLevel: '0',
  category: ProductCategory.OTHER,
  unitOfMeasure: UnitOfMeasure.PIECE,
  barcode: '',
  expiryDate: '',
  batchNumber: '',
  serialNumber: '',
  mfgDate: '',
  dateOfPurchase: new Date().toISOString().split('T')[0],
  modelNo: '',
};

export function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? '',
    salePrice: String(product.salePrice),
    costPerUnitPrice: String(product.costPerUnitPrice),
    stockQuantity: String(product.stockQuantity),
    minStockLevel: String(product.minStockLevel),
    category: product.category,
    unitOfMeasure: product.unitOfMeasure as UnitOfMeasure,
    barcode: product.barcode ?? '',
    expiryDate: product.expiryDate ?? '',
    batchNumber: product.batchNumber ?? '',
    serialNumber: product.serialNumber ?? '',
    mfgDate: product.mfgDate ?? '',
    dateOfPurchase: product.dateOfPurchase ?? new Date().toISOString().split('T')[0],
    modelNo: product.modelNo ?? '',
  };
}
