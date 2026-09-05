import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Integer, Text, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base
from ...config.core_models import project_team_members
from .enums import ProjectStatus, ProjectPriority


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.PLANNING)
    priority = Column(Enum(ProjectPriority), nullable=False, default=ProjectPriority.MEDIUM)
    startDate = Column(String)
    endDate = Column(String)
    completionPercent = Column(Integer, default=0)
    budget = Column(Float)
    actualCost = Column(Float, default=0.0)
    projectManagerId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text)
    clientEmail = Column(String)
    deletionStatus = Column(String, nullable=False, default="none")
    deletionRequestedById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    deletionRequestedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="projects")
    projectManager = relationship("User", foreign_keys=[projectManagerId], back_populates="managed_projects")
    creator = relationship("User", foreign_keys=[createdById], back_populates="projects_created")
    teamMembers = relationship("User", secondary=project_team_members, back_populates="team_projects")
    tasks = relationship("Task", back_populates="project")
    events = relationship("Event", back_populates="project")
    quality_checks = relationship("QualityCheck", back_populates="project")
    quality_defects = relationship("QualityDefect", back_populates="project")

    __table_args__ = (
        Index("idx_projects_tenant_id", "tenant_id"),
        Index("idx_projects_status", "status"),
        Index("idx_projects_priority", "priority"),
        Index("idx_projects_created_at", "createdAt"),
        Index("idx_projects_manager", "projectManagerId"),
        Index("idx_projects_created_by", "createdById"),
        Index("idx_projects_tenant_status", "tenant_id", "status"),
    )
