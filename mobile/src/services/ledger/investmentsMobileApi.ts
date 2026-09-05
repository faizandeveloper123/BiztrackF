import { apiService } from '../ApiService';

export type InvestmentTypeCode =
  | 'cash_investment'
  | 'card_transfer'
  | 'bank_transfer'
  | 'equipment_purchase';

export interface InvestmentRow {
  id: string;
  tenant_id: string;
  investment_number: string;
  investment_date: string;
  investment_type: InvestmentTypeCode;
  status: string;
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  reference_number?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
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

export async function getInvestments(params?: {
  skip?: number;
  limit?: number;
  investmentType?: string;
  status?: string;
}): Promise<{ investments: InvestmentRow[]; total: number }> {
  const p = new URLSearchParams();
  p.append('skip', String(params?.skip ?? 0));
  p.append('limit', String(params?.limit ?? 100));
  if (params?.investmentType) {
    p.append('investment_type', params.investmentType);
  }
  if (params?.status) p.append('status', params.status);
  const res = await apiService.get<{
    investments?: InvestmentRow[];
    total?: number;
  }>(`/investments?${p.toString()}`);
  return {
    investments: res.investments ?? [],
    total: res.total ?? 0,
  };
}

export async function createInvestment(body: {
  investment_date: string;
  investment_type: InvestmentTypeCode;
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  reference_number?: string;
}): Promise<InvestmentRow> {
  return apiService.post<InvestmentRow>('/investments', body);
}

export async function updateInvestment(
  id: string,
  body: Partial<{
    investment_date: string;
    investment_type: InvestmentTypeCode;
    amount: number;
    currency: string;
    description: string;
    notes: string;
    reference_number: string;
    status: string;
  }>,
): Promise<InvestmentRow> {
  return apiService.put<InvestmentRow>(`/investments/${id}`, body);
}

export async function approveInvestment(id: string): Promise<InvestmentRow> {
  return apiService.post<InvestmentRow>(`/investments/${id}/approve`, {});
}

export async function deleteInvestment(id: string): Promise<void> {
  await apiService.delete(`/investments/${id}`);
}

export async function getInvestmentDashboardStats(): Promise<InvestmentDashboardStats> {
  return apiService.get<InvestmentDashboardStats>(
    '/investments/dashboard/stats',
  );
}
