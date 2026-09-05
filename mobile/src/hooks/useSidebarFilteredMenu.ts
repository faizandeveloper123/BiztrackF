import { useMemo } from 'react';
import { apiService } from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';
import { usePlanInfo } from './usePlanInfo';
import { usePermissions } from './usePermissions';
import { SIDEBAR_PATH_PERMISSIONS } from '../constants/rbacPermissions';
import {
  allMenuItems,
  superAdminMenuItems,
  type MenuItemDef,
} from '../navigation/sidebarMenuData';

export function evalSidebarPathPermission(
  path: string | undefined,
  isOwner: () => boolean,
  hasPermission: (p: string) => boolean,
): boolean {
  if (!path || isOwner()) return true;
  const requiredPermission = SIDEBAR_PATH_PERMISSIONS[path];
  if (!requiredPermission) return true;
  return hasPermission(requiredPermission);
}

function getModuleForMenuItem(item: MenuItemDef): string | null {
  const moduleMap: Record<string, string> = {
    CRM: 'crm',
    Customers: 'crm',
    Sales: 'sales',
    Invoicing: 'sales',
    HRM: 'hrm',
    'HRM Management': 'hrm',
    Inventory: 'inventory',
    Finance: 'finance',
    Banking: 'banking',
    Ledger: 'ledger',
    'Financial Ledger': 'ledger',
    POS: 'pos',
    Projects: 'projects',
    'Project Management': 'projects',
    'Workshop Management': 'production',
    'Quality Control': 'quality',
    Events: 'events',
    Reports: 'reports',
    Dashboard: 'dashboard',
    Healthcare: 'healthcare',
  };
  return moduleMap[item.text] || null;
}

export function useSidebarFilteredMenu(searchQuery: string): {
  filteredItems: MenuItemDef[];
  isSuperAdminNoTenant: boolean;
  menuBootLoading: boolean;
  planInfo: ReturnType<typeof usePlanInfo>['planInfo'];
} {
  const { planInfo, loading: planLoading } = usePlanInfo();
  const { user } = useAuth();
  const {
    hasModuleAccess,
    hasPermission,
    isOwner,
    initializing,
    accessibleModules,
  } = usePermissions();

  const isSuperAdminNoTenant =
    user?.userRole === 'super_admin' && !apiService.getTenantId();

  const menuBootLoading =
    !isSuperAdminNoTenant &&
    (planLoading || !planInfo || initializing);

  const filteredItems = useMemo(() => {
    if (isSuperAdminNoTenant) {
      return superAdminMenuItems.filter((item) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return item.text.toLowerCase().includes(q);
        }
        return true;
      });
    }

    if (planLoading || !planInfo) return [];

    const currentPlanType = planInfo.planType;

    return allMenuItems.filter((item) => {
      const isAvailableForPlan =
        item.planTypes.includes('*') ||
        item.planTypes.includes(currentPlanType);

      if (!isAvailableForPlan) return false;

      if (!isOwner()) {
        if (
          item.path &&
          !evalSidebarPathPermission(item.path, isOwner, hasPermission)
        ) {
          return false;
        }
        const module = getModuleForMenuItem(item);
        if (module && !hasModuleAccess(module)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        if (item.text.toLowerCase().includes(query)) {
          return true;
        }

        if (item.subItems) {
          return item.subItems.some((subItem) => {
            const subItemAvailable =
              subItem.planTypes.includes('*') ||
              subItem.planTypes.includes(currentPlanType);
            return (
              subItemAvailable &&
              subItem.text.toLowerCase().includes(query)
            );
          });
        }

        return false;
      }

      return true;
    });
  }, [
    searchQuery,
    planInfo,
    planLoading,
    user,
    hasModuleAccess,
    hasPermission,
    isOwner,
    isSuperAdminNoTenant,
    accessibleModules,
  ]);

  return {
    filteredItems,
    isSuperAdminNoTenant,
    menuBootLoading,
    planInfo,
  };
}
