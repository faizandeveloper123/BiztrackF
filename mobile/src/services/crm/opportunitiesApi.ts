import { apiService } from '../ApiService';
import type {
  CRMOpportunityFilters,
  CRMOpportunitiesResponse,
  Opportunity,
  OpportunityCreate,
  OpportunityUpdate,
} from '../../models/crm';

const base = '/crm/opportunities';

export async function fetchOpportunitiesPaged(
  filters: CRMOpportunityFilters | undefined,
  page: number,
  limit: number,
): Promise<CRMOpportunitiesResponse> {
  const params = new URLSearchParams();
  if (filters?.stage) params.append('stage', filters.stage);
  if (filters?.assignedTo) params.append('assigned_to', filters.assignedTo);
  if (filters?.search) params.append('search', filters.search);
  params.append('page', String(page));
  params.append('limit', String(limit));
  return apiService.get<CRMOpportunitiesResponse>(
    `${base}?${params.toString()}`,
  );
}

export async function createOpportunityApi(
  data: OpportunityCreate,
): Promise<Opportunity> {
  return apiService.post<Opportunity>(base, data);
}

export async function updateOpportunityApi(
  id: string,
  data: OpportunityUpdate,
): Promise<Opportunity> {
  return apiService.put<Opportunity>(`${base}/${id}`, data);
}

export async function deleteOpportunityApi(id: string): Promise<void> {
  await apiService.delete(`${base}/${id}`);
}
