from pydantic import BaseModel

from .platform.enums import (
    UserRole,
    TenantRole,
    ModulePermission,
    SubscriptionStatus,
    PlanType,
    PlanFeature,
)
from .crm.enums import (
    LeadStatus,
    LeadSource,
    OpportunityStage,
    ContactType,
    ActivityType,
    CompanySize,
    Industry,
    QuoteStatus,
    ContractStatus,
)
from .projects.enums import (
    ProjectStatus,
    ProjectPriority,
    TaskStatus,
    TaskPriority,
)
from .healthcare.enums import (
    AppointmentStatus,
    AdmissionStatus,
)
from .ngo.enums import (
    DonorType,
    DonorStatus,
    DonorLeadStatus,
    DonorLeadSource,
    PartnerSector,
    PartnerSize,
    PartnerStatus,
)


class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


__all__ = [
    "Pagination",
    "UserRole",
    "TenantRole",
    "ModulePermission",
    "SubscriptionStatus",
    "PlanType",
    "PlanFeature",
    "LeadStatus",
    "LeadSource",
    "OpportunityStage",
    "ContactType",
    "ActivityType",
    "CompanySize",
    "Industry",
    "QuoteStatus",
    "ContractStatus",
    "ProjectStatus",
    "ProjectPriority",
    "TaskStatus",
    "TaskPriority",
    "AppointmentStatus",
    "AdmissionStatus",
    "DonorType",
    "DonorStatus",
    "DonorLeadStatus",
    "DonorLeadSource",
    "PartnerSector",
    "PartnerSize",
    "PartnerStatus",
]
