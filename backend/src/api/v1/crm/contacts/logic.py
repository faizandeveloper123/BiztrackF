import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import String, and_, cast, extract, func, or_
from sqlalchemy.orm import Session

from .....models.crm import Company, Contact
from .....services.contact_financials import batch_contact_financials, resolve_date_range
from ..db_common import (
    attachment_item_to_dict,
    attachment_url_from_stored,
    attachment_urls_set,
    contact_addresses_to_orm,
    contact_social_to_orm,
    delete_s3_for_file_url,
    find_contact_by_any_email,
    prepare_labeled_contact_dict,
)



def get_contact_by_id(contact_id: str, db: Session, tenant_id: str = None) -> Optional[Contact]:
    query = db.query(Contact).filter(Contact.id == contact_id)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.first()

def _get_all_contacts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    query = db.query(Contact)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.order_by(Contact.createdAt.desc()).offset(skip).limit(limit).all()


def get_contacts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    return _get_all_contacts(db, tenant_id, skip, limit)


get_all_contacts = _get_all_contacts


def search_contacts(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    type_: Optional[str] = None,
    company_id: Optional[str] = None,
    search: Optional[str] = None,
    assigned_to: Optional[str] = None,
    industry: Optional[str] = None,
    website: Optional[str] = None,
    birthday_month: Optional[int] = None,
    country: Optional[str] = None,
    date_field: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    quick_filter: Optional[str] = None,
    crm_scope_user_id: Optional[str] = None,
) -> Tuple[List[Contact], int]:
    q = db.query(Contact).filter(Contact.tenant_id == tenant_id)
    if crm_scope_user_id:
        try:
            uid = uuid.UUID(str(crm_scope_user_id))
        except (ValueError, TypeError):
            q = q.filter(False)
        else:
            q = q.filter(
                or_(Contact.assignedToId == uid, Contact.createdById == uid)
            )
    if industry:
        q = q.join(Company, Contact.companyId == Company.id).filter(
            Company.industry == industry
        )
    if type_:
        q = q.filter(
            or_(
                Contact.contactSource == type_,
                and_(Contact.contactSource.is_(None), type_ == "customer"),
            )
        )
    if company_id:
        try:
            q = q.filter(Contact.companyId == uuid.UUID(str(company_id)))
        except (ValueError, TypeError):
            q = q.filter(False)
    if assigned_to:
        try:
            q = q.filter(Contact.assignedToId == uuid.UUID(str(assigned_to)))
        except (ValueError, TypeError):
            q = q.filter(False)
    if website and website.strip():
        w = website.strip()
        q = q.filter(Contact.website.ilike(f"%{w}%"))
    if birthday_month is not None and 1 <= birthday_month <= 12:
        q = q.filter(extract("month", Contact.birthday) == birthday_month)
    if country and country.strip():
        c = country.strip()
        q = q.filter(cast(Contact.addresses, String).ilike(f"%{c}%"))
    start, end = resolve_date_range(quick_filter, date_from, date_to)
    field = (date_field or "created").lower()
    if start or end:
        col = Contact.createdAt
        if field == "updated":
            col = Contact.updatedAt
        elif field == "last_contacted":
            col = Contact.lastContactDate
        if start:
            q = q.filter(col >= start)
        if end:
            q = q.filter(col < end)
    if search and search.strip():
        term = f"%{search.strip()}%"
        blob = func.concat(
            func.coalesce(cast(Contact.emails, String), ""),
            func.coalesce(cast(Contact.phones, String), ""),
            func.coalesce(cast(Contact.addresses, String), ""),
            func.coalesce(cast(Contact.socialLinks, String), ""),
            func.coalesce(Contact.initials, ""),
            func.coalesce(Contact.fullName, ""),
            func.coalesce(Contact.businessTaxId, ""),
            func.coalesce(Contact.email, ""),
            func.coalesce(Contact.phone, ""),
            func.coalesce(Contact.mobile, ""),
        )
        q = q.filter(
            or_(
                Contact.firstName.ilike(term),
                Contact.lastName.ilike(term),
                Contact.email.ilike(term),
                Contact.phone.ilike(term),
                Contact.mobile.ilike(term),
                Contact.jobTitle.ilike(term),
                blob.ilike(term),
            )
        )
    total = q.count()
    rows = q.order_by(Contact.createdAt.desc()).offset(skip).limit(limit).all()
    return rows, total

def get_contacts_by_company(company_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Contact]:
    query = db.query(Contact).filter(Contact.companyId == company_id)
    if tenant_id:
        query = query.filter(Contact.tenant_id == tenant_id)
    return query.order_by(Contact.createdAt.desc()).offset(skip).limit(limit).all()

