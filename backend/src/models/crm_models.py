from __future__ import annotations

def __getattr__(name: str):
    import importlib
    _map = {
        **{k: "leads" for k in (
            "LeadBase", "LeadCreate", "LeadUpdate", "Lead",
            "CRMLeadsResponse", "LeadsResponse",
        )},
        **{k: "contacts" for k in (
            "ContactAttachmentItem", "ContactAddressItem", "ContactSocialLinks",
            "ContactBase", "ContactCreate", "ContactUpdate", "Contact",
            "CRMContactsResponse", "ContactsResponse",
        )},
        **{k: "companies" for k in (
            "CompanyBase", "CompanyCreate", "CompanyUpdate", "Company",
            "CRMCompaniesResponse", "CompaniesResponse",
        )},
        **{k: "opportunities" for k in (
            "OpportunityBase", "OpportunityCreate", "OpportunityUpdate", "Opportunity",
            "CRMOpportunitiesResponse", "OpportunitiesResponse",
        )},
        **{k: "quotes" for k in (
            "QuoteItem", "QuoteBase", "QuoteCreate", "QuoteUpdate", "Quote",
            "QuotesResponse", "ContractBase", "ContractCreate", "ContractUpdate", "Contract",
            "ContractsResponse",
        )},
        **{k: "activities" for k in (
            "SalesActivityBase", "SalesActivityCreate", "SalesActivityUpdate", "SalesActivity",
            "CRMActivitiesResponse", "SalesActivitiesResponse",
            "SalesMetrics", "SalesPipeline", "SalesDashboard",
        )},
        **{k: "dashboard" for k in (
            "CRMMetrics", "CRMPipeline", "CRMDashboard",
        )},
    }
    mod = _map.get(name)
    if mod is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    m = importlib.import_module(f"..api.v1.crm.{mod}.schemas", __package__)
    return getattr(m, name)

__all__ = [
    "ContactAttachmentItem", "ContactAddressItem", "ContactSocialLinks",
    "LeadBase", "LeadCreate", "LeadUpdate", "Lead",
    "ContactBase", "ContactCreate", "ContactUpdate", "Contact",
    "CompanyBase", "CompanyCreate", "CompanyUpdate", "Company",
    "OpportunityBase", "OpportunityCreate", "OpportunityUpdate", "Opportunity",
    "QuoteItem", "QuoteBase", "QuoteCreate", "QuoteUpdate", "Quote",
    "ContractBase", "ContractCreate", "ContractUpdate", "Contract",
    "SalesActivityBase", "SalesActivityCreate", "SalesActivityUpdate", "SalesActivity",
    "LeadsResponse", "ContactsResponse", "CompaniesResponse", "OpportunitiesResponse",
    "QuotesResponse", "ContractsResponse", "SalesActivitiesResponse",
    "SalesMetrics", "SalesPipeline", "SalesDashboard",
    "CRMLeadsResponse", "CRMContactsResponse", "CRMCompaniesResponse",
    "CRMOpportunitiesResponse", "CRMActivitiesResponse",
    "CRMMetrics", "CRMPipeline", "CRMDashboard",
]
