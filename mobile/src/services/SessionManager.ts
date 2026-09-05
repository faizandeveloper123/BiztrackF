import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../models/auth/User';
import { getApiBaseUrl } from '../config/apiConfig';

export interface SessionData {
  token: string;
  user: User;
  expiresAt?: number;
  refreshToken?: string;
}

class SessionManager {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly EXPIRES_KEY = 'token_expires';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  async setToken(token: string, expiresIn?: number): Promise<void> {
    await AsyncStorage.setItem(this.TOKEN_KEY, token);
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000;
      await AsyncStorage.setItem(this.EXPIRES_KEY, expiresAt.toString());
    }
  }

  async getToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(this.TOKEN_KEY);
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    if (token && expiresAt) {
      if (Date.now() > parseInt(expiresAt, 10)) {
        await this.clearSession();
        return null;
      }
    }
    return token;
  }

  async removeToken(): Promise<void> {
    await AsyncStorage.multiRemove([this.TOKEN_KEY, this.EXPIRES_KEY]);
  }

  async setRefreshToken(refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  async removeRefreshToken(): Promise<void> {
    await AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  async getUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem(this.USER_KEY);
    if (!userData) return null;
    try {
      return JSON.parse(userData) as User;
    } catch {
      await this.removeUser();
      return null;
    }
  }

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(this.USER_KEY);
  }

  async setSession(
    token: string,
    user: User,
    expiresIn?: number,
    refreshToken?: string,
  ): Promise<void> {
    await this.setToken(token, expiresIn);
    await this.setUser(user);
    if (refreshToken) {
      await this.setRefreshToken(refreshToken);
    }
  }

  async getSession(): Promise<SessionData | null> {
    const token = await this.getToken();
    const user = await this.getUser();
    if (!token || !user) return null;
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    const refreshToken = await this.getRefreshToken();
    return {
      token,
      user,
      expiresAt: expiresAt ? parseInt(expiresAt, 10) : undefined,
      refreshToken: refreshToken || undefined,
    };
  }

  async clearSession(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
    await this.removeRefreshToken();
    await AsyncStorage.multiRemove(['currentTenantId', 'userTenants']);
  }

  async isSessionValid(): Promise<boolean> {
    const token = await this.getToken();
    const user = await this.getUser();
    return !!(token && user);
  }

  async isTokenExpired(): Promise<boolean> {
    const expiresAt = await AsyncStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return false;
    return Date.now() > parseInt(expiresAt, 10);
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        await this.setToken(data.access_token, data.expires_in);
        if (data.refresh_token) {
          await this.setRefreshToken(data.refresh_token);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export { SessionManager };
export default SessionManager;
