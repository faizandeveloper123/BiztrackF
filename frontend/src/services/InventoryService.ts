import { apiService } from "./ApiService";
import {
  WarehouseCreate,
  WarehouseUpdate,
  WarehousesResponse,
  WarehouseResponse,
  StorageLocationCreate,
  StorageLocationUpdate,
  StorageLocationsResponse,
  StorageLocationResponse,
  StockMovementCreate,
  StockMovementUpdate,
  StockMovementsResponse,
  StockMovementResponse,
  PurchaseOrderCreate,
  PurchaseOrderUpdate,
  PurchaseOrdersResponse,
  PurchaseOrderResponse,
  ReceivingCreate,
  ReceivingUpdate,
  ReceivingsResponse,
  ReceivingResponse,
  InventoryDashboardStats,
} from "../models/inventory";

class InventoryService {
  private handleError(error: any, endpoint: string) {
    console.error(`[InventoryService] Error calling ${endpoint}:`, error);
    if (error.response) {
      console.error(
        `[InventoryService] Response status: ${error.response.status}`,
      );
      console.error(`[InventoryService] Response data:`, error.response.data);
    } else if (error.request) {
      console.error(
        `[InventoryService] No response received. Request:`,
        error.request,
      );
    } else {
      console.error(`[InventoryService] Error message:`, error.message);
    }
    throw error;
  }

  async getWarehouses(
    skip: number = 0,
    limit: number = 100,
  ): Promise<WarehousesResponse> {
    try {
      const response = await apiService.get(
        `/inventory/warehouses?skip=${skip}&limit=${limit}`,
      );
      return response;
    } catch (error) {
      this.handleError(error, "/inventory/warehouses");
      throw error;
    }
  }

  async getWarehouse(id: string): Promise<WarehouseResponse> {
    const response = await apiService.get(`/inventory/warehouses/${id}`);
    return response;
  }

  async createWarehouse(
    warehouse: WarehouseCreate,
  ): Promise<WarehouseResponse> {
    const response = await apiService.post("/inventory/warehouses", warehouse);
    return response;
  }

  async updateWarehouse(
    id: string,
    warehouse: WarehouseUpdate,
  ): Promise<WarehouseResponse> {
    const response = await apiService.put(
      `/inventory/warehouses/${id}`,
      warehouse,
    );
    return response;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await apiService.delete(`/inventory/warehouses/${id}`);
  }

  // Storage Location Management
  async getStorageLocations(
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StorageLocationsResponse> {
    const params = new URLSearchParams();
    if (warehouseId) params.append("warehouse_id", warehouseId);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/storage-locations?${params.toString()}`,
    );
    return response;
  }

  async getStorageLocation(id: string): Promise<StorageLocationResponse> {
    const response = await apiService.get(`/inventory/storage-locations/${id}`);
    return response;
  }

  async createStorageLocation(
    location: StorageLocationCreate,
  ): Promise<StorageLocationResponse> {
    const response = await apiService.post(
      "/inventory/storage-locations",
      location,
    );
    return response;
  }

  async updateStorageLocation(
    id: string,
    location: StorageLocationUpdate,
  ): Promise<StorageLocationResponse> {
    const response = await apiService.put(
      `/inventory/storage-locations/${id}`,
      location,
    );
    return response;
  }

  async deleteStorageLocation(id: string): Promise<void> {
    await apiService.delete(`/inventory/storage-locations/${id}`);
  }

  // Stock Movement Management
  async getStockMovements(
    productId?: string,
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StockMovementsResponse> {
    const params = new URLSearchParams();
    if (productId) params.append("product_id", productId);
    if (warehouseId) params.append("warehouse_id", warehouseId);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/stock-movements?${params.toString()}`,
    );
    return response;
  }

  async getStockMovement(id: string): Promise<StockMovementResponse> {
    const response = await apiService.get(`/inventory/stock-movements/${id}`);
    return response;
  }

  async createStockMovement(
    movement: StockMovementCreate,
  ): Promise<StockMovementResponse> {
    const response = await apiService.post(
      "/inventory/stock-movements",
      movement,
    );
    return response;
  }

