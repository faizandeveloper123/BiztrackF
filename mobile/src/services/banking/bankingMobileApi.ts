import { apiService } from '../ApiService';
import type {
  BankAccount,
  BankAccountCreate,
  BankAccountUpdate,
  BankTransaction,
  BankTransactionCreate,
  BankTransactionUpdate,
  BankingDashboard,
  CashPosition,
  ReconciliationSummary,
  Till,
  TillCreate,
  TillUpdate,
  TransactionReconciliation,
  TransactionStatus,
  TransactionType,
} from '../../models/banking';

const baseUrl = '/banking';

function pickAccounts(res: unknown): BankAccount[] {
  const r = res as { bankAccounts?: BankAccount[]; bank_accounts?: BankAccount[] };
  return r.bankAccounts ?? r.bank_accounts ?? [];
}

function pickAccount(res: unknown): BankAccount {
  const r = res as { bankAccount?: BankAccount; bank_account?: BankAccount };
  return (r.bankAccount ?? r.bank_account) as BankAccount;
}

function pickTransactions(res: unknown): BankTransaction[] {
  const r = res as {
    bankTransactions?: BankTransaction[];
    bank_transactions?: BankTransaction[];
  };
  return r.bankTransactions ?? r.bank_transactions ?? [];
}

function pickTransaction(res: unknown): BankTransaction {
  const r = res as {
    bankTransaction?: BankTransaction;
    bank_transaction?: BankTransaction;
  };
  return (r.bankTransaction ?? r.bank_transaction) as BankTransaction;
}

function pickTills(res: unknown): Till[] {
  const r = res as { tills?: Till[] };
  return r.tills ?? [];
}

function buildDashboardFromData(
  accounts: BankAccount[],
  transactions: BankTransaction[],
): BankingDashboard {
  const totalBankBalance = accounts.reduce(
    (sum, account) => sum + (account.currentBalance || 0),
    0,
  );
  const totalAvailableBalance = accounts.reduce(
    (sum, account) => sum + (account.availableBalance || 0),
    0,
  );
  const totalPendingBalance = accounts.reduce(
    (sum, account) => sum + (account.pendingBalance || 0),
    0,
  );
  const pendingTransactionsCount = transactions.filter((t) => {
    const status = String(t.status || '').toLowerCase();
    return status === 'pending' || status === 'processing';
  }).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayTransactions = transactions.filter((t) =>
    String(t.transactionDate || '').slice(0, 10) === today,
  );
  const inflowTypes = new Set(['deposit', 'transfer_in', 'refund', 'interest']);
  const outflowTypes = new Set(['withdrawal', 'transfer_out', 'payment', 'fee']);
  const dailyInflow = todayTransactions
    .filter((t) => inflowTypes.has(String(t.transactionType || '').toLowerCase()))
    .reduce((sum, t) => sum + Math.abs(Number(t.baseAmount ?? t.amount ?? 0)), 0);
  const dailyOutflow = todayTransactions
    .filter((t) => outflowTypes.has(String(t.transactionType || '').toLowerCase()))
    .reduce((sum, t) => sum + Math.abs(Number(t.baseAmount ?? t.amount ?? 0)), 0);
  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(String(b.transactionDate || 0)).getTime() -
        new Date(String(a.transactionDate || 0)).getTime(),
    )
    .slice(0, 10);

  return {
    totalBankBalance,
    totalAvailableBalance,
    totalPendingBalance,
    pendingTransactionsCount,
    dailyInflow,
    dailyOutflow,
    netCashFlow: dailyInflow - dailyOutflow,
    outstandingReceivables: 0,
    outstandingPayables: 0,
    recentTransactions,
    bankAccountsSummary: accounts.map((account) => ({
      id: account.id,
      name: account.accountName,
      bankName: account.bankName,
      accountType: account.accountType,
      currentBalance: account.currentBalance || 0,
      availableBalance: account.availableBalance || 0,
      pendingBalance: account.pendingBalance || 0,
    })),
  };
}

export async function getBankingDashboard(): Promise<BankingDashboard> {
  try {
    const res = await apiService.get<BankingDashboard>(`${baseUrl}/dashboard`);
    return res;
  } catch {
    const [accountsRes, transactionsRes] = await Promise.all([
      apiService.get<unknown>(`${baseUrl}/accounts?active_only=true`),
      apiService.get<unknown>(`${baseUrl}/transactions?skip=0&limit=100`),
    ]);
    const accounts = pickAccounts(accountsRes);
    const transactions = pickTransactions(transactionsRes);
    return buildDashboardFromData(accounts, transactions);
  }
}

