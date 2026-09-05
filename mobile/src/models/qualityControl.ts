// Quality Control Models

export enum QualityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL_PASS = 'conditional_pass',
  REQUIRES_REVIEW = 'requires_review',
}

export enum QualityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum InspectionType {
  VISUAL = 'visual',
  DIMENSIONAL = 'dimensional',
  FUNCTIONAL = 'functional',
  MATERIAL = 'material',
  SAFETY = 'safety',
  ENVIRONMENTAL = 'environmental',
  DOCUMENTATION = 'documentation',
}

export enum DefectSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
  BLOCKER = 'blocker',
}

export enum QualityStandard {
  ISO_9001 = 'iso_9001',
  ISO_14001 = 'iso_14001',
  ISO_45001 = 'iso_45001',
  FDA = 'fda',
  CE = 'ce',
  CUSTOM = 'custom',
}

// Base Models
export interface QualityCheckBase {
  title: string;
  description?: string;
  inspection_type: InspectionType;
  priority: QualityPriority;
  quality_standard: QualityStandard;
  criteria: string[];
  acceptance_criteria: Record<string, any>;
  tolerance_limits: Record<string, any>;
  required_equipment: string[];
  required_skills: string[];
  estimated_duration_minutes: number;
  project_id?: string;
  assigned_to_id?: string;
  scheduled_date?: string;
  tags: string[];
}

export interface QualityInspectionBase {
  quality_check_id: string;
  inspector_id: string;
  inspection_date: string;
  status: QualityStatus;
  results: Record<string, any>;
  measurements: Record<string, any>;
  defects_found: Record<string, any>[];
  corrective_actions: string[];
  notes?: string;
  photos: string[];
  documents: string[];
  compliance_score: number;
}

export interface QualityDefectBase {
  title: string;
  description: string;
  severity: DefectSeverity;
  category: string;
  location?: string;
  detected_date: string;
  detected_by_id: string;
  quality_check_id?: string;
  status: string;
  priority: QualityPriority;
  assigned_to_id?: string;
  estimated_resolution_date?: string;
  actual_resolution_date?: string;
  resolution_notes?: string;
  cost_impact: number;
  tags: string[];
}

export interface QualityReportBase {
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  summary: string;
  key_findings: string[];
  recommendations: string[];
  metrics: Record<string, any>;
  generated_by_id: string;
  tags: string[];
}

// Create Models
export interface QualityCheckCreate extends QualityCheckBase {}

export interface QualityInspectionCreate extends QualityInspectionBase {}

export interface QualityDefectCreate extends QualityDefectBase {}

export interface QualityReportCreate extends QualityReportBase {}

// Update Models
export interface QualityCheckUpdate {
  title?: string;
  description?: string;
  inspection_type?: InspectionType;
  priority?: QualityPriority;
  quality_standard?: QualityStandard;
  criteria?: string[];
  acceptance_criteria?: Record<string, any>;
  tolerance_limits?: Record<string, any>;
  required_equipment?: string[];
  required_skills?: string[];
  estimated_duration_minutes?: number;
  project_id?: string;
  assigned_to_id?: string;
  scheduled_date?: string;
  tags?: string[];
}

export interface QualityInspectionUpdate {
  status?: QualityStatus;
  results?: Record<string, any>;
  measurements?: Record<string, any>;
  defects_found?: Record<string, any>[];
  corrective_actions?: string[];
  notes?: string;
  photos?: string[];
  documents?: string[];
  compliance_score?: number;
}

export interface QualityDefectUpdate {
  title?: string;
  description?: string;
  severity?: DefectSeverity;
  category?: string;
  location?: string;
  status?: string;
  priority?: QualityPriority;
  assigned_to_id?: string;
  estimated_resolution_date?: string;
  actual_resolution_date?: string;
  resolution_notes?: string;
  cost_impact?: number;
  tags?: string[];
}

export interface QualityReportUpdate {
  title?: string;
  summary?: string;
  key_findings?: string[];
  recommendations?: string[];
  metrics?: Record<string, any>;
  tags?: string[];
}

