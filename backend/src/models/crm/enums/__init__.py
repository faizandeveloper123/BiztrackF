from enum import Enum


class LeadStatus(str, Enum):
    NEW = "new"
    OPEN = "open"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"
    CLOSED = "closed"


class LeadPipelineStage(str, Enum):
    NEW_LEAD = "new_lead"
    TRIED_TO_CONTACT = "tried_to_contact"
    MADE_CONTACT = "made_contact"
    QUALIFIED = "qualified"
    APPOINTMENT_SET = "appointment_set"
    OFFER_MADE = "offer_made"
    UNDER_CONTRACT = "under_contract"
    CLOSED = "closed"
    LOST = "lost"


class LeadRating(str, Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


class CallResult(str, Enum):
    LEAD_CALLED_IN = "Lead Called In"
    CONNECTED = "Connected"
    INTERESTED = "Interested"
    ATTEMPTED = "Attempted"
    CALLED_NO_MESSAGE = "Called (No message left)"
    OPT_OUT = "Opt Out - Do not call"
    LEAD_NOT_THERE = "Lead Is Not There"
    TALKED_TO_LEAD = "Talked to Lead"
    WRONG_NUMBER = "Wrong Number"
    LEFT_VOICE_MAIL = "Left Voice Mail"


class LeadSource(str, Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"
    EMAIL_CAMPAIGN = "email_campaign"
    COLD_CALL = "cold_call"
    TRADE_SHOW = "trade_show"
    PARTNER = "partner"
    OTHER = "other"


class OpportunityStage(str, Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ContactType(str, Enum):
    LEAD = "lead"
    CUSTOMER = "customer"
    PARTNER = "partner"
    VENDOR = "vendor"
    OTHER = "other"


class ActivityType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    PROPOSAL = "proposal"
    CONTRACT = "contract"


class CompanySize(str, Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"


class Industry(str, Enum):
    TECHNOLOGY = "technology"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    CONSULTING = "consulting"


class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ContractStatus(str, Enum):
    DRAFT = "draft"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    OTHER = "other"


__all__ = [
    "LeadStatus",
    "LeadPipelineStage",
    "LeadRating",
    "CallResult",
    "LeadSource",
    "OpportunityStage",
    "ContactType",
    "ActivityType",
    "CompanySize",
    "Industry",
    "QuoteStatus",
    "ContractStatus",
]
