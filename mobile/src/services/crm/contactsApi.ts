import { apiService } from '../ApiService';
import type {
  CRMContactFilters,
  CRMContactsResponse,
  Contact,
  ContactCreate,
  ContactUpdate,
} from '../../models/crm';
export { fetchCompaniesList } from './companiesApi';

const contactsBase = '/crm/contacts';

export async function fetchContacts(
  filters: CRMContactFilters | undefined,
  page: number,
  limit: number,
): Promise<CRMContactsResponse> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.companyId) params.append('company_id', filters.companyId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.assignedTo) params.append('assigned_to', filters.assignedTo);
  if (filters?.industry) params.append('industry', filters.industry);
  if (filters?.website?.trim())
    params.append('website', filters.website.trim());
  if (
    filters?.birthdayMonth != null &&
    filters.birthdayMonth >= 1 &&
    filters.birthdayMonth <= 12
  ) {
    params.append('birthday_month', String(filters.birthdayMonth));
  }
  if (filters?.country?.trim())
    params.append('country', filters.country.trim());
  if (filters?.dateField) params.append('date_field', filters.dateField);
  if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
  if (filters?.dateTo) params.append('date_to', filters.dateTo);
  if (filters?.quickFilter) params.append('quick_filter', filters.quickFilter);
  params.append('page', String(page));
  params.append('limit', String(limit));
  return apiService.get<CRMContactsResponse>(
    `${contactsBase}?${params.toString()}`,
  );
}

export async function createContactApi(data: ContactCreate): Promise<Contact> {
  return apiService.post<Contact>(contactsBase, data);
}

export async function updateContactApi(
  id: string,
  data: ContactUpdate,
): Promise<Contact> {
  return apiService.put<Contact>(`${contactsBase}/${id}`, data);
}

export async function deleteContactApi(
  id: string,
): Promise<void> {
  await apiService.delete(`${contactsBase}/${id}`);
}
