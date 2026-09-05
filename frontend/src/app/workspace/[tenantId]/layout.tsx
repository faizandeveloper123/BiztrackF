"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Sheet, SheetContent } from "../../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Separator } from "../../../components/ui/separator";
import { useAuth } from "../../../contexts/AuthContext";
import { usePermissions } from "../../../hooks/usePermissions";
import { SessionManager } from "../../../services/SessionManager";
import { Toaster } from "sonner";
import {
  Menu as MenuIcon,
  Building2,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  UserCheck,
  Package,
  PieChart,
  BarChart3,
  Shield,
} from "lucide-react";

interface TenantLayoutProps {
  children: React.ReactNode;
}

interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  user_role: string;
}

const TenantLayout: React.FC<TenantLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const { user, logout } = useAuth();
  const {
    canViewCRM,
    canViewHRM,
    canViewInventory,
    canViewFinance,
    canViewProjects,
    canViewQuality,
    canManageUsers,
    canViewReports,
    isOwner,
  } = usePermissions();
  const router = useRouter();
  const params = useParams();
  const tenantId = params?.tenantId ? (params.tenantId as string) : "";

  const fetchTenantInfo = useCallback(async () => {
    try {
      const sessionManager = new SessionManager();
      const token = sessionManager.getToken();

      if (!token) {
        router.push("/");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const apiUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const response = await axios.get(`${apiUrl}/tenants/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTenantInfo(response.data);
    } catch (error) {
      router.push("/");
    }
  }, [tenantId, router]);

  useEffect(() => {
    fetchTenantInfo();
  }, [fetchTenantInfo]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchWorkspace = () => {
    router.push("/");
  };

  const sidebarContent = (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-gradient-primary">
            <AvatarFallback className="bg-gradient-primary text-white font-semibold">
              {tenantInfo?.name?.charAt(0).toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {tenantInfo?.name || "Workspace"}
            </h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {isOwner() ? "Owner" : tenantInfo?.user_role || "member"}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link
          href={`/workspace/${tenantId}`}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>

        {canViewProjects() && (
          <Link
            href={"/projects"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FolderOpen className="h-5 w-5" />
            <span className="text-sm font-medium">Projects</span>
          </Link>
        )}

        {canViewCRM() && (
          <Link
            href={"/crm/customers"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">CRM</span>
          </Link>
        )}

        {canViewHRM() && (
          <Link
            href={"/hrm/employees"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <UserCheck className="h-5 w-5" />
            <span className="text-sm font-medium">HRM</span>
          </Link>
        )}

        {canViewInventory() && (
          <Link
            href={"/inventory/products"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">Inventory</span>
          </Link>
        )}

        {canViewFinance() && (
          <Link
            href={"/ledger"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <PieChart className="h-5 w-5" />
            <span className="text-sm font-medium">Finance</span>
          </Link>
        )}

        {canViewQuality() && (
          <Link
            href={"/workshop-management/quality-control"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Quality Control</span>
          </Link>
        )}

        {canViewReports() && (
          <Link
            href={"/reports"}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Reports</span>
          </Link>
        )}

        {/* User Management - Only for owners or users with user management permissions */}
        {canManageUsers() && (
          <>
            <Separator className="my-4" />
            <Link
              href={"/users"}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">User Management</span>
            </Link>
          </>
        )}

        {/* Admin section - Only for super_admin */}
        {user?.userRole === "super_admin" && (
          <>
            <Separator className="my-4" />
            <Link
              href={"/admin/tenants"}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Admin</span>
            </Link>
          </>
        )}

        <Separator className="my-4" />
        <Link
          href={`/workspace/${tenantId}/settings`}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Desktop Sidebar - Static part of layout, not fixed */}
      <div className="hidden lg:block w-64 flex-shrink-0">{sidebarContent}</div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden shrink-0"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>

              <h1 className="min-w-0 truncate text-lg font-semibold text-gray-900 sm:text-xl">
                {tenantInfo?.name || "Workspace"}
              </h1>
            </div>

            <div className="flex shrink-0 items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                onClick={handleSwitchWorkspace}
                className="hidden sm:flex items-center space-x-2"
              >
                <Building2 className="h-4 w-4" />
                <span>Switch Workspace</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-2 sm:px-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-white text-sm">
                        {user?.userName?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user?.userName || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-w-[calc(100vw-1rem)]">
                  <DropdownMenuItem
                    onClick={handleSwitchWorkspace}
                    className="sm:hidden"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Switch Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
};

export default TenantLayout;
