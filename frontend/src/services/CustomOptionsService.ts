import { ApiService } from "./ApiService";

export interface CustomOption {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

function asList(response: unknown): CustomOption[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const data = (response as { data?: unknown }).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

function asItem(response: unknown): CustomOption {
  if (response && typeof response === "object") {
    const data = (response as { data?: unknown }).data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as CustomOption;
    }
    if ("id" in (response as object)) {
      return response as CustomOption;
    }
  }
  return response as CustomOption;
}

export class CustomOptionsService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  async createCustomEventType(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post("/custom-options/event-types", {
      name,
      description,
    });
    return asItem(response);
  }

  async getCustomEventTypes(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/event-types"));
  }

  async createCustomDepartment(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const params = new URLSearchParams({ name });
    if (description?.trim()) params.append("description", description.trim());
    return asItem(
      await this.apiService.post(
        `/custom-options/departments?${params.toString()}`,
      ),
    );
  }

  async getCustomDepartments(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/departments"));
  }

  async createCustomLeaveType(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post("/custom-options/leave-types", {
      name,
      description,
    });
    return asItem(response);
  }

  async getCustomLeaveTypes(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/leave-types"));
  }

  async createCustomLeadSource(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post(
      "/custom-options/lead-sources",
      {
        name,
        description,
      },
    );
    return asItem(response);
  }

  async getCustomLeadSources(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/lead-sources"));
  }

  async createCustomContactSource(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post(
      "/custom-options/contact-sources",
      {
        name,
        description,
      },
    );
    return asItem(response);
  }

  async getCustomContactSources(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/contact-sources"));
  }

  async createCustomCompanyIndustry(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post(
      "/custom-options/company-industries",
      {
        name,
        description,
      },
    );
    return asItem(response);
  }

  async getCustomCompanyIndustries(): Promise<CustomOption[]> {
    return asList(
      await this.apiService.get("/custom-options/company-industries"),
    );
  }

  async createCustomContactType(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post(
      "/custom-options/contact-types",
      {
        name,
        description,
      },
    );
    return asItem(response);
  }

  async getCustomContactTypes(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/contact-types"));
  }

  async createCustomIndustry(
    name: string,
    description?: string,
  ): Promise<CustomOption> {
    const response = await this.apiService.post("/custom-options/industries", {
      name,
      description,
    });
    return asItem(response);
  }

  async getCustomIndustries(): Promise<CustomOption[]> {
    return asList(await this.apiService.get("/custom-options/industries"));
  }
}
