export const BANKING_NATIVE_PATHS = [
  '/banking',
  '/banking/accounts',
  '/banking/transactions',
  '/banking/reconciliation',
] as const;

export type BankingNativePath = (typeof BANKING_NATIVE_PATHS)[number];

export function isBankingWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (BANKING_NATIVE_PATHS as readonly string[]).includes(n);
}
