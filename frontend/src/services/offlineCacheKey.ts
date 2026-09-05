export function offlineGetCacheKey(
  tenantId: string,
  configUrl: string,
  params?: Record<string, unknown> | null,
): string {
  return `${tenantId}|GET|${configUrl}|${JSON.stringify(params ?? {})}`;
}

export function offlineRequestPathname(url: string): string {
  const raw = url.split("?")[0] || "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw;
}

export const OFFLINE_AGGREGATE_FALLBACK_PATHS = new Set<string>([
  "/sales/leads",
  "/sales/contacts",
  "/sales/companies",
  "/sales/opportunities",
  "/sales/quotes",
  "/sales/contracts",
  "/sales/activities",
  "/tasks",
  "/events",
  "/crm/leads",
  "/crm/contacts",
  "/crm/companies",
  "/crm/opportunities",
  "/crm/activities",
  "/healthcare/doctors",
  "/healthcare/patients",
  "/healthcare/staff",
  "/healthcare/appointments",
  "/healthcare/prescriptions",
  "/healthcare/expense-categories",
  "/healthcare/daily-expenses",
  "/healthcare/admissions",
  "/healthcare/admission-invoices",
  "/hrm/employees",
  "/hrm/jobs",
  "/hrm/applications",
  "/hrm/reviews",
  "/hrm/time-entries",
  "/hrm/leave-requests",
  "/hrm/payroll",
  "/hrm/benefits",
  "/hrm/training",
  "/invoices",
  "/inventory/warehouses",
  "/inventory/storage-locations",
  "/inventory/stock-movements",
  "/inventory/purchase-orders",
  "/inventory/receivings",
  "/investments",
  "/ledger/chart-of-accounts",
  "/ledger/transactions",
  "/ledger/journal-entries",
  "/ledger/financial-periods",
  "/ledger/budgets",
  "/installments/installment-plans",
  "/delivery-notes",
]);

export function offlineUseAggregateFallback(
  pathname: string,
  fullUrl: string,
): boolean {
  if (!OFFLINE_AGGREGATE_FALLBACK_PATHS.has(pathname)) {
    return false;
  }
  if (pathname === "/tasks" && fullUrl.includes("project=")) {
    return false;
  }
  if (
    pathname === "/events" &&
    (fullUrl.includes("project_id=") || fullUrl.includes("user_id="))
  ) {
    return false;
  }
  return true;
}
