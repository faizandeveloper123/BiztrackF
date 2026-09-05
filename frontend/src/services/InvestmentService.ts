import { apiService } from "./ApiService";

export interface Investment {
  id: string;
  tenant_id: string;
  investment_number: string;
  investment_date: string;
  investment_type:
    | "cash_investment"
    | "card_transfer"
    | "bank_transfer"
    | "equipment_purchase";
  status: "pending" | "completed" | "cancelled" | "failed";
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  reference_number?: string;
  reference_type?: string;
  meta_data?: Record<string, any>;
  tags?: string[];
  attachments?: string[];
  created_by_id: string;
  approved_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentCreate {
  investment_date: string;
  investment_type:
    | "cash_investment"
    | "card_transfer"
    | "bank_transfer"
    | "equipment_purchase";
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  reference_number?: string;
  reference_type?: string;
  meta_data?: Record<string, any>;
  tags?: string[];
}

export interface InvestmentUpdate {
  investment_date?: string;
  investment_type?:
    | "cash_investment"
    | "card_transfer"
    | "bank_transfer"
    | "equipment_purchase";
  amount?: number;
  currency?: string;
  description?: string;
  notes?: string;
  reference_number?: string;
  reference_type?: string;
  meta_data?: Record<string, any>;
  tags?: string[];
  status?: "pending" | "completed" | "cancelled" | "failed";
}

export interface InvestmentDashboardStats {
  total_investments: number;
  total_amount: number;
  cash_investments: number;
  equipment_investments: number;
  pending_investments: number;
  completed_investments: number;
  monthly_investments: number;
  quarterly_investments: number;
  yearly_investments: number;
}

export interface EquipmentInvestment {
  id: string;
  tenant_id: string;
  investment_id: string;
  equipment_name: string;
  equipment_type: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  purchase_price: number;
  estimated_life_years: number;
  depreciation_method: string;
  purchase_date: string;
  warranty_expiry?: string;
  location?: string;
  condition: string;
  notes?: string;
  attachments?: string[];
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentInvestmentCreate {
  equipment_name: string;
  equipment_type: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  purchase_price: number;
  estimated_life_years?: number;
  depreciation_method?: string;
  purchase_date: string;
  warranty_expiry?: string;
  location?: string;
  condition?: string;
  notes?: string;
}

class InvestmentService {
  async getInvestments(
    skip: number = 0,
    limit: number = 100,
    investment_type?: string,
    status?: string,
    start_date?: string,
    end_date?: string,
  ): Promise<{ investments: Investment[]; total: number }> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (investment_type) params.append("investment_type", investment_type);
    if (status) params.append("status", status);
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);

    const response = await apiService.get(`/investments?${params.toString()}`);
    return response;
  }

  async getInvestment(id: string): Promise<Investment> {
    const response = await apiService.get(`/investments/${id}`);
    return response;
  }

  async createInvestment(investment: InvestmentCreate): Promise<Investment> {
    const response = await apiService.post("/investments", investment);
    return response;
  }

  async updateInvestment(
    id: string,
    investment: InvestmentUpdate,
  ): Promise<Investment> {
    const response = await apiService.put(`/investments/${id}`, investment);
    return response;
  }

  async approveInvestment(id: string): Promise<Investment> {
    const response = await apiService.post(`/investments/${id}/approve`);
    return response;
  }

  async deleteInvestment(id: string): Promise<void> {
    await apiService.delete(`/investments/${id}`);
  }

  async getInvestmentDashboardStats(): Promise<InvestmentDashboardStats> {
    const response = await apiService.get("/investments/dashboard/stats");
    return response;
  }

  async getEquipmentInvestments(
    investmentId: string,
  ): Promise<EquipmentInvestment[]> {
    const response = await apiService.get(
      `/investments/${investmentId}/equipment`,
    );
    return response;
  }

  async createEquipmentInvestment(
    investmentId: string,
    equipment: EquipmentInvestmentCreate,
  ): Promise<EquipmentInvestment> {
    const response = await apiService.post(
      `/investments/${investmentId}/equipment`,
      equipment,
    );
    return response;
  }
}

export const investmentService = new InvestmentService();
