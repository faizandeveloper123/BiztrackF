"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { usePermissions } from "@/src/hooks/usePermissions";
import { getDefaultLandingPath } from "@/src/utils/getDefaultLandingPath";
import { isTenantMotPublicRoute } from "@/src/constants/tenantPublicRoutes";
import { isTauriApp } from "@/src/lib/isTauriApp";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { loading, isAuthenticated, user } = useAuth();
  const { userPermissions, initializing: rbacInitializing } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  const isMotPublicRoute = useMemo(
    () => isTenantMotPublicRoute(pathname),
    [pathname],
  );

  const isPublicRoute = useMemo(() => {
    const publicRoutes = [
      "/",
      "/about",
      "/contact",
      "/login",
      "/signup",
      "/client-portal",
      "/api",
      "/_next",
      "/favicon.ico",
      "/manifest.json",
    ];
    return (
      isMotPublicRoute ||
      publicRoutes.some((route) => pathname?.startsWith(route))
    );
  }, [pathname, isMotPublicRoute]);

  const isProtectedRoute = useMemo(() => {
    const protectedRoutes = [
      "/dashboard",
      "/inventory",
      "/pos",
      "/crm",
      "/sales",
      "/time-tracking",
      "/team",
      "/projects",
      "/events",
      "/tasks",
      "/users",
      "/workspace",
      "/reports",
      "/hrm",
      "/workshop-management",
      "/ngo",
      "/healthcare",
      "/banking",
      "/ledger",
      "/subscription",
      "/settings",
      "/notifications",
      "/employee-portal",
      "/finance",
      "/production",
      "/quality",
    ];
    return protectedRoutes.some((route) => pathname?.startsWith(route));
  }, [pathname]);

  useEffect(() => {
    if (!loading) {
      if (isTauriApp() && pathname === "/signup") {
        router.replace("/login");
        return;
      }

      if (!isAuthenticated && isProtectedRoute) {
        router.push("/login");
        return;
      }

      if (
        isAuthenticated &&
        (pathname === "/login" || pathname === "/signup")
      ) {
        if (!rbacInitializing && userPermissions) {
          router.push(
            getDefaultLandingPath(
              userPermissions.permissions,
              userPermissions.is_owner,
              user?.userRole,
            ),
          );
        } else if (!rbacInitializing) {
          router.push(getDefaultLandingPath([], false, user?.userRole));
        }
        return;
      }
    }
  }, [
    isAuthenticated,
    loading,
    pathname,
    router,
    isProtectedRoute,
    rbacInitializing,
    userPermissions,
    user?.userRole,
  ]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Initializing...</p>
          <p className="text-sm text-gray-500">
            Please wait while we verify your session
          </p>
        </div>
      </div>
    );
  }

  // For public routes, render children without authentication check
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated
  if (!isAuthenticated) {
    // Show a brief loading state before redirect to prevent flash
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