  async updateStockMovement(
    id: string,
    movement: StockMovementUpdate,
  ): Promise<StockMovementResponse> {
    const response = await apiService.put(
      `/inventory/stock-movements/${id}`,
      movement,
    );
    return response;
  }

  async deleteStockMovement(id: string): Promise<void> {
    await apiService.delete(`/inventory/stock-movements/${id}`);
  }

  // Purchase Order Management
  async getPurchaseOrders(
    status?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<PurchaseOrdersResponse> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/purchase-orders?${params.toString()}`,
    );
    return response;
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrderResponse> {
    const response = await apiService.get(`/inventory/purchase-orders/${id}`);
    return response;
  }

  async createPurchaseOrder(
    order: PurchaseOrderCreate,
  ): Promise<PurchaseOrderResponse> {
    const response = await apiService.post("/inventory/purchase-orders", order);
    return response;
  }

  async updatePurchaseOrder(
    id: string,
    order: PurchaseOrderUpdate,
  ): Promise<PurchaseOrderResponse> {
    const response = await apiService.put(
      `/inventory/purchase-orders/${id}`,
      order,
    );
    return response;
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    await apiService.delete(`/inventory/purchase-orders/${id}`);
  }

  // Receiving Management
  async getReceivings(
    status?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<ReceivingsResponse> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/receivings?${params.toString()}`,
    );
    return response;
  }

  async getReceiving(id: string): Promise<ReceivingResponse> {
    const response = await apiService.get(`/inventory/receivings/${id}`);
    return response;
  }

  async createReceiving(
    receiving: ReceivingCreate,
  ): Promise<ReceivingResponse> {
    const response = await apiService.post("/inventory/receivings", receiving);
    return response;
  }

  async updateReceiving(
    id: string,
    receiving: ReceivingUpdate,
  ): Promise<ReceivingResponse> {
    const response = await apiService.put(
      `/inventory/receivings/${id}`,
      receiving,
    );
    return response;
  }

  async deleteReceiving(id: string): Promise<void> {
    await apiService.delete(`/inventory/receivings/${id}`);
  }

  // Dashboard
  async getInventoryDashboard(): Promise<InventoryDashboardStats> {
    try {
      const response = await apiService.get("/inventory/dashboard");
      return response;
    } catch (error) {
      this.handleError(error, "/inventory/dashboard");
      throw error;
    }
  }

  // Dumps Management
  async getDumps(
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StockMovementsResponse> {
    const params = new URLSearchParams();
    if (warehouseId) params.append("warehouse_id", warehouseId);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/dumps?${params.toString()}`,
    );
    return response;
  }

  async createDump(dump: StockMovementCreate): Promise<StockMovementResponse> {
    const response = await apiService.post("/inventory/dumps", dump);
    return response;
  }

  // Customer Returns Management
  async getCustomerReturns(
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StockMovementsResponse> {
    const params = new URLSearchParams();
    if (warehouseId) params.append("warehouse_id", warehouseId);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/customer-returns?${params.toString()}`,
    );
    return response;
  }

  async createCustomerReturn(
    returnData: StockMovementCreate,
  ): Promise<StockMovementResponse> {
    const response = await apiService.post(
      "/inventory/customer-returns",
      returnData,
    );
    return response;
  }

  // Supplier Returns Management
  async getSupplierReturns(
    warehouseId?: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<StockMovementsResponse> {
    const params = new URLSearchParams();
    if (warehouseId) params.append("warehouse_id", warehouseId);
    params.append("skip", skip.toString());
    params.append("limit", limit.toString());

    const response = await apiService.get(
      `/inventory/supplier-returns?${params.toString()}`,
    );
    return response;
  }

  async createSupplierReturn(
    returnData: StockMovementCreate,
  ): Promise<StockMovementResponse> {
    const response = await apiService.post(
      "/inventory/supplier-returns",
      returnData,
    );
    return response;
  }
}

export const inventoryService = new InventoryService();
