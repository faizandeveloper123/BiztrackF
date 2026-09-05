import { apiService } from "./ApiService";
import {
  QualityCheckResponse as QualityCheck,
  QualityCheckCreate,
  QualityCheckUpdate,
  QualityChecksResponse,
  QualityInspectionBase as QualityInspection,
  QualityInspectionCreate,
  QualityInspectionUpdate,
  QualityInspectionsResponse,
  QualityDefectBase as QualityDefect,
  QualityDefectCreate,
  QualityDefectUpdate,
  QualityDefectsResponse,
  QualityReportBase as QualityReport,
  QualityReportCreate,
  QualityReportUpdate,
  QualityReportsResponse,
  QualityDashboard,
  QualityCheckFilters,
  QualityInspectionFilters,
  QualityDefectFilters,
} from "../models/qualityControl";

export class QualityControlService {
  private baseUrl = "/quality-control";

  // Quality Check CRUD operations
  async createQualityCheck(
    checkData: QualityCheckCreate,
  ): Promise<QualityCheck> {
    const response = await apiService.post(`${this.baseUrl}/checks`, checkData);
    return response;
  }

  async getQualityChecks(
    filters: QualityCheckFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<QualityChecksResponse> {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append("status", filters.status);
    if (filters.priority) queryParams.append("priority", filters.priority);
    if (filters.inspection_type)
      queryParams.append("inspection_type", filters.inspection_type);
    if (filters.quality_standard)
      queryParams.append("quality_standard", filters.quality_standard);
    if (filters.project_id)
      queryParams.append("project_id", filters.project_id);
    if (filters.assigned_to_id)
      queryParams.append("assigned_to_id", filters.assigned_to_id);
    if (filters.scheduled_date_from)
      queryParams.append("scheduled_date_from", filters.scheduled_date_from);
    if (filters.scheduled_date_to)
      queryParams.append("scheduled_date_to", filters.scheduled_date_to);
    if (filters.search) queryParams.append("search", filters.search);

    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/checks?${queryParams.toString()}`,
    );

    // Transform the response to match QualityChecksResponse interface
    return {
      quality_checks: response,
      total: response.length,
      page,
      limit,
      total_pages: Math.ceil(response.length / limit),
    };
  }

  async getQualityCheck(id: string): Promise<QualityCheck> {
    const response = await apiService.get(`${this.baseUrl}/checks/${id}`);
    return response;
  }

  async updateQualityCheck(
    id: string,
    checkData: QualityCheckUpdate,
  ): Promise<QualityCheck> {
    const response = await apiService.put(
      `${this.baseUrl}/checks/${id}`,
      checkData,
    );
    return response;
  }

  async deleteQualityCheck(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/checks/${id}`);
  }

  // Quality Inspection operations
  async getQualityInspections(
    filters: QualityInspectionFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<QualityInspectionsResponse> {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append("status", filters.status);
    if (filters.inspector_id)
      queryParams.append("inspector_id", filters.inspector_id);
    if (filters.quality_check_id)
      queryParams.append("quality_check_id", filters.quality_check_id);
    if (filters.inspection_date_from)
      queryParams.append("inspection_date_from", filters.inspection_date_from);
    if (filters.inspection_date_to)
      queryParams.append("inspection_date_to", filters.inspection_date_to);
    if (filters.compliance_score_min)
      queryParams.append(
        "compliance_score_min",
        filters.compliance_score_min.toString(),
      );
    if (filters.compliance_score_max)
      queryParams.append(
        "compliance_score_max",
        filters.compliance_score_max.toString(),
      );
    if (filters.search) queryParams.append("search", filters.search);

    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/inspections?${queryParams.toString()}`,
    );

    return {
      quality_inspections: response,
      total: response.length,
      page,
      limit,
      total_pages: Math.ceil(response.length / limit),
    };
  }

  async getQualityInspection(id: string): Promise<QualityInspection> {
    const response = await apiService.get(`${this.baseUrl}/inspections/${id}`);
    return response;
  }

  async createQualityInspection(
    inspectionData: QualityInspectionCreate,
  ): Promise<QualityInspection> {
    const response = await apiService.post(
      `${this.baseUrl}/inspections`,
      inspectionData,
    );
    return response;
  }

  async updateQualityInspection(
    id: string,
    inspectionData: QualityInspectionUpdate,
  ): Promise<QualityInspection> {
    const response = await apiService.put(
      `${this.baseUrl}/inspections/${id}`,
      inspectionData,
    );
    return response;
  }

  async deleteQualityInspection(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/inspections/${id}`);
  }

