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
