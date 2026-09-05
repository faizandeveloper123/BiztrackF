export enum StockMovementType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  DAMAGE = 'damage',
  EXPIRY = 'expiry',
  CYCLE_COUNT = 'cycle_count',
  INSTOCK = 'instock',
}

export enum StockMovementStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface StockMovement {
  id: string;
  tenantId: string;
  createdBy: string;
  productId: string;
  productName?: string;
  productSku?: string;
  productCategory?: string;
  warehouseId: string;
  locationId?: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost: number;
  status: StockMovementStatus;
  referenceNumber?: string;
  referenceType?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementCreate {
  productId: string;
  warehouseId: string;
  locationId?: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost: number;
  referenceNumber?: string;
  referenceType?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface StockMovementUpdate {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  movementType?: StockMovementType;
  quantity?: number;
  unitCost?: number;
  referenceNumber?: string;
  referenceType?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
}

export interface StockMovementResponse {
  stockMovement: StockMovement;
}

export interface StockMovementsResponse {
  stockMovements: StockMovement[];
  total: number;
}
