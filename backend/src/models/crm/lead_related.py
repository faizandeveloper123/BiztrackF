import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class LeadPipelineHistory(Base):
    __tablename__ = "lead_pipeline_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    pipelineStage = Column(String, nullable=False)
    changedAt = Column(DateTime, default=datetime.utcnow)
    changedById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)


class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    commType = Column(String, nullable=False, default="note")
    callResult = Column(String)
    content = Column(Text)
    occurredAt = Column(DateTime, default=datetime.utcnow)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    isSystem = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadTask(Base):
    __tablename__ = "lead_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    details = Column(Text)
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String, default="not_started")
    priority = Column(String, default="normal")
    dueAt = Column(DateTime)
    reminder = Column(String)
    completedAt = Column(DateTime)
    flagged = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadEmail(Base):
    __tablename__ = "lead_emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String)
    body = Column(Text)
    direction = Column(String, default="outgoing")
    status = Column(String, default="queued")
    trackingToken = Column(String, index=True)
    toEmail = Column(String)
    fromEmail = Column(String)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    sentAt = Column(DateTime)
    openedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadSms(Base):
    __tablename__ = "lead_sms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    direction = Column(String, default="outgoing")
    status = Column(String, default="queued")
    twilioSid = Column(String)
    toPhone = Column(String)
    fromPhone = Column(String)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    sentAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)


class LeadCampaign(Base):
    __tablename__ = "lead_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    steps = Column(JSON, default=[])
    status = Column(String, default="active")
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadCampaignAssignment(Base):
    __tablename__ = "lead_campaign_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    campaignId = Column(UUID(as_uuid=True), ForeignKey("lead_campaigns.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="in_progress")
    progress = Column(Integer, default=0)
    currentStep = Column(Integer, default=0)
    totalSteps = Column(Integer, default=0)
    assignedById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assignedAt = Column(DateTime, default=datetime.utcnow)
    stoppedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadListingSearch(Base):
    __tablename__ = "lead_listing_searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    criteria = Column(JSON, default={})
    city = Column(String)
    priceMin = Column(Float)
    priceMax = Column(Float)
    propertyTypes = Column(JSON, default=[])
    emailsSent = Column(Integer, default=0)
    lastSentAt = Column(DateTime)
    nextSendAt = Column(DateTime)
    intervalHours = Column(Integer, default=24)
    active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadPropertyView(Base):
    __tablename__ = "lead_property_views"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    propertyType = Column(String)
    beds = Column(Integer)
    baths = Column(Integer)
    price = Column(Float)
    city = Column(String)
    address = Column(String)
    mlsNumber = Column(String)
    viewedAt = Column(DateTime, default=datetime.utcnow)
    createdAt = Column(DateTime, default=datetime.utcnow)


class LeadSale(Base):
    __tablename__ = "lead_sales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    agentRole = Column(String)
    closingDate = Column(DateTime)
    mlsNumber = Column(String)
    sellingPrice = Column(Float)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LeadAdditionalContact(Base):
    __tablename__ = "lead_additional_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    leadId = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String)
    phone = Column(String)
    email = Column(String)
    relationshipLabel = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)


class LeadSavedFilter(Base):
    __tablename__ = "lead_saved_filters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String, nullable=False)
    filters = Column(JSON, default={})
    pinned = Column(Boolean, default=False)
    pinOrder = Column(Integer, default=0)
    color = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
