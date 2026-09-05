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

export interface InventoryReport {
  reportType: string;
  dateRange: string;
  data: Record<string, any>[];
  summary: Record<string, any>;
}
