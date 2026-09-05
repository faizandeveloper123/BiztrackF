from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID

# Enums
class QualityStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    CONDITIONAL_PASS = "conditional_pass"
    REQUIRES_REVIEW = "requires_review"

class QualityPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class InspectionType(str, Enum):
    VISUAL = "visual"
    DIMENSIONAL = "dimensional"
    FUNCTIONAL = "functional"
    MATERIAL = "material"
    SAFETY = "safety"
    ENVIRONMENTAL = "environmental"
    DOCUMENTATION = "documentation"

class DefectSeverity(str, Enum):
    MINOR = "minor"
    MAJOR = "major"
    CRITICAL = "critical"
    BLOCKER = "blocker"

class QualityStandard(str, Enum):
    ISO_9001 = "iso_9001"
    ISO_14001 = "iso_14001"
    ISO_45001 = "iso_45001"
    FDA = "fda"
    CE = "ce"
    CUSTOM = "custom"

# Base Models
class QualityCheckBase(BaseModel):
    title: str = Field(..., description="Quality check title")
    description: Optional[str] = Field(None, description="Quality check description")
    inspection_type: InspectionType = Field(..., description="Type of inspection")
    priority: QualityPriority = Field(QualityPriority.MEDIUM, description="Quality check priority")
    quality_standard: QualityStandard = Field(..., description="Quality standard to follow")
    criteria: List[str] = Field(default_factory=list, description="Quality criteria to check")
    acceptance_criteria: Dict[str, Any] = Field(default_factory=dict, description="Acceptance criteria")
    tolerance_limits: Dict[str, Any] = Field(default_factory=dict, description="Tolerance limits")
    required_equipment: List[str] = Field(default_factory=list, description="Required equipment for inspection")
    required_skills: List[str] = Field(default_factory=list, description="Required skills for inspector")
    estimated_duration_minutes: int = Field(0, description="Estimated duration in minutes")
    project_id: Optional[str] = Field(None, description="Associated project ID")
    assigned_to_id: Optional[str] = Field(None, description="Assigned inspector ID")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled inspection date")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

class QualityInspectionBase(BaseModel):
    quality_check_id: str = Field(..., description="Associated quality check ID")
    inspector_id: str = Field(..., description="Inspector user ID")
    inspection_date: datetime = Field(..., description="Date of inspection")
    status: QualityStatus = Field(QualityStatus.PENDING, description="Inspection status")
    results: Dict[str, Any] = Field(default_factory=dict, description="Inspection results")
    measurements: Dict[str, Any] = Field(default_factory=dict, description="Measured values")
    defects_found: List[Dict[str, Any]] = Field(default_factory=list, description="Defects found during inspection")
    corrective_actions: List[str] = Field(default_factory=list, description="Corrective actions taken")
    notes: Optional[str] = Field(None, description="Additional notes")
    photos: List[str] = Field(default_factory=list, description="Photo URLs")
    documents: List[str] = Field(default_factory=list, description="Document URLs")
    compliance_score: float = Field(0.0, ge=0.0, le=100.0, description="Compliance score percentage")

class QualityDefectBase(BaseModel):
    title: str = Field(..., description="Defect title")
    description: str = Field(..., description="Defect description")
    severity: DefectSeverity = Field(..., description="Defect severity")
    category: str = Field(..., description="Defect category")
    location: Optional[str] = Field(None, description="Defect location")
    detected_date: datetime = Field(..., description="Date defect was detected")
    detected_by_id: str = Field(..., description="User who detected the defect")
    quality_check_id: Optional[str] = Field(None, description="Associated quality check ID")
    status: str = Field("open", description="Defect status")
    priority: QualityPriority = Field(QualityPriority.MEDIUM, description="Defect priority")
    assigned_to_id: Optional[str] = Field(None, description="Assigned user for resolution")
    estimated_resolution_date: Optional[datetime] = Field(None, description="Estimated resolution date")
    actual_resolution_date: Optional[datetime] = Field(None, description="Actual resolution date")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")
    cost_impact: float = Field(0.0, description="Cost impact of the defect")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

class QualityReportBase(BaseModel):
    title: str = Field(..., description="Report title")
    report_type: str = Field(..., description="Type of quality report")
    period_start: datetime = Field(..., description="Report period start date")
    period_end: datetime = Field(..., description="Report period end date")
    summary: str = Field(..., description="Report summary")
    key_findings: List[str] = Field(default_factory=list, description="Key findings")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Quality metrics")
    generated_by_id: str = Field(..., description="User who generated the report")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")

