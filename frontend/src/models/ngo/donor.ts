export type DonorType = "individual" | "corporate" | "anonymous";
export type DonorStatus = "active" | "inactive";

export interface Donor {
  id: string;
  tenant_id: string;
  donor_code: string;
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  donor_type: DonorType;
  status: DonorStatus;
  address?: string | null;
  notes?: string | null;
  total_donated: number;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DonorCreate {
  full_name: string;
  email: string;
  phone?: string;
  organization?: string;
  donor_type?: DonorType;
  status?: DonorStatus;
  address?: string;
  notes?: string;
  total_donated?: number;
}

export interface DonorUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  donor_type?: DonorType;
  status?: DonorStatus;
  address?: string;
  notes?: string;
  total_donated?: number;
  is_active?: boolean;
}

export interface DonorsResponse {
  donors: Donor[];
  total: number;
}
