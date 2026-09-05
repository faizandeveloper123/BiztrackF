export type PartnerSector = "relief" | "medical" | "education" | "food";
export type PartnerSize = "small" | "medium" | "large";
export type PartnerStatus = "active" | "inactive";

export interface PartnerOrganization {
  id: string;
  tenant_id: string;
  partner_code: string;
  name: string;
  email: string;
  sector: PartnerSector;
  organization_size: PartnerSize;
  website?: string | null;
  location?: string | null;
  status: PartnerStatus;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartnerOrganizationCreate {
  name: string;
  email: string;
  sector?: PartnerSector;
  organization_size?: PartnerSize;
  website?: string;
  location?: string;
  status?: PartnerStatus;
}

export interface PartnerOrganizationUpdate {
  name?: string;
  email?: string;
  sector?: PartnerSector;
  organization_size?: PartnerSize;
  website?: string;
  location?: string;
  status?: PartnerStatus;
  is_active?: boolean;
}

export interface PartnerOrganizationsResponse {
  organizations: PartnerOrganization[];
  total: number;
}
