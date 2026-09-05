import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { MenuItem, SubMenuItem } from "@/src/types/sidebar";
import { SidebarSubMenuItem } from "./SidebarSubMenuItem";

interface SidebarMenuItemProps {
  item: MenuItem;
  isExpanded: boolean;
  onToggle: () => void;
  isActive: (path: string, exact?: boolean) => boolean;
  isSubItemAvailable: (subItem: SubMenuItem) => boolean;
  hasPathPermission: (path?: string) => boolean;
  getSubItemLabel: (subItem: SubMenuItem) => string;
  collapsed?: boolean;
  onExpandSidebar?: () => void;
}

export function SidebarMenuItem({
  item,
  isExpanded,
  onToggle,
  isActive,
  isSubItemAvailable,
  hasPathPermission,
  getSubItemLabel,
  collapsed = false,
  onExpandSidebar,
}: SidebarMenuItemProps) {
  const hasSubItems = Boolean(item.subItems?.length);
  const isMainItemActive = Boolean(
    item.path && isActive(item.path, item.text === "Dashboard"),
  );
  const hasActiveSubItem = Boolean(
    hasSubItems &&
      item.subItems!.some((subItem) =>
        isActive(subItem.path, subItem.text === "Dashboard"),
      ),
  );

  const handleParentClick = () => {
    if (collapsed && onExpandSidebar) {
      onExpandSidebar();
      onToggle();
      return;
    }
    onToggle();
  };

  if (collapsed) {
    if (item.path) {
      return (
        <Link
          href={item.path}
          title={item.text}
          className={cn(
            "flex items-center justify-center rounded-xl p-2.5 transition-all duration-200",
            isMainItemActive
              ? "bg-gradient-to-r " + item.gradient + " text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5",
              isMainItemActive ? "text-white" : "text-gray-600",
            )}
          />
        </Link>
      );
    }

    return (
      <button
        type="button"
        title={item.text}
        onClick={handleParentClick}
        className={cn(
          "flex w-full items-center justify-center rounded-xl p-2.5 transition-all duration-200",
          hasActiveSubItem
            ? "bg-gradient-to-r " + item.gradient + " text-white shadow-lg"
            : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <item.icon
          className={cn(
            "h-5 w-5",
            hasActiveSubItem ? "text-white" : "text-gray-600",
          )}
        />
      </button>
    );
  }

  return (
    <div className="space-y-1">
      {item.path ? (
        <Link
          href={item.path}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
            isMainItemActive
              ? "bg-gradient-to-r " + item.gradient + " text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <SidebarMenuIcon
            item={item}
            highlighted={Boolean(isMainItemActive)}
          />
          <span
            className={cn(
              "font-medium transition-colors flex-1",
              isMainItemActive ? "text-white" : "text-gray-700",
            )}
          >
            {item.text}
          </span>
          {isMainItemActive && !hasSubItems && (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
            hasActiveSubItem
              ? "bg-gradient-to-r " + item.gradient + " text-white shadow-lg"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <div className="flex items-center gap-3">
            <SidebarMenuIcon item={item} highlighted={hasActiveSubItem} />
            <span
              className={cn(
                "font-medium transition-colors flex-1",
                hasActiveSubItem ? "text-white" : "text-gray-700",
              )}
            >
              {item.text}
            </span>
          </div>
          {hasSubItems && (
            <div
              className={cn(
                "p-1 rounded transition-transform duration-200",
                isExpanded ? "rotate-180" : "rotate-0",
              )}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-colors",
                  hasActiveSubItem ? "text-white" : "text-gray-500",
                )}
              />
            </div>
          )}
        </button>
      )}

      {hasSubItems && isExpanded && (
        <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
          {item.subItems!.map((subItem) => {
            if (
              !isSubItemAvailable(subItem) ||
              !hasPathPermission(subItem.path)
            ) {
              return null;
            }

            return (
              <SidebarSubMenuItem
                key={subItem.text}
                subItem={subItem}
                label={getSubItemLabel(subItem)}
                isActive={isActive(subItem.path, subItem.text === "Dashboard")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SidebarMenuIcon({
  item,
  highlighted,
}: {
  item: MenuItem;
  highlighted: boolean;
}) {
  return (
    <div
      className={cn(
        "p-2 rounded-lg transition-colors",
        highlighted ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200",
      )}
    >
      <item.icon
        className={cn(
          "h-5 w-5 transition-colors",
          highlighted ? "text-white" : "text-gray-600",
        )}
      />
    </div>
  );
}
