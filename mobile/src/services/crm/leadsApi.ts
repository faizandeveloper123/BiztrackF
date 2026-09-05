import { apiService } from '../ApiService';
import type {
  CRMLeadFilters,
  CRMLeadsResponse,
  Lead,
  LeadCreate,
  LeadUpdate,
} from '../../models/crm';

const base = '/crm/leads';

export async function fetchLeadsPaged(
  filters: CRMLeadFilters | undefined,
  page: number,
  limit: number,
): Promise<CRMLeadsResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.source) params.append('source', filters.source);
  if (filters?.assignedTo) params.append('assigned_to', filters.assignedTo);
  if (filters?.search) params.append('search', filters.search);
  params.append('page', String(page));
  params.append('limit', String(limit));
  return apiService.get<CRMLeadsResponse>(`${base}?${params.toString()}`);
}

export async function createLeadApi(data: LeadCreate): Promise<Lead> {
  return apiService.post<Lead>(base, data);
}

export async function updateLeadApi(
  id: string,
  data: LeadUpdate,
): Promise<Lead> {
  return apiService.put<Lead>(`${base}/${id}`, data);
}

export async function deleteLeadApi(id: string): Promise<void> {
  await apiService.delete(`${base}/${id}`);
}
