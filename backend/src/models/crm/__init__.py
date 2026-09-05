from __future__ import annotations

from .lead import Lead
from .lead_related import (
    LeadPipelineHistory,
    LeadNote,
    LeadTask,
    LeadEmail,
    LeadSms,
    LeadCampaign,
    LeadCampaignAssignment,
    LeadListingSearch,
    LeadPropertyView,
    LeadSale,
    LeadAdditionalContact,
    LeadSavedFilter,
)
from .customer import Customer
from .guarantor import CustomerGuarantor
from .contact import Contact
from .company import Company
from .opportunity import Opportunity
from .sales_activity import SalesActivity
from .enums import (
    LeadStatus,
    LeadPipelineStage,
    LeadRating,
    CallResult,
    LeadSource,
    OpportunityStage,
    ContactType,
    ActivityType,
    CompanySize,
    Industry,
    QuoteStatus,
    ContractStatus,
)

__all__ = [
    "Lead",
    "LeadPipelineHistory",
    "LeadNote",
    "LeadTask",
    "LeadEmail",
    "LeadSms",
    "LeadCampaign",
    "LeadCampaignAssignment",
    "LeadListingSearch",
    "LeadPropertyView",
    "LeadSale",
    "LeadAdditionalContact",
    "LeadSavedFilter",
    "Customer",
    "CustomerGuarantor",
    "Contact",
    "Company",
    "Opportunity",
    "SalesActivity",
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
    "CustomerAttachmentItem",
    "CustomerBase",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "CustomersListResponse",
    "CustomerStatsResponse",
    "GuarantorBase",
    "GuarantorCreate",
    "GuarantorUpdate",
    "GuarantorResponse",
]


def __getattr__(name: str):
    import importlib

    _customers = {
        "CustomerAttachmentItem",
        "CustomerBase",
        "CustomerCreate",
        "CustomerUpdate",
        "CustomerResponse",
        "CustomersListResponse",
        "CustomerStatsResponse",
    }
    _guarantors = {
        "GuarantorBase",
        "GuarantorCreate",
        "GuarantorUpdate",
        "GuarantorResponse",
    }
    if name in _customers:
        m = importlib.import_module("...api.v1.crm.customers.schemas", __package__)
        return getattr(m, name)
    if name in _guarantors:
        m = importlib.import_module("...api.v1.crm.guarantors.schemas", __package__)
        return getattr(m, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
