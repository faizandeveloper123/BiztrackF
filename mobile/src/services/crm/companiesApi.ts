import { apiService } from '../ApiService';
import type {
  Company,
  CompanyCreate,
  CompanyUpdate,
  CRMCompaniesResponse,
  CRMCompanyFilters,
} from '../../models/crm';

const base = '/crm/companies';

export async function fetchCompaniesPaged(
  filters: CRMCompanyFilters | undefined,
  page: number,
  limit: number,
): Promise<CRMCompaniesResponse> {
  const params = new URLSearchParams();
  if (filters?.industry) params.append('industry', filters.industry);
  if (filters?.size) params.append('size', filters.size);
  if (filters?.search) params.append('search', filters.search);
  params.append('page', String(page));
  params.append('limit', String(limit));
  return apiService.get<CRMCompaniesResponse>(`${base}?${params.toString()}`);
}

export async function fetchCompaniesList(limit = 200): Promise<Company[]> {
  const res = await fetchCompaniesPaged({}, 1, limit);
  return res.companies ?? [];
}

export async function createCompanyApi(data: CompanyCreate): Promise<Company> {
  return apiService.post<Company>(base, data);
}

export async function updateCompanyApi(
  id: string,
  data: CompanyUpdate,
): Promise<Company> {
  return apiService.put<Company>(`${base}/${id}`, data);
}

export async function deleteCompanyApi(id: string): Promise<void> {
  await apiService.delete(`${base}/${id}`);
}
