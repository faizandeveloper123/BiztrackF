import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { SessionManager } from "./SessionManager";
import {
  offlineGetCacheKey,
  offlineRequestPathname,
  offlineUseAggregateFallback,
} from "./offlineCacheKey";

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiService {
  private client: AxiosInstance;
  private sessionManager: SessionManager;
  private publicEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/reset-password",
    "/auth/reset-password/confirm",
    "/public/plans",
    "/public/mot",
  ];
  private currentTenantId: string | null = null;

  constructor() {
    this.sessionManager = new SessionManager();

    const getApiUrl = () => {
      if (typeof window !== "undefined") {
        const runtimeUrl = (window as any).__API_URL__;
        if (runtimeUrl) return runtimeUrl;
      }
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    };

    this.client = axios.create({
      baseURL: getApiUrl(),
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Initialize tenant ID from localStorage if available
    if (typeof window !== "undefined") {
      this.currentTenantId = localStorage.getItem("currentTenantId");
    }

    this.setupInterceptors();
    this.setupOfflineInterceptors();
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  // Tenant management
  setTenantId(tenantId: string | null) {
    this.currentTenantId = tenantId;
    if (typeof window !== "undefined") {
      if (tenantId) {
        localStorage.setItem("currentTenantId", tenantId);
      } else {
        localStorage.removeItem("currentTenantId");
        localStorage.removeItem("userTenants");
      }
    }
  }

  getTenantId(): string | null {
    if (this.currentTenantId) {
      return this.currentTenantId;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentTenantId");
    }
    return null;
  }

  // Store user tenants in localStorage
  setUserTenants(tenants: any[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem("userTenants", JSON.stringify(tenants));
    }
  }

  // Get user tenants from localStorage
  getUserTenants(): any[] {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userTenants");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          localStorage.removeItem("userTenants");
        }
      }
    }
    return [];
  }

  // Get current tenant info from localStorage
  getCurrentTenant(): any | null {
    const tenantId = this.getTenantId();
    if (!tenantId) return null;

    const tenants = this.getUserTenants();
    return tenants.find((t) => t.id === tenantId) || null;
  }

  // Force refresh tenants from API (for admin operations)
  async refreshTenants(): Promise<any[]> {
    try {
      const tenantsResponse = await this.getMyTenants();
      if (tenantsResponse.tenants) {
        this.setUserTenants(tenantsResponse.tenants);
        return tenantsResponse.tenants;
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          "[ApiService Interceptor] Request intercepted:",
          config.method,
          config.url,
        );

        // Check if this is a public endpoint
        const isPublicEndpoint = this.publicEndpoints.some((endpoint) => {
          const matches = config.url?.includes(endpoint);
          return matches;
        });

        if (isPublicEndpoint) {
          console.log(
            "[ApiService Interceptor] Public endpoint, skipping auth",
          );
          return config;
        }

        if (typeof window === "undefined") {
          console.error(
            `[ApiService Interceptor] Server-side request to protected endpoint without auth | URL: ${config.url} | Method: ${config.method}`,
          );
          return Promise.reject(
            new Error(
              "Server-side requests to protected endpoints are not allowed",
            ),
          );
        }

        const isSessionValid = this.sessionManager.isSessionValid();
        console.log("[ApiService Interceptor] Session valid:", isSessionValid);

        if (!isSessionValid) {
          console.warn(
            `[ApiService Interceptor] Session invalid - rejecting request | URL: ${config.url} | Method: ${config.method}`,
          );
          return Promise.reject(new Error("Not authenticated"));
        }

        const token = this.sessionManager.getToken();
        console.log("[ApiService Interceptor] Token exists:", !!token);

        if (!token) {
          console.error(
            `[ApiService Interceptor] Session valid but token missing - rejecting request | URL: ${config.url} | Method: ${config.method}`,
          );
          return Promise.reject(new Error("Authentication token missing"));
        }

        config.headers.Authorization = `Bearer ${token}`;
        console.log("[ApiService Interceptor] Authorization header set");

        const tenantId = this.getTenantId();
        console.log("[ApiService Interceptor] Tenant ID:", tenantId);

        if (tenantId) {
          config.headers["X-Tenant-ID"] = tenantId;
          console.log(
            "[ApiService Interceptor] X-Tenant-ID header set:",
            tenantId,
          );
        } else {
          console.warn(
            `[ApiService Interceptor] Tenant ID missing for protected endpoint | URL: ${config.url} | Method: ${config.method}`,
          );
        }

        if (
          typeof FormData !== "undefined" &&
          config.data &&
          config.data instanceof FormData
        ) {
          if (config.headers) {
            delete (config.headers as Record<string, unknown>)["Content-Type"];
            delete (config.headers as Record<string, unknown>)["content-type"];
          }
        }

        console.log("[ApiService Interceptor] Request config final:", {
          url: config.url,
          method: config.method,
          headers: {
            Authorization: config.headers.Authorization
              ? "Bearer ***"
              : "missing",
            "X-Tenant-ID": config.headers["X-Tenant-ID"] || "missing",
          },
        });

        return config;
      },
      (error) => {
        console.error(
          "[ApiService Interceptor] Request interceptor error:",
          error,
        );
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      async (response) => {
        if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
          try {
            if (
              navigator.onLine &&
              (response.config.method || "").toLowerCase() === "get" &&
              response.config.responseType !== "blob" &&
              !(response.data instanceof Blob)
            ) {
              const { invoke } = await import("@tauri-apps/api/core");
              const tid = this.getTenantId() || "";
              const u = String(response.config.url || "");
              const key = offlineGetCacheKey(
                tid,
                u,
                (response.config.params as Record<string, unknown>) || {},
              );
              const value =
                typeof response.data === "string"
                  ? response.data
                  : JSON.stringify(response.data);
              await invoke("offline_cache_put", { key, value });
            }
          } catch {}
        }
        return response;
      },
      async (error) => {
        if (
          error.code === "ECONNABORTED" &&
          error.message.includes("timeout")
        ) {
          const timeoutError = new Error(
            "Request timeout. Please try again.",
          ) as Error & {
            isTimeout?: boolean;
            config?: typeof error.config;
          };
          timeoutError.isTimeout = true;
          timeoutError.config = error.config;
          return Promise.reject(timeoutError);
        }

        if (error.response?.status === 401) {
          const requestUrl = String(error.config?.url ?? "");
          const isLoginRequest = requestUrl.includes("auth/login");
          if (isLoginRequest) {
            return Promise.reject(error);
          }
          console.warn("401 Unauthorized error:", error.config?.url);
          if (error.config._retry) {
            console.error("Token refresh failed, clearing session");
            this.sessionManager.clearSession();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(error);
          }

          console.log("Attempting to refresh token...");
          const refreshSuccess = await this.sessionManager.refreshAccessToken();
          if (refreshSuccess) {
            console.log("Token refreshed successfully, retrying request");
            const originalRequest = error.config;
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${this.sessionManager.getToken()}`;
            return this.client(originalRequest);
          } else {
            console.error("Token refresh failed, clearing session");
            this.sessionManager.clearSession();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private setupOfflineInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        if (
          typeof window === "undefined" ||
          !("__TAURI_INTERNALS__" in window)
        ) {
          return config;
        }
        if (
          typeof FormData !== "undefined" &&
          config.data instanceof FormData
        ) {
          return config;
        }
        const online = typeof navigator !== "undefined" && navigator.onLine;
        const method = (config.method || "get").toUpperCase();
        const url = String(config.url || "");
        const isPublicEndpoint = this.publicEndpoints.some((endpoint) =>
          url.includes(endpoint),
        );
        if (isPublicEndpoint) {
          return config;
        }
        const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
        if (!online && isMutation) {
          const { invoke } = await import("@tauri-apps/api/core");
          const token = this.sessionManager.getToken();
          const tid = this.getTenantId();
          await invoke("offline_enqueue", {
            method,
            url,
            queryJson: config.params ? JSON.stringify(config.params) : null,
            bodyJson:
              config.data !== undefined && config.data !== null
                ? typeof config.data === "string"
                  ? config.data
                  : JSON.stringify(config.data)
                : null,
            headersJson: JSON.stringify({
              Authorization: token
                ? `Bearer ${token}`
                : config.headers?.Authorization,
              "X-Tenant-ID":
                tid ||
                (config.headers as Record<string, unknown>)["X-Tenant-ID"],
            }),
            tenantId: tid,
          });
          (
            config as { adapter?: (c: typeof config) => Promise<unknown> }
          ).adapter = () =>
            Promise.resolve({
              data: { success: true, offlineQueued: true },
              status: 202,
              statusText: "Accepted",
              headers: {},
              config,
              request: {},
            });
          return config;
        }
        if (!online && method === "GET") {
          const { invoke } = await import("@tauri-apps/api/core");
          const tid = this.getTenantId() || "";
          const key = offlineGetCacheKey(
            tid,
            url,
            (config.params as Record<string, unknown>) || {},
          );
          let payload: string | null = await invoke<string | null>(
            "offline_cache_get",
            { key },
          );
          if (payload == null) {
            const pathname = offlineRequestPathname(url);
            if (offlineUseAggregateFallback(pathname, url)) {
              payload = await invoke<string | null>("offline_aggregate_get", {
                tenant_id: tid,
                route_key: pathname,
              });
            }
          }
          if (payload != null) {
            let parsed: unknown;
            try {
              parsed = JSON.parse(payload);
            } catch {
              parsed = payload;
            }
            (
              config as { adapter?: (c: typeof config) => Promise<unknown> }
            ).adapter = () =>
              Promise.resolve({
                data: parsed,
                status: 200,
                statusText: "OK",
                headers: {},
                config,
                request: {},
              });
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async getBlob(url: string): Promise<Blob> {
    const response = await this.client.get(url, { responseType: "blob" });
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    console.log("[ApiService] POST request:", url);
    console.log("[ApiService] POST data:", data);
    console.log("[ApiService] Base URL:", this.client.defaults.baseURL);
    console.log(
      "[ApiService] Full URL:",
      `${this.client.defaults.baseURL}${url}`,
    );
    console.log("[ApiService] Tenant ID:", this.getTenantId());
    console.log(
      "[ApiService] Session valid:",
      this.sessionManager.isSessionValid(),
    );

    try {
      const response = await this.client.post<T>(url, data, config);
      console.log("[ApiService] POST response status:", response.status);
      console.log("[ApiService] POST response data:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[ApiService] POST error:", error);
      console.error("[ApiService] POST error message:", error?.message);
      console.error("[ApiService] POST error response:", error?.response);
      if (error?.response) {
        console.error("[ApiService] POST error status:", error.response.status);
        console.error("[ApiService] POST error data:", error.response.data);
      }
      throw error;
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    try {
      const response = await this.post("/auth/login", credentials);

      // Store session after successful login
      if (response.success && response.token && response.user) {
        this.sessionManager.setSession(
          response.token,
          response.user,
          response.expires_in,
          response.refresh_token,
        );

        // Fetch user's tenants ONCE during login and store in localStorage
        try {
          const tenantsResponse = await this.getMyTenants();
          if (tenantsResponse.tenants && tenantsResponse.tenants.length > 0) {
            // Store all tenants in localStorage
            this.setUserTenants(tenantsResponse.tenants);

            // Set the first tenant as current tenant
            this.setTenantId(tenantsResponse.tenants[0].id);
          }
        } catch (tenantError) {
          // Continue without tenant - some endpoints might still work
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: {
    userName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.post("/auth/register", userData);
  }

  async getCurrentUser() {
    return this.get("/auth/me");
  }

  async logout() {
    try {
      const response = await this.post("/auth/logout");
      // Clear all tenant information on logout
      this.setTenantId(null);
      return response;
    } catch (error) {
      // Clear tenant even if logout request fails
      this.setTenantId(null);
      throw error;
    }
  }

  // User endpoints
  async getUsers() {
    // Use tenant-scoped endpoint if tenant is available, otherwise fallback to global
    const tenantId = this.getTenantId();
    if (tenantId) {
      return this.getTenantUsers(tenantId);
    }
    return this.get("/users");
  }

  async getTenantUsers(tenantId: string) {
    return this.get(`/tenants/${tenantId}/users`);
  }

  // Get users for current tenant
  async getCurrentTenantUsers() {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error("No tenant selected");
    }
    return this.getTenantUsers(tenantId);
  }

  async getUser(id: string) {
    return this.get(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.put(`/auth/users/${id}`, data);
  }

  async getMyProfile() {
    return this.get("/profile/me");
  }

  async updateMyProfile(data: any) {
    return this.put("/profile/me", data);
  }

  async uploadCompanyLogo(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return this.post("/file-upload/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async deleteCompanyLogo() {
    return this.delete("/file-upload/logo");
  }

  async deleteAvatar() {
    return this.delete("/profile/avatar");
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post("/profile/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }
  // SaaS Plans and Subscription
  async getPlans() {
    return this.get("/plans");
  }

  async subscribeToPlan(data: {
    planId: string;
    tenantName: string;
    domain?: string;
  }) {
    return this.post("/tenants/subscribe", data);
  }

  async createTenantFromLanding(data: {
    planId: string;
    tenantName: string;
    domain?: string;
    paymentMethod?: "stripe" | "paypal";
  }) {
    return this.post("/tenants/create-tenant", data);
  }

  async confirmPayPalSubscription(tenantId: string, subscriptionId: string) {
    return this.post(
      `/subscriptions/paypal/confirm?tenant_id=${tenantId}&subscription_id=${subscriptionId}`,
    );
  }

  async getSubscriptionBilling(tenantId: string) {
    return this.get(`/subscriptions/billing?tenant_id=${tenantId}`);
  }

  async getSubscriptionUsage(tenantId: string) {
    return this.get(`/subscriptions/usage?tenant_id=${tenantId}`);
  }

  async cancelSubscription(tenantId: string, reason: string) {
    return this.post(
      `/subscriptions/cancel?tenant_id=${tenantId}&reason=${encodeURIComponent(reason)}`,
    );
  }

  async reactivateSubscription(tenantId: string) {
    return this.post(`/subscriptions/reactivate?tenant_id=${tenantId}`);
  }

  async upgradePlan(tenantId: string, newPlanId: string, oldPlanId: string) {
    return this.post("/subscriptions/upgrade", {
      tenant_id: tenantId,
      new_plan_id: newPlanId,
      old_plan_id: oldPlanId,
    });
  }

  async syncSubscriptionStatus(tenantId: string) {
    return this.post(`/subscriptions/sync?tenant_id=${tenantId}`);
  }

  async getPlanLimits(tenantId: string, resourceType: string) {
    return this.get(
      `/subscriptions/limits?tenant_id=${tenantId}&resource_type=${resourceType}`,
    );
  }

  // Tenant endpoints
  async getMyTenants() {
    return this.get("/tenants/my-tenants");
  }

  async getTenant(tenantId: string) {
    return this.get(`/tenants/${tenantId}`);
  }

  async switchTenant(tenantId: string) {
    // Verify user has access to this tenant using stored tenants (no API call)
    const storedTenants = this.getUserTenants();
    const tenant = storedTenants.find((t: any) => t.id === tenantId);

    if (!tenant) {
      throw new Error("Access denied to this tenant");
    }

    this.setTenantId(tenantId);
    return tenant;
  }

  // Project endpoints
  async getProjects() {
    return this.get("/projects");
  }

  async getProject(id: string) {
    return this.get(`/projects/${id}`);
  }

  async createProject(data: any) {
    return this.post("/projects", data);
  }

  async updateProject(id: string, data: any) {
    return this.put(`/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.delete(`/projects/${id}`);
  }

  async requestProjectDeletion(id: string) {
    return this.post(`/projects/${id}/request-deletion`, {});
  }

  async approveProjectDeletion(id: string) {
    return this.post(`/projects/${id}/approve-deletion`, {});
  }

  async rejectProjectDeletion(id: string) {
    return this.post(`/projects/${id}/reject-deletion`, {});
  }

  async getProjectTeamMembers() {
    return this.get("/projects/team-members");
  }

  // Task endpoints
  async getTasks(params?: {
    project?: string;
    status?: string;
    assignedTo?: string;
    includeSubtasks?: boolean;
    mainTasksOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.project) queryParams.append("project", params.project);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.assignedTo) queryParams.append("assignedTo", params.assignedTo);
    if (params?.includeSubtasks !== undefined)
      queryParams.append("include_subtasks", params.includeSubtasks.toString());
    if (params?.mainTasksOnly !== undefined)
      queryParams.append("main_tasks_only", params.mainTasksOnly.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return this.get(url);
  }

  async getTask(id: string, includeSubtasks: boolean = true) {
    const params = includeSubtasks
      ? "?include_subtasks=true"
      : "?include_subtasks=false";
    return this.get(`/tasks/${id}${params}`);
  }

  async createTask(data: any) {
    return await this.post("/tasks", data);
  }

  async updateTask(id: string, data: any) {
    return this.put(`/tasks/${id}`, data);
  }

  async deleteTask(id: string) {
    return this.delete(`/tasks/${id}`);
  }

  async getTasksByProject(projectId: string, mainTasksOnly: boolean = false) {
    const params = mainTasksOnly ? "?main_tasks_only=true" : "";
    return this.get(`/tasks?project=${projectId}${params}`);
  }

  // Subtask endpoints
  async getSubtasks(taskId: string) {
    return this.get(`/tasks/${taskId}/subtasks`);
  }

  async createSubtask(taskId: string, data: any) {
    return this.post(`/tasks/${taskId}/subtasks`, data);
  }

  async getTaskMessages(taskId: string) {
    return this.get(`/tasks/${taskId}/messages`);
  }

  async createTaskMessage(
    taskId: string,
    data: { body: string; messageType?: string },
  ) {
    return this.post(`/tasks/${taskId}/messages`, data);
  }

  // Health check
  async healthCheck() {
    return this.get("/health");
  }

  // Custom Roles & Permissions
  async getCustomRoles(tenantId: string) {
    return this.get(`/tenants/${tenantId}/custom-roles`);
  }

  async createCustomRole(
    tenantId: string,
    data: { name: string; permissions: string[] },
  ) {
    return this.post(`/tenants/${tenantId}/custom-roles`, data);
  }

  async updateCustomRole(
    tenantId: string,
    roleId: string,
    data: { name?: string; permissions?: string[] },
  ) {
    return this.put(`/tenants/${tenantId}/custom-roles/${roleId}`, data);
  }

  async deleteCustomRole(tenantId: string, roleId: string) {
    return this.delete(`/tenants/${tenantId}/custom-roles/${roleId}`);
  }

  async getPermissions() {
    return this.get("/tenants/permissions");
  }
  // Test connection
  async testConnection() {
    try {
      const response = await this.get("/health");
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Event methods
  async getEvents(params?: {
    project?: string;
    user?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.project) queryParams.append("project_id", params.project);
      if (params?.user) queryParams.append("user_id", params.user);
      if (params?.status) queryParams.append("status_filter", params.status);
      if (params?.page)
        queryParams.append(
          "skip",
          ((params.page - 1) * (params.limit || 100)).toString(),
        );
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const url = `/events?${queryParams.toString()}`;
      const response = await this.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getEvent(id: string) {
    try {
      const response = await this.get(`/events/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createEvent(data: any) {
    try {
      const response = await this.post("/events", data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateEvent(id: string, data: any) {
    try {
      const response = await this.put(`/events/${id}`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deleteEvent(id: string) {
    try {
      const response = await this.delete(`/events/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getUpcomingEvents(days: number = 7) {
    try {
      const response = await this.get(`/events/upcoming?days=${days}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async joinEvent(id: string) {
    try {
      const response = await this.post(`/events/${id}/join`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async leaveEvent(id: string) {
    try {
      const response = await this.post(`/events/${id}/leave`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getGoogleAuthUrl() {
    try {
      const response = await this.get("/events/google/authorize");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async googleAuthCallback(code: string) {
    try {
      const response = await this.post("/events/google/callback", { code });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getGoogleAuthStatus() {
    try {
      const response = await this.get("/events/google/status");
      return response;
    } catch (error) {
      throw error;
    }
  }

  async regenerateMeetLink(id: string) {
    try {
      const response = await this.post(`/events/${id}/regenerate-meet-link`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Sales methods
  async getSalesDashboard(): Promise<any> {
    try {
      const response = await this.client.get("/sales/dashboard");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getLeads(
    params: {
      limit?: number;
      status?: string;
      source?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/leads", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createLead(leadData: any): Promise<any> {
    try {
      const response = await this.client.post("/sales/leads", leadData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateLead(leadId: string, leadData: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/sales/leads/${leadId}`,
        leadData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteLead(leadId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/sales/leads/${leadId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getContacts(
    params: {
      limit?: number;
      companyId?: string;
      contactType?: string;
      search?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/contacts", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createContact(contactData: any): Promise<any> {
    try {
      const response = await this.client.post("/sales/contacts", contactData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateContact(contactId: string, contactData: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/sales/contacts/${contactId}`,
        contactData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteContact(contactId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/sales/contacts/${contactId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCompanies(
    params: {
      limit?: number;
      industry?: string;
      search?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/companies", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createCompany(companyData: any): Promise<any> {
    try {
      const response = await this.client.post("/sales/companies", companyData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateCompany(companyId: string, companyData: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/sales/companies/${companyId}`,
        companyData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteCompany(companyId: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/sales/companies/${companyId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getOpportunities(
    params: {
      limit?: number;
      stage?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/opportunities", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createOpportunity(opportunityData: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/sales/opportunities",
        opportunityData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateOpportunity(
    opportunityId: string,
    opportunityData: any,
  ): Promise<any> {
    try {
      const response = await this.client.put(
        `/sales/opportunities/${opportunityId}`,
        opportunityData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteOpportunity(opportunityId: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/sales/opportunities/${opportunityId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getQuotes(
    params: {
      limit?: number;
      status?: string;
      opportunityId?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/quotes", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createQuote(quoteData: any): Promise<any> {
    try {
      const response = await this.client.post("/sales/quotes", quoteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateQuote(quoteId: string, quoteData: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/sales/quotes/${quoteId}`,
        quoteData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteQuote(quoteId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/sales/quotes/${quoteId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getContracts(
    params: {
      limit?: number;
      status?: string;
      opportunityId?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/contracts", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createContract(contractData: any): Promise<any> {
    try {
      const response = await this.client.post("/sales/contracts", contractData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateContract(contractId: string, contractData: any): Promise<any> {
    try {
      const response = await this.client.put(
        `/sales/contracts/${contractId}`,
        contractData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteContract(contractId: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/sales/contracts/${contractId}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getSalesActivities(
    params: {
      limit?: number;
      leadId?: string;
      opportunityId?: string;
      contactId?: string;
      companyId?: string;
      type?: string;
      page?: number;
    } = {},
  ): Promise<any> {
    try {
      const response = await this.client.get("/sales/activities", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createSalesActivity(activityData: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/sales/activities",
        activityData,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRevenueAnalytics(
    period: string = "monthly",
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    try {
      const params: any = { period };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await this.client.get("/sales/analytics/revenue", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getConversionAnalytics(): Promise<any> {
    try {
      const response = await this.client.get("/sales/analytics/conversion");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Admin API methods
  async getAllTenants(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<any[]> {
    try {
      const response = await this.client.get("/admin/tenants", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getTenantDetails(tenantId: string): Promise<any> {
    try {
      const response = await this.client.get(`/admin/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateTenantStatus(tenantId: string, isActive: boolean): Promise<any> {
    try {
      const response = await this.client.put(
        `/admin/tenants/${tenantId}/status`,
        {
          is_active: isActive,
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAdminStats(): Promise<any> {
    try {
      const response = await this.client.get("/admin/stats");
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
