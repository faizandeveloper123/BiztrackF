import { apiService } from './ApiService';

export const apiClient = {
  get: <T = any>(url: string) => apiService.get<T>(url),
  post: <T = any>(url: string, data?: any) => apiService.post<T>(url, data),
  put: <T = any>(url: string, data?: any) => apiService.put<T>(url, data),
  delete: <T = any>(url: string) => apiService.delete<T>(url),
  patch: <T = any>(url: string, data?: any) => apiService.patch<T>(url, data),
};

export { apiService };