# Create Models
class QualityCheckCreate(QualityCheckBase):
    pass

class QualityInspectionCreate(QualityInspectionBase):
    pass

class QualityDefectCreate(QualityDefectBase):
    pass

class QualityReportCreate(QualityReportBase):
    pass

# Update Models
class QualityCheckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    inspection_type: Optional[InspectionType] = None
    priority: Optional[QualityPriority] = None
    quality_standard: Optional[QualityStandard] = None
    criteria: Optional[List[str]] = None
    acceptance_criteria: Optional[Dict[str, Any]] = None
    tolerance_limits: Optional[Dict[str, Any]] = None
    required_equipment: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    estimated_duration_minutes: Optional[int] = None
    project_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    status: Optional[QualityStatus] = None

class QualityInspectionUpdate(BaseModel):
    status: Optional[QualityStatus] = None
    results: Optional[Dict[str, Any]] = None
    measurements: Optional[Dict[str, Any]] = None
    defects_found: Optional[List[Dict[str, Any]]] = None
    corrective_actions: Optional[List[str]] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None
    documents: Optional[List[str]] = None
    compliance_score: Optional[float] = None

class QualityDefectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[DefectSeverity] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[QualityPriority] = None
    assigned_to_id: Optional[str] = None
    estimated_resolution_date: Optional[datetime] = None
    actual_resolution_date: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    cost_impact: Optional[float] = None
    tags: Optional[List[str]] = None

class QualityReportUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    key_findings: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    metrics: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

# Response Models
class QualityCheckResponse(QualityCheckBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    status: QualityStatus
    completion_percentage: float
    total_inspections: int
    passed_inspections: int
    failed_inspections: int
    pending_inspections: int

class QualityInspectionResponse(QualityInspectionBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    inspector_name: str
    quality_check_title: str

class QualityDefectResponse(QualityDefectBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    detected_by_name: str
    assigned_to_name: Optional[str] = None

class QualityReportResponse(QualityReportBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    generated_by_name: str

# List Response Models
class QualityChecksResponse(BaseModel):
    quality_checks: List[QualityCheckResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class QualityInspectionsResponse(BaseModel):
    quality_inspections: List[QualityInspectionResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class QualityDefectsResponse(BaseModel):
    quality_defects: List[QualityDefectResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class QualityReportsResponse(BaseModel):
    quality_reports: List[QualityReportResponse]
    total: int
    page: int
    limit: int
    total_pages: int

# Dashboard Models
class QualityDashboardStats(BaseModel):
    total_checks: int
    pending_checks: int
    in_progress_checks: int
    completed_checks: int
    passed_inspections: int
    failed_inspections: int
    open_defects: int
    critical_defects: int
    average_compliance_score: float
    total_cost_impact: float

class QualityDashboard(BaseModel):
    stats: QualityDashboardStats
    recent_checks: List[QualityCheckResponse]
    recent_inspections: List[QualityInspectionResponse]
    critical_defects: List[QualityDefectResponse]
    upcoming_checks: List[QualityCheckResponse]

# Filter Models
class QualityCheckFilters(BaseModel):
    status: Optional[QualityStatus] = None
    priority: Optional[QualityPriority] = None
    inspection_type: Optional[InspectionType] = None
    quality_standard: Optional[QualityStandard] = None
    project_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    scheduled_date_from: Optional[datetime] = None
    scheduled_date_to: Optional[datetime] = None
    search: Optional[str] = None

class QualityInspectionFilters(BaseModel):
    status: Optional[QualityStatus] = None
    inspector_id: Optional[str] = None
    quality_check_id: Optional[str] = None
    inspection_date_from: Optional[datetime] = None
    inspection_date_to: Optional[datetime] = None
    compliance_score_min: Optional[float] = None
    compliance_score_max: Optional[float] = None
    search: Optional[str] = None

class QualityDefectFilters(BaseModel):
    severity: Optional[DefectSeverity] = None
    status: Optional[str] = None
    priority: Optional[QualityPriority] = None
    category: Optional[str] = None
    assigned_to_id: Optional[str] = None
    detected_date_from: Optional[datetime] = None
    detected_date_to: Optional[datetime] = None
    cost_impact_min: Optional[float] = None
    cost_impact_max: Optional[float] = None
    search: Optional[str] = None
