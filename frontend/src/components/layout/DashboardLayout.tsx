"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useSidebarCollapse } from "@/src/hooks/useSidebarCollapse";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggle, expand, ready } = useSidebarCollapse();
  const pathname = usePathname();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, closeSidebar]);

  const desktopSidebarWidth = collapsed ? "w-[4.5rem]" : "w-64";
  const mainMargin = collapsed ? "md:ml-[4.5rem]" : "md:ml-64";

  return (
    <div className="flex min-h-screen flex-row bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="hidden md:block">
        <div
          className={cn(
            "fixed left-0 top-0 z-40 flex h-screen flex-col overflow-visible transition-[width] duration-300 ease-in-out",
            desktopSidebarWidth,
          )}
        >
          <Sidebar
            collapsed={ready && collapsed}
            onToggleCollapse={toggle}
            onExpandSidebar={expand}
          />
        </div>
      </div>
      <div className="md:hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
            onClick={closeSidebar}
            aria-hidden
          />
        )}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-[60] flex max-h-[100dvh] w-64 max-w-[85vw] flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!sidebarOpen}
        >
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close menu"
            className="absolute right-2 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
          <Sidebar collapsed={false} />
        </div>
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out",
          ready ? mainMargin : "md:ml-64",
        )}
      >
        <Header onMenuClick={openSidebar} />
        <main className="min-h-[calc(100vh-4rem)] w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
