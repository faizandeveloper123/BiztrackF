from typing import Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy.inspection import inspect as sa_inspect

from .donors.schemas import Donor
from .donor_leads.schemas import DonorLead
from .partner_organizations.schemas import PartnerOrganization

T = TypeVar("T", bound=BaseModel)


def orm_to_schema(schema_cls: Type[T], orm, **extra) -> T:
    data = {a.key: getattr(orm, a.key) for a in sa_inspect(orm).mapper.column_attrs}
    if data.get("id") is not None:
        data["id"] = str(data["id"])
    if data.get("tenant_id") is not None:
        data["tenant_id"] = str(data["tenant_id"])
    for key, val in list(data.items()):
        if isinstance(val, UUID):
            data[key] = str(val)
    if data.get("total_donated") is not None:
        data["total_donated"] = float(data["total_donated"])
    data.update(extra)
    return schema_cls.model_validate(data)


def donor_to_schema(orm) -> Donor:
    return orm_to_schema(Donor, orm)


def donor_lead_to_schema(orm) -> DonorLead:
    return orm_to_schema(DonorLead, orm)


def partner_to_schema(orm) -> PartnerOrganization:
    return orm_to_schema(PartnerOrganization, orm)
