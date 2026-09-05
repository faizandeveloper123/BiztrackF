import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { User, LoginCredentials } from '../models/auth';
import { apiService } from '../services/ApiService';
import { SessionManager } from '../services/SessionManager';
import { appCache } from '../services/appCache';
import { unregisterStoredPushTokenFromBackend } from '../services/push/expoPush';

export interface Tenant {
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

  useEffect(() => {
    apiService.onUnauthorized = () => {
      setUser(null);
      setTenants([]);
      setCurrentTenant(null);
      appCache.delete('plan_info');
      appCache.delete('dashboard_overview');
    };
    return () => {
      apiService.onUnauthorized = undefined;
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const sessionManager = new SessionManager();
      try {
        if (!(await sessionManager.isSessionValid())) {
          await sessionManager.clearSession();
          setUser(null);
          setTenants([]);
          setCurrentTenant(null);
          return;
        }

        if (await sessionManager.isTokenExpired()) {
          const refreshSuccess = await sessionManager.refreshAccessToken();
          if (!refreshSuccess) {
            await sessionManager.clearSession();
            setUser(null);
            return;
          }
        }

        const sessionUser = await sessionManager.getUser();

        if (sessionUser) {
          const userWithId = {
            ...sessionUser,
            id: sessionUser.userId || sessionUser.id,
          };
          setUser(userWithId as User);

          const storedTenants = apiService.getUserTenants();
          if (storedTenants.length > 0) {
            setTenants(storedTenants);

            const ct = apiService.getCurrentTenant();
            if (ct) {
              setCurrentTenant(ct);
            } else {
              setCurrentTenant(storedTenants[0]);
              apiService.setTenantId(storedTenants[0].id);
            }
          }
        } else {
          await sessionManager.clearSession();
          setUser(null);
        }
      } catch {
        const sessionManagerInner = new SessionManager();
        await sessionManagerInner.clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    const response = await apiService.login(credentials);

    if (response.success && response.user) {
      const userWithId = {
        ...response.user,
        id: response.user.userId || response.user.id,
      };
      setUser(userWithId as User);

      const storedTenants = apiService.getUserTenants();
      if (storedTenants.length > 0) {
        setTenants(storedTenants);

        const ct = apiService.getCurrentTenant();
        if (ct) {
          setCurrentTenant(ct);
        }
      }

      return true;
    }
    return false;
  };

  const logout = useCallback(async () => {
    try {
      await unregisterStoredPushTokenFromBackend();
      await apiService.logout();
    } catch {
    } finally {
      const sessionManager = new SessionManager();
      setUser(null);
      setTenants([]);
      setCurrentTenant(null);
      await sessionManager.clearSession();
      apiService.setTenantId(null);
      appCache.delete('plan_info');
      appCache.delete('dashboard_overview');
    }
  }, []);

  const switchTenant = async (tenantId: string): Promise<boolean> => {
    try {
      const tenant = await apiService.switchTenant(tenantId);
      setCurrentTenant(tenant);
      appCache.delete('plan_info');
      appCache.delete('dashboard_overview');
      return true;
    } catch {
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    tenants,
    currentTenant,
    login,
    logout,
    switchTenant,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
