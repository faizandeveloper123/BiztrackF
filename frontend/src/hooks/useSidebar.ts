"use client";

import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { usePlanInfo } from "./usePlanInfo";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "./usePermissions";
import { apiService } from "../services/ApiService";
import { SIDEBAR_PATH_PERMISSIONS } from "@/src/constants/rbacPermissions";
import {
  allMenuItems,
  superAdminMenuItems,
} from "@/src/constants/sidebarMenuItems";
import type { MenuItem, SubMenuItem } from "@/src/types/sidebar";

const TENANT_MOT_BOOK_PATH = "__tenant_mot_book__";

function resolveTenantMotMenuPaths(
  items: MenuItem[],
  tenantDomain?: string | null,
): MenuItem[] {
  return items.map((item) => {
    if (!item.subItems) return item;

    const subItems = item.subItems
      .filter((subItem) => {
        if (subItem.path === TENANT_MOT_BOOK_PATH) return Boolean(tenantDomain);
        return true;
      })
      .map((subItem) =>
        subItem.path === TENANT_MOT_BOOK_PATH
          ? { ...subItem, path: `/${tenantDomain}/mot/book` }
          : subItem,
      );

    return { ...item, subItems };
  });
}

const SIDEBAR_STORAGE_SEARCH = "biztrack:sidebar:search";
const SIDEBAR_STORAGE_EXPANDED = "biztrack:sidebar:expanded";
const SIDEBAR_STORAGE_SCROLL = "biztrack:sidebar:scroll";

const MODULE_MAP: Record<string, string> = {
  CRM: "crm",
  Customers: "crm",
  Sales: "sales",
  Invoicing: "sales",
  "Create Invoice": "sales",
  "Invoice Dashboard": "sales",
  HRM: "hrm",
  "HRM Management": "hrm",
  Inventory: "inventory",
  Finance: "finance",
  Banking: "banking",
  Ledger: "ledger",
  "Financial Ledger": "ledger",
  POS: "pos",
  Projects: "projects",
  "Project Management": "projects",
  Production: "production",
  "Workshop Management": "production",
  "Quality Control": "quality",
  Events: "events",
  Reports: "reports",
  Dashboard: "dashboard",
  Healthcare: "healthcare",
  "Donor Management": "ngo",
  "Donation Management": "ngo",
  "Gift & Inventory": "ngo",
  "Volunteer Management": "ngo",
  "Relief Projects": "projects",
  "Charity Reports": "reports",
  "Charity Events": "events",
  "Charity Banking": "banking",
  "Fund Accounting": "ledger",
  "User Management": "users",
};

function getModuleForMenuItem(item: MenuItem): string | null {
  return MODULE_MAP[item.text] || null;
}

