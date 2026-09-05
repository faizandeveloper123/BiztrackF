import { apiService } from "./ApiService";
import { extractErrorMessage } from "../utils/errorUtils";
import {
  ChartOfAccountsCreate,
  ChartOfAccountsUpdate,
  ChartOfAccountsResponse,
  LedgerTransactionCreate,
  LedgerTransactionUpdate,
  LedgerTransactionResponse,
  JournalEntryCreate,
  JournalEntryUpdate,
  JournalEntryResponse,
  FinancialPeriodCreate,
  FinancialPeriodUpdate,
  FinancialPeriodResponse,
  BudgetCreate,
  BudgetUpdate,
  BudgetResponse,
  BudgetItemCreate,
  BudgetItemUpdate,
  BudgetItemResponse,
  TrialBalanceResponse,
  IncomeStatementResponse,
  BalanceSheetResponse,
  TransactionType,
  AccountType,
  AccountCategory,
  ProfitLossDashboard,
} from "../models/ledger";

export class LedgerService {
  // Chart of Accounts
  static async createChartOfAccounts(
    data: ChartOfAccountsCreate,
  ): Promise<ChartOfAccountsResponse> {
    const response = await apiService.post("/ledger/chart-of-accounts", data);
    return response;
  }

  static async getChartOfAccounts(
    skip: number = 0,
    limit: number = 1000,
    accountType?: AccountType,
    accountCategory?: AccountCategory,
  ): Promise<ChartOfAccountsResponse[]> {
    const params = new URLSearchParams();
    if (skip > 0) params.append("skip", skip.toString());
    if (limit !== 1000) params.append("limit", limit.toString());
    if (accountType) params.append("account_type", accountType);
    if (accountCategory) params.append("account_category", accountCategory);

    const response = await apiService.get(
      `/ledger/chart-of-accounts?${params.toString()}`,
    );
    return response || [];
  }

  static async getChartOfAccountsById(
    id: string,
  ): Promise<ChartOfAccountsResponse> {
    const response = await apiService.get(`/ledger/chart-of-accounts/${id}`);
    return response;
  }

  static async updateChartOfAccounts(
    id: string,
    data: ChartOfAccountsUpdate,
  ): Promise<ChartOfAccountsResponse> {
    const response = await apiService.put(
      `/ledger/chart-of-accounts/${id}`,
      data,
    );
    return response;
  }

  static async deleteChartOfAccounts(id: string): Promise<void> {
    await apiService.delete(`/ledger/chart-of-accounts/${id}`);
  }

  // Ledger Transactions
  static async createLedgerTransaction(
    data: LedgerTransactionCreate,
  ): Promise<LedgerTransactionResponse> {
    const response = await apiService.post("/ledger/transactions", data);
    return response;
  }

  static async getLedgerTransactions(
    skip: number = 0,
    limit: number = 100,
    transactionType?: TransactionType,
    accountId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<LedgerTransactionResponse[]> {
    const params = new URLSearchParams();
    if (skip > 0) params.append("skip", skip.toString());
    if (limit !== 100) params.append("limit", limit.toString());
    if (transactionType) params.append("transaction_type", transactionType);
    if (accountId) params.append("account_id", accountId);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await apiService.get(
      `/ledger/transactions?${params.toString()}`,
    );
    return response || [];
  }

  static async getLedgerTransactionById(
    id: string,
  ): Promise<LedgerTransactionResponse> {
    const response = await apiService.get(`/ledger/transactions/${id}`);
    return response;
  }

  static async updateLedgerTransaction(
    id: string,
    data: LedgerTransactionUpdate,
  ): Promise<LedgerTransactionResponse> {
    const response = await apiService.put(`/ledger/transactions/${id}`, data);
    return response;
  }

  static async deleteLedgerTransaction(id: string): Promise<void> {
    await apiService.delete(`/ledger/transactions/${id}`);
  }

  // Journal Entries
  static async createJournalEntry(
    data: JournalEntryCreate,
  ): Promise<JournalEntryResponse> {
    const response = await apiService.post("/ledger/journal-entries", data);
    return response;
  }

  static async getJournalEntries(
    skip: number = 0,
    limit: number = 100,
    status?: string,
  ): Promise<JournalEntryResponse[]> {
    const params = new URLSearchParams();
    if (skip > 0) params.append("skip", skip.toString());
    if (limit !== 100) params.append("limit", limit.toString());
    if (status) params.append("status", status);

    const response = await apiService.get(
      `/ledger/journal-entries?${params.toString()}`,
    );
    return response || [];
  }

  static async getJournalEntryById(id: string): Promise<JournalEntryResponse> {
    const response = await apiService.get(`/ledger/journal-entries/${id}`);
    return response;
  }

  static async updateJournalEntry(
    id: string,
    data: JournalEntryUpdate,
  ): Promise<JournalEntryResponse> {
    const response = await apiService.put(
      `/ledger/journal-entries/${id}`,
      data,
    );
    return response;
  }

  static async deleteJournalEntry(id: string): Promise<void> {
    await apiService.delete(`/ledger/journal-entries/${id}`);
  }

  static async postJournalEntry(id: string): Promise<JournalEntryResponse> {
    const response = await apiService.post(
      `/ledger/journal-entries/${id}/post`,
    );
    return response;
  }

  // Financial Reports
  static async getTrialBalance(
    asOfDate?: string,
  ): Promise<TrialBalanceResponse> {
    const params = new URLSearchParams();
    if (asOfDate) params.append("as_of_date", asOfDate);

    const response = await apiService.get(
      `/ledger/reports/trial-balance?${params.toString()}`,
    );
    return response;
  }

  static async getIncomeStatement(
    startDate?: string,
    endDate?: string,
  ): Promise<IncomeStatementResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await apiService.get(
      `/ledger/reports/income-statement?${params.toString()}`,
    );
    return response;
  }

