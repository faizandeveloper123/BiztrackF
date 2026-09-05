import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base
import enum

class QualityStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    CONDITIONAL_PASS = "conditional_pass"
    REQUIRES_REVIEW = "requires_review"

class QualityPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class InspectionType(str, enum.Enum):
    VISUAL = "visual"
    DIMENSIONAL = "dimensional"
    FUNCTIONAL = "functional"
    MATERIAL = "material"
    SAFETY = "safety"
    ENVIRONMENTAL = "environmental"
    DOCUMENTATION = "documentation"

class DefectSeverity(str, enum.Enum):
    MINOR = "minor"
    MAJOR = "major"
    CRITICAL = "critical"
    BLOCKER = "blocker"

class QualityStandard(str, enum.Enum):
    ISO_9001 = "iso_9001"
    ISO_14001 = "iso_14001"
    ISO_45001 = "iso_45001"
    FDA = "fda"
    CE = "ce"
    CUSTOM = "custom"

class QualityCheck(Base):
    __tablename__ = "quality_checks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Basic Information
    check_number = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    inspection_type = Column(Enum(InspectionType), nullable=False)
    priority = Column(Enum(QualityPriority), nullable=False, default=QualityPriority.MEDIUM)
    quality_standard = Column(Enum(QualityStandard), nullable=False)
    
    # Criteria and Standards
    criteria = Column(JSON, default=[])
    acceptance_criteria = Column(JSON, default={})
    tolerance_limits = Column(JSON, default={})
    
    # Requirements
    required_equipment = Column(JSON, default=[])
    required_skills = Column(JSON, default=[])
    estimated_duration_minutes = Column(Integer, default=0)
    
    # Associations
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)

    # Assignment
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Scheduling
    scheduled_date = Column(DateTime)
    status = Column(Enum(QualityStatus), nullable=False, default=QualityStatus.PENDING)
    
    # Progress Tracking
    completion_percentage = Column(Float, default=0.0)
    current_step = Column(String)
    notes = Column(JSON, default=[])
    
    # Metadata
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="quality_checks")
    project = relationship("Project", back_populates="quality_checks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_quality_checks")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_quality_checks")
    quality_inspections = relationship("QualityInspection", back_populates="quality_check", cascade="all, delete-orphan")
    quality_defects = relationship("QualityDefect", back_populates="quality_check", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_quality_checks_tenant_status', 'tenant_id', 'status'),
        Index('idx_quality_checks_tenant_priority', 'tenant_id', 'priority'),
        Index('idx_quality_checks_tenant_type', 'tenant_id', 'inspection_type'),
        Index('idx_quality_checks_scheduled_date', 'scheduled_date'),
    )

class QualityInspection(Base):
    __tablename__ = "quality_inspections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Association
    quality_check_id = Column(UUID(as_uuid=True), ForeignKey("quality_checks.id"), nullable=False, index=True)
    inspector_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Inspection Details
    inspection_date = Column(DateTime, nullable=False)
    status = Column(Enum(QualityStatus), nullable=False, default=QualityStatus.PENDING)
    
    # Results
    results = Column(JSON, default={})
    measurements = Column(JSON, default={})
    defects_found = Column(JSON, default=[])
    corrective_actions = Column(JSON, default=[])
    
    # Documentation
    notes = Column(Text)
    photos = Column(JSON, default=[])
    documents = Column(JSON, default=[])
    
    # Metrics
    compliance_score = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="quality_inspections")
    quality_check = relationship("QualityCheck", back_populates="quality_inspections")
    inspector = relationship("User", foreign_keys=[inspector_id], back_populates="conducted_inspections")
    
    # Indexes
    __table_args__ = (
        Index('idx_quality_inspections_tenant_status', 'tenant_id', 'status'),
        Index('idx_quality_inspections_tenant_inspector', 'tenant_id', 'inspector_id'),
        Index('idx_quality_inspections_inspection_date', 'inspection_date'),
        Index('idx_quality_inspections_compliance_score', 'compliance_score'),
    )

class QualityDefect(Base):
    __tablename__ = "quality_defects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Basic Information
    defect_number = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(DefectSeverity), nullable=False)
    category = Column(String, nullable=False)
    location = Column(String)
    
    # Detection
    detected_date = Column(DateTime, nullable=False)
    detected_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Associations
    quality_check_id = Column(UUID(as_uuid=True), ForeignKey("quality_checks.id"), nullable=True, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)

    # Status and Assignment
    status = Column(String, default="open")
    priority = Column(Enum(QualityPriority), nullable=False, default=QualityPriority.MEDIUM)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    # Resolution
    estimated_resolution_date = Column(DateTime)
    actual_resolution_date = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Impact
    cost_impact = Column(Float, default=0.0)
    
    # Metadata
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="quality_defects")
    quality_check = relationship("QualityCheck", back_populates="quality_defects")
    project = relationship("Project", back_populates="quality_defects")
    detected_by = relationship("User", foreign_keys=[detected_by_id], back_populates="detected_defects")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_defects")
    
    # Indexes
    __table_args__ = (
        Index('idx_quality_defects_tenant_status', 'tenant_id', 'status'),
        Index('idx_quality_defects_tenant_severity', 'tenant_id', 'severity'),
        Index('idx_quality_defects_tenant_priority', 'tenant_id', 'priority'),
        Index('idx_quality_defects_detected_date', 'detected_date'),
        Index('idx_quality_defects_cost_impact', 'cost_impact'),
        Index('idx_quality_defects_project_id', 'project_id'),
    )

class QualityReport(Base):
    __tablename__ = "quality_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Basic Information
    report_number = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    report_type = Column(String, nullable=False)
    
    # Period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Content
    summary = Column(Text, nullable=False)
    key_findings = Column(JSON, default=[])
    recommendations = Column(JSON, default=[])
    metrics = Column(JSON, default={})
    
    # Generation
    generated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Metadata
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="quality_reports")
    generated_by = relationship("User", foreign_keys=[generated_by_id], back_populates="generated_quality_reports")
    
    # Indexes
    __table_args__ = (
        Index('idx_quality_reports_tenant_type', 'tenant_id', 'report_type'),
        Index('idx_quality_reports_period', 'period_start', 'period_end'),
        Index('idx_quality_reports_generated_by', 'generated_by_id'),
    )
