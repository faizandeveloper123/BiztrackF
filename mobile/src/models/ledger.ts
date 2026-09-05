export interface AccountReceivable {
  id: string;
  tenant_id: string;
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  due_date: string;
  invoice_date: string;
  invoice_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  currency: string;
  status: AccountReceivableStatus;
  payment_terms?: string;
  notes?: string;
  days_overdue: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccountReceivableCreate {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  due_date: string;
  invoice_date: string;
  invoice_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  currency?: string;
  status?: AccountReceivableStatus;
  payment_terms?: string;
  notes?: string;
  days_overdue?: number;
}

export interface AccountReceivableUpdate {
  invoice_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  due_date?: string;
  amount_paid?: number;
  outstanding_balance?: number;
  status?: AccountReceivableStatus;
  payment_terms?: string;
  notes?: string;
  days_overdue?: number;
}

export enum AccountReceivableStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
}

export interface AccountReceivablesListResponse {
  account_receivables: AccountReceivable[];
  total: number;
  total_outstanding: number;
  total_overdue: number;
}

export const getAccountReceivableStatusLabel = (status: AccountReceivableStatus): string => {
  const labels = {
    [AccountReceivableStatus.PENDING]: 'Pending',
    [AccountReceivableStatus.PARTIALLY_PAID]: 'Partially Paid',
    [AccountReceivableStatus.PAID]: 'Paid',
    [AccountReceivableStatus.OVERDUE]: 'Overdue',
    [AccountReceivableStatus.WRITTEN_OFF]: 'Written Off',
  };
  return labels[status] || status;
};

export const getAccountReceivableStatusColor = (status: AccountReceivableStatus): string => {
  const colors = {
    [AccountReceivableStatus.PENDING]: 'text-yellow-600',
    [AccountReceivableStatus.PARTIALLY_PAID]: 'text-blue-600',
    [AccountReceivableStatus.PAID]: 'text-green-600',
    [AccountReceivableStatus.OVERDUE]: 'text-red-600',
    [AccountReceivableStatus.WRITTEN_OFF]: 'text-gray-600',
  };
  return colors[status] || '';
};

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum TransactionType {
  GENERAL = 'general',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  JOURNAL = 'journal',
  ADJUSTMENT = 'adjustment',
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  REFUND = 'refund',
}

export enum TransactionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  POSTED = 'posted',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum AccountCategory {
  CURRENT_ASSET = 'current_asset',
  FIXED_ASSET = 'fixed_asset',
  CURRENT_LIABILITY = 'current_liability',
  LONG_TERM_LIABILITY = 'long_term_liability',
  EQUITY = 'equity',
  OPERATING_REVENUE = 'operating_revenue',
  NON_OPERATING_REVENUE = 'non_operating_revenue',
  OPERATING_EXPENSE = 'operating_expense',
  NON_OPERATING_EXPENSE = 'non_operating_expense',
}

export interface ChartOfAccountsCreate {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_category: AccountCategory;
  parent_account_id?: string;
  description?: string;
  is_active?: boolean;
}

export interface ChartOfAccountsUpdate {
  account_code?: string;
  account_name?: string;
  account_type?: AccountType;
  account_category?: AccountCategory;
  parent_account_id?: string;
  description?: string;
  is_active?: boolean;
}

