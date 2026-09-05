// POS Module Types and Interfaces

export enum POSPaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  BANK_TRANSFER = "bank_transfer",
  CHECK = "check",
  OTHER = "other",
}

export enum POSTransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum POSShiftStatus {
  OPEN = "open",
  CLOSED = "closed",
}

export enum ProductCategory {
  ELECTRONICS = "electronics",
  CLOTHING = "clothing",
  FOOD = "food",
  BEVERAGES = "beverages",
  BEAUTY = "beauty",
  HOME = "home",
  AUTOMOTIVE = "automotive",
  SPORTS = "sports",
  BOOKS = "books",
  OTHER = "other",
}

export enum UnitOfMeasure {
  PIECE = "piece",
  KILOGRAM = "kilogram",
  GRAM = "gram",
  LITER = "litre",
  MILLILITER = "millilitre",
  METER = "meter",
  CENTIMETER = "centimeter",
  SQUARE_METER = "square meter",
  CUBIC_METER = "cubic meter",
  BOX = "box",
  PACK = "pack",
  ROLL = "roll",
  SET = "set",
  PAIR = "pair",
  DOZEN = "dozen",
  OTHER = "other",
}

// Product Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  productType?: string;
  packSize?: number;
  supplierId?: string;
  supplierName?: string;
  salePrice: number;
  costPerUnitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  category: string;
  unitOfMeasure: UnitOfMeasure;
  barcode?: string;
  expiryDate?: string;
  batchNumber?: string;
  serialNumber?: string;
  mfgDate?: string;
  dateOfPurchase?: string;
  modelNo?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  productType?: string;
  packSize?: number;
  supplierId?: string;
  salePrice: number;
  costPerUnitPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  category: string;
  unitOfMeasure: UnitOfMeasure;
  barcode?: string;
  expiryDate?: string;
  batchNumber?: string;
  serialNumber?: string;
  mfgDate?: string;
  dateOfPurchase?: string;
  modelNo?: string;
}

export interface ProductUpdate {
  name?: string;
  sku?: string;
  description?: string;
  brand?: string;
  productType?: string;
  packSize?: number;
  supplierId?: string;
  salePrice?: number;
  costPerUnitPrice?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
  unitOfMeasure?: UnitOfMeasure;
  barcode?: string;
  expiryDate?: string;
  batchNumber?: string;
  serialNumber?: string;
  mfgDate?: string;
  dateOfPurchase?: string;
  modelNo?: string;
}

export interface POSCategoriesResponse {
  categories: string[];
  customCategories: { id: string; name: string }[];
}

// POS Transaction Types
export interface POSTransactionItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface POSTransaction {
  id: string;
  transactionNumber: string;
  customerId?: string;
  customerName?: string;
  items: POSTransactionItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  paymentMethod: POSPaymentMethod;
  status: POSTransactionStatus;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  notes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSTransactionCreate {
  customerId?: string;
  customerName?: string;
  items: Omit<POSTransactionItem, "id" | "total">[];
  taxRate: number;
  discount: number;
  paymentMethod: POSPaymentMethod;
  notes?: string;
}

export interface POSTransactionUpdate {
  status?: POSTransactionStatus;
  notes?: string;
}

// POS Shift Types
export interface POSShift {
  id: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  totalTransactions: number;
  status: POSShiftStatus;
  openedAt: string;
  closedAt?: string;
  notes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface POSShiftCreate {
  openingBalance: number;
  notes?: string;
}

export interface POSShiftUpdate {
  status?: POSShiftStatus;
  closingBalance?: number;
  notes?: string;
}

// Response Types
export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductResponse {
  product: Product;
}

export interface POSTransactionsResponse {
  transactions: POSTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface POSTransactionResponse {
  transaction: POSTransaction;
}

export interface POSShiftsResponse {
  shifts: POSShift[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface POSShiftResponse {
  shift: POSShift;
}

// Dashboard and Filter Types
export interface POSMetrics {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  lowStockItems: number;
  dailySales: Array<{
    date: string;
    sales: number;
    transactions: number;
  }>;
}

export interface POSDashboard {
  metrics: POSMetrics;
  recentTransactions: POSTransaction[];
  lowStockProducts: Product[];
}

export interface ProductFilters {
  category?: string;
  search?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface POSTransactionFilters {
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface POSShiftFilters {
  status?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
