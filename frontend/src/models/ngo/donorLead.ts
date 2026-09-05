import type {
  DonorLeadSource,
  DonorLeadStatus,
} from "@/src/constants/ngo/donorLead";

export type { DonorLeadSource, DonorLeadStatus };

export interface DonorLead {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  expected_donation: number;
  status: DonorLeadStatus;
  source: DonorLeadSource;
  assigned_to?: string | null;
  notes?: string | null;
  is_active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DonorLeadCreate {
  full_name: string;
  email: string;
  phone?: string;
  organization?: string;
  expected_donation?: number;
  status?: DonorLeadStatus;
  source?: DonorLeadSource;
  assigned_to?: string;
  notes?: string;
}

export interface DonorLeadUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  expected_donation?: number;
  status?: DonorLeadStatus;
  source?: DonorLeadSource;
  assigned_to?: string;
  notes?: string;
  is_active?: boolean;
}

export interface DonorLeadsResponse {
  leads: DonorLead[];
  total: number;
}

export interface DonorLeadFilters {
  search?: string;
  status?: string;
  source?: string;
  created_date?: string;
}
