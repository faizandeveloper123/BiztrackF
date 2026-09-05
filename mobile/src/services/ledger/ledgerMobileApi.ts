import { apiService } from '../ApiService';
import type {
  AccountReceivablesListResponse,
  ChartOfAccountsResponse,
  LedgerTransactionCreate,
  LedgerTransactionResponse,
  LedgerTransactionUpdate,
  BudgetResponse,
  TrialBalanceResponse,
  IncomeStatementResponse,
  BalanceSheetResponse,
  TransactionType,
} from '../../models/ledger';

const base = '/ledger';

function asArray<T>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : [];
}

function toDateOnly(value?: string): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export async function getChartOfAccounts(
  skip = 0,
  limit = 500,
  accountType?: string,
  accountCategory?: string,
): Promise<ChartOfAccountsResponse[]> {
  const p = new URLSearchParams();
  if (skip > 0) p.append('skip', String(skip));
  if (limit !== 500) p.append('limit', String(limit));
  if (accountType) p.append('account_type', accountType);
  if (accountCategory) p.append('account_category', accountCategory);
  const qs = p.toString();
  const res = await apiService.get<unknown>(
    `${base}/chart-of-accounts${qs ? `?${qs}` : ''}`,
  );
  return asArray<ChartOfAccountsResponse>(res);
}

export async function getLedgerTransactions(params?: {
  skip?: number;
  limit?: number;
  transactionType?: TransactionType;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<LedgerTransactionResponse[]> {
  const p = new URLSearchParams();
  if (params?.skip !== undefined) p.append('skip', String(params.skip));
  if (params?.limit !== undefined) p.append('limit', String(params.limit));
  if (params?.transactionType) {
    p.append('transaction_type', params.transactionType);
  }
  if (params?.accountId) p.append('account_id', params.accountId);
  if (params?.startDate) p.append('start_date', params.startDate.slice(0, 10));
  if (params?.endDate) p.append('end_date', params.endDate.slice(0, 10));
  const qs = p.toString();
  const res = await apiService.get<unknown>(
    `${base}/transactions${qs ? `?${qs}` : ''}`,
  );
  return asArray<LedgerTransactionResponse>(res);
}

export async function createLedgerTransaction(
  body: LedgerTransactionCreate,
): Promise<LedgerTransactionResponse> {
  return apiService.post<LedgerTransactionResponse>(
    `${base}/transactions`,
    body,
  );
}

export async function updateLedgerTransaction(
  id: string,
  body: LedgerTransactionUpdate,
): Promise<LedgerTransactionResponse> {
  return apiService.put<LedgerTransactionResponse>(
    `${base}/transactions/${id}`,
    body,
  );
}

export async function deleteLedgerTransaction(id: string): Promise<void> {
  await apiService.delete(`${base}/transactions/${id}`);
}

export async function getBudgets(
  skip = 0,
  limit = 100,
  activeOnly = false,
): Promise<BudgetResponse[]> {
  const p = new URLSearchParams();
  if (skip > 0) p.append('skip', String(skip));
  if (limit !== 100) p.append('limit', String(limit));
  if (activeOnly) p.append('active_only', 'true');
  const qs = p.toString();
  const res = await apiService.get<unknown>(
    `${base}/budgets${qs ? `?${qs}` : ''}`,
  );
  return asArray<BudgetResponse>(res);
}

export async function getTrialBalance(
  asOfDate?: string,
): Promise<TrialBalanceResponse> {
  const normalizedAsOfDate = toDateOnly(asOfDate);
  const p = normalizedAsOfDate
    ? `?as_of_date=${encodeURIComponent(normalizedAsOfDate)}`
    : '';
  return apiService.get<TrialBalanceResponse>(
    `${base}/reports/trial-balance${p}`,
  );
}

export async function getIncomeStatement(
  startDate?: string,
  endDate?: string,
): Promise<IncomeStatementResponse> {
  const pr = new URLSearchParams();
  const normalizedStartDate = toDateOnly(startDate);
  const normalizedEndDate = toDateOnly(endDate);
  if (normalizedStartDate) pr.append('start_date', normalizedStartDate);
  if (normalizedEndDate) pr.append('end_date', normalizedEndDate);
  const qs = pr.toString();
  return apiService.get<IncomeStatementResponse>(
    `${base}/reports/income-statement${qs ? `?${qs}` : ''}`,
  );
}

export async function getBalanceSheet(
  asOfDate?: string,
): Promise<BalanceSheetResponse> {
  const normalizedAsOfDate = toDateOnly(asOfDate);
  const p = normalizedAsOfDate
    ? `?as_of_date=${encodeURIComponent(normalizedAsOfDate)}`
    : '';
  return apiService.get<BalanceSheetResponse>(
    `${base}/reports/balance-sheet${p}`,
  );
}

export async function getAccountReceivablesList(): Promise<AccountReceivablesListResponse> {
  return apiService.get<AccountReceivablesListResponse>(
    `${base}/account-receivables`,
  );
}

export type ProfitLossDashboardRaw = Record<string, unknown>;

export async function getProfitLossDashboard(params: {
  period: string;
  startDate?: string;
  endDate?: string;
}): Promise<ProfitLossDashboardRaw> {
  const p = new URLSearchParams();
  p.append('period', params.period);
  if (params.startDate) p.append('start_date', params.startDate);
  if (params.endDate) p.append('end_date', params.endDate);
  return apiService.get<ProfitLossDashboardRaw>(
    `${base}/profit-loss-dashboard?${p.toString()}`,
  );
}