export function useSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { planInfo, loading: planLoading } = usePlanInfo();
  const { user } = useAuth();
  const {
    accessibleModules,
    hasModuleAccess,
    hasPermission,
    isOwner,
    initializing: rbacInitializing,
  } = usePermissions();

  const navRef = useRef<HTMLElement | null>(null);
  const scrollSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const didRestoreScrollRef = useRef(false);
  const [persistReady, setPersistReady] = useState(false);

  const purchaseOrdersNavLabel = useCallback(
    (subItem: SubMenuItem) =>
      subItem.path === "/inventory/purchase-orders" &&
      planInfo?.planType === "healthcare"
        ? "Medical supply orders"
        : subItem.text,
    [planInfo?.planType],
  );

  const isSuperAdmin = user?.userRole === "super_admin";

  const hasMenuRoleAccess = useCallback(
    (roles?: string[]) => {
      if (!roles || roles.length === 0 || roles.includes("*")) return true;
      if (isSuperAdmin && roles.includes("super_admin")) return true;
      if (isOwner() && (roles.includes("owner") || roles.includes("admin")))
        return true;
      if (roles.includes("admin") && hasPermission("users:view")) return true;
      if (user?.userRole && roles.includes(user.userRole)) return true;
      return false;
    },
    [hasPermission, isOwner, isSuperAdmin, user?.userRole],
  );

  const hasStrictPermission = useCallback(
    (permission?: string) => {
      if (!permission || isSuperAdmin || isOwner()) return true;
      return hasPermission(permission);
    },
    [hasPermission, isOwner, isSuperAdmin],
  );

  const hasPathPermission = useCallback(
    (path?: string) => {
      if (!path || isSuperAdmin || isOwner()) return true;
      if (path === "/sales/invoice-dashboard") {
        return (
          hasStrictPermission("sales:invoices:view") ||
          hasStrictPermission("sales:invoice_dashboard:view")
        );
      }
      if (path === "/sales/invoices" || path === "/invoices") {
        return (
          hasStrictPermission("sales:invoices:create") ||
          hasStrictPermission("sales:invoices:update")
        );
      }
      const requiredPermission = SIDEBAR_PATH_PERMISSIONS[path];
      if (!requiredPermission) return true;
      return hasStrictPermission(requiredPermission);
    },
    [hasStrictPermission, isOwner, isSuperAdmin],
  );

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SIDEBAR_STORAGE_SEARCH);
      if (s !== null) setSearchQuery(s);
      const ex = sessionStorage.getItem(SIDEBAR_STORAGE_EXPANDED);
      if (ex) {
        const arr = JSON.parse(ex) as string[];
        if (Array.isArray(arr)) setExpandedItems(new Set(arr));
      }
    } catch {}
    setPersistReady(true);
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    try {
      sessionStorage.setItem(SIDEBAR_STORAGE_SEARCH, searchQuery);
    } catch {}
  }, [searchQuery, persistReady]);

  useEffect(() => {
    if (!persistReady) return;
    try {
      const expandedArr: string[] = [];
      expandedItems.forEach((x) => expandedArr.push(x));
      sessionStorage.setItem(
        SIDEBAR_STORAGE_EXPANDED,
        JSON.stringify(expandedArr),
      );
    } catch {}
  }, [expandedItems, persistReady]);

  useLayoutEffect(() => {
    if (planLoading) return;
    const el = navRef.current;
    if (!el || didRestoreScrollRef.current) return;
    didRestoreScrollRef.current = true;
    try {
      const raw = sessionStorage.getItem(SIDEBAR_STORAGE_SCROLL);
      if (raw == null) return;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) return;
      el.scrollTop = n;
    } catch {}
  }, [planLoading]);

  useEffect(() => {
    return () => {
      if (scrollSaveTimeoutRef.current) {
        clearTimeout(scrollSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleNavScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    if (scrollSaveTimeoutRef.current) {
      clearTimeout(scrollSaveTimeoutRef.current);
    }
    scrollSaveTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(SIDEBAR_STORAGE_SCROLL, String(el.scrollTop));
      } catch {}
      scrollSaveTimeoutRef.current = null;
    }, 120);
  }, []);

  const toggleExpanded = useCallback((itemText: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemText)) {
        next.delete(itemText);
      } else {
        next.add(itemText);
      }
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    const currentTenantId = apiService.getTenantId();
    if (isSuperAdmin && !currentTenantId) {
      return superAdminMenuItems.filter((item) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        if (item.text.toLowerCase().includes(query)) return true;
        return item.subItems?.some(
          (subItem) =>
            subItem.text.toLowerCase().includes(query) ||
            subItem.path?.toLowerCase().includes(query),
        );
      });
    }

    if (planLoading || !planInfo) return [];

    const currentPlanType = planInfo.planType;

    const tenantItems = resolveTenantMotMenuPaths(
      allMenuItems.filter((item) => {
        const isAvailableForPlan =
          item.planTypes.includes("*") ||
          item.planTypes.includes(currentPlanType);

        if (!isAvailableForPlan) return false;
        if (!hasMenuRoleAccess(item.roles)) return false;

        if (!isOwner()) {
          if (item.path && !hasPathPermission(item.path)) {
            return false;
          }
          const moduleName = getModuleForMenuItem(item);
          if (moduleName && !hasModuleAccess(moduleName)) {
            return false;
          }
          if (item.subItems?.length) {
            const hasVisibleChild = item.subItems.some((subItem) => {
              const subItemAvailable =
                (subItem.planTypes.includes("*") ||
                  subItem.planTypes.includes(currentPlanType)) &&
                hasMenuRoleAccess(subItem.roles);
              return subItemAvailable && hasPathPermission(subItem.path);
            });
            if (!hasVisibleChild) return false;
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
                (subItem.planTypes.includes("*") ||
                  subItem.planTypes.includes(currentPlanType)) &&
                hasMenuRoleAccess(subItem.roles);
              const label = purchaseOrdersNavLabel(subItem);
              return (
                subItemAvailable &&
                hasPathPermission(subItem.path) &&
                (label.toLowerCase().includes(query) ||
                  subItem.text.toLowerCase().includes(query))
              );
            });
          }

          return false;
        }

        return true;
      }),
      apiService.getCurrentTenant()?.domain,
    );

    return tenantItems;
  }, [
    searchQuery,
    planInfo,
    planLoading,
    isSuperAdmin,
    user,
    accessibleModules,
    hasModuleAccess,
    hasMenuRoleAccess,
    hasPathPermission,
    isOwner,
    purchaseOrdersNavLabel,
  ]);

  const filteredItemsRef = useRef(filteredItems);
  filteredItemsRef.current = filteredItems;

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    setExpandedItems((prev) => {
      const next = new Set(prev);
      let changed = false;
      filteredItemsRef.current.forEach((item) => {
        if (item.subItems?.length && !next.has(item.text)) {
          next.add(item.text);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [
    searchQuery,
    planLoading,
    planInfo?.planType,
    user?.userRole,
    rbacInitializing,
  ]);

  const isActive = useCallback(
    (path: string, exact: boolean = false) => {
      if (path === "/sales/invoice-dashboard") {
        return (
          pathname === "/sales/invoice-dashboard" ||
          pathname.startsWith("/sales/invoice-dashboard/")
        );
      }
      if (path === "/sales/invoices" || path === "/invoices") {
        return pathname === path || pathname.startsWith(`${path}/`);
      }
      if (path === "/" || exact) {
        return pathname === path;
      }
      return pathname.startsWith(path);
    },
    [pathname],
  );

  const getPlanDisplayName = useCallback(() => {
    if (user?.userRole === "super_admin") {
      return "Super Admin";
    }
    if (!planInfo) return "Loading...";

    switch (planInfo.planType) {
      case "workshop":
        return "Workshop Master";
      case "commerce":
        return "Commerce Pro";
      case "agency":
        return "Agency Pro";
      case "healthcare":
        return "Healthcare Suite";
      case "ngo":
        return "Charity Pro";
      default:
        return planInfo.planName;
    }
  }, [planInfo, user?.userRole]);

  const isSubItemAvailable = useCallback(
    (subItem: SubMenuItem) => {
      if (!hasMenuRoleAccess(subItem.roles)) return false;
      if (isSuperAdmin && subItem.roles?.includes("super_admin")) return true;
      if (subItem.planTypes.includes("*")) return true;
      return planInfo != null && subItem.planTypes.includes(planInfo.planType);
    },
    [hasMenuRoleAccess, isSuperAdmin, planInfo],
  );

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  const sidebarLoading =
    isSuperAdmin && !apiService.getTenantId() ? false : planLoading;

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    expandedItems,
    toggleExpanded,
    navRef,
    handleNavScroll,
    filteredItems,
    planLoading: sidebarLoading,
    planInfo,
    isActive,
    getPlanDisplayName,
    purchaseOrdersNavLabel,
    hasPathPermission,
    isSubItemAvailable,
  };
}
