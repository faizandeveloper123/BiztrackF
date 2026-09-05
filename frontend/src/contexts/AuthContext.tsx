"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginCredentials } from "@/src/models/auth";
import { apiService } from "@/src/services/ApiService";
import { SessionManager } from "@/src/services/SessionManager";
import { startOfflineOutboxFlush } from "@/src/services/offlineOutboxFlush";
import {
  runTenantFullSync,
  TENANT_FULL_SYNC_TOTAL_STEPS,
  type TenantSyncProgressPayload,
} from "@/src/services/tenantOfflineSync";
import { isTauriApp } from "@/src/lib/isTauriApp";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  role: string;
  joined_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  tauriTenantSync: TenantSyncProgressPayload | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tauriTenantSync, setTauriTenantSync] =
    useState<TenantSyncProgressPayload | null>(null);

  const startTauriTenantDataSync = (
    client: ReturnType<typeof apiService.getClient>,
    tenantId: string,
  ) => {
    if (!isTauriApp() || !tenantId || !navigator.onLine) return;
    void (async () => {
      setTauriTenantSync({
        step: 0,
        total: TENANT_FULL_SYNC_TOTAL_STEPS,
        label: "starting",
      });
      try {
        await runTenantFullSync(client, tenantId, (p) => setTauriTenantSync(p));
      } finally {
        setTauriTenantSync(null);
      }
    })();
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionManager = new SessionManager();

        if (!sessionManager.isSessionValid()) {
          sessionManager.clearSession();
          setUser(null);
          setTenants([]);
          setCurrentTenant(null);
          setLoading(false);
          return;
        }

        if (sessionManager.isSessionValid()) {
          if (sessionManager.isTokenExpired()) {
            const refreshSuccess = await sessionManager.refreshAccessToken();
            if (!refreshSuccess) {
              sessionManager.clearSession();
              setUser(null);
              setLoading(false);
              return;
            }
          }

          const session = sessionManager.getSession();

          if (session && session.token && session.user) {
            // Ensure user has both id and userId properties
            const userWithId = {
              ...session.user,
              id: session.user.userId || session.user.id,
            };
            setUser(userWithId);

            sessionManager.startProactiveRefresh();

            const storedTenants = apiService.getUserTenants();
            if (storedTenants.length > 0) {
              setTenants(storedTenants);

              const currentTenant = apiService.getCurrentTenant();
              if (currentTenant) {
                setCurrentTenant(currentTenant);
              } else {
                setCurrentTenant(storedTenants[0]);
                apiService.setTenantId(storedTenants[0].id);
              }
            }
            const tidAfter = apiService.getTenantId();
            if (tidAfter) {
              startTauriTenantDataSync(apiService.getClient(), tidAfter);
            }
          } else {
            sessionManager.clearSession();
            setUser(null);
          }
        } else {
          sessionManager.clearSession();
          setUser(null);
        }
      } catch (error) {
        const sessionManager = new SessionManager();
        sessionManager.clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const stop = startOfflineOutboxFlush(() => apiService.getClient());
    return stop;
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);

      if (response.success && response.user) {
        // Ensure user has both id and userId properties
        const userWithId = {
          ...response.user,
          id: response.user.userId || response.user.id,
        };
        setUser(userWithId);

        const sessionManager = new SessionManager();
        sessionManager.startProactiveRefresh();

        const storedTenants = apiService.getUserTenants();
        if (storedTenants.length > 0) {
          setTenants(storedTenants);

          const currentTenant = apiService.getCurrentTenant();
          if (currentTenant) {
            setCurrentTenant(currentTenant);
          }
        }
        const tidLogin = apiService.getTenantId();
        if (tidLogin) {
          startTauriTenantDataSync(apiService.getClient(), tidLogin);
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
      const tenant = await apiService.switchTenant(tenantId);
      setCurrentTenant(tenant);
      startTauriTenantDataSync(apiService.getClient(), tenantId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    tenants,
    currentTenant,
    tauriTenantSync,
    login,
    logout,
    switchTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
