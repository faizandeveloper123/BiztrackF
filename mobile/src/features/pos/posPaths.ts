export const POS_NATIVE_PATHS = [
  '/pos',
  '/pos/sale',
  '/pos/products',
  '/pos/transactions',
  '/pos/shifts',
  '/pos/reports',
] as const;

export type PosNativePath = (typeof POS_NATIVE_PATHS)[number];

export function isPosWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (POS_NATIVE_PATHS as readonly string[]).includes(n);
}
