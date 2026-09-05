"use client";

import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface SidebarCollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarCollapseToggle({
  collapsed,
  onToggle,
}: SidebarCollapseToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "group absolute -right-3.5 top-[4.5rem] z-50 flex h-8 w-8 items-center justify-center rounded-full",
        "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white",
        "shadow-[0_4px_14px_rgba(79,70,229,0.45)] ring-2 ring-white",
        "transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 hover:shadow-[0_6px_20px_rgba(79,70,229,0.55)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "before:absolute before:inset-0 before:rounded-full before:bg-white/20 before:opacity-0 before:transition-opacity group-hover:before:opacity-100",
      )}
    >
      <span className="relative flex items-center justify-center">
        {collapsed ? (
          <>
            <PanelLeftOpen className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            <ChevronRight
              className="absolute h-4 w-4 transition-opacity group-hover:opacity-0"
              strokeWidth={2.5}
            />
          </>
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            <ChevronLeft
              className="absolute h-4 w-4 transition-opacity group-hover:opacity-0"
              strokeWidth={2.5}
            />
          </>
        )}
      </span>
    </button>
  );
}
