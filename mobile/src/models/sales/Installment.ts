export interface Installment {
  id: string;
  tenant_id: string;
  installment_plan_id: string;
  sequence_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_amount: number;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstallmentPlan {
  id: string;
  tenant_id: string;
  invoice_id: string;
  total_amount: number;
  currency: string;
  number_of_installments: number;
  frequency: string;
  first_due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  installments: Installment[];
}

export interface InstallmentPlanCreate {
  invoice_id: string;
  total_amount: number;
  number_of_installments: number;
  frequency: string;
  first_due_date: string;
  currency?: string;
}

export interface InstallmentPlanUpdate {
  status?: string;
}

export interface ApplyPaymentToInstallmentRequest {
  amount: number;
  payment_id?: string;
}
