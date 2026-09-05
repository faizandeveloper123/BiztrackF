export const PROJECT_NATIVE_PATHS = [
  '/projects',
  '/tasks',
  '/team',
  '/time-tracking',
] as const;

export type ProjectNativePath = (typeof PROJECT_NATIVE_PATHS)[number];

export function isProjectWorkspacePath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (PROJECT_NATIVE_PATHS as readonly string[]).includes(n);
}
