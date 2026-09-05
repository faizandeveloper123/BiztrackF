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
