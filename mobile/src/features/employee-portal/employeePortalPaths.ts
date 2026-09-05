export const EMPLOYEE_PORTAL_PATHS = [
  '/employee-portal',
  '/employee-portal/profile',
  '/employee-portal/leave',
  '/employee-portal/time',
  '/employee-portal/tasks',
  '/employee-portal/devices',
  '/employee-portal/approvals',
  '/employee-portal/manage-devices',
] as const;

export type EmployeePortalPath = (typeof EMPLOYEE_PORTAL_PATHS)[number];

export function isEmployeePortalPath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (EMPLOYEE_PORTAL_PATHS as readonly string[]).includes(n);
}
