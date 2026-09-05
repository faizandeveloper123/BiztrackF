"use client";

import { useState, useEffect } from "react";
import { User, LoginCredentials } from "@/src/models/auth";
import { apiService } from "@/src/services/ApiService";
import { SessionManager } from "@/src/services/SessionManager";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  role: string;
  joined_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeAuth = () => {
      try {
        const sessionManager = new SessionManager();
        const session = sessionManager.getSession();

        if (session && session.token && session.user) {
          setUser(session.user);

          // Load tenants from localStorage (no API call)
          const storedTenants = apiService.getUserTenants();
          if (storedTenants.length > 0) {
            setTenants(storedTenants);

            // Get current tenant from localStorage
            const currentTenant = apiService.getCurrentTenant();
            if (currentTenant) {
              setCurrentTenant(currentTenant);
            } else {
              // Fallback to first tenant if no current tenant is set
              setCurrentTenant(storedTenants[0]);
              apiService.setTenantId(storedTenants[0].id);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [mounted]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);

      if (response.success && response.user) {
        setUser(response.user);

        // Tenants are already fetched and stored during apiService.login()
        // Just load them from localStorage
        const storedTenants = apiService.getUserTenants();
        if (storedTenants.length > 0) {
          setTenants(storedTenants);

          // Current tenant is already set during login, just get it
          const currentTenant = apiService.getCurrentTenant();
          if (currentTenant) {
            setCurrentTenant(currentTenant);
          }
        }

        return true;
      }
      return false;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail || error?.message || "Failed to logout";
      toast.error(`Logout Error: ${errorMessage}`);
    } finally {
      const sessionManager = new SessionManager();
      setUser(null);
      setTenants([]);
      setCurrentTenant(null);
      sessionManager.clearSession();
      apiService.setTenantId(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const switchTenant = async (tenantId: string): Promise<boolean> => {
    try {
      // This now uses localStorage, no API call
      const tenant = await apiService.switchTenant(tenantId);
      setCurrentTenant(tenant);
      return true;
    } catch (error) {
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      console.log("Refreshed user data:", response);
      if (response) {
        setUser(response);
        const sessionManager = new SessionManager();
        const session = sessionManager.getSession();
        if (session) {
          sessionManager.setSession(
            session.token,
            response,
            session.expiresAt
              ? Math.floor((session.expiresAt - Date.now()) / 1000)
              : undefined,
            session.refreshToken,
          );
        }
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const isAuthenticated = !!user;

  return {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
    tenants,
    currentTenant,
    switchTenant,
    refreshUser,
  };
}
