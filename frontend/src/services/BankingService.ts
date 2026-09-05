import { apiService } from "./ApiService";
import {
  BankAccount,
  BankAccountCreate,
  BankAccountUpdate,
  BankTransaction,
  BankTransactionCreate,
  BankTransactionUpdate,
  BankTransactionResponse,
  BankTransactionsResponse,
  CashPosition,
  CashPositionResponse,
  BankingDashboard,
  ReconciliationSummary,
  TransactionReconciliation,
  AccountBalance,
  TransactionType,
  TransactionStatus,
} from "../models/banking";

class BankingService {
  private baseUrl = "/banking";

  // Bank Account Methods
  async createBankAccount(account: BankAccountCreate): Promise<BankAccount> {
    const response = await apiService.post<any>(
      `${this.baseUrl}/accounts`,
      account,
    );
    const result = response.bankAccount;
    return result;
  }

  async getBankAccounts(activeOnly: boolean = false): Promise<BankAccount[]> {
    const params = activeOnly ? "?active_only=true" : "";
    const response = await apiService.get<any>(
      `${this.baseUrl}/accounts${params}`,
    );
    const accounts = response?.bankAccounts || [];
    return accounts;
  }

  async getBankAccount(accountId: string): Promise<BankAccount> {
    const response = await apiService.get<any>(
      `${this.baseUrl}/accounts/${accountId}`,
    );
    return response.bankAccount;
  }

  async updateBankAccount(
    accountId: string,
    account: BankAccountUpdate,
  ): Promise<BankAccount> {
    const response = await apiService.put<any>(
      `${this.baseUrl}/accounts/${accountId}`,
      account,
    );
    return response.bankAccount;
  }

  async deleteBankAccount(accountId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/accounts/${accountId}`);
  }

  async getAccountBalance(
    accountId: string,
    asOfDate?: string,
  ): Promise<AccountBalance> {
    const params = asOfDate ? `?as_of_date=${asOfDate}` : "";
    return await apiService.get<AccountBalance>(
      `${this.baseUrl}/accounts/${accountId}/balance${params}`,
    );
  }

  // Bank Transaction Methods
  async createBankTransaction(
    transaction: BankTransactionCreate,
  ): Promise<BankTransaction> {
    const response = await apiService.post<BankTransactionResponse>(
      `${this.baseUrl}/transactions`,
      transaction,
    );
    return response.bankTransaction;
  }

  async getBankTransactions(params?: {
    skip?: number;
    limit?: number;
    accountId?: string;
    transactionType?: TransactionType;
    status?: TransactionStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<BankTransaction[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined)
      queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.accountId) queryParams.append("account_id", params.accountId);
    if (params?.transactionType)
      queryParams.append("transaction_type", params.transactionType);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("start_date", params.startDate);
    if (params?.endDate) queryParams.append("end_date", params.endDate);

    const queryString = queryParams.toString();
    const url = `${this.baseUrl}/transactions${queryString ? `?${queryString}` : ""}`;

    const response = await apiService.get<BankTransactionsResponse>(url);
    return response.bankTransactions;
  }

  async getBankTransaction(transactionId: string): Promise<BankTransaction> {
    const response = await apiService.get<BankTransactionResponse>(
      `${this.baseUrl}/transactions/${transactionId}`,
    );
    return response.bankTransaction;
  }

  async updateBankTransaction(
    transactionId: string,
    transaction: BankTransactionUpdate,
  ): Promise<BankTransaction> {
    const response = await apiService.put<BankTransactionResponse>(
      `${this.baseUrl}/transactions/${transactionId}`,
      transaction,
    );
    return response.bankTransaction;
  }

  async deleteBankTransaction(transactionId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/transactions/${transactionId}`);
  }

  async reconcileTransaction(
    transactionId: string,
    reconciliation: TransactionReconciliation,
  ): Promise<void> {
    await apiService.post(
      `${this.baseUrl}/transactions/${transactionId}/reconcile`,
      reconciliation,
    );
  }

  async reconcileTransactionSimple(
    transactionId: string,
    notes?: string,
  ): Promise<void> {
    const reconciliation: TransactionReconciliation = {
      bank_transaction_id: transactionId,
      is_reconciled: true,
      notes: notes || "Reconciled",
    };
    await this.reconcileTransaction(transactionId, reconciliation);
  }

  async unreconcileTransaction(transactionId: string): Promise<void> {
    const reconciliation: TransactionReconciliation = {
      bank_transaction_id: transactionId,
      is_reconciled: false,
      notes: "Unreconciled",
    };
    await this.reconcileTransaction(transactionId, reconciliation);
  }

  // Cash Position Methods
  async getLatestCashPosition(): Promise<CashPosition> {
    const response = await apiService.get<CashPositionResponse>(
      `${this.baseUrl}/cash-position`,
    );
    return response.cashPosition;
  }

  async getCashPositionByDate(date: string): Promise<CashPosition> {
    const response = await apiService.get<CashPositionResponse>(
      `${this.baseUrl}/cash-position/${date}`,
    );
    return response.cashPosition;
  }

  // Dashboard Methods
  async getBankingDashboard(): Promise<BankingDashboard> {
    const response = await apiService.get<BankingDashboard>(
      `${this.baseUrl}/dashboard`,
    );
    return (
      response || {
        totalBankBalance: 0,
        totalAvailableBalance: 0,
        totalPendingBalance: 0,
        pendingTransactionsCount: 0,
        dailyInflow: 0,
        dailyOutflow: 0,
        netCashFlow: 0,
        outstandingReceivables: 0,
        outstandingPayables: 0,
        recentTransactions: [],
        bankAccountsSummary: [],
      }
    );
  }

  async getReconciliationSummary(): Promise<ReconciliationSummary> {
    return await apiService.get<ReconciliationSummary>(
      `${this.baseUrl}/reconciliation/summary`,
    );
  }

  async getTransactionsByAccount(
    accountId: string,
  ): Promise<BankTransaction[]> {
    return this.getBankTransactions({ accountId });
  }

  async getUnreconciledTransactions(): Promise<BankTransaction[]> {
    return this.getBankTransactions({ status: TransactionStatus.PENDING });
  }

  async getTransactionsByType(
    transactionType: TransactionType,
  ): Promise<BankTransaction[]> {
    return this.getBankTransactions({ transactionType });
  }

  async getTransactionsByStatus(
    status: TransactionStatus,
  ): Promise<BankTransaction[]> {
    return this.getBankTransactions({ status });
  }

  async getTransactionsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<BankTransaction[]> {
    return this.getBankTransactions({ startDate, endDate });
  }
}

export const bankingService = new BankingService();
