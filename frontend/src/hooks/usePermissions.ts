"use client";

import { useMemo } from "react";
import { useRBAC } from "@/src/contexts/RBACContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { formatRoleDisplayName } from "@/src/lib/utils";

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

  const currentUserRole = userPermissions?.role || currentTenantUser?.role;
  const currentRoleName = currentUserRole?.name || currentTenantUser?.role_id;
  const roleDisplayName =
    user?.userRole === "super_admin"
      ? "Super Admin"
      : formatRoleDisplayName(currentUserRole);

  return useMemo(
    () => ({
      currentUser: user,
      currentTenantUser,
      currentRole: currentUserRole,
      currentRoleName,
      roleDisplayName,
      permissions: userPermissions?.permissions || [],
      accessibleModules: userPermissions?.accessible_modules || [],
      isOwner: isOwner,
      hasPermission,
      hasModuleAccess,
      userPermissions,
      loading,
      initializing,

      canViewUsers: () => hasPermission("users:view") || isOwner(),
      canManageUsers: () => hasPermission("users:create") || isOwner(),
      canViewCRM: () => hasModuleAccess("crm"),
      canManageCRM: () => hasPermission("crm:create") || isOwner(),
      canViewHRM: () => hasModuleAccess("hrm"),
      canManageHRM: () => hasPermission("hrm:create") || isOwner(),
      canViewInventory: () => hasModuleAccess("inventory"),
      canManageInventory: () => hasPermission("inventory:create") || isOwner(),
      canViewFinance: () => hasModuleAccess("finance"),
      canManageFinance: () => hasPermission("finance:create") || isOwner(),
      canViewProjects: () => hasModuleAccess("projects"),
      canManageProjects: () => hasPermission("projects:create") || isOwner(),
      canUpdateProjects: () =>
        hasPermission("projects:update") ||
        hasPermission("projects:projects:update") ||
        isOwner(),
      canDeleteProjects: () =>
        hasPermission("projects:delete") ||
        hasPermission("projects:projects:delete") ||
        isOwner(),
      canViewProduction: () => hasModuleAccess("production"),
      canManageProduction: () => hasPermission("production:create") || isOwner(),
      canViewQuality: () => hasModuleAccess("quality"),
      canManageQuality: () => hasPermission("quality:create") || isOwner(),
      canViewBanking: () => hasModuleAccess("banking"),
      canManageBanking: () => hasPermission("banking:create") || isOwner(),
      canViewEvents: () => hasModuleAccess("events"),
      canManageEvents: () => hasPermission("events:create") || isOwner(),
      canViewSales: () => hasModuleAccess("sales"),
      canManageSales: () => hasPermission("sales:create") || isOwner(),
      canViewInvoices: () =>
        hasPermission("sales:invoices:view") ||
        hasPermission("sales:view") ||
        hasModuleAccess("sales") ||
        isOwner(),
      canManageInvoices: () =>
        hasPermission("sales:invoices:create") ||
        hasPermission("sales:invoices:update") ||
        hasPermission("sales:create") ||
        hasPermission("sales:update") ||
        isOwner(),
      canViewInvoiceDashboard: () =>
        hasPermission("sales:invoice_dashboard:view") || isOwner(),
      canViewReports: () => hasPermission("reports:view") || isOwner(),
      canExportReports: () => hasPermission("reports:export") || isOwner(),
      canCreateTasks: () =>
        hasPermission("projects:tasks:create") || isOwner(),
      canUpdateTasks: () =>
        hasPermission("projects:tasks:update") || isOwner(),
      canDeleteTasks: () =>
        hasPermission("projects:tasks:delete") || isOwner(),
    }),
    [
      user,
      currentTenantUser,
      currentUserRole,
      currentRoleName,
      roleDisplayName,
      userPermissions,
      isOwner,
      hasPermission,
      hasModuleAccess,
      loading,
      initializing,
    ],
  );
}

export function useModuleAccess(module: string) {
  const { hasModuleAccess } = useRBAC();
  return hasModuleAccess(module);
}

export function useCrudPermissions(prefix: string) {
  const { hasPermission, isOwner } = useRBAC();
  return {
    canView: () => hasPermission(`${prefix}:view`) || isOwner(),
    canCreate: () => hasPermission(`${prefix}:create`) || isOwner(),
    canUpdate: () => hasPermission(`${prefix}:update`) || isOwner(),
    canDelete: () => hasPermission(`${prefix}:delete`) || isOwner(),
  };
}

export function usePermission(permission: string) {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
}