def create_contact(contact_data: dict, db: Session) -> Contact:
    contact_data["addresses"] = contact_addresses_to_orm(contact_data.get("addresses"))
    contact_data["socialLinks"] = contact_social_to_orm(contact_data.get("socialLinks"))
    atts = contact_data.get("attachments")
    if atts is None:
        contact_data["attachments"] = []
    else:
        contact_data["attachments"] = [attachment_item_to_dict(x) for x in atts]
    if contact_data.get("description") == "":
        contact_data["description"] = None
    tid = str(contact_data.get("tenant_id", ""))
    prepare_labeled_contact_dict(contact_data, customer_email_blank_string=False)
    for em in contact_data.get("emails") or []:
        ev = (em.get("value") or "").strip().lower()
        if not ev:
            continue
        existing = find_contact_by_any_email(db, ev, tid)
        if existing:
            raise ValueError(f"Contact with email '{ev}' already exists")
    db_contact = Contact(**contact_data)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def update_contact(contact_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Contact]:
    contact = get_contact_by_id(contact_id, db, tenant_id)
    if not contact:
        return None
    if "description" in update_data and update_data["description"] == "":
        update_data["description"] = None
    if "attachments" in update_data:
        new_atts = update_data.get("attachments")
        if new_atts is None:
            update_data["attachments"] = []
        else:
            old_urls = attachment_urls_set(contact.attachments)
            new_urls = attachment_urls_set(new_atts)
            for url in old_urls - new_urls:
                delete_s3_for_file_url(url)
            update_data["attachments"] = [attachment_item_to_dict(x) for x in new_atts]
    if "addresses" in update_data:
        update_data["addresses"] = contact_addresses_to_orm(update_data.get("addresses"))
    if "socialLinks" in update_data:
        update_data["socialLinks"] = contact_social_to_orm(update_data.get("socialLinks"))
    tid = str(tenant_id) if tenant_id else str(contact.tenant_id)
    if any(k in update_data for k in ("emails", "phones", "email", "phone", "mobile")):
        merged = {
            "emails": list(contact.emails or []),
            "phones": list(contact.phones or []),
            "email": contact.email,
            "phone": contact.phone,
            "mobile": contact.mobile,
        }
        for k in ("emails", "phones", "email", "phone", "mobile"):
            if k in update_data:
                merged[k] = update_data[k]
        prepare_labeled_contact_dict(merged, customer_email_blank_string=False)
        for k in ("emails", "phones", "email", "phone", "mobile"):
            update_data[k] = merged[k]
        for em in merged.get("emails") or []:
            ev = (em.get("value") or "").strip().lower()
            if not ev:
                continue
            existing = find_contact_by_any_email(db, ev, tid)
            if existing and str(existing.id) != str(contact_id):
                raise ValueError(f"Contact with email '{ev}' already exists")
    for key, value in update_data.items():
        if not hasattr(contact, key):
            continue
        if value is not None or key in (
            "email", "notes", "description", "phone", "mobile", "emails", "phones",
            "initials", "fullName", "birthday", "businessTaxId", "website", "addresses", "socialLinks",
            "assignedToId", "clientValue", "lastContactDate",
        ):
            setattr(contact, key, value)
    contact.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(contact)
    return contact

def delete_contact(contact_id: str, db: Session, tenant_id: str = None) -> bool:
    contact = get_contact_by_id(contact_id, db, tenant_id)
    if not contact:
        return False
    for att in (contact.attachments or []):
        delete_s3_for_file_url(attachment_url_from_stored(att))
    db.delete(contact)
    db.commit()
    return True


import logging
import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..http_common import (
    delete_message,
    notify_crm_broadcast,
    pagination,
    require_tenant,
    tenant_id_optional,
    tenant_id_str,
    user_display_name,
    visible_or_404,
)
from ..shared import _crm_scope_user_id, _contact_create_to_orm_dict, ensure_lead_row_for_contact
from .schemas import Contact as ContactSchema, ContactCreate, ContactUpdate, CRMContactsResponse

logger = logging.getLogger(__name__)


