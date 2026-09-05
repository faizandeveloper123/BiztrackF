import { apiService } from '../ApiService';
import type {
  ProductCreate,
  ProductUpdate,
  ProductResponse,
} from '../../models/pos';
import type {
  WarehousesResponse,
  WarehouseResponse,
  WarehouseCreate,
  WarehouseUpdate,
  StorageLocationsResponse,
  StorageLocationResponse,
  StorageLocationCreate,
  StorageLocationUpdate,
  StockMovementsResponse,
  StockMovementResponse,
  StockMovementCreate,
  StockMovementUpdate,
  PurchaseOrdersResponse,
  PurchaseOrderResponse,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  ReceivingsResponse,
  ReceivingResponse,
  ReceivingCreate,
  ReceivingUpdate,
  InventoryDashboardStats,
} from '../../models/inventory';
import type { Product } from '../../models/pos';
import type { POSCategoriesResponse } from '../../models/pos';

export async function getInventoryDashboard(): Promise<InventoryDashboardStats> {
  return apiService.get<InventoryDashboardStats>('/inventory/dashboard');
}

export async function getWarehouses(
  skip = 0,
  limit = 200,
): Promise<WarehousesResponse> {
  return apiService.get<WarehousesResponse>(
    `/inventory/warehouses?skip=${skip}&limit=${limit}`,
  );
}

export async function getWarehouse(id: string): Promise<WarehouseResponse> {
  return apiService.get<WarehouseResponse>(`/inventory/warehouses/${id}`);
}

export async function createWarehouse(
  data: WarehouseCreate,
): Promise<WarehouseResponse> {
  return apiService.post<WarehouseResponse>('/inventory/warehouses', data);
}

export async function updateWarehouse(
  id: string,
  data: WarehouseUpdate,
): Promise<WarehouseResponse> {
  return apiService.put<WarehouseResponse>(
    `/inventory/warehouses/${id}`,
    data,
  );
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiService.delete(`/inventory/warehouses/${id}`);
}

export async function getStorageLocations(
  warehouseId?: string,
  skip = 0,
  limit = 200,
): Promise<StorageLocationsResponse> {
  const p = new URLSearchParams();
  if (warehouseId) p.append('warehouse_id', warehouseId);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<StorageLocationsResponse>(
    `/inventory/storage-locations?${p.toString()}`,
  );
}

export async function createStorageLocation(
  data: StorageLocationCreate,
): Promise<StorageLocationResponse> {
  return apiService.post<StorageLocationResponse>(
    '/inventory/storage-locations',
    data,
  );
}

export async function updateStorageLocation(
  id: string,
  data: StorageLocationUpdate,
): Promise<StorageLocationResponse> {
  return apiService.put<StorageLocationResponse>(
    `/inventory/storage-locations/${id}`,
    data,
  );
}

export async function deleteStorageLocation(id: string): Promise<void> {
  await apiService.delete(`/inventory/storage-locations/${id}`);
}

export async function getStockMovements(
  productId?: string,
  warehouseId?: string,
  skip = 0,
  limit = 200,
): Promise<StockMovementsResponse> {
  const p = new URLSearchParams();
  if (productId) p.append('product_id', productId);
  if (warehouseId) p.append('warehouse_id', warehouseId);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<StockMovementsResponse>(
    `/inventory/stock-movements?${p.toString()}`,
  );
}

export async function createStockMovement(
  data: StockMovementCreate,
): Promise<StockMovementResponse> {
  return apiService.post<StockMovementResponse>(
    '/inventory/stock-movements',
    data,
  );
}

export async function updateStockMovement(
  id: string,
  data: StockMovementUpdate,
): Promise<StockMovementResponse> {
  return apiService.put<StockMovementResponse>(
    `/inventory/stock-movements/${id}`,
    data,
  );
}

export async function deleteStockMovement(id: string): Promise<void> {
  await apiService.delete(`/inventory/stock-movements/${id}`);
}

export async function getPurchaseOrders(
  status?: string,
  skip = 0,
  limit = 200,
): Promise<PurchaseOrdersResponse> {
  const p = new URLSearchParams();
  if (status) p.append('status', status);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<PurchaseOrdersResponse>(
    `/inventory/purchase-orders?${p.toString()}`,
  );
}

