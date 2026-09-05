import base64
import logging
import uuid
from datetime import datetime
from typing import Optional, Type, TypeVar

from fastapi import HTTPException, status
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy.orm import Session

T = TypeVar("T", bound=PydanticBaseModel)


def orm_to_schema(schema_cls: Type[T], orm, **extra) -> T:
    inst = schema_cls.model_validate(orm, from_attributes=True)
    updates = {}
    if hasattr(orm, "id"):
        updates["id"] = str(orm.id)
    if hasattr(orm, "tenant_id"):
        updates["tenant_id"] = str(orm.tenant_id)
    updates.update(extra)
    if updates:
        return inst.model_copy(update=updates)
    return inst

from ....services.s3_service import s3_service
from .db_common import attachment_item_to_dict
from ....api.crm_access import can_see_all_crm_records
from .contacts.schemas import ContactCreate, Contact
from .companies.schemas import Company
from .opportunities.schemas import Opportunity as OpportunityPydantic

logger = logging.getLogger(__name__)

def _pydantic_company_from_orm(company_orm) -> Company:
    from sqlalchemy.inspection import inspect as sa_inspect
    d = {a.key: getattr(company_orm, a.key) for a in sa_inspect(company_orm).mapper.column_attrs}
    cid = d.pop("createdById", None)
    d["createdBy"] = str(cid) if cid is not None else None
    d["id"] = str(d["id"]) if d.get("id") is not None else ""
    d["tenant_id"] = str(d["tenant_id"]) if d.get("tenant_id") is not None else ""
    d["opportunities"] = [
        OpportunityPydantic.model_validate(o, from_attributes=True).model_dump()
        for o in (getattr(company_orm, "opportunities", None) or [])
    ]
    d["contacts"] = [
        Contact.model_validate(c, from_attributes=True).model_dump()
        for c in (getattr(company_orm, "contacts", None) or [])
    ]
    d.setdefault("size", None)
    d.setdefault("description", None)
    raw_tags = d.get("tags")
    d["tags"] = list(raw_tags) if isinstance(raw_tags, (list, tuple)) else (raw_tags if raw_tags is not None else [])
    d.setdefault("foundedYear", None)
    return Company.model_validate(d)


def _crm_scope_user_id(tenant_context: Optional[dict], current_user) -> Optional[str]:
    if not tenant_context or can_see_all_crm_records(tenant_context):
        return None
    return str(current_user.id)


def _contact_create_to_orm_dict(
    contact_data: ContactCreate,
    tenant_id,
    created_by_user_id: Optional[str] = None,
) -> dict:
    raw = contact_data.dict()
    company_id = raw.get("companyId")
    if company_id:
        try:
            company_id = uuid.UUID(str(company_id))
        except (ValueError, TypeError):
            company_id = None
    else:
        company_id = None
    ct = raw.get("contactType")
    if ct is not None and hasattr(ct, "value"):
        contact_source = ct.value
    elif ct is not None:
        contact_source = str(ct)
    else:
        contact_source = None
    now = datetime.utcnow()
    desc = raw.get("description")
    if desc is not None and isinstance(desc, str) and not desc.strip():
        desc = None
    atts_raw = raw.get("attachments") or []
    atts = [attachment_item_to_dict(x) for x in atts_raw]
    assigned_to_id = None
    if raw.get("assignedTo"):
        try:
            assigned_to_id = uuid.UUID(str(raw["assignedTo"]))
        except (ValueError, TypeError):
            assigned_to_id = None
    created_by_uuid = None
    if created_by_user_id:
        try:
            created_by_uuid = uuid.UUID(str(created_by_user_id))
        except (ValueError, TypeError):
            created_by_uuid = None
    return {
        "id": uuid.uuid4(),
        "tenant_id": tenant_id,
        "firstName": raw["firstName"],
        "lastName": raw["lastName"],
        "emails": raw.get("emails") or [],
        "phones": raw.get("phones") or [],
        "email": raw.get("email"),
        "phone": raw.get("phone"),
        "mobile": raw.get("mobile"),
        "jobTitle": raw.get("jobTitle"),
        "department": raw.get("department"),
        "companyId": company_id,
        "contactSource": contact_source,
        "isActive": raw.get("isActive", True),
        "notes": raw.get("notes"),
        "description": desc,
        "attachments": atts,
        "initials": raw.get("initials"),
        "fullName": raw.get("fullName"),
        "birthday": raw.get("birthday"),
        "businessTaxId": raw.get("businessTaxId"),
        "website": raw.get("website"),
        "addresses": raw.get("addresses") or [],
        "socialLinks": raw.get("socialLinks"),
        "assignedToId": assigned_to_id,
        "clientValue": raw.get("clientValue"),
        "createdById": created_by_uuid,
        "createdAt": now,
        "updatedAt": now,
    }


