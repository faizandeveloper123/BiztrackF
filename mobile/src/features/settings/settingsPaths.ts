export const SETTINGS_NATIVE_PATHS = [
  '/settings',
  '/settings/invoice',
  '/notifications',
  '/notifications/settings',
  '/subscription/manage',
] as const;

export type SettingsNativePath = (typeof SETTINGS_NATIVE_PATHS)[number];

export function isSettingsWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (SETTINGS_NATIVE_PATHS as readonly string[]).includes(n);
}
