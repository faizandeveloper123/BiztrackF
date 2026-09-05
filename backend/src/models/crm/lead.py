import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    company = Column(String)
    jobTitle = Column(String)
    leadSource = Column(String)
    status = Column(String, nullable=False, default="open")
    priority = Column(String, default="medium")
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text)
    tags = Column(JSON, default=[])
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pipelineStage = Column(String, default="new_lead")
    leadRating = Column(String)
    leadType = Column(String)
    priceMin = Column(Float)
    priceMax = Column(Float)
    buyIntent = Column(String)
    sellIntent = Column(String)
    houseToSell = Column(String)
    buyingIn = Column(String)
    sellingIn = Column(String)
    mortgageType = Column(String)
    ownsRents = Column(String)
    workPhone = Column(String)
    homePhone = Column(String)
    address = Column(Text)
    city = Column(String)
    description = Column(Text)
    ipAddress = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    mainAgentId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    listAgentId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    mortgageAgentId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    score = Column(Integer, default=0)
    budget = Column(Float)
    timeline = Column(String)
    estimatedValue = Column(Float)
    expectedCloseDate = Column(DateTime)
    lastContactAt = Column(DateTime)
    lastContactChannel = Column(String)
    registeredAt = Column(DateTime)
    isPartial = Column(Boolean, default=False)
    refSource = Column(String)
    campaignSource = Column(String)
    receiveSms = Column(Boolean, default=True)
    customFields = Column(JSON, default={})
    nextFollowUpDate = Column(DateTime)
    callCount = Column(Integer, default=0)
    emailCount = Column(Integer, default=0)
    smsCount = Column(Integer, default=0)
    lastCallAt = Column(DateTime)
    lastEmailAt = Column(DateTime)
    lastSmsAt = Column(DateTime)
    hasOpenTask = Column(Boolean, default=False)
    hasFlaggedTask = Column(Boolean, default=False)

    tenant = relationship("Tenant", back_populates="leads")
    assignedTo = relationship("User", foreign_keys=[assignedToId])
    mainAgent = relationship("User", foreign_keys=[mainAgentId])
    listAgent = relationship("User", foreign_keys=[listAgentId])
    mortgageAgent = relationship("User", foreign_keys=[mortgageAgentId])

    @property
    def activities(self):
        return []

    @property
    def createdBy(self):
        x = getattr(self, "createdById", None)
        return str(x) if x is not None else None
