"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Menu, Settings, LogOut, User, Loader2 } from "lucide-react";
import { useAuth } from "@/src/contexts/AuthContext";
import { isTauriApp } from "@/src/lib/isTauriApp";
import { usePermissions } from "@/src/hooks/usePermissions";
import { getInitials } from "../../lib/utils";
import NotificationBell from "../notifications/NotificationBell";
import { BizTrackLogo } from "../brand/BizTrackLogo";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, tauriTenantSync } = useAuth();
  const { roleDisplayName, initializing } = usePermissions();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {}
  };

  const handleSettingsClick = () => {
    router.push("/settings");
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const showSync = isTauriApp() && tauriTenantSync && tauriTenantSync.total > 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
      {showSync ? (
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/90 px-4 py-2 text-sm text-blue-900 md:px-6">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-blue-600"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate font-medium">
            Syncing workspace for offline use{" "}
            <span className="font-normal text-blue-800/90">
              ({tauriTenantSync.step}/{tauriTenantSync.total}){" "}
              {tauriTenantSync.label.replace(/_/g, " ")}
            </span>
          </span>
          <span className="hidden shrink-0 tabular-nums text-blue-700 sm:inline">
            {Math.round((100 * tauriTenantSync.step) / tauriTenantSync.total)}%
          </span>
        </div>
      ) : null}
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Menu button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <BizTrackLogo size="sm" href="/dashboard" className="md:hidden" />
        </div>

        {/* Right side - Notifications and User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.userName} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {user
                      ? getInitials(
                          `${user.firstName} ${user.lastName}` || user.userName,
                        )
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 max-w-[calc(100vw-1rem)]"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.userName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {roleDisplayName ? (
                    <Badge variant="secondary" className="w-fit text-xs mt-1">
                      {roleDisplayName}
                    </Badge>
                  ) : initializing ? (
                    <Badge variant="secondary" className="w-fit text-xs mt-1">
                      Loading...
                    </Badge>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
