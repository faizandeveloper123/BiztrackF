export const RESERVED_ROOT_SEGMENTS = new Set([
  "about",
  "admin",
  "api",
  "banking",
  "contact",
  "crm",
  "dashboard",
  "events",
  "healthcare",
  "hrm",
  "inventory",
  "invoices",
  "ledger",
  "login",
  "mot",
  "ngo",
  "notifications",
  "pos",
  "profile",
  "projects",
  "reports",
  "reset-password",
  "sales",
  "settings",
  "signup",
  "subscription",
  "tasks",
  "team",
  "time-tracking",
  "users",
  "workshop-management",
  "workspace",
  "client-portal",
  "i",
  "_next",
  "favicon.ico",
  "manifest.json",
]);

export function isTenantMotPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return false;

  if (parts.length === 1) {
    return !RESERVED_ROOT_SEGMENTS.has(parts[0].toLowerCase());
  }

  if (parts.length >= 2 && parts[1] === "mot") {
    if (parts[2] === "book") return true;
    if (parts[2] === "bookings" && parts.length >= 4) return true;
  }

  return false;
}

export function getTenantDomainFromPath(
  pathname: string | null,
): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  if (RESERVED_ROOT_SEGMENTS.has(parts[0].toLowerCase())) return null;
  return parts[0];
}
