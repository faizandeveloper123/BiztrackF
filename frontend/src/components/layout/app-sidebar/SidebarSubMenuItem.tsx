import Link from "next/link";
import { cn } from "@/src/lib/utils";
import type { SubMenuItem } from "@/src/types/sidebar";

interface SidebarSubMenuItemProps {
  subItem: SubMenuItem;
  label: string;
  isActive: boolean;
}

export function SidebarSubMenuItem({
  subItem,
  label,
  isActive,
}: SidebarSubMenuItemProps) {
  return (
    <Link
      href={subItem.path}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group",
        isActive
          ? "bg-blue-50 text-blue-700 border-l-2 border-blue-500"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800",
      )}
    >
      <div
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isActive ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200",
        )}
      >
        <subItem.icon
          className={cn(
            "h-4 w-4 transition-colors",
            isActive ? "text-blue-600" : "text-gray-500",
          )}
        />
      </div>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isActive ? "text-blue-700" : "text-gray-600",
        )}
      >
        {label}
      </span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
      )}
    </Link>
  );
}
