export enum PurchaseOrderStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  APPROVED = "approved",
  ORDERED = "ordered",
  ARRIVED = "arrived",
  PARTIALLY_RECEIVED = "partially_received",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

export interface PurchaseOrderItem {
  productId?: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitCost: number;
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
  status: PurchaseOrderStatus;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
  vehicleReg?: string;
  purchaseForType?: "vehicle" | "garage";
  vehicleId?: string;
  jobCardId?: string | null;
  department?: string;
  deliveryLocation?: string;
  requisitionNumber?: string;
  items?: PurchaseOrderItem[];
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
  purchaseForType?: "vehicle" | "garage";
  vehicleId?: string;
  jobCardId?: string | null;
  department?: string;
  deliveryLocation?: string;
  requisitionNumber?: string;
  items?: PurchaseOrderItem[];
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
  vehicleReg?: string | null;
  purchaseForType?: "vehicle" | "garage";
  vehicleId?: string | null;
  jobCardId?: string | null;
  department?: string;
  deliveryLocation?: string;
  requisitionNumber?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderResponse {
  purchaseOrder: PurchaseOrder;
}

export interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
}