export async function getPurchaseOrder(
  id: string,
): Promise<PurchaseOrderResponse> {
  return apiService.get<PurchaseOrderResponse>(
    `/inventory/purchase-orders/${id}`,
  );
}

export async function createPurchaseOrder(
  data: PurchaseOrderCreate,
): Promise<PurchaseOrderResponse> {
  return apiService.post<PurchaseOrderResponse>(
    '/inventory/purchase-orders',
    data,
  );
}

export async function updatePurchaseOrder(
  id: string,
  data: PurchaseOrderUpdate,
): Promise<PurchaseOrderResponse> {
  return apiService.put<PurchaseOrderResponse>(
    `/inventory/purchase-orders/${id}`,
    data,
  );
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await apiService.delete(`/inventory/purchase-orders/${id}`);
}

export async function getReceivings(
  status?: string,
  skip = 0,
  limit = 200,
): Promise<ReceivingsResponse> {
  const p = new URLSearchParams();
  if (status) p.append('status', status);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<ReceivingsResponse>(
    `/inventory/receivings?${p.toString()}`,
  );
}

export async function createReceiving(
  data: ReceivingCreate,
): Promise<ReceivingResponse> {
  return apiService.post<ReceivingResponse>('/inventory/receivings', data);
}

export async function updateReceiving(
  id: string,
  data: ReceivingUpdate,
): Promise<ReceivingResponse> {
  return apiService.put<ReceivingResponse>(
    `/inventory/receivings/${id}`,
    data,
  );
}

export async function deleteReceiving(id: string): Promise<void> {
  await apiService.delete(`/inventory/receivings/${id}`);
}

export async function getDumps(
  warehouseId?: string,
  skip = 0,
  limit = 200,
): Promise<StockMovementsResponse> {
  const p = new URLSearchParams();
  if (warehouseId) p.append('warehouse_id', warehouseId);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<StockMovementsResponse>(
    `/inventory/dumps?${p.toString()}`,
  );
}

export async function getCustomerReturns(
  warehouseId?: string,
  skip = 0,
  limit = 200,
): Promise<StockMovementsResponse> {
  const p = new URLSearchParams();
  if (warehouseId) p.append('warehouse_id', warehouseId);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<StockMovementsResponse>(
    `/inventory/customer-returns?${p.toString()}`,
  );
}

export async function createCustomerReturn(
  data: StockMovementCreate,
): Promise<StockMovementResponse> {
  return apiService.post<StockMovementResponse>(
    '/inventory/customer-returns',
    data,
  );
}

export async function getSupplierReturns(
  warehouseId?: string,
  skip = 0,
  limit = 200,
): Promise<StockMovementsResponse> {
  const p = new URLSearchParams();
  if (warehouseId) p.append('warehouse_id', warehouseId);
  p.append('skip', String(skip));
  p.append('limit', String(limit));
  return apiService.get<StockMovementsResponse>(
    `/inventory/supplier-returns?${p.toString()}`,
  );
}

export async function createSupplierReturn(
  data: StockMovementCreate,
): Promise<StockMovementResponse> {
  return apiService.post<StockMovementResponse>(
    '/inventory/supplier-returns',
    data,
  );
}

export async function fetchPosProducts(): Promise<{ products: Product[] }> {
  return apiService.get<{ products: Product[] }>('/pos/products');
}

export async function fetchProductCategories(): Promise<POSCategoriesResponse> {
  return apiService.get<POSCategoriesResponse>('/pos/categories');
}

export async function getProduct(id: string): Promise<ProductResponse> {
  return apiService.get<ProductResponse>(`/pos/products/${id}`);
}

export async function createProduct(data: ProductCreate): Promise<ProductResponse> {
  return apiService.post<ProductResponse>('/pos/products', data);
}

export async function updateProduct(id: string, data: ProductUpdate): Promise<ProductResponse> {
  return apiService.put<ProductResponse>(`/pos/products/${id}`, data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiService.delete(`/pos/products/${id}`);
}

export type ProductCodeLookupResult = {
  source: string;
  codeType: string;
  existsInCatalog: boolean;
  existingProductId?: string | null;
  suggested: Record<string, string | number | null | undefined>;
  message: string;
};

export async function lookupProductCode(code: string): Promise<ProductCodeLookupResult> {
  return apiService.get<ProductCodeLookupResult>(
    `/pos/products/lookup?code=${encodeURIComponent(code)}`,
  );
}
