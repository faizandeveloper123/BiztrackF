export const INVENTORY_NATIVE_PATHS = [
  '/inventory',
  '/inventory/warehouses',
  '/inventory/storage-locations',
  '/inventory/stock-movements',
  '/inventory/purchase-orders',
  '/inventory/receiving',
  '/inventory/products',
  '/inventory/alerts',
  '/inventory/dumps',
  '/inventory/customer-returns',
  '/inventory/supplier-returns',
] as const;

export type InventoryNativePath = (typeof INVENTORY_NATIVE_PATHS)[number];

export function isInventoryWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (INVENTORY_NATIVE_PATHS as readonly string[]).includes(n);
}
