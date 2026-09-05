from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import Contact, ContactCreate, ContactUpdate, CRMContactsResponse, ContactLedgerResponse
from . import logic

router = APIRouter()


@router.get("/contacts", response_model=CRMContactsResponse)
async def get_crm_contacts(
    type: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    website: Optional[str] = Query(None),
    birthday_month: Optional[int] = Query(None, ge=1, le=12),
    country: Optional[str] = Query(None),
    date_field: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    quick_filter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_contacts(
        db, current_user, tenant_context, type, company_id, search,
        assigned_to, industry, website, birthday_month, country,
        date_field, date_from, date_to, quick_filter, page, limit,
    )


@router.post("/contacts", response_model=Contact)
async def create_crm_contact(
    contact_data: ContactCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_crm_contact(contact_data, current_user, db, tenant_context)


@router.get("/contacts/{contact_id}", response_model=Contact)
async def get_crm_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_contact(contact_id, db, current_user, tenant_context)


@router.get("/contacts/{contact_id}/ledger", response_model=ContactLedgerResponse)
async def get_crm_contact_ledger(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_contact_ledger(contact_id, db, current_user, tenant_context)


@router.put("/contacts/{contact_id}", response_model=Contact)
async def update_crm_contact(
    contact_id: str,
    contact_data: ContactUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_crm_contact(contact_id, contact_data, current_user, db, tenant_context)


@router.delete("/contacts/{contact_id}")
async def delete_crm_contact(
    contact_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_crm_contact(contact_id, current_user, db, tenant_context)
