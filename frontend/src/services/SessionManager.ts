import { User } from "../models/auth/User";
import { extractErrorMessage } from "../utils/errorUtils";

export interface SessionData {
  token: string;
  user: User;
  expiresAt?: number;
  refreshToken?: string;
}

class SessionManager {
  private readonly TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "user_data";
  private readonly EXPIRES_KEY = "token_expires";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly COOKIE_TOKEN_KEY = "auth-token";

  // Helper function to set cookie
  private setCookie(name: string, value: string, days: number = 7): void {
    if (typeof window === "undefined") return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  // Helper function to get cookie
  private getCookie(name: string): string | null {
    if (typeof window === "undefined") return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Helper function to remove cookie
  private removeCookie(name: string): void {
    if (typeof window === "undefined") return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Token management
  setToken(token: string, expiresIn?: number): void {
    if (typeof window === "undefined") return;

    // Store in localStorage
    localStorage.setItem(this.TOKEN_KEY, token);

    // Also store in cookie for middleware access
    const days = expiresIn ? Math.ceil(expiresIn / (24 * 60 * 60)) : 7;
    this.setCookie(this.COOKIE_TOKEN_KEY, token, days);

    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.EXPIRES_KEY, expiresAt.toString());
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;

    // Try localStorage first, then cookie as fallback
    let token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      token = this.getCookie(this.COOKIE_TOKEN_KEY);
    }

    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);

    if (token && expiresAt) {
      const now = Date.now();
      if (now > parseInt(expiresAt)) {
        this.clearSession();
        return null;
      }
    }

    return token;
  }

  removeToken(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    this.removeCookie(this.COOKIE_TOKEN_KEY);
  }

  // Refresh token management
  setRefreshToken(refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  removeRefreshToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // User data management
  setUser(user: User): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    if (typeof window === "undefined") return null;

    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch (error) {
      this.removeUser();
      return null;
    }
  }

  removeUser(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(this.USER_KEY);
  }

  // Session management
  setSession(
    token: string,
    user: User,
    expiresIn?: number,
    refreshToken?: string,
  ): void {
    this.setToken(token, expiresIn);
    this.setUser(user);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  getSession(): SessionData | null {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) return null;

    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    const refreshToken = this.getRefreshToken();

    return {
      token,
      user,
      expiresAt: expiresAt ? parseInt(expiresAt) : undefined,
      refreshToken: refreshToken || undefined,
    };
  }

  clearSession(): void {
    this.removeToken();
    this.removeUser();
    this.removeRefreshToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentTenantId");
      localStorage.removeItem("userTenants");
      this.removeCookie(this.COOKIE_TOKEN_KEY);
    }
  }

  isSessionValid(): boolean {
    if (typeof window === "undefined") return false;

    const token = this.getToken();
    const user = this.getUser();

    return !!(token && user);
  }

  isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;

    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return false;

    return Date.now() > parseInt(expiresAt);
  }

  // Session refresh
  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const apiUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.access_token, data.expires_in);

        // Update refresh token if provided (token rotation)
        if (data.refresh_token) {
          this.setRefreshToken(data.refresh_token);
        } else {
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  refreshSession(): boolean {
    if (this.isTokenExpired()) {
      // Try to refresh instead of just clearing
      return false; // Will be handled by async refresh
    }
    return true;
  }

  // Session events
  onSessionExpired(callback: () => void): void {
    if (typeof window === "undefined") return;

    const checkExpiration = async () => {
      if (this.isTokenExpired()) {
        // Try to refresh the token first
        const refreshSuccess = await this.refreshAccessToken();
        if (!refreshSuccess) {
          this.clearSession();
          callback();
        }
      }
    };

    // Check every minute
    setInterval(checkExpiration, 60000);
  }

  // Proactive token refresh - refresh before expiration
  startProactiveRefresh(): void {
    if (typeof window === "undefined") return;

    const refreshBeforeExpiration = async () => {
      try {
        const timeUntilExpiration = this.getTimeUntilExpiration();

        // If token expires in less than 5 minutes, refresh it proactively
        if (timeUntilExpiration && timeUntilExpiration < 5 * 60 * 1000) {
          const refreshSuccess = await this.refreshAccessToken();
          if (!refreshSuccess) {
            // Don't clear session immediately, let the reactive refresh handle it
          }
        }
      } catch (error: any) {
        extractErrorMessage(error, "Session refresh failed");
      }
    };

    // Check every 2 minutes for proactive refresh
    setInterval(refreshBeforeExpiration, 2 * 60 * 1000);

    // Also check immediately
    refreshBeforeExpiration();
  }

  // Utility methods
  getTokenExpirationTime(): Date | null {
    if (typeof window === "undefined") return null;

    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return null;

    return new Date(parseInt(expiresAt));
  }

  getTimeUntilExpiration(): number | null {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return null;

    return Math.max(0, expirationTime.getTime() - Date.now());
  }

  // Debug methods
  getSessionInfo(): {
    hasToken: boolean;
    hasUser: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
    timeUntilExpiration: number | null;
  } {
    return {
      hasToken: !!this.getToken(),
      hasUser: !!this.getUser(),
      isExpired: this.isTokenExpired(),
      expiresAt: this.getTokenExpirationTime(),
      timeUntilExpiration: this.getTimeUntilExpiration(),
    };
  }
}

export { SessionManager };
export default SessionManager;
