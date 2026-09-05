import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from ....services.s3_service import s3_service


def crm_user_scope_filter(query, model, user_id_str: Optional[str]):
    if not user_id_str:
        return query
    try:
        uid = uuid.UUID(str(user_id_str))
    except (ValueError, TypeError):
        return query.filter(False)
    has_a = hasattr(model, "assignedToId")
    has_c = hasattr(model, "createdById")
    if has_a and has_c:
        return query.filter(or_(model.createdById == uid, model.assignedToId == uid))
    if has_c:
        return query.filter(model.createdById == uid)
    return query


def attachment_url_from_stored(item: Any) -> Optional[str]:
    if isinstance(item, dict):
        u = item.get("url")
        return str(u) if u else None
    if isinstance(item, str):
        return item
    return None


def attachment_urls_set(attachments: Any) -> set:
    if not attachments:
        return set()
    return {u for u in (attachment_url_from_stored(a) for a in attachments) if u}


def phone_from_phones_list(phones: Any) -> Optional[str]:
    if not phones or not isinstance(phones, list):
        return None
    for item in phones:
        if isinstance(item, dict):
            value = item.get("value") or item.get("phone") or item.get("number")
            if value and str(value).strip():
                return str(value).strip()
        elif isinstance(item, str) and item.strip():
            return item.strip()
    return None


def resolve_phone_from_customer(customer: Any) -> Optional[str]:
    if not customer:
        return None
    for attr in ("phone", "mobile"):
        value = getattr(customer, attr, None)
        if value and str(value).strip():
            return str(value).strip()
    listed = phone_from_phones_list(getattr(customer, "phones", None))
    if listed:
        return listed
    return None


def delete_s3_for_file_url(url: Optional[str]) -> None:
    if not url or not (str(url).startswith("http://") or str(url).startswith("https://")):
        return
    try:
        s3_key = s3_service.extract_s3_key_from_url(str(url))
        if s3_key:
            s3_service.delete_file(s3_key)
    except Exception:
        pass


def attachment_item_to_dict(x: Any) -> Dict[str, Any]:
    if isinstance(x, dict):
        return dict(x)
    md = getattr(x, "model_dump", None)
    if callable(md):
        return md()
    raise TypeError("Invalid attachment item")


_LABELS = frozenset({"work", "personal", "other"})


def norm_label(x: Any) -> str:
    s = str(x or "personal").lower()
    return s if s in _LABELS else "personal"


def prepare_labeled_contact_dict(d: Dict[str, Any], *, customer_email_blank_string: bool) -> None:
    emails = []
    for x in d.get("emails") or []:
        if isinstance(x, dict):
            v = (x.get("value") or "").strip()
            if v:
                emails.append({"value": v, "label": norm_label(x.get("label"))})
    if not emails and d.get("email"):
        v = str(d["email"]).strip()
        if v:
            emails.append({"value": v, "label": "personal"})
    phones = []
    for x in d.get("phones") or []:
        if isinstance(x, dict):
            v = (x.get("value") or "").strip()
            if v:
                phones.append({"value": v, "label": norm_label(x.get("label"))})
    if not phones:
        if d.get("phone") and str(d["phone"]).strip():
            phones.append({"value": str(d["phone"]).strip(), "label": "work"})
        if d.get("mobile") and str(d["mobile"]).strip():
            phones.append({"value": str(d["mobile"]).strip(), "label": "personal"})
    d["emails"] = emails
    d["phones"] = phones
    if customer_email_blank_string:
        d["email"] = (emails[0]["value"].strip().lower() if emails else "") or ""
    else:
        d["email"] = emails[0]["value"].strip().lower() if emails else None
    d["phone"] = phones[0]["value"] if len(phones) > 0 else None
    d["mobile"] = phones[1]["value"] if len(phones) > 1 else None


def contact_addresses_to_orm(addresses: Any) -> List[Dict[str, Any]]:
    if not addresses:
        return []
    out: List[Dict[str, Any]] = []
    keys = ("label", "line1", "line2", "city", "state", "postalCode", "country")
    for a in addresses:
        if hasattr(a, "model_dump"):
            d = a.model_dump(exclude_none=False)
        elif isinstance(a, dict):
            d = dict(a)
        else:
            continue
        cleaned: Dict[str, Any] = {}
        for k in keys:
            val = d.get(k)
            if val is not None and isinstance(val, str):
                val = val.strip() or None
            elif val is not None:
                s = str(val).strip()
                val = s or None
            if val:
                cleaned[k] = val
        if cleaned:
            out.append(cleaned)
    return out


def contact_social_to_orm(social: Any) -> Dict[str, str]:
    if social is None:
        return {}
    if hasattr(social, "model_dump"):
        d = social.model_dump(exclude_none=True)
    elif isinstance(social, dict):
        d = dict(social)
    else:
        return {}
    out: Dict[str, str] = {}
    for k in ("facebook", "instagram", "x", "linkedin", "skype", "tiktok", "threads"):
        v = d.get(k)
        if v is not None and str(v).strip():
            out[k] = str(v).strip()
    return out


def find_customer_by_any_email(db: Session, email_lower: str, tenant_id: str):
    from ....models.crm import Customer

    if not email_lower or not str(email_lower).strip():
        return None
    email_lower = str(email_lower).strip().lower()
    for c in db.query(Customer).filter(Customer.tenant_id == tenant_id).all():
        for e in (c.emails or []):
            if isinstance(e, dict) and (e.get("value") or "").strip().lower() == email_lower:
                return c
        if c.email and str(c.email).strip().lower() == email_lower:
            return c
    return None


def find_contact_by_any_email(db: Session, email_lower: str, tenant_id: str):
    from ....models.crm import Contact

    if not email_lower or not str(email_lower).strip():
        return None
    email_lower = str(email_lower).strip().lower()
    for c in db.query(Contact).filter(Contact.tenant_id == tenant_id).all():
        for e in (c.emails or []):
            if isinstance(e, dict) and (e.get("value") or "").strip().lower() == email_lower:
                return c
        if c.email and str(c.email).strip().lower() == email_lower:
            return c
    return None