export interface ChartOfAccountsResponse {
  id: string;
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  account_category: AccountCategory;
  parent_account_id?: string;
  description?: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransactionCreate {
  description: string;
  amount: number;
  account_id: string;
  contra_account_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  reference_number?: string;
  status?: TransactionStatus;
  meta_data?: Record<string, any>;
}

export interface LedgerTransactionUpdate {
  description?: string;
  amount?: number;
  account_id?: string;
  contra_account_id?: string;
  transaction_date?: string;
  transaction_type?: TransactionType;
  reference_number?: string;
  status?: TransactionStatus;
  meta_data?: Record<string, any>;
}

export interface LedgerTransactionResponse {
  id: string;
  tenant_id: string;
  transaction_number: string;
  description: string;
  amount: number;
  account_id: string;
  contra_account_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  reference_number?: string;
  meta_data?: Record<string, any>;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  entry_number?: string;
  description: string;
  entry_date: string;
  reference_number?: string;
}

export interface JournalEntryUpdate {
  entry_number?: string;
  description?: string;
  entry_date?: string;
  reference_number?: string;
  status?: TransactionStatus;
}

export interface JournalEntryResponse {
  id: string;
  tenant_id: string;
  entry_number: string;
  description: string;
  entry_date: string;
  reference_number?: string;
  status: TransactionStatus;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialPeriodCreate {
  period_name: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface FinancialPeriodUpdate {
  period_name?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_closed?: boolean;
}

export interface FinancialPeriodResponse {
  id: string;
  tenant_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  description?: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreate {
  budget_name: string;
  budget_type: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  description?: string;
}

export interface BudgetUpdate {
  budget_name?: string;
  budget_type?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  description?: string;
  is_active?: boolean;
}

export interface BudgetResponse {
  id: string;
  tenant_id: string;
  budget_name: string;
  budget_type: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  spent_amount: number;
  remaining_amount: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetItemCreate {
  budget_id: string;
  account_id: string;
  allocated_amount: number;
  description?: string;
}

export interface BudgetItemUpdate {
  account_id?: string;
  allocated_amount?: number;
  spent_amount?: number;
  description?: string;
}

export interface BudgetItemResponse {
  id: string;
  tenant_id: string;
  budget_id: string;
  account_id: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TrialBalanceAccount {
  account_id: string;
  account_code: string;
  account_name: string;
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalanceResponse {
  as_of_date: string;
  accounts: TrialBalanceAccount[];
}

export interface IncomeStatementResponse {
  start_date: string;
  end_date: string;
  revenue: number;
  expenses: number;
  net_income: number;
}

export interface BalanceSheetResponse {
  as_of_date: string;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

export interface ProfitLossPeriodData {
  month: string;
  revenue: number;
  expenses: number;
  net_income: number;
}

export interface ProfitLossDashboard {
  period: string;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  start_date?: string;
  end_date?: string;
  summary?: {
    total_sales: number;
    total_purchases: number;
    inventory_value: number;
    net_profit: number;
    profit_after_investment: number;
    total_investments: number;
  };
  sales?: {
    total_invoices: number;
    paid_invoices: number;
    pending_invoices: number;
    overdue_invoices: number;
    total_payments_received: number;
  };
  purchases?: {
    total_purchase_orders: number;
    completed_purchases: number;
    pending_purchases: number;
    total_purchases: number;
  };
  inventory?: {
    total_products: number;
    total_inventory_value: number;
    inbound_movements: number;
    outbound_movements: number;
  };
  quotes_contracts?: {
    total_quotes: number;
    quotes_value: number;
    total_contracts: number;
    contracts_value: number;
  };
  daily_breakdown?: Array<{
    date: string;
    revenue: number;
    expenses: number;
    net_income: number;
  }>;
  monthly_breakdown?: ProfitLossPeriodData[];
}

export enum ProfitLossPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export const getAccountTypeLabel = (type: AccountType): string => {
  const labels = {
    [AccountType.ASSET]: 'Asset',
    [AccountType.LIABILITY]: 'Liability',
    [AccountType.EQUITY]: 'Equity',
    [AccountType.REVENUE]: 'Revenue',
    [AccountType.EXPENSE]: 'Expense',
  };
  return labels[type] || type;
};

export const getTransactionTypeLabel = (type: TransactionType): string => {
  const labels: Record<TransactionType, string> = {
    [TransactionType.GENERAL]: 'General',
    [TransactionType.PAYMENT]: 'Payment',
    [TransactionType.RECEIPT]: 'Receipt',
    [TransactionType.JOURNAL]: 'Journal',
    [TransactionType.ADJUSTMENT]: 'Adjustment',
    [TransactionType.INCOME]: 'Income',
    [TransactionType.EXPENSE]: 'Expense',
    [TransactionType.TRANSFER]: 'Transfer',
    [TransactionType.REFUND]: 'Refund',
  };
  return labels[type] || type;
};

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.DRAFT]: 'Draft',
    [TransactionStatus.PENDING]: 'Pending',
    [TransactionStatus.POSTED]: 'Posted',
    [TransactionStatus.CANCELLED]: 'Cancelled',
    [TransactionStatus.COMPLETED]: 'Completed',
    [TransactionStatus.FAILED]: 'Failed',
  };
  return labels[status] || status;
};

export const getAccountTypeColor = (type: AccountType): string => {
  const colors = {
    [AccountType.ASSET]: 'text-blue-600',
    [AccountType.LIABILITY]: 'text-red-600',
    [AccountType.EQUITY]: 'text-green-600',
    [AccountType.REVENUE]: 'text-yellow-600',
    [AccountType.EXPENSE]: 'text-orange-600',
  };
  return colors[type] || '';
};

export const getProfitLossPeriodLabel = (period: ProfitLossPeriod): string => {
  const labels: Record<ProfitLossPeriod, string> = {
    [ProfitLossPeriod.DAY]: 'Daily',
    [ProfitLossPeriod.WEEK]: 'Weekly',
    [ProfitLossPeriod.MONTH]: 'Monthly',
    [ProfitLossPeriod.QUARTER]: 'Quarterly',
    [ProfitLossPeriod.YEAR]: 'Yearly',
  };
  return labels[period] || period;
};
