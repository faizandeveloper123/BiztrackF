import type {
  LedgerTransactionResponse,
  ChartOfAccountsResponse,
  TransactionType,
} from "@/src/models/ledger";

export type CurrencyFormatter = (
  amount: number,
  customCurrency?: string,
) => string;

export interface LedgerTransactionFormData {
  transaction_date: string;
  transaction_type: TransactionType;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  currency: string;
  reference_number: string;
  description: string;
  notes: string;
  tags: string[];
}

export interface LedgerTransactionsHeaderProps {
  onExport: () => void;
  onAddTransaction?: () => void;
}

export interface LedgerSummaryCardsProps {
  transactions: LedgerTransactionResponse[];
  formatCurrency: CurrencyFormatter;
}

export interface LedgerTransactionFiltersProps {
  accounts: ChartOfAccountsResponse[] | undefined;
  searchTerm: string;
  selectedType: string;
  selectedStatus: string;
  selectedAccount: string;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export interface LedgerTransactionsTableProps {
  transactions: LedgerTransactionResponse[];
  accounts: ChartOfAccountsResponse[] | undefined;
  formatCurrency: CurrencyFormatter;
  onView: (transaction: LedgerTransactionResponse) => void;
  onEdit?: (transaction: LedgerTransactionResponse) => void;
  onDelete?: (transaction: LedgerTransactionResponse) => void;
}

export interface LedgerTransactionFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  accounts: ChartOfAccountsResponse[] | undefined;
  formData: LedgerTransactionFormData;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: LedgerTransactionFormData) => void;
  onSubmit: () => void;
}

export interface LedgerTransactionViewDialogProps {
  transaction: LedgerTransactionResponse | null;
  accounts: ChartOfAccountsResponse[] | undefined;
  formatCurrency: CurrencyFormatter;
  onClose: () => void;
}

export interface LedgerTransactionDeleteDialogProps {
  transaction: LedgerTransactionResponse | null;
  open: boolean;
  isDeleting: boolean;
  formatCurrency: CurrencyFormatter;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
