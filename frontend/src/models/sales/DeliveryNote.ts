export interface DeliveryNote {
  id: string;
  tenant_id: string;
  invoice_id: string;
  note: string | null;
  created_by: string;
  created_at: string;
  invoice_number?: string | null;
  customer_name?: string | null;
}

export interface DeliveryNoteCreate {
  invoice_id: string;
  note?: string | null;
}
