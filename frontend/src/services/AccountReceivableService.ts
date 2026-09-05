import { apiService } from "./ApiService";
import type {
  AccountReceivable,
  AccountReceivableCreate,
  AccountReceivableUpdate,
  AccountReceivablesListResponse,
  AccountReceivableStatus,
} from "@/src/models/ledger";

class AccountReceivableService {
  private baseUrl = "/ledger";

  async getAccountReceivables(
    status?: AccountReceivableStatus,
  ): Promise<AccountReceivablesListResponse> {
    const params = status ? `?status=${status}` : "";
    return await apiService.get<AccountReceivablesListResponse>(
      `${this.baseUrl}/account-receivables${params}`,
    );
  }

  async getAccountReceivableById(id: string): Promise<AccountReceivable> {
    const response = await apiService.get<AccountReceivable>(
      `${this.baseUrl}/account-receivables/${id}`,
    );
    return response;
  }

  async createAccountReceivable(
    data: AccountReceivableCreate,
  ): Promise<AccountReceivable> {
    return await apiService.post<AccountReceivable>(
      `${this.baseUrl}/account-receivables`,
      data,
    );
  }

  async updateAccountReceivable(
    id: string,
    data: AccountReceivableUpdate,
  ): Promise<AccountReceivable> {
    return await apiService.put<AccountReceivable>(
      `${this.baseUrl}/account-receivables/${id}`,
      data,
    );
  }

  async deleteAccountReceivable(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/account-receivables/${id}`);
  }
}

export const accountReceivableService = new AccountReceivableService();
