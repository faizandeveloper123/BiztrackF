from enum import Enum


class DonorType(str, Enum):
    INDIVIDUAL = "individual"
    CORPORATE = "corporate"
    ANONYMOUS = "anonymous"


class DonorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class DonorLeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"


class DonorLeadSource(str, Enum):
    WEBSITE = "website"
    EVENT = "event"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"
    CAMPAIGN = "campaign"
    OTHER = "other"


class PartnerSector(str, Enum):
    RELIEF = "relief"
    MEDICAL = "medical"
    EDUCATION = "education"
    FOOD = "food"


class PartnerSize(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class PartnerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


__all__ = [
    "DonorType",
    "DonorStatus",
    "DonorLeadStatus",
    "DonorLeadSource",
    "PartnerSector",
    "PartnerSize",
    "PartnerStatus",
]
