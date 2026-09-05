import { useAuth } from '../contexts/AuthContext';
import { useRBAC } from '../contexts/RBACContext';

const MANAGER_ROLES = new Set(['admin', 'super_admin', 'project_manager']);

export function useIsManagerPortal(): boolean {
  const { user } = useAuth();
  const { isOwner, hasPermission } = useRBAC();
  if (isOwner()) return true;
  if (user?.userRole && MANAGER_ROLES.has(user.userRole)) return true;
  if (hasPermission('hrm:create')) return true;
  if (hasPermission('hrm:leave_requests:update')) return true;
  if (hasPermission('hrm:employees:update')) return true;
  if (hasPermission('projects:create')) return true;
  return false;
}
