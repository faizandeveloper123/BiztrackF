import type {
  BankingDashboard,
  BankAccount,
  BankTransaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@/src/models/banking";

export type CurrencyFormatter = (
  amount: number,
  customCurrency?: string,
) => string;

export interface TransactionFormData {
  bank_account_id: string;
  transaction_date: string;
  value_date: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  external_reference: string;
  check_number: string;
  description: string;
  memo: string;
  category: string;
  counterparty_name: string;
  counterparty_account: string;
  counterparty_bank: string;
  is_reconciled: boolean;
  related_invoice_id: string;
  related_purchase_order_id: string;
  related_expense_id: string;
  tags: string[];
  notes: string;
}

export interface TransactionPageHeaderProps {
  onAddTransaction: () => void;
}

export interface TransactionFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  bankAccounts: BankAccount[];
  formData: TransactionFormData;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: TransactionFormData) => void;
  onSubmit: () => void;
}

export interface TransactionFiltersProps {
  bankAccounts: BankAccount[];
  searchTerm: string;
  selectedAccount: string;
  selectedType: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export interface TransactionsTableProps {
  transactions: BankTransaction[];
  bankAccounts: BankAccount[];
  formatCurrency: CurrencyFormatter;
  isDeleting: boolean;
  onView: (transaction: BankTransaction) => void;
  onEdit?: (transaction: BankTransaction) => void;
  onReconcile: (transactionId: string) => void;
  onUnreconcile: (transactionId: string) => void;
  onDelete?: (transaction: BankTransaction) => void;
}

export interface TransactionViewDialogProps {
  transaction: BankTransaction | null;
  bankAccounts: BankAccount[];
  formatCurrency: CurrencyFormatter;
  onClose: () => void;
  onEdit?: (transaction: BankTransaction) => void;
}

export interface TransactionDeleteDialogProps {
  transaction: BankTransaction | null;
  open: boolean;
  isDeleting: boolean;
  formatCurrency: CurrencyFormatter;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export interface BankingDashboardHeaderProps {
  activeTab: string;
  refreshing: boolean;
  onRefresh: () => void;
  onAddAccount: () => void;
}

export interface BankingSummaryCardsProps {
  dashboardData: BankingDashboard | null;
  formatCurrency: CurrencyFormatter;
}

export interface BankingMetricsCardsProps {
  dashboardData: BankingDashboard | null;
  formatCurrency: CurrencyFormatter;
}

export interface BankAccountsListProps {
  accounts: BankAccount[];
  formatCurrency: CurrencyFormatter;
  onView: (account: BankAccount) => void;
}

export interface RecentTransactionsTableProps {
  transactions: BankTransaction[];
  bankAccounts: BankAccount[];
  formatCurrency: CurrencyFormatter;
  onViewAll: () => void;
}

export interface BankAccountViewDialogProps {
  account: BankAccount | null;
  formatCurrency: CurrencyFormatter;
  onClose: () => void;
  footerActionLabel?: string;
  onFooterAction?: () => void;
}
