import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from ..models.crm import Contact, Opportunity
from ..models.invoices import Invoice, Payment


def resolve_date_range(
    quick_filter: Optional[str],
    date_from: Optional[datetime],
    date_to: Optional[datetime],
) -> Tuple[Optional[datetime], Optional[datetime]]:
    if date_from or date_to:
        return date_from, date_to
    if not quick_filter:
        return None, None
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    end = today + timedelta(days=1)
    mapping = {
        "today": (today, end),
        "7d": (today - timedelta(days=7), end),
        "30d": (today - timedelta(days=30), end),
        "90d": (today - timedelta(days=90), end),
    }
    return mapping.get(quick_filter, (None, None))


def _contact_emails(contact: Contact) -> List[str]:
    emails = []
    if contact.email:
        emails.append(contact.email.strip().lower())
    for item in contact.emails or []:
        if isinstance(item, dict):
            val = (item.get("value") or "").strip().lower()
            if val:
                emails.append(val)
    return list(dict.fromkeys(emails))


def _invoice_contact_filter(tenant_id: str, contact_ids: List[uuid.UUID], emails: Dict[str, List[str]]):
    conditions = [Invoice.contactId.in_(contact_ids)]
    for cid, emlist in emails.items():
        if emlist:
            conditions.append(
                and_(
                    Invoice.contactId.is_(None),
                    func.lower(func.coalesce(Invoice.customerEmail, "")).in_(emlist),
                )
            )
    return and_(Invoice.tenant_id == tenant_id, or_(*conditions))


def compute_contact_financials(
    db: Session,
    tenant_id: str,
    contact: Contact,
) -> Dict[str, float]:
    cid = contact.id
    emails = _contact_emails(contact)

    opp_q = db.query(Opportunity).filter(
        Opportunity.tenant_id == tenant_id,
        Opportunity.contactId == cid,
    )
    opps = opp_q.all()
    closed = [o for o in opps if o.stage == "closed_won"]
    deal_closed_value = sum(
        float(o.wonAmount if o.wonAmount is not None else o.amount or 0) for o in closed
    )
    if contact.clientValue is not None:
        client_value = float(contact.clientValue)
    elif opps:
        client_value = float(max(o.amount or 0 for o in opps))
    else:
        client_value = 0.0

    inv_conditions = [Invoice.contactId == cid]
    if emails:
        inv_conditions.append(
            and_(
                Invoice.contactId.is_(None),
                func.lower(func.coalesce(Invoice.customerEmail, "")).in_(emails),
            )
        )
    invoices = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        or_(*inv_conditions),
    ).all()

    paid_total = sum(float(i.totalPaid or 0) for i in invoices)
    remaining = sum(float(i.balance or 0) for i in invoices)
    if not invoices and closed:
        remaining = max(deal_closed_value - paid_total, 0.0)

    return {
        "clientValue": round(client_value, 2),
        "dealClosedValue": round(deal_closed_value, 2),
        "remainingPayable": round(remaining, 2),
        "lifetimeValue": round(paid_total, 2),
    }


def batch_contact_financials(
    db: Session,
    tenant_id: str,
    contacts: List[Contact],
) -> Dict[str, Dict[str, float]]:
    if not contacts:
        return {}
    tid = uuid.UUID(str(tenant_id)) if not isinstance(tenant_id, uuid.UUID) else tenant_id
    contact_ids = [c.id for c in contacts]
    email_map: Dict[str, List[str]] = {str(c.id): _contact_emails(c) for c in contacts}
    all_emails = {e for elist in email_map.values() for e in elist}

    opps = db.query(Opportunity).filter(
        Opportunity.tenant_id == tid,
        Opportunity.contactId.in_(contact_ids),
    ).all()
    opps_by_contact: Dict[str, List[Opportunity]] = {}
    for o in opps:
        key = str(o.contactId)
        opps_by_contact.setdefault(key, []).append(o)

    inv_by_contact: Dict[str, List[Invoice]] = {str(c.id): [] for c in contacts}
    direct_invs = db.query(Invoice).filter(
        Invoice.tenant_id == tid,
        Invoice.contactId.in_(contact_ids),
    ).all()
    for inv in direct_invs:
        if inv.contactId:
            inv_by_contact.setdefault(str(inv.contactId), []).append(inv)

    if all_emails:
        email_invs = db.query(Invoice).filter(
            Invoice.tenant_id == tid,
            Invoice.contactId.is_(None),
            func.lower(func.coalesce(Invoice.customerEmail, "")).in_(list(all_emails)),
        ).all()
        email_to_cids: Dict[str, List[str]] = {}
        for cid, emlist in email_map.items():
            for em in emlist:
                email_to_cids.setdefault(em, []).append(cid)
        for inv in email_invs:
            em = (inv.customerEmail or "").strip().lower()
            for cid in email_to_cids.get(em, []):
                if inv not in inv_by_contact[cid]:
                    inv_by_contact[cid].append(inv)

    result: Dict[str, Dict[str, float]] = {}
    for c in contacts:
        cid = str(c.id)
        contact_opps = opps_by_contact.get(cid, [])
        closed = [o for o in contact_opps if o.stage == "closed_won"]
        deal_closed_value = sum(
            float(o.wonAmount if o.wonAmount is not None else o.amount or 0) for o in closed
        )
        if c.clientValue is not None:
            client_value = float(c.clientValue)
        elif contact_opps:
            client_value = float(max(o.amount or 0 for o in contact_opps))
        else:
            client_value = 0.0
        invoices = inv_by_contact.get(cid, [])
        paid_total = sum(float(i.totalPaid or 0) for i in invoices)
        remaining = sum(float(i.balance or 0) for i in invoices)
        if not invoices and closed:
            remaining = max(deal_closed_value - paid_total, 0.0)
        result[cid] = {
            "clientValue": round(client_value, 2),
            "dealClosedValue": round(deal_closed_value, 2),
            "remainingPayable": round(remaining, 2),
            "lifetimeValue": round(paid_total, 2),
        }
    return result
