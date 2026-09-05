"use client";

import { useSidebar } from "../../hooks/useSidebar";
import {
  SidebarHeader,
  SidebarSearch,
  SidebarNav,
  SidebarFooter,
  SidebarCollapseToggle,
} from "./app-sidebar";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onExpandSidebar?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onExpandSidebar,
}: SidebarProps) {
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    expandedItems,
    toggleExpanded,
    navRef,
    handleNavScroll,
    filteredItems,
    planLoading,
    planInfo,
    isActive,
    getPlanDisplayName,
    purchaseOrdersNavLabel,
    hasPathPermission,
    isSubItemAvailable,
  } = useSidebar();

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col border-r border-gray-200 bg-white/95 shadow-xl backdrop-blur-md">
      {onToggleCollapse && (
        <SidebarCollapseToggle
          collapsed={collapsed}
          onToggle={onToggleCollapse}
        />
      )}
      <SidebarHeader
        planLabel={!collapsed && planInfo ? getPlanDisplayName() : undefined}
        collapsed={collapsed}
      />
      {!collapsed && (
        <SidebarSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearSearch}
        />
      )}
      <SidebarNav
        navRef={navRef}
        onScroll={handleNavScroll}
        loading={planLoading}
        items={filteredItems}
        searchQuery={searchQuery}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
        isActive={isActive}
        isSubItemAvailable={isSubItemAvailable}
        hasPathPermission={hasPathPermission}
        getSubItemLabel={purchaseOrdersNavLabel}
        collapsed={collapsed}
        onExpandSidebar={onExpandSidebar}
      />
      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}
