export enum ReceivingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
}

export interface ReceivingItem {
  id: string;
  receivingId: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivingItemCreate {
  purchaseOrderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface ReceivingItemUpdate {
  purchaseOrderId?: string;
  productId?: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  receivedQuantity?: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  notes?: string;
}

export interface Receiving {
  id: string;
  tenantId: string;
  createdBy: string;
  receivingNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  status: ReceivingStatus;
  receivedDate: string;
  notes?: string;
  items: ReceivingItemCreate[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceivingCreate {
  receivingNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receivedDate: string;
  notes?: string;
  items: ReceivingItemCreate[];
}

export interface ReceivingUpdate {
  receivingNumber?: string;
  purchaseOrderId?: string;
  warehouseId?: string;
  status?: ReceivingStatus;
  receivedDate?: string;
  notes?: string;
}

export interface ReceivingResponse {
  receiving: Receiving;
}

export interface ReceivingsResponse {
  receivings: Receiving[];
  total: number;
}
