import { apiService } from '../ApiService';

export type CustomOption = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
};

export async function getCustomDepartments(): Promise<CustomOption[]> {
  const res = await apiService.get<CustomOption[] | { data: CustomOption[] }>(
    '/custom-options/departments',
  );
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && Array.isArray((res as { data: CustomOption[] }).data)) {
    return (res as { data: CustomOption[] }).data;
  }
  return [];
}

export async function createCustomDepartment(
  name: string,
  description?: string,
): Promise<CustomOption> {
  const params = new URLSearchParams({ name });
  if (description?.trim()) params.append('description', description.trim());
  return apiService.post<CustomOption>(
    `/custom-options/departments?${params.toString()}`,
  );
}
