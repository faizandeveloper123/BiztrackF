import { ApiService } from "./ApiService";
import type {
  Donor,
  DonorCreate,
  DonorUpdate,
  DonorsResponse,
  DonorLead,
  DonorLeadCreate,
  DonorLeadUpdate,
  DonorLeadsResponse,
  PartnerOrganization,
  PartnerOrganizationCreate,
  PartnerOrganizationUpdate,
  PartnerOrganizationsResponse,
} from "../models/ngo";

const apiService = new ApiService();

export class NgoService {
  async getDonors(params?: {
    search?: string;
    donor_type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DonorsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.donor_type) searchParams.set("donor_type", params.donor_type);
    if (params?.status) searchParams.set("status", params.status);
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 50));
    return apiService.get<DonorsResponse>(
      `/ngo/donors?${searchParams.toString()}`,
    );
  }

  async getDonor(id: string): Promise<Donor> {
    return apiService.get<Donor>(`/ngo/donors/${id}`);
  }

  async createDonor(body: DonorCreate): Promise<Donor> {
    return apiService.post<Donor>("/ngo/donors", body);
  }

  async updateDonor(id: string, body: DonorUpdate): Promise<Donor> {
    return apiService.put<Donor>(`/ngo/donors/${id}`, body);
  }

  async deleteDonor(id: string): Promise<void> {
    return apiService.delete(`/ngo/donors/${id}`);
  }

  async getDonorLeads(params?: {
    search?: string;
    status?: string;
    source?: string;
    created_date?: string;
    page?: number;
    limit?: number;
  }): Promise<DonorLeadsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.source) searchParams.set("source", params.source);
    if (params?.created_date)
      searchParams.set("created_date", params.created_date);
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 50));
    return apiService.get<DonorLeadsResponse>(
      `/ngo/donor-leads?${searchParams.toString()}`,
    );
  }

  async getDonorLead(id: string): Promise<DonorLead> {
    return apiService.get<DonorLead>(`/ngo/donor-leads/${id}`);
  }

  async createDonorLead(body: DonorLeadCreate): Promise<DonorLead> {
    return apiService.post<DonorLead>("/ngo/donor-leads", body);
  }

  async updateDonorLead(id: string, body: DonorLeadUpdate): Promise<DonorLead> {
    return apiService.put<DonorLead>(`/ngo/donor-leads/${id}`, body);
  }

  async deleteDonorLead(id: string): Promise<void> {
    return apiService.delete(`/ngo/donor-leads/${id}`);
  }

  async getPartnerOrganizations(params?: {
    search?: string;
    sector?: string;
    organization_size?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PartnerOrganizationsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sector) searchParams.set("sector", params.sector);
    if (params?.organization_size)
      searchParams.set("organization_size", params.organization_size);
    if (params?.status) searchParams.set("status", params.status);
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("limit", String(params?.limit ?? 50));
    return apiService.get<PartnerOrganizationsResponse>(
      `/ngo/partner-organizations?${searchParams.toString()}`,
    );
  }

  async getPartnerOrganization(id: string): Promise<PartnerOrganization> {
    return apiService.get<PartnerOrganization>(
      `/ngo/partner-organizations/${id}`,
    );
  }

  async createPartnerOrganization(
    body: PartnerOrganizationCreate,
  ): Promise<PartnerOrganization> {
    return apiService.post<PartnerOrganization>(
      "/ngo/partner-organizations",
      body,
    );
  }

  async updatePartnerOrganization(
    id: string,
    body: PartnerOrganizationUpdate,
  ): Promise<PartnerOrganization> {
    return apiService.put<PartnerOrganization>(
      `/ngo/partner-organizations/${id}`,
      body,
    );
  }

  async deletePartnerOrganization(id: string): Promise<void> {
    return apiService.delete(`/ngo/partner-organizations/${id}`);
  }
}

const ngoService = new NgoService();
export default ngoService;
