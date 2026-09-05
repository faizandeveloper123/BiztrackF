export interface JobCardItem {
  productId?: string;
  description: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
}

export interface JobCard {
  id: string;
  tenant_id: string;
  job_card_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  purchase_order_id?: string;
  invoice_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_info?: Record<string, unknown>;
  assigned_to_id?: string;
  assigned_to_name?: string;
  created_by_id: string;
  planned_date?: string;
  completed_at?: string;
  labor_estimate: number;
  parts_estimate: number;
  vat_rate?: number;
  attachments: string[];
  items: JobCardItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobCardCreate {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  purchase_order_id?: string;
  invoice_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_info?: Record<string, unknown>;
  assigned_to_id?: string;
  planned_date?: string;
  completed_at?: string;
  labor_estimate?: number;
  parts_estimate?: number;
  vat_rate?: number;
  attachments?: string[];
  items?: JobCardItem[];
}

export interface JobCardUpdate {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  purchase_order_id?: string;
  invoice_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_info?: Record<string, unknown>;
  assigned_to_id?: string;
  planned_date?: string;
  completed_at?: string;
  labor_estimate?: number;
  parts_estimate?: number;
  vat_rate?: number;
  attachments?: string[];
  items?: JobCardItem[];
}