  // Quality Defect operations
  async getQualityDefects(
    filters: QualityDefectFilters = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<QualityDefectsResponse> {
    const queryParams = new URLSearchParams();

    if (filters.severity) queryParams.append("severity", filters.severity);
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.priority) queryParams.append("priority", filters.priority);
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.assigned_to_id)
      queryParams.append("assigned_to_id", filters.assigned_to_id);
    if (filters.detected_date_from)
      queryParams.append("detected_date_from", filters.detected_date_from);
    if (filters.detected_date_to)
      queryParams.append("detected_date_to", filters.detected_date_to);
    if (filters.cost_impact_min)
      queryParams.append("cost_impact_min", filters.cost_impact_min.toString());
    if (filters.cost_impact_max)
      queryParams.append("cost_impact_max", filters.cost_impact_max.toString());
    if (filters.search) queryParams.append("search", filters.search);

    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/defects?${queryParams.toString()}`,
    );

    return {
      quality_defects: response,
      total: response.length,
      page,
      limit,
      total_pages: Math.ceil(response.length / limit),
    };
  }

  async getQualityDefect(id: string): Promise<QualityDefect> {
    const response = await apiService.get(`${this.baseUrl}/defects/${id}`);
    return response;
  }

  async createQualityDefect(
    defectData: QualityDefectCreate,
  ): Promise<QualityDefect> {
    const response = await apiService.post(
      `${this.baseUrl}/defects`,
      defectData,
    );
    return response;
  }

  async updateQualityDefect(
    id: string,
    defectData: QualityDefectUpdate,
  ): Promise<QualityDefect> {
    const response = await apiService.put(
      `${this.baseUrl}/defects/${id}`,
      defectData,
    );
    return response;
  }

  async deleteQualityDefect(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/defects/${id}`);
  }

  // Quality Report operations
  async getQualityReports(
    reportType?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<QualityReportsResponse> {
    const queryParams = new URLSearchParams();

    if (reportType) queryParams.append("report_type", reportType);
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const response = await apiService.get(
      `${this.baseUrl}/reports?${queryParams.toString()}`,
    );

    return {
      quality_reports: response,
      total: response.length,
      page,
      limit,
      total_pages: Math.ceil(response.length / limit),
    };
  }

  async getQualityReport(id: string): Promise<QualityReport> {
    const response = await apiService.get(`${this.baseUrl}/reports/${id}`);
    return response;
  }

  async createQualityReport(
    reportData: QualityReportCreate,
  ): Promise<QualityReport> {
    const response = await apiService.post(
      `${this.baseUrl}/reports`,
      reportData,
    );
    return response;
  }

  async updateQualityReport(
    id: string,
    reportData: QualityReportUpdate,
  ): Promise<QualityReport> {
    const response = await apiService.put(
      `${this.baseUrl}/reports/${id}`,
      reportData,
    );
    return response;
  }

  async deleteQualityReport(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/reports/${id}`);
  }

  // Dashboard and Statistics
  async getQualityDashboard(): Promise<QualityDashboard> {
    const response = await apiService.get(`${this.baseUrl}/dashboard`);
    return response;
  }

  async getQualityStatistics(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  // Utility methods
  async getQualityChecksByStatus(status: string): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?status=${status}`,
    );
    return response;
  }

  async getQualityChecksByPriority(priority: string): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?priority=${priority}`,
    );
    return response;
  }

  async getQualityChecksByInspectionType(
    inspectionType: string,
  ): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?inspection_type=${inspectionType}`,
    );
    return response;
  }

  async getQualityChecksByAssignedUser(
    userId: string,
  ): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?assigned_to_id=${userId}`,
    );
    return response;
  }

  async getQualityInspectionsByCheck(
    checkId: string,
  ): Promise<QualityInspection[]> {
    const response = await apiService.get(
      `${this.baseUrl}/inspections?quality_check_id=${checkId}`,
    );
    return response;
  }

  async getQualityInspectionsByInspector(
    inspectorId: string,
  ): Promise<QualityInspection[]> {
    const response = await apiService.get(
      `${this.baseUrl}/inspections?inspector_id=${inspectorId}`,
    );
    return response;
  }

  async getQualityDefectsBySeverity(
    severity: string,
  ): Promise<QualityDefect[]> {
    const response = await apiService.get(
      `${this.baseUrl}/defects?severity=${severity}`,
    );
    return response;
  }

  async getQualityDefectsByStatus(status: string): Promise<QualityDefect[]> {
    const response = await apiService.get(
      `${this.baseUrl}/defects?status=${status}`,
    );
    return response;
  }

  async getQualityReportsByType(reportType: string): Promise<QualityReport[]> {
    const response = await apiService.get(
      `${this.baseUrl}/reports?report_type=${reportType}`,
    );
    return response;
  }
}

export default QualityControlService;