  static async getBalanceSheet(
    asOfDate?: string,
  ): Promise<BalanceSheetResponse> {
    const params = new URLSearchParams();
    if (asOfDate) params.append("as_of_date", asOfDate);

    const response = await apiService.get(
      `/ledger/reports/balance-sheet?${params.toString()}`,
    );
    return response;
  }

  // Account Balance
  static async getAccountBalance(
    accountId: string,
    asOfDate?: string,
  ): Promise<{
    account_id: string;
    as_of_date: string;
    balance: number;
  }> {
    const params = new URLSearchParams();
    if (asOfDate) params.append("as_of_date", asOfDate);

    const response = await apiService.get(
      `/ledger/accounts/${accountId}/balance?${params.toString()}`,
    );
    return response;
  }

  // Budgets
  static async createBudget(data: BudgetCreate): Promise<BudgetResponse> {
    const response = await apiService.post("/ledger/budgets", data);
    return response;
  }

  static async getBudgets(
    skip: number = 0,
    limit: number = 100,
    activeOnly: boolean = false,
  ): Promise<BudgetResponse[]> {
    const params = new URLSearchParams();
    if (skip > 0) params.append("skip", skip.toString());
    if (limit !== 100) params.append("limit", limit.toString());
    if (activeOnly) params.append("active_only", "true");

    const response = await apiService.get(
      `/ledger/budgets?${params.toString()}`,
    );
    return response || [];
  }

  static async getBudgetById(id: string): Promise<BudgetResponse> {
    const response = await apiService.get(`/ledger/budgets/${id}`);
    return response;
  }

  static async updateBudget(
    id: string,
    data: BudgetUpdate,
  ): Promise<BudgetResponse> {
    const response = await apiService.put(`/ledger/budgets/${id}`, data);
    return response;
  }

  static async deleteBudget(id: string): Promise<void> {
    await apiService.delete(`/ledger/budgets/${id}`);
  }

  // Budget Items
  static async createBudgetItem(
    data: BudgetItemCreate,
  ): Promise<BudgetItemResponse> {
    const response = await apiService.post("/ledger/budget-items", data);
    return response;
  }

  static async getBudgetItemsByBudget(
    budgetId: string,
  ): Promise<BudgetItemResponse[]> {
    const response = await apiService.get(`/ledger/budgets/${budgetId}/items`);
    return response;
  }

  static async updateBudgetItem(
    id: string,
    data: BudgetItemUpdate,
  ): Promise<BudgetItemResponse> {
    const response = await apiService.put(`/ledger/budget-items/${id}`, data);
    return response;
  }

  static async deleteBudgetItem(id: string): Promise<void> {
    await apiService.delete(`/ledger/budget-items/${id}`);
  }

  // Financial Periods
  static async createFinancialPeriod(
    data: FinancialPeriodCreate,
  ): Promise<FinancialPeriodResponse> {
    const response = await apiService.post("/ledger/financial-periods", data);
    return response;
  }