def get_crm_contacts(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    type: Optional[str] = None,
    company_id: Optional[str] = None,
    search: Optional[str] = None,
    assigned_to: Optional[str] = None,
    industry: Optional[str] = None,
    website: Optional[str] = None,
    birthday_month: Optional[int] = None,
    country: Optional[str] = None,
    date_field: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    quick_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    try:
        ctx = require_tenant(tenant_context)
        skip = (page - 1) * limit
        parsed_from = datetime.fromisoformat(date_from.replace("Z", "+00:00")).replace(tzinfo=None) if date_from else None
        parsed_to = datetime.fromisoformat(date_to.replace("Z", "+00:00")).replace(tzinfo=None) if date_to else None
        contacts, total = search_contacts(
            db,
            tenant_id_str(ctx),
            skip=skip,
            limit=limit,
            type_=type,
            company_id=company_id,
            search=search,
            assigned_to=assigned_to,
            industry=industry,
            website=website,
            birthday_month=birthday_month,
            country=country,
            date_field=date_field,
            date_from=parsed_from,
            date_to=parsed_to,
            quick_filter=quick_filter,
            crm_scope_user_id=_crm_scope_user_id(ctx, current_user),
        )
        financials = batch_contact_financials(db, tenant_id_str(ctx), contacts)
        enriched = []
        for c in contacts:
            data = ContactSchema.model_validate(c, from_attributes=True).model_dump()
            data.update(financials.get(str(c.id), {}))
            enriched.append(ContactSchema.model_validate(data))
        return CRMContactsResponse(contacts=enriched, pagination=pagination(page, limit, total))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contacts: {str(e)}")


def create_crm_contact(contact_data: ContactCreate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = tenant_id_str(ctx)
        contact = create_contact(_contact_create_to_orm_dict(contact_data, tid, str(current_user.id)), db)
        try:
            ensure_lead_row_for_contact(contact, db, tid, str(current_user.id))
        except Exception as sync_err:
            logger.warning("Could not create lead row for contact: %s", sync_err, exc_info=True)
        label = f"{contact_data.firstName} {contact_data.lastName}".strip() or "Contact"
        notify_crm_broadcast(
            db, ctx, current_user,
            title="New Contact Created",
            message=f"{user_display_name(current_user)} created a new contact: {label}",
            path=f"/crm/contacts/{contact.id}",
            meta={"contact_id": str(contact.id), "created_by": str(current_user.id)},
        )
        return contact
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating contact: {str(e)}")


def get_crm_contact(contact_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        contact = get_contact_by_id(contact_id, db, tenant_id_optional(tenant_context))
        visible = visible_or_404(contact, tenant_context, current_user, detail="Contact not found")
        from .....services.contact_financials import compute_contact_financials
        data = ContactSchema.model_validate(visible, from_attributes=True).model_dump()
        tid = tenant_id_optional(tenant_context)
        if tid:
            data.update(compute_contact_financials(db, str(tid), visible))
        return ContactSchema.model_validate(data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact: {str(e)}")


def _contact_update_payload(contact_data: ContactUpdate) -> dict:
    update_data = contact_data.dict(exclude_unset=True)
    for k in ("tags", "isPrimary"):
        update_data.pop(k, None)
    if "contactType" in update_data:
        ct = update_data.pop("contactType")
        if ct is not None:
            update_data["contactSource"] = ct.value if hasattr(ct, "value") else str(ct)
    if update_data.get("companyId"):
        try:
            update_data["companyId"] = uuid.UUID(str(update_data["companyId"]))
        except (ValueError, TypeError):
            update_data["companyId"] = None
    if "assignedTo" in update_data:
        at = update_data.pop("assignedTo", None)
        if at:
            try:
                update_data["assignedToId"] = uuid.UUID(str(at))
            except (ValueError, TypeError):
                update_data["assignedToId"] = None
        else:
            update_data["assignedToId"] = None
    update_data["updatedAt"] = datetime.utcnow()
    return update_data


def update_crm_contact(contact_id: str, contact_data: ContactUpdate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_contact_by_id(contact_id, db, tid), tenant_context, current_user, detail="Contact not found")
        updated = update_contact(contact_id, _contact_update_payload(contact_data), db, tid)
        try:
            ensure_lead_row_for_contact(updated, db, tid, str(current_user.id))
        except Exception as sync_err:
            logger.warning("Could not sync lead row for contact: %s", sync_err, exc_info=True)
        label = f"{getattr(updated, 'firstName', '')} {getattr(updated, 'lastName', '')}".strip() or "Contact"
        notify_crm_broadcast(
            db, ctx, current_user,
            title="Contact Updated",
            message=f"{user_display_name(current_user)} updated contact: {label}",
            path=f"/crm/contacts/{contact_id}",
            meta={"contact_id": contact_id, "updated_by": str(current_user.id)},
        )
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating contact: {str(e)}")


def delete_crm_contact(contact_id: str, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_contact_by_id(contact_id, db, tid), tenant_context, current_user, detail="Contact not found")
        if not delete_contact(contact_id, db, tid):
            raise HTTPException(status_code=404, detail="Contact not found")
        return delete_message("Contact")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting contact: {str(e)}")


def get_crm_contact_ledger(contact_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        contact = visible_or_404(get_contact_by_id(contact_id, db, tid), tenant_context, current_user, detail="Contact not found")
        from .....services.crm_sync_service import get_contact_ledger
        rows = get_contact_ledger(db, str(tid), str(contact.id))
        entries = []
        total_paid = 0.0
        total_pending = 0.0
        for r in rows:
            amt = float(r.amount or 0)
            if r.revenueType == "realized":
                total_paid += amt
            else:
                total_pending += amt
            entries.append({
                "id": str(r.id),
                "entryType": r.entryType,
                "revenueType": r.revenueType,
                "amount": amt,
                "description": r.description,
                "entryDate": r.entryDate.isoformat() if r.entryDate else "",
                "invoiceId": str(r.invoiceId) if r.invoiceId else None,
                "paymentId": str(r.paymentId) if r.paymentId else None,
            })
        from .schemas import ContactLedgerResponse
        return ContactLedgerResponse(entries=entries, totalPaid=round(total_paid, 2), totalPending=round(total_pending, 2))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching contact ledger: {str(e)}")