def _primary_email_from_contact(contact) -> Optional[str]:
    for e in getattr(contact, "emails", None) or []:
        if isinstance(e, dict):
            v = (e.get("value") or "").strip()
            if v:
                return v
    e = getattr(contact, "email", None)
    if e and str(e).strip():
        return str(e).strip()
    return None


def _primary_phone_from_contact(contact) -> Optional[str]:
    for p in getattr(contact, "phones", None) or []:
        if isinstance(p, dict):
            v = (p.get("value") or "").strip()
            if v:
                return v
    for fld in ("phone", "mobile"):
        v = getattr(contact, fld, None)
        if v and str(v).strip():
            return str(v).strip()
    return None


def _lead_email_from_contact(contact) -> str:
    email = _primary_email_from_contact(contact)
    if email:
        return email
    return f"contact-{str(contact.id).replace('-', '')}@noemail.crm"


def ensure_lead_row_for_contact(
    contact,
    db: Session,
    tenant_id: str,
    current_user_id: str,
) -> None:
    from ....models.crm import Lead as LeadORM, Company as CompanyORM

    if getattr(contact, "contactSource", None) != "lead":
        return
    email = _lead_email_from_contact(contact)
    tid = uuid.UUID(str(tenant_id))
    existing = (
        db.query(LeadORM)
        .filter(LeadORM.tenant_id == tid, LeadORM.email == email)
        .first()
    )
    if existing:
        return
    phone = _primary_phone_from_contact(contact)
    company_name = None
    cid = getattr(contact, "companyId", None)
    if cid:
        try:
            cuid = uuid.UUID(str(cid))
            comp = db.query(CompanyORM).filter(CompanyORM.id == cuid).first()
            if comp:
                company_name = comp.name
        except (ValueError, TypeError):
            pass
    assigned_to_id = getattr(contact, "assignedToId", None)
    created_by_uuid = None
    try:
        created_by_uuid = uuid.UUID(str(current_user_id))
    except (ValueError, TypeError):
        created_by_uuid = None
    now = datetime.utcnow()
    lead_dict = {
        "id": uuid.uuid4(),
        "tenant_id": tid,
        "firstName": contact.firstName,
        "lastName": contact.lastName,
        "email": email,
        "phone": phone,
        "company": company_name,
        "jobTitle": getattr(contact, "jobTitle", None),
        "leadSource": "other",
        "status": "new",
        "priority": "medium",
        "assignedToId": assigned_to_id,
        "createdById": created_by_uuid,
        "notes": getattr(contact, "notes", None),
        "createdAt": now,
        "updatedAt": now,
    }
    from .leads.logic import create_lead

    create_lead(lead_dict, db)



class CustomerPhotoUpload(PydanticBaseModel):
    image: str


def process_customer_photo_upload(image_data: str, tenant_id: str, customer_id: str) -> Optional[str]:
    if not image_data:
        return None
    if image_data.startswith("data:image"):
        try:
            if "," not in image_data:
                raise ValueError("Invalid base64 data format")
            header, encoded = image_data.split(",", 1)
            if not encoded or len(encoded) < 100:
                raise ValueError("Base64 data is too short or empty")
            try:
                raw = base64.b64decode(encoded, validate=True)
            except Exception as e:
                logger.error(f"Base64 decode error: {str(e)}")
                raise ValueError("Invalid base64 encoding")
            if len(raw) > 5 * 1024 * 1024:
                raise ValueError("Image size exceeds 5MB limit")
            if len(raw) < 100:
                raise ValueError("Image file is too small")
            file_ext = ".png"
            if "jpeg" in header.lower() or "jpg" in header.lower():
                file_ext = ".jpg"
            elif "gif" in header.lower():
                file_ext = ".gif"
            elif "webp" in header.lower():
                file_ext = ".webp"
            filename = f"customer_{customer_id}_{uuid.uuid4().hex}{file_ext}"
            try:
                result = s3_service.upload_file(
                    file_content=raw,
                    tenant_id=str(tenant_id),
                    folder="customer-photos",
                    original_filename=filename,
                )
            except ValueError as e:
                raise HTTPException(status_code=503, detail="File upload service is not configured. Please contact administrator.")
            if not result or "file_url" not in result:
                raise ValueError("S3 upload failed - no file URL returned")
            return result["file_url"]
        except ValueError as ve:
            logger.error(f"Validation error processing customer photo: {str(ve)}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid image: {str(ve)}")
        except Exception as e:
            logger.error(f"Error processing customer photo: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    if image_data.startswith("http://") or image_data.startswith("https://"):
        return image_data
    return None


