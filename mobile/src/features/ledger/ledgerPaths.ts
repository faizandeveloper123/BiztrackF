export const LEDGER_NATIVE_PATHS = [
  '/ledger',
  '/ledger/profit-loss',
  '/ledger/investments',
  '/ledger/transactions',
  '/ledger/account-receivables',
  '/ledger/reports',
] as const;

export type LedgerNativePath = (typeof LEDGER_NATIVE_PATHS)[number];

export function isLedgerWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (LEDGER_NATIVE_PATHS as readonly string[]).includes(n);
}
