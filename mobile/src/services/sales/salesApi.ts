import { apiService } from '../ApiService';
import type {
  Contract,
  ContractCreatePayload,
  QuotesResponse,
  ContractsResponse,
  Quote,
  QuoteCreatePayload,
} from '../../models/sales';

export async function fetchQuotesPaged(
  page = 1,
  limit = 20,
  status?: string,
  opportunityId?: string,
): Promise<QuotesResponse> {
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(limit));
  if (status) p.append('status', status);
  if (opportunityId) p.append('opportunityId', opportunityId);
  return apiService.get<QuotesResponse>(`/sales/quotes?${p.toString()}`);
}

export async function createQuoteApi(
  data: QuoteCreatePayload,
): Promise<Quote> {
  return apiService.post<Quote>('/sales/quotes', data);
}

export async function updateQuoteApi(
  id: string,
  data: Partial<Quote>,
): Promise<Quote> {
  return apiService.put<Quote>(`/sales/quotes/${id}`, data);
}

export async function deleteQuoteApi(id: string): Promise<void> {
  await apiService.delete(`/sales/quotes/${id}`);
}

export async function fetchContractsPaged(
  page = 1,
  limit = 20,
  status?: string,
  opportunityId?: string,
): Promise<ContractsResponse> {
  const p = new URLSearchParams();
  p.append('page', String(page));
  p.append('limit', String(limit));
  if (status) p.append('status', status);
  if (opportunityId) p.append('opportunityId', opportunityId);
  return apiService.get<ContractsResponse>(
    `/sales/contracts?${p.toString()}`,
  );
}

export async function createContractApi(
  data: ContractCreatePayload,
): Promise<Contract> {
  return apiService.post<Contract>('/sales/contracts', data);
}

export async function updateContractApi(
  id: string,
  data: Partial<Contract>,
): Promise<Contract> {
  return apiService.put<Contract>(`/sales/contracts/${id}`, data);
}

export async function deleteContractApi(id: string): Promise<void> {
  await apiService.delete(`/sales/contracts/${id}`);
}

export async function getRevenueAnalytics(
  period = 'monthly',
  startDate?: string,
  endDate?: string,
): Promise<unknown> {
  const p = new URLSearchParams({ period });
  if (startDate) p.append('start_date', startDate);
  if (endDate) p.append('end_date', endDate);
  return apiService.get(`/sales/analytics/revenue?${p.toString()}`);
}

export async function getConversionAnalytics(): Promise<unknown> {
  return apiService.get('/sales/analytics/conversion');
}