export async function getBankAccounts(activeOnly = false): Promise<BankAccount[]> {
  const q = activeOnly ? '?active_only=true' : '';
  const res = await apiService.get<unknown>(`${baseUrl}/accounts${q}`);
  return pickAccounts(res);
}

export async function createBankAccount(
  body: BankAccountCreate,
): Promise<BankAccount> {
  const res = await apiService.post<unknown>(`${baseUrl}/accounts`, body);
  return pickAccount(res);
}

export async function updateBankAccount(
  id: string,
  body: BankAccountUpdate,
): Promise<BankAccount> {
  const res = await apiService.put<unknown>(`${baseUrl}/accounts/${id}`, body);
  return pickAccount(res);
}

export async function deleteBankAccount(id: string): Promise<void> {
  await apiService.delete(`${baseUrl}/accounts/${id}`);
}

export async function getBankTransactions(params?: {
  skip?: number;
  limit?: number;
  accountId?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}): Promise<BankTransaction[]> {
  const p = new URLSearchParams();
  if (params?.skip !== undefined) p.append('skip', String(params.skip));
  if (params?.limit !== undefined) p.append('limit', String(params.limit));
  if (params?.accountId) p.append('account_id', params.accountId);
  if (params?.transactionType) {
    p.append('transaction_type', params.transactionType);
  }
  if (params?.status) p.append('status', params.status);
  if (params?.startDate) p.append('start_date', params.startDate);
  if (params?.endDate) p.append('end_date', params.endDate);
  const qs = p.toString();
  const res = await apiService.get<unknown>(
    `${baseUrl}/transactions${qs ? `?${qs}` : ''}`,
  );
  return pickTransactions(res);
}

export async function createBankTransaction(
  body: BankTransactionCreate,
): Promise<BankTransaction> {
  const res = await apiService.post<unknown>(
    `${baseUrl}/transactions`,
    body,
  );
  return pickTransaction(res);
}

export async function updateBankTransaction(
  id: string,
  body: BankTransactionUpdate,
): Promise<BankTransaction> {
  const res = await apiService.put<unknown>(
    `${baseUrl}/transactions/${id}`,
    body,
  );
  return pickTransaction(res);
}

export async function deleteBankTransaction(id: string): Promise<void> {
  await apiService.delete(`${baseUrl}/transactions/${id}`);
}

export async function reconcileTransaction(
  transactionId: string,
  notes?: string,
): Promise<void> {
  const payload: TransactionReconciliation = {
    is_reconciled: true,
    notes: notes?.trim() || undefined,
  };
  await apiService.post(
    `${baseUrl}/transactions/${transactionId}/reconcile`,
    payload,
  );
}

function pickReconciliationSummary(res: unknown): ReconciliationSummary {
  const r = res as Record<string, unknown>;
  return {
    totalTransactions: Number(r.totalTransactions ?? r.total_transactions ?? 0),
    reconciledTransactions: Number(
      r.reconciledTransactions ?? r.reconciled_transactions ?? 0,
    ),
    unreconciledTransactions: Number(
      r.unreconciledTransactions ?? r.unreconciled_transactions ?? 0,
    ),
    reconciliationPercentage: Number(
      r.reconciliationPercentage ?? r.reconciliation_percentage ?? 0,
    ),
    lastReconciliationDate:
      (r.lastReconciliationDate ?? r.last_reconciliation_date) as
        | string
        | undefined,
  };
}

export async function getReconciliationSummary(): Promise<ReconciliationSummary> {
  const res = await apiService.get<unknown>(
    `${baseUrl}/reconciliation/summary`,
  );
  return pickReconciliationSummary(res);
}

export async function getLatestCashPosition(): Promise<CashPosition> {
  const res = await apiService.get<{ cashPosition?: CashPosition }>(
    `${baseUrl}/cash-position`,
  );
  return res.cashPosition as CashPosition;
}

export async function getTills(limit = 100): Promise<Till[]> {
  const res = await apiService.get<unknown>(
    `${baseUrl}/tills?skip=0&limit=${limit}`,
  );
  return pickTills(res);
}

export async function createTill(body: TillCreate): Promise<Till> {
  const res = await apiService.post<{ till?: Till }>(`${baseUrl}/tills`, body);
  return res.till as Till;
}

export async function updateTill(id: string, body: TillUpdate): Promise<Till> {
  const res = await apiService.put<{ till?: Till }>(
    `${baseUrl}/tills/${id}`,
    body,
  );
  return res.till as Till;
}

export async function deleteTill(id: string): Promise<void> {
  await apiService.delete(`${baseUrl}/tills/${id}`);
}
