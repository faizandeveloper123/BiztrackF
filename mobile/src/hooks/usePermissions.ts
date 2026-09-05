import { useRBAC } from '../contexts/RBACContext';
import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const {
    userPermissions,
    hasPermission,
    hasModuleAccess,
    isOwner,
    loading,
    initializing,
    tenantUsers,
  } = useRBAC();

  const currentTenantUser = tenantUsers.find((tu) => tu.id === user?.id);

  const currentUserRole = currentTenantUser?.role;
  const currentRoleName =
    currentUserRole?.name || currentTenantUser?.role_id;

  return {
    currentUser: user,
    currentTenantUser,
    currentRole: currentUserRole,
    currentRoleName,
    permissions: userPermissions?.permissions || [],
    accessibleModules: userPermissions?.accessible_modules || [],
    isOwner,
    hasPermission,
    hasModuleAccess,
    userPermissions,
    loading,
    initializing,
    canManageUsers: () => hasPermission('users:create') || isOwner(),
    canViewCRM: () => hasModuleAccess('crm'),
    canManageCRM: () => hasPermission('crm:create') || isOwner(),
    canViewHRM: () => hasModuleAccess('hrm'),
    canManageHRM: () => hasPermission('hrm:create') || isOwner(),
    canViewInventory: () => hasModuleAccess('inventory'),
    canManageInventory: () => hasPermission('inventory:create') || isOwner(),
    canViewFinance: () => hasModuleAccess('finance'),
    canManageFinance: () => hasPermission('finance:create') || isOwner(),
    canViewProjects: () => hasModuleAccess('projects'),
    canManageProjects: () => hasPermission('projects:create') || isOwner(),
    canViewQuality: () => hasModuleAccess('quality'),
    canManageQuality: () => hasPermission('quality:create') || isOwner(),
    canViewBanking: () => hasModuleAccess('banking'),
    canManageBanking: () => hasPermission('banking:create') || isOwner(),
    canViewLedger: () => hasModuleAccess('ledger'),
    canManageLedger: () =>
      hasPermission('ledger:transactions:create') || isOwner(),
    canViewEvents: () => hasModuleAccess('events'),
    canManageEvents: () => hasPermission('events:create') || isOwner(),
    canViewSales: () => hasModuleAccess('sales'),
    canManageSales: () => hasPermission('sales:create') || isOwner(),
    canViewInvoices: () =>
      hasModuleAccess('sales') || hasPermission('sales:view') || isOwner(),
    canManageInvoices: () =>
      hasPermission('sales:create') ||
      hasPermission('sales:update') ||
      isOwner(),
    canViewReports: () => hasPermission('reports:view') || isOwner(),
    canExportReports: () => hasPermission('reports:export') || isOwner(),
    canCreateTasks: () =>
      hasPermission('projects:tasks:create') || isOwner(),
    canUpdateTasks: () =>
      hasPermission('projects:tasks:update') || isOwner(),
    canDeleteTasks: () =>
      hasPermission('projects:tasks:delete') || isOwner(),
  };
}
