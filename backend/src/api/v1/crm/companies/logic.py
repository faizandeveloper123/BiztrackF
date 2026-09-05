import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....models.crm import Company as CompanyORM
from ..http_common import (
    apply_scoped_filters,
    delete_message,
    pagination,
    require_tenant,
    safe_uuid,
    tenant_id_optional,
    visible_or_404,
)
from ...repository import create_entity, delete_by_id, get_by_id, list_for_tenant, update_entity
from ..shared import _pydantic_company_from_orm
from .schemas import Company, CompanyCreate, CompanyUpdate, CRMCompaniesResponse


def get_company_by_id(company_id: str, db: Session, tenant_id: str = None) -> Optional[CompanyORM]:
    return get_by_id(CompanyORM, company_id, db, tenant_id)


def _get_all_companies(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CompanyORM]:
    return list_for_tenant(CompanyORM, db, tenant_id, skip, limit)


get_companies = _get_all_companies
get_all_companies = _get_all_companies


def get_companies_by_industry(industry: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CompanyORM]:
    return list_for_tenant(CompanyORM, db, tenant_id, skip, limit, filters=[CompanyORM.industry == industry])


def _create_company(company_data: dict, db: Session) -> CompanyORM:
    return create_entity(CompanyORM, company_data, db)


def _update_company(company_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CompanyORM]:
    company = get_company_by_id(company_id, db, tenant_id)
    if not company:
        return None
    filtered = {k: v for k, v in update_data.items() if v is not None}
    return update_entity(company, filtered, db)


def delete_company(company_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(CompanyORM, company_id, db, tenant_id)


def _company_predicate(industry, size, search):
    def _match(company: CompanyORM) -> bool:
        if industry and company.industry != industry:
            return False
        if size and getattr(company, "size", None) != size:
            return False
        if search:
            sl = search.lower()
            if not any(sl in (getattr(company, f, None) or "").lower() for f in ("name", "industry", "city")):
                return False
        return True

    return _match


def get_crm_companies(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    industry: Optional[str] = None,
    size: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    try:
        skip = (page - 1) * limit
        tid = tenant_id_optional(tenant_context)
        companies = get_companies(db, tid, skip, limit)
        companies = apply_scoped_filters(
            companies, tenant_context, current_user, _company_predicate(industry, size, search)
        )
        total = len(companies)
        return CRMCompaniesResponse(
            companies=[_pydantic_company_from_orm(c) for c in companies],
            pagination=pagination(page, limit, total),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching companies: {str(e)}")


def create_crm_company(company_data: CompanyCreate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        data = company_data.dict()
        payload = {
            "id": uuid.uuid4(),
            "tenant_id": safe_uuid(ctx["tenant_id"]) or uuid.uuid4(),
            "createdById": safe_uuid(current_user.id),
            "name": data.get("name", ""),
            "industry": data.get("industry"),
            "website": data.get("website"),
            "phone": data.get("phone"),
            "address": data.get("address"),
            "city": data.get("city"),
            "state": data.get("state"),
            "country": data.get("country"),
            "postalCode": data.get("postalCode"),
            "annualRevenue": data.get("annualRevenue"),
            "employeeCount": data.get("employeeCount"),
            "isActive": data.get("isActive", True),
            "notes": data.get("notes"),
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }
        return _pydantic_company_from_orm(_create_company(payload, db))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating company: {str(e)}")


def get_crm_company(company_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        company = get_company_by_id(company_id, db, tenant_id_optional(tenant_context))
        return _pydantic_company_from_orm(
            visible_or_404(company, tenant_context, current_user, detail="Company not found")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching company: {str(e)}")


def update_crm_company(company_id: str, company_data: CompanyUpdate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_company_by_id(company_id, db, tid), tenant_context, current_user, detail="Company not found")
        update_data = company_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.now()
        updated = _update_company(company_id, update_data, db, tid)
        return _pydantic_company_from_orm(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating company: {str(e)}")


def delete_crm_company(company_id: str, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_company_by_id(company_id, db, tid), tenant_context, current_user, detail="Company not found")
        if not delete_company(company_id, db, tid):
            raise HTTPException(status_code=404, detail="Company not found")
        return delete_message("Company")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting company: {str(e)}")


create_company = _create_company
update_company = _update_company
