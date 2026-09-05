import { StockMovement } from './stockMovement';

export interface DumpItem extends StockMovement {
  productName?: string;
  productCode?: string;
  warehouseName?: string;
  locationName?: string;
  damageReason?: string;
  damageDate?: string;
  reportedBy?: string;
  estimatedLoss?: number;
}

export interface DumpItemCreate {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  unitCost: number;
  damageReason: string;
  damageDate: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  estimatedLoss?: number;
}

export interface DumpItemUpdate {
  quantity?: number;
  unitCost?: number;
  damageReason?: string;
  damageDate?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  estimatedLoss?: number;
}

export interface DumpItemResponse {
  dumpItem: DumpItem;
}

export interface DumpItemsResponse {
  dumpItems: DumpItem[];
  total: number;
}

export interface DumpsStats {
  totalDumps: number;
  totalLoss: number;
  dumpsThisMonth: number;
  lossThisMonth: number;
  topDamagedProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    totalLoss: number;
  }>;
  dumpsByWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    count: number;
    totalLoss: number;
  }>;
}

export interface DumpsStatsResponse {
  stats: DumpsStats;
}

export enum DamageReason {
  HANDLING_DAMAGE = 'handling_damage',
  STORAGE_DAMAGE = 'storage_damage',
  EXPIRY = 'expiry',
  CONTAMINATION = 'contamination',
  EQUIPMENT_FAILURE = 'equipment_failure',
  NATURAL_DISASTER = 'natural_disaster',
  THEFT = 'theft',
  OTHER = 'other',
}

export const DamageReasonLabels: Record<DamageReason, string> = {
  [DamageReason.HANDLING_DAMAGE]: 'Handling Damage',
  [DamageReason.STORAGE_DAMAGE]: 'Storage Damage',
  [DamageReason.EXPIRY]: 'Expired',
  [DamageReason.CONTAMINATION]: 'Contamination',
  [DamageReason.EQUIPMENT_FAILURE]: 'Equipment Failure',
  [DamageReason.NATURAL_DISASTER]: 'Natural Disaster',
  [DamageReason.THEFT]: 'Theft',
  [DamageReason.OTHER]: 'Other',
};
