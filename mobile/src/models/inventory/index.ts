export interface StockAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  alertType: string;
  message: string;
}

export interface InventoryDashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalWarehouses: number;
  totalSuppliers: number;
  pendingPurchaseOrders: number;
  pendingReceivings: number;
  totalStockValue: number;
  lowStockAlerts: StockAlert[];
}

export interface Warehouse {
  id: string;
  tenantId: string;
  createdBy: string;
  name: string;
  code: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  capacity?: number;
  usedCapacity?: number;
  temperatureZone?: string;
  securityLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseCreate {
  name: string;
  code: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive?: boolean;
  capacity?: number;
  usedCapacity?: number;
  temperatureZone?: string;
  securityLevel?: string;
}

export interface WarehouseUpdate {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive?: boolean;
  capacity?: number;
  usedCapacity?: number;
  temperatureZone?: string;
  securityLevel?: string;
}

export interface WarehouseResponse {
  warehouse: Warehouse;
}

export interface WarehousesResponse {
  warehouses: Warehouse[];
  total: number;
}

export interface StorageLocation {
  id: string;
  tenantId: string;
  createdBy: string;
  warehouseId: string;
  name: string;
  code: string;
  description?: string;
  locationType: string;
  parentLocationId?: string;
  capacity?: number;
  usedCapacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocationCreate {
  warehouseId: string;
  name: string;
  code: string;
  description?: string;
  locationType: string;
  parentLocationId?: string;
  capacity?: number;
  usedCapacity?: number;
  isActive?: boolean;
}

export interface StorageLocationUpdate {
  warehouseId?: string;
  name?: string;
  code?: string;
  description?: string;
  locationType?: string;
  parentLocationId?: string;
  capacity?: number;
  usedCapacity?: number;
  isActive?: boolean;
}

export interface StorageLocationResponse {
  storageLocation: StorageLocation;
}

export interface StorageLocationsResponse {
  storageLocations: StorageLocation[];
  total: number;
}

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
  tenantId?: string;
  createdBy?: string;
  productId: string;
  productName?: string;
  productSku?: string;
  productCategory?: string;
  warehouseId: string;
  locationId?: string;
  movementType: StockMovementType | string;
  quantity: number;
  unitCost: number;
  status: StockMovementStatus | string;
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

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  ARRIVED = 'arrived',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  createdBy: string;
  orderNumber: string;
  batchNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus | string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  vehicleReg?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderCreate {
  orderNumber?: string;
  batchNumber?: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status?: PurchaseOrderStatus;
  notes?: string;
  vehicleReg?: string;
}

export interface PurchaseOrderUpdate {
  orderNumber?: string;
  batchNumber?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  status?: PurchaseOrderStatus;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  notes?: string;
  vehicleReg?: string;
}

export interface PurchaseOrderResponse {
  purchaseOrder: PurchaseOrder;
}

export interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
}

export enum ReceivingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled',
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

export interface Receiving {
  id: string;
  tenantId: string;
  createdBy: string;
  receivingNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  status: ReceivingStatus | string;
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
