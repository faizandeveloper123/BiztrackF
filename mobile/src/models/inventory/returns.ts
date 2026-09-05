import { StockMovement } from './stockMovement';

export interface CustomerReturn extends StockMovement {
  customerId?: string;
  customerName?: string;
  orderId?: string;
  returnReason?: string;
  returnDate?: string;
  refundAmount?: number;
  refundStatus?: string;
  productName?: string;
  productCode?: string;
  warehouseName?: string;
  locationName?: string;
}

export interface SupplierReturn extends StockMovement {
  supplierId?: string;
  supplierName?: string;
  purchaseOrderId?: string;
  returnReason?: string;
  returnDate?: string;
  creditAmount?: number;
  creditStatus?: string;
  productName?: string;
  productCode?: string;
  warehouseName?: string;
  locationName?: string;
}

export interface CustomerReturnCreate {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  unitCost: number;
  customerId?: string;
  orderId?: string;
  returnReason: string;
  returnDate: string;
  refundAmount?: number;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface SupplierReturnCreate {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  unitCost: number;
  supplierId?: string;
  purchaseOrderId?: string;
  returnReason: string;
  returnDate: string;
  creditAmount?: number;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface CustomerReturnUpdate {
  quantity?: number;
  unitCost?: number;
  customerId?: string;
  orderId?: string;
  returnReason?: string;
  returnDate?: string;
  refundAmount?: number;
  refundStatus?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface SupplierReturnUpdate {
  quantity?: number;
  unitCost?: number;
  supplierId?: string;
  purchaseOrderId?: string;
  returnReason?: string;
  returnDate?: string;
  creditAmount?: number;
  creditStatus?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface CustomerReturnResponse {
  customerReturn: CustomerReturn;
}

export interface SupplierReturnResponse {
  supplierReturn: SupplierReturn;
}

export interface CustomerReturnsResponse {
  customerReturns: CustomerReturn[];
  total: number;
}

export interface SupplierReturnsResponse {
  supplierReturns: SupplierReturn[];
  total: number;
}

export interface CustomerReturnsStats {
  totalReturns: number;
  totalRefundValue: number;
  returnsThisMonth: number;
  refundsThisMonth: number;
  topReturnReasons: Array<{
    reason: string;
    count: number;
    totalValue: number;
  }>;
  returnsByCustomer: Array<{
    customerId: string;
    customerName: string;
    count: number;
    totalValue: number;
  }>;
}

export interface SupplierReturnsStats {
  totalReturns: number;
  totalCreditValue: number;
  returnsThisMonth: number;
  creditsThisMonth: number;
  topReturnReasons: Array<{
    reason: string;
    count: number;
    totalValue: number;
  }>;
  returnsBySupplier: Array<{
    supplierId: string;
    supplierName: string;
    count: number;
    totalValue: number;
  }>;
}

export interface CustomerReturnsStatsResponse {
  stats: CustomerReturnsStats;
}

export interface SupplierReturnsStatsResponse {
  stats: SupplierReturnsStats;
}

export enum ReturnReason {
  DEFECTIVE = 'defective',
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
  NOT_AS_DESCRIBED = 'not_as_described',
  CUSTOMER_CHANGED_MIND = 'customer_changed_mind',
  EXPIRED = 'expired',
  OVERSTOCK = 'overstock',
  QUALITY_ISSUE = 'quality_issue',
  OTHER = 'other',
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  DENIED = 'denied',
  PARTIAL = 'partial',
}

export enum CreditStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  DENIED = 'denied',
  PARTIAL = 'partial',
}

export const ReturnReasonLabels: Record<ReturnReason, string> = {
  [ReturnReason.DEFECTIVE]: 'Defective Product',
  [ReturnReason.DAMAGED]: 'Damaged in Transit',
  [ReturnReason.WRONG_ITEM]: 'Wrong Item Sent',
  [ReturnReason.NOT_AS_DESCRIBED]: 'Not as Described',
  [ReturnReason.CUSTOMER_CHANGED_MIND]: 'Customer Changed Mind',
  [ReturnReason.EXPIRED]: 'Product Expired',
  [ReturnReason.OVERSTOCK]: 'Overstock Return',
  [ReturnReason.QUALITY_ISSUE]: 'Quality Issue',
  [ReturnReason.OTHER]: 'Other',
};

export const RefundStatusLabels: Record<RefundStatus, string> = {
  [RefundStatus.PENDING]: 'Pending',
  [RefundStatus.PROCESSED]: 'Processed',
  [RefundStatus.DENIED]: 'Denied',
  [RefundStatus.PARTIAL]: 'Partial',
};

export const CreditStatusLabels: Record<CreditStatus, string> = {
  [CreditStatus.PENDING]: 'Pending',
  [CreditStatus.PROCESSED]: 'Processed',
  [CreditStatus.DENIED]: 'Denied',
  [CreditStatus.PARTIAL]: 'Partial',
};
