export interface MotSettings {
  inspection_price: number;
  public_booking_enabled: boolean;
  tenant_domain: string;
  tenant_name: string;
  tenant_logo_url?: string | null;
}

export interface MotSettingsUpdate {
  inspection_price?: number;
  public_booking_enabled?: boolean;
}

export function getTenantMotBookingUrl(domain: string): string {
  return `/${domain}/mot/book`;
}
