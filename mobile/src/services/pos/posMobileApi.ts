import { apiService } from '../ApiService';
import type {
  PosDashboardApi,
  POSTransactionResponse,
  POSTransactionCreate,
  POSShift,
  POSShiftCreate,
  POSShiftResponse,
  POSShiftUpdate,
  POSShiftsResponse,
  POSTransactionsResponse,
} from '../../models/pos';

export async function getPosDashboard(): Promise<PosDashboardApi> {
  return apiService.get<PosDashboardApi>('/pos/dashboard');
}

export async function getCurrentOpenShift(): Promise<{
  shift: POSShift | null;
}> {
  return apiService.get<{ shift: POSShift | null }>(
    '/pos/shifts/current/open',
  );
}

export async function getPosShifts(
  page = 1,
  limit = 100,
): Promise<POSShiftsResponse> {
  return apiService.get<POSShiftsResponse>(
    `/pos/shifts?page=${page}&limit=${limit}`,
  );
}

export async function createPosShift(
  data: POSShiftCreate,
): Promise<POSShiftResponse> {
  return apiService.post<POSShiftResponse>('/pos/shifts', data);
}

export async function updatePosShift(
  id: string,
  data: POSShiftUpdate,
): Promise<POSShiftResponse> {
  return apiService.put<POSShiftResponse>(`/pos/shifts/${id}`, data);
}

export async function getPosTransactions(
  page = 1,
  limit = 100,
): Promise<POSTransactionsResponse> {
  return apiService.get<POSTransactionsResponse>(
    `/pos/transactions?page=${page}&limit=${limit}`,
  );
}

export async function createPosTransaction(
  data: POSTransactionCreate,
): Promise<POSTransactionResponse> {
  return apiService.post<POSTransactionResponse>('/pos/transactions', data);
}

export async function getPosSalesReport(params?: {
  date_from?: string;
  date_to?: string;
  payment_method?: string;
  cashier_id?: string;
}): Promise<Record<string, unknown>> {
  const p = new URLSearchParams();
  if (params?.date_from) p.append('date_from', params.date_from);
  if (params?.date_to) p.append('date_to', params.date_to);
  if (params?.payment_method) p.append('payment_method', params.payment_method);
  if (params?.cashier_id) p.append('cashier_id', params.cashier_id);
  const q = p.toString();
  return apiService.get(`/pos/reports/sales${q ? `?${q}` : ''}`);
}

export async function getPosInventoryReport(params?: {
  low_stock_only?: boolean;
  category?: string;
}): Promise<Record<string, unknown>> {
  const p = new URLSearchParams();
  if (params?.low_stock_only) p.append('low_stock_only', 'true');
  if (params?.category) p.append('category', params.category);
  const q = p.toString();
  return apiService.get(`/pos/reports/inventory${q ? `?${q}` : ''}`);
}

export async function getPosShiftsReport(params?: {
  date_from?: string;
  date_to?: string;
  cashier_id?: string;
}): Promise<Record<string, unknown>> {
  const p = new URLSearchParams();
  if (params?.date_from) p.append('date_from', params.date_from);
  if (params?.date_to) p.append('date_to', params.date_to);
  if (params?.cashier_id) p.append('cashier_id', params.cashier_id);
  const q = p.toString();
  return apiService.get(`/pos/reports/shifts${q ? `?${q}` : ''}`);
}
