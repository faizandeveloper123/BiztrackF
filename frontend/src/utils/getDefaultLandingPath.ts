import { SIDEBAR_PATH_PERMISSIONS } from "@/src/constants/rbacPermissions";

const LANDING_PRIORITY = [
  "/dashboard",
  "/projects",
  "/users",
  "/crm",
  "/tasks",
  "/team",
  "/inventory/products",
  "/sales/invoice-dashboard",
  "/hrm/employees",
  "/reports",
  "/events",
];

function permissionSatisfied(permissions: string[], required: string): boolean {
  if (permissions.includes(required)) return true;
  const segments = required.split(":");
  if (segments.length === 2) {
    const [module, action] = segments;
    const prefix = `${module}:`;
    return permissions.some(
      (p) => p.startsWith(prefix) && p.endsWith(`:${action}`),
    );
  }
  if (segments.length >= 3) {
    const legacy = `${segments[0]}:${segments[segments.length - 1]}`;
    return permissions.includes(legacy);
  }
  return false;
}

export function getDefaultLandingPath(
  permissions: string[],
  isOwner: boolean,
  userRole?: string,
): string {
  if (userRole === "super_admin") {
    return "/admin/tenants";
  }

  if (isOwner) {
    return "/dashboard";
  }

  for (const path of LANDING_PRIORITY) {
    const required = SIDEBAR_PATH_PERMISSIONS[path];
    if (!required || permissionSatisfied(permissions, required)) {
      return path;
    }
  }

  for (const [path, required] of Object.entries(SIDEBAR_PATH_PERMISSIONS)) {
    if (permissionSatisfied(permissions, required)) {
      return path;
    }
  }

  return "/dashboard";
}
