import { apiService } from "./ApiService";
import type {
  Till,
  TillCreate,
  TillUpdate,
  TillResponse,
  TillTransaction,
  TillTransactionCreate,
  TillTransactionUpdate,
  TillTransactionResponse,
  TillTransactionsResponse,
} from "@/src/models/banking";

class TillService {
  private baseUrl = "/banking";

  async getTills(activeOnly: boolean = false): Promise<Till[]> {
    const response = await apiService.get<{ tills: Till[]; total: number }>(
      `${this.baseUrl}/tills?activeOnly=${activeOnly}`,
    );
    return response.tills || [];
  }

  async getTillById(tillId: string): Promise<Till> {
    const response = await apiService.get<TillResponse>(
      `${this.baseUrl}/tills/${tillId}`,
    );
    return response.till;
  }

  async createTill(till: TillCreate): Promise<Till> {
    const response = await apiService.post<TillResponse>(
      `${this.baseUrl}/tills`,
      till,
    );
    return response.till;
  }

  async updateTill(tillId: string, till: TillUpdate): Promise<Till> {
    const response = await apiService.put<TillResponse>(
      `${this.baseUrl}/tills/${tillId}`,
      till,
    );
    return response.till;
  }

  async deleteTill(tillId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/tills/${tillId}`);
  }

  async getTillTransactions(tillId?: string): Promise<TillTransaction[]> {
    const url = tillId
      ? `${this.baseUrl}/till-transactions?tillId=${tillId}`
      : `${this.baseUrl}/till-transactions`;
    const response = await apiService.get<TillTransactionsResponse>(url);
    return response.tillTransactions || [];
  }

  async getTillTransactionById(
    transactionId: string,
  ): Promise<TillTransaction> {
    const response = await apiService.get<TillTransactionResponse>(
      `${this.baseUrl}/till-transactions/${transactionId}`,
    );
    return response.tillTransaction;
  }

  async createTillTransaction(
    transaction: TillTransactionCreate,
  ): Promise<TillTransaction> {
    const response = await apiService.post<TillTransactionResponse>(
      `${this.baseUrl}/till-transactions`,
      transaction,
    );
    return response.tillTransaction;
  }

  async updateTillTransaction(
    transactionId: string,
    transaction: TillTransactionUpdate,
  ): Promise<TillTransaction> {
    const response = await apiService.put<TillTransactionResponse>(
      `${this.baseUrl}/till-transactions/${transactionId}`,
      transaction,
    );
    return response.tillTransaction;
  }

  async deleteTillTransaction(transactionId: string): Promise<void> {
    await apiService.delete(
      `${this.baseUrl}/till-transactions/${transactionId}`,
    );
  }

  async getBankTransactions(accountId?: string): Promise<any[]> {
    const url = accountId
      ? `${this.baseUrl}/transactions?accountId=${accountId}`
      : `${this.baseUrl}/transactions`;
    const response = await apiService.get<{
      bankTransactions: any[];
      total: number;
    }>(url);
    return response.bankTransactions || [];
  }
}

export const tillService = new TillService();