// Response Models
export interface QualityCheckResponse extends QualityCheckBase {
  id: string;
  tenant_id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  status: QualityStatus;
  completion_percentage: number;
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pending_inspections: number;
}

export interface QualityInspectionResponse extends QualityInspectionBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  inspector_name: string;
  quality_check_title: string;
}

export interface QualityDefectResponse extends QualityDefectBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  detected_by_name: string;
  assigned_to_name?: string;
}

export interface QualityReportResponse extends QualityReportBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  generated_by_name: string;
}

// List Response Models
export interface QualityChecksResponse {
  quality_checks: QualityCheckResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QualityInspectionsResponse {
  quality_inspections: QualityInspectionResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QualityDefectsResponse {
  quality_defects: QualityDefectResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QualityReportsResponse {
  quality_reports: QualityReportResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Dashboard Models
export interface QualityDashboardStats {
  total_checks: number;
  pending_checks: number;
  in_progress_checks: number;
  completed_checks: number;
  passed_inspections: number;
  failed_inspections: number;
  open_defects: number;
  critical_defects: number;
  average_compliance_score: number;
  total_cost_impact: number;
}

export interface QualityDashboard {
  stats: QualityDashboardStats;
  recent_checks: QualityCheckResponse[];
  recent_inspections: QualityInspectionResponse[];
  critical_defects: QualityDefectResponse[];
  upcoming_checks: QualityCheckResponse[];
}

// Filter Models
export interface QualityCheckFilters {
  status?: QualityStatus;
  priority?: QualityPriority;
  inspection_type?: InspectionType;
  quality_standard?: QualityStandard;
  project_id?: string;
  assigned_to_id?: string;
  scheduled_date_from?: string;  scheduled_date_to?: string;
  search?: string;
}

export interface QualityInspectionFilters {
  status?: QualityStatus;
  inspector_id?: string;
  quality_check_id?: string;
  inspection_date_from?: string;
  inspection_date_to?: string;
  compliance_score_min?: number;
  compliance_score_max?: number;
  search?: string;
}

export interface QualityDefectFilters {
  severity?: DefectSeverity;
  status?: string;
  priority?: QualityPriority;
  category?: string;
  assigned_to_id?: string;
  detected_date_from?: string;
  detected_date_to?: string;
  cost_impact_min?: number;
  cost_impact_max?: number;
  search?: string;
}

// Utility functions
export const getQualityStatusColor = (status: QualityStatus): string => {
  switch (status) {
    case QualityStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case QualityStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-800';
    case QualityStatus.PASSED:
      return 'bg-green-100 text-green-800';
    case QualityStatus.FAILED:
      return 'bg-red-100 text-red-800';
    case QualityStatus.CONDITIONAL_PASS:
      return 'bg-orange-100 text-orange-800';
    case QualityStatus.REQUIRES_REVIEW:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getQualityPriorityColor = (priority: QualityPriority): string => {
  switch (priority) {
    case QualityPriority.LOW:
      return 'bg-gray-100 text-gray-800';
    case QualityPriority.MEDIUM:
      return 'bg-blue-100 text-blue-800';
    case QualityPriority.HIGH:
      return 'bg-orange-100 text-orange-800';
    case QualityPriority.CRITICAL:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getDefectSeverityColor = (severity: DefectSeverity): string => {
  switch (severity) {
    case DefectSeverity.MINOR:
      return 'bg-gray-100 text-gray-800';
    case DefectSeverity.MAJOR:
      return 'bg-yellow-100 text-yellow-800';
    case DefectSeverity.CRITICAL:
      return 'bg-orange-100 text-orange-800';
    case DefectSeverity.BLOCKER:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getInspectionTypeIcon = (type: InspectionType): string => {
  switch (type) {
    case InspectionType.VISUAL:
      return '👁️';
    case InspectionType.DIMENSIONAL:
      return '📏';
    case InspectionType.FUNCTIONAL:
      return '⚙️';
    case InspectionType.MATERIAL:
      return '🧪';
    case InspectionType.SAFETY:
      return '🛡️';
    case InspectionType.ENVIRONMENTAL:
      return '🌱';
    case InspectionType.DOCUMENTATION:
      return '📋';
    default:
      return '❓';
  }
};
