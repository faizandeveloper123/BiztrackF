export interface InvoiceCustomization {
  id: string;
  tenant_id: string;
  created_by: string;
  company_name: string;
  company_logo_url?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  payment_instructions?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  show_vehicle_info: boolean;
  show_parts_section: boolean;
  show_labour_section: boolean;
  show_comments_section: boolean;
  footer_text?: string;
  show_contact_info_in_footer: boolean;
  footer_background_color: string;
  grid_color: string;
  thank_you_message: string;
  enquiry_message: string;
  contact_message: string;
  default_payment_instructions: string;
  default_currency: string;
  custom_fields?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCustomizationCreate {
  company_name: string;
  company_logo_url?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  payment_instructions?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  show_vehicle_info?: boolean;
  show_parts_section?: boolean;
  show_labour_section?: boolean;
  show_comments_section?: boolean;
  footer_text?: string;
  show_contact_info_in_footer?: boolean;
  footer_background_color?: string;
  grid_color?: string;
  thank_you_message?: string;
  enquiry_message?: string;
  contact_message?: string;
  default_payment_instructions?: string;
  default_currency?: string;
  custom_fields?: Record<string, any>;
}

export interface InvoiceCustomizationUpdate {
  company_name?: string;
  company_logo_url?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  bank_sort_code?: string;
  bank_account_number?: string;
  payment_instructions?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  show_vehicle_info?: boolean;
  show_parts_section?: boolean;
  show_labour_section?: boolean;
  show_comments_section?: boolean;
  footer_text?: string;
  show_contact_info_in_footer?: boolean;
  footer_background_color?: string;
  grid_color?: string;
  thank_you_message?: string;
  enquiry_message?: string;
  contact_message?: string;
  default_payment_instructions?: string;
  default_currency?: string;
  custom_fields?: Record<string, any>;
}

export interface InvoiceCustomizationResponse {
  customization: InvoiceCustomization;
}
