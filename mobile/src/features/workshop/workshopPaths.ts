export const WORKSHOP_NATIVE_PATHS = [
  '/workshop-management/job-cards',
  '/workshop-management/vehicles',
  '/workshop-management/quality-control',
  '/workshop-management/mot/bookings',
] as const;

export function isWorkshopNativePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (WORKSHOP_NATIVE_PATHS as readonly string[]).includes(n);
}
