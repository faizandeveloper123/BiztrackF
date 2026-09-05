export const HRM_NATIVE_PATHS = [
  '/hrm',
  '/hrm/employees',
  '/hrm/job-postings',
  '/hrm/performance-reviews',
  '/hrm/leave-management',
  '/hrm/training',
  '/hrm/payroll',
  '/hrm/suppliers',
] as const;

export type HrmNativePath = (typeof HRM_NATIVE_PATHS)[number];

export function isHrmWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (HRM_NATIVE_PATHS as readonly string[]).includes(n);
}
