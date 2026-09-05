export const HEALTHCARE_NATIVE_PATHS = [
  '/healthcare/appointments',
  '/healthcare/patients',
  '/healthcare/staff',
  '/healthcare/doctors',
  '/healthcare/calendar',
  '/healthcare/patient-history',
  '/healthcare/admitted-patients',
  '/healthcare/payments',
  '/healthcare/daily-expense',
] as const;

export type HealthcareNativePath = (typeof HEALTHCARE_NATIVE_PATHS)[number];

export function isHealthcareNativePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (HEALTHCARE_NATIVE_PATHS as readonly string[]).includes(n);
}