  static async getFinancialPeriods(
    skip: number = 0,
    limit: number = 100,
  ): Promise<FinancialPeriodResponse[]> {
    const params = new URLSearchParams();
    if (skip > 0) params.append("skip", skip.toString());
    if (limit !== 100) params.append("limit", limit.toString());

    const response = await apiService.get(
      `/ledger/financial-periods?${params.toString()}`,
    );
    return response;
  }

  static async getFinancialPeriodById(
    id: string,
  ): Promise<FinancialPeriodResponse> {
    const response = await apiService.get(`/ledger/financial-periods/${id}`);
    return response;
  }

  static async updateFinancialPeriod(
    id: string,
    data: FinancialPeriodUpdate,
  ): Promise<FinancialPeriodResponse> {
    const response = await apiService.put(
      `/ledger/financial-periods/${id}`,
      data,
    );
    return response;
  }

  static async deleteFinancialPeriod(id: string): Promise<void> {
    return await apiService.delete(`/ledger/financial-periods/${id}`);
  }

  static async closeFinancialPeriod(
    id: string,
  ): Promise<FinancialPeriodResponse> {
    const response = await apiService.post(
      `/ledger/financial-periods/${id}/close`,
    );
    return response;
  }

  // Utility methods
  static async getChartOfAccountsByType(
    accountType: AccountType,
  ): Promise<ChartOfAccountsResponse[]> {
    return this.getChartOfAccounts(0, 1000, accountType);
  }

  static async getChartOfAccountsByCategory(
    accountCategory: AccountCategory,
  ): Promise<ChartOfAccountsResponse[]> {
    return this.getChartOfAccounts(0, 1000, undefined, accountCategory);
  }

  static async getLedgerTransactionsByType(
    transactionType: TransactionType,
    skip: number = 0,
    limit: number = 100,
  ): Promise<LedgerTransactionResponse[]> {
    return this.getLedgerTransactions(skip, limit, transactionType);
  }

  static async getLedgerTransactionsByAccount(
    accountId: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<LedgerTransactionResponse[]> {
    return this.getLedgerTransactions(skip, limit, undefined, accountId);
  }

  static async getLedgerTransactionsByDateRange(
    startDate: string,
    endDate: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<LedgerTransactionResponse[]> {
    return this.getLedgerTransactions(
      skip,
      limit,
      undefined,
      undefined,
      startDate,
      endDate,
    );
  }

  static async getJournalEntriesByStatus(
    status: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<JournalEntryResponse[]> {
    return this.getJournalEntries(skip, limit, status);
  }

  static async getActiveBudgets(): Promise<BudgetResponse[]> {
    return this.getBudgets(0, 1000, true);
  }

  // Test seeding endpoint
  static async testSeedEndpoint(): Promise<any> {
    try {
      const response = await apiService.post("/ledger/seed-accounts-simple");
      return response;
    } catch (error: any) {
      const errorMessage = extractErrorMessage(
        error,
        "Failed to seed accounts",
      );
      throw new Error(errorMessage);
    }
  }

  // Profit/Loss Dashboard
  static async getProfitLossDashboard(
    period: string = "month",
    startDate?: string,
    endDate?: string,
  ): Promise<ProfitLossDashboard> {
    const params = new URLSearchParams();
    params.append("period", period);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await apiService.get(
      `/ledger/profit-loss-dashboard?${params.toString()}`,
    );
    return response;
  }

  static async sendProfitLossReportEmail(
    period: string = "month",
    startDate: string | undefined,
    endDate: string | undefined,
    toEmail: string,
    message?: string,
  ): Promise<{ message: string; warning?: string }> {
    const params = new URLSearchParams();
    params.append("period", period);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const body: any = { to_email: toEmail };
    if (message) {
      body.message = message;
    }

    const response = await apiService.post(
      `/ledger/profit-loss-dashboard/send-email?${params.toString()}`,
      body,
    );
    return response;
  }

  static async sendProfitLossReportWhatsApp(
    period: string = "month",
    startDate: string | undefined,
    endDate: string | undefined,
    phoneNumber: string,
  ): Promise<{
    whatsapp_url: string;
    phone_number: string;
    formatted_message: string;
  }> {
    const params = new URLSearchParams();
    params.append("period", period);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await apiService.post(
      `/ledger/profit-loss-dashboard/send-whatsapp?${params.toString()}`,
      { phone_number: phoneNumber },
    );
    return response;
  }
}
