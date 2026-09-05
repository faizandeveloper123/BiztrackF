export const WORKSPACE_HUB_PATHS = ['/reports', '/events', '/users'] as const;

export type WorkspaceHubPath = (typeof WORKSPACE_HUB_PATHS)[number];

export function isWorkspaceHubPath(path: string): boolean {
  const n = path.startsWith('/') ? path : `/${path}`;
  return (WORKSPACE_HUB_PATHS as readonly string[]).includes(n);
}
