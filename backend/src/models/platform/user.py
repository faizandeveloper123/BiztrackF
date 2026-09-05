import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ...config.database_config import Base
from .associations import project_team_members


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    userName = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    firstName = Column(String)
    lastName = Column(String)
    hashedPassword = Column(String, nullable=False)
    userRole = Column(String, nullable=False, default="team_member")
    avatar = Column(String)
    isActive = Column(Boolean, default=True)
    lastLogin = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="users")
    tenant_users = relationship("TenantUser", back_populates="user")
    managed_projects = relationship("Project", foreign_keys="Project.projectManagerId", back_populates="projectManager")
    projects_created = relationship("Project", foreign_keys="Project.createdById", back_populates="creator")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignedToId", back_populates="assignedTo")
    created_tasks = relationship("Task", foreign_keys="Task.createdById", back_populates="createdBy")
    team_projects = relationship("Project", secondary=project_team_members, back_populates="teamMembers")
    createdCustomEventTypes = relationship("CustomEventType", back_populates="createdByUser", foreign_keys="CustomEventType.createdByUserId")
    createdCustomDepartments = relationship("CustomDepartment", back_populates="createdByUser", foreign_keys="CustomDepartment.createdByUserId")
    createdCustomLeaveTypes = relationship("CustomLeaveType", back_populates="createdByUser", foreign_keys="CustomLeaveType.createdByUserId")
    createdCustomLeadSources = relationship("CustomLeadSource", back_populates="createdByUser", foreign_keys="CustomLeadSource.createdByUserId")
    createdCustomContactSources = relationship("CustomContactSource", back_populates="createdByUser", foreign_keys="CustomContactSource.createdByUserId")
    createdCustomCompanyIndustries = relationship("CustomCompanyIndustry", back_populates="createdByUser", foreign_keys="CustomCompanyIndustry.createdByUserId")
    createdCustomContactTypes = relationship("CustomContactType", back_populates="createdByUser", foreign_keys="CustomContactType.createdByUserId")
    createdCustomIndustries = relationship("CustomIndustry", back_populates="createdByUser", foreign_keys="CustomIndustry.createdByUserId")
    created_events = relationship("Event", back_populates="createdBy", foreign_keys="Event.createdById")
    created_quotes = relationship("Quote", back_populates="creator", foreign_keys="Quote.createdBy")
    created_contracts = relationship("Contract", back_populates="creator", foreign_keys="Contract.createdBy")
    created_storage_locations = relationship("StorageLocation", back_populates="creator", foreign_keys="StorageLocation.createdBy")
    created_stock_movements = relationship("StockMovement", back_populates="creator", foreign_keys="StockMovement.createdBy")
    pos_shifts = relationship("POSShift", back_populates="employee", foreign_keys="POSShift.employeeId")
    created_training = relationship("Training", back_populates="creator", foreign_keys="Training.createdBy")
    created_training_enrollments = relationship("TrainingEnrollment", back_populates="creator", foreign_keys="TrainingEnrollment.createdBy")
    assigned_applications = relationship("Application", back_populates="assignee", foreign_keys="Application.assignedTo")
    created_applications = relationship("Application", back_populates="creator", foreign_keys="Application.createdBy")
    created_invoices = relationship("Invoice", back_populates="creator", foreign_keys="Invoice.createdBy")
    created_suppliers = relationship("Supplier", back_populates="creator", foreign_keys="Supplier.createdBy")
    created_chart_of_accounts = relationship("ChartOfAccounts", foreign_keys="ChartOfAccounts.created_by", back_populates="created_by_user")
    created_ledger_transactions = relationship("LedgerTransaction", foreign_keys="LedgerTransaction.created_by", back_populates="created_by_user")
    approved_ledger_transactions = relationship("LedgerTransaction", foreign_keys="LedgerTransaction.approved_by", back_populates="approved_by_user")
    created_journal_entries = relationship("JournalEntry", foreign_keys="JournalEntry.created_by", back_populates="created_by_user")
    posted_journal_entries = relationship("JournalEntry", foreign_keys="JournalEntry.posted_by", back_populates="posted_by_user")
    created_financial_periods = relationship("FinancialPeriod", foreign_keys="FinancialPeriod.created_by", back_populates="created_by_user")
    closed_financial_periods = relationship("FinancialPeriod", foreign_keys="FinancialPeriod.closed_by", back_populates="closed_by_user")
    created_budgets = relationship("Budget", foreign_keys="Budget.created_by", back_populates="created_by_user")
    assigned_quality_checks = relationship("QualityCheck", foreign_keys="QualityCheck.assigned_to_id", back_populates="assigned_to")
    created_quality_checks = relationship("QualityCheck", foreign_keys="QualityCheck.created_by_id", back_populates="created_by")
    conducted_inspections = relationship("QualityInspection", foreign_keys="QualityInspection.inspector_id", back_populates="inspector")
    detected_defects = relationship("QualityDefect", foreign_keys="QualityDefect.detected_by_id", back_populates="detected_by")
    assigned_defects = relationship("QualityDefect", foreign_keys="QualityDefect.assigned_to_id", back_populates="assigned_to")
    generated_quality_reports = relationship("QualityReport", foreign_keys="QualityReport.generated_by_id", back_populates="generated_by")
    created_investments = relationship("Investment", foreign_keys="Investment.created_by", back_populates="created_by_user")
    approved_investments = relationship("Investment", foreign_keys="Investment.approved_by", back_populates="approved_by_user")
    created_equipment_investments = relationship("EquipmentInvestment", foreign_keys="EquipmentInvestment.created_by", back_populates="created_by_user")
    created_investment_transactions = relationship("InvestmentTransaction", foreign_keys="InvestmentTransaction.created_by", back_populates="created_by_user")
