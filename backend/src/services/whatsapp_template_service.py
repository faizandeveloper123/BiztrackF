"""Self-managed WhatsApp message templates.

Templates are stored per tenant in the ``whatsapp_templates`` table and are
filled at send time from live data (customer name, booking date/time, vehicle,
ref...). Sending uses the plain-text BotLinkd endpoint, so no template needs to
be created/approved on the botlinkd or Meta dashboard.
"""
import logging
from datetime import date, datetime
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from ..models.whatsapp_template import WhatsAppTemplate

logger = logging.getLogger(__name__)

DEFAULT_MOT_CONFIRMATION = (
    "Hi {customer_name}, your MOT test with {company_name} is confirmed 🚗\n"
    "\n"
    "Date: {booking_date_long}\n"
    "Time: {time_slot}\n"
    "Vehicle: {vehicle}\n"
    "Reference: #{ref}\n"
    "Estimated total: {price}\n"
    "\n"
    "Need to change? Simply reply to this message or contact us to reschedule."
)

DEFAULT_MOT_CANCELLATION = (
    "Hi {customer_name}, your MOT test has been cancelled.\n"
    "\n"
    "Previously booked: {booking_date_long} {time_slot}\n"
    "Vehicle: {vehicle}\n"
    "Reference: #{ref}\n"
    "\n"
    "Need a new slot? Contact us or book again — we're happy to help."
)

DEFAULT_MOT_REMINDER = (
    "Hi {customer_name}, your MOT is due in {days_left} day(s) — book today to stay road-legal.\n"
    "\n"
    "MOT due date: {mot_expiry_date_long}\n"
    "Vehicle: {vehicle}\n"
    "Reference: #{ref}\n"
    "\n"
    "Contact {company_name} to schedule your MOT test."
)

DEFAULT_MOT_EXPIRED = (
    "Hi {customer_name}, your MOT has expired and it's no longer legal to drive your vehicle on UK roads. 🚨\n"
    "\n"
    "Vehicle: {vehicle}\n"
    "MOT expired on: {mot_expiry_date_long}\n"
    "Reference: #{ref}\n"
    "\n"
    "Book immediately with {company_name} to get back on the road — we'll fit you in as soon as possible."
)

DEFAULT_JOB_CARD = (
    "Hi {customer_name}, here's the latest on your job card:\n"
    "\n"
    "Job Card: {job_card_number}\n"
    "Service: {title}\n"
    "Status: {status}\n"
    "Vehicle: {vehicle}\n"
    "\n"
    "Questions? Just contact us."
)

TEMPLATE_TYPES: Dict[str, Dict[str, str]] = {
    "mot_confirmation": {"name": "MOT Booking Confirmation", "body": DEFAULT_MOT_CONFIRMATION},
    "mot_cancellation": {"name": "MOT Cancellation", "body": DEFAULT_MOT_CANCELLATION},
    "mot_reminder": {"name": "MOT Expiration Reminder", "body": DEFAULT_MOT_REMINDER},
    "mot_expired": {"name": "MOT Expired", "body": DEFAULT_MOT_EXPIRED},
    "job_card": {"name": "Job Card Notification", "body": DEFAULT_JOB_CARD},
}

TEMPLATE_TYPE_CHOICES = list(TEMPLATE_TYPES.keys())


def _dmy(value) -> str:
    if not value:
        return ""
    try:
        return value.strftime("%d/%m/%Y")
    except Exception:
        return str(value)


def _long(value) -> str:
    if not value:
        return ""
    try:
        return value.strftime("%A, %d %B %Y")
    except Exception:
        return str(value)


def _fmt_currency(value: Any) -> str:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0.0
    return f"{amount:,.2f}"


def _short_ref(booking_id: str) -> str:
    return str(booking_id).replace("-", "").upper()[:8]


def _booking_vehicle(booking) -> str:
    parts = [
        getattr(booking, "vehicle_registration", "") or "",
        getattr(booking, "vehicle_make", "") or "",
        getattr(booking, "vehicle_model", "") or "",
    ]
    cleaned = [str(p).strip() for p in parts if p and str(p).strip()]
    return " ".join(cleaned) or "your vehicle"


def _job_card_vehicle(jc) -> str:
    vi = getattr(jc, "vehicle_info", None) or {}
    parts = [vi.get("make"), vi.get("model"), vi.get("registration_number")]
    cleaned = [str(p).strip() for p in parts if p and str(p).strip()]
    return " ".join(cleaned) if cleaned else "your vehicle"


def _company_name(branding: Dict[str, Optional[str]]) -> str:
    return branding.get("company_name") or branding.get("tenant_name") or "Workshop"


def render_message(body: str, context: Optional[Dict[str, Any]]) -> str:
    """Replace ``{key}`` placeholders with context values."""
    rendered = body or ""
    for key, value in (context or {}).items():
        rendered = rendered.replace("{" + key + "}", str(value if value is not None else ""))
    return rendered


# ---------------------------------------------------------------------------
# Context builders (fetch live data from the booking / job card at send time)
# ---------------------------------------------------------------------------

def mot_booking_context(booking, branding: Dict[str, Optional[str]]) -> Dict[str, str]:
    end_time = getattr(booking, "end_time", "") or ""
    start_time = getattr(booking, "start_time", "") or ""
    return {
        "customer_name": getattr(booking, "customer_name", "") or "Customer",
        "customer_phone": getattr(booking, "customer_phone", "") or "",
        "vehicle": _booking_vehicle(booking),
        "vehicle_registration": getattr(booking, "vehicle_registration", "") or "",
        "vehicle_make": getattr(booking, "vehicle_make", "") or "",
        "vehicle_model": getattr(booking, "vehicle_model", "") or "",
        "vehicle_year": getattr(booking, "vehicle_year", "") or "",
        "booking_date": _dmy(getattr(booking, "booking_date", None)),
        "booking_date_long": _long(getattr(booking, "booking_date", None)),
        "start_time": start_time,
        "end_time": end_time,
        "time_slot": f"{start_time} – {end_time}".strip(" –"),
        "ref": _short_ref(str(getattr(booking, "id", ""))),
        "price": "£" + _fmt_currency(getattr(booking, "price", None)),
        "price_raw": _fmt_currency(getattr(booking, "price", None)),
        "company_name": _company_name(branding),
        "test_type": getattr(booking, "test_type", "") or "",
        "delivery_option": getattr(booking, "delivery_option", "") or "",
        "status": getattr(booking, "status", "") or "",
    }


def mot_reminder_context(booking, branding: Dict[str, Optional[str]], days_left: int) -> Dict[str, str]:
    ctx = mot_booking_context(booking, branding)
    ctx.update(
        {
            "days_left": str(int(days_left)),
            "mot_expiry_date": _dmy(getattr(booking, "mot_expiry_date", None)),
            "mot_expiry_date_long": _long(getattr(booking, "mot_expiry_date", None)),
        }
    )
    return ctx


def job_card_context(jc, branding: Dict[str, Optional[str]]) -> Dict[str, str]:
    planned = getattr(jc, "planned_date", None)
    return {
        "customer_name": getattr(jc, "customer_name", "") or "Customer",
        "customer_phone": getattr(jc, "customer_phone", "") or "",
        "job_card_number": getattr(jc, "job_card_number", "") or "",
        "title": getattr(jc, "title", "") or "",
        "status": getattr(jc, "status", "") or "",
        "priority": getattr(jc, "priority", "") or "",
        "vehicle": _job_card_vehicle(jc),
        "planned_date": _long(planned),
        "planned_date_slug": _dmy(planned),
        "company_name": _company_name(branding),
    }


# ---------------------------------------------------------------------------
# DB access
# ---------------------------------------------------------------------------

def get_tenant_template(db: Session, tenant_id: str, template_type: str) -> Optional[WhatsAppTemplate]:
    try:
        return (
            db.query(WhatsAppTemplate)
            .filter(
                WhatsAppTemplate.tenant_id == tenant_id,
                WhatsAppTemplate.template_type == template_type,
            )
            .first()
        )
    except Exception as exc:
        logger.warning("Could not read WhatsApp template %s/%s: %s", tenant_id, template_type, exc)
        return None


def get_or_create_tenant_template(db: Session, tenant_id: str, template_type: str):
    row = get_tenant_template(db, tenant_id, template_type)
    if row is not None:
        return row, False
    meta = TEMPLATE_TYPES.get(template_type)
    if not meta:
        return None, False
    try:
        row = WhatsAppTemplate(
            tenant_id=tenant_id,
            template_type=template_type,
            name=meta["name"],
            body=meta["body"],
            is_active=True,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row, True
    except Exception as exc:
        db.rollback()
        logger.warning("Could not create WhatsApp template %s/%s: %s", tenant_id, template_type, exc)
        return None, False


def ensure_default_templates(db: Session, tenant_id: str) -> None:
    """Create any missing default templates for the tenant (best effort)."""
    try:
        for template_type, meta in TEMPLATE_TYPES.items():
            exists = (
                db.query(WhatsAppTemplate.id)
                .filter(
                    WhatsAppTemplate.tenant_id == tenant_id,
                    WhatsAppTemplate.template_type == template_type,
                )
                .first()
            )
            if not exists:
                db.add(
                    WhatsAppTemplate(
                        tenant_id=tenant_id,
                        template_type=template_type,
                        name=meta["name"],
                        body=meta["body"],
                        is_active=True,
                    )
                )
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning("Could not seed default WhatsApp templates for %s: %s", tenant_id, exc)


def render_tenant_template(
    db: Session,
    tenant_id: str,
    template_type: str,
    context: Optional[Dict[str, Any]],
) -> Optional[str]:
    """Render the tenant's active template body, creating a default if needed.

    Returns None when no template can be used (table missing / inactive).
    """
    row = get_tenant_template(db, tenant_id, template_type)
    if row is None:
        row, _ = get_or_create_tenant_template(db, tenant_id, template_type)
    if row is None or not row.is_active:
        return None
    return render_message(row.body, context)


def send_custom_template(
    db: Session,
    tenant_id: str,
    template_type: str,
    phone: str,
    context: Optional[Dict[str, Any]],
):
    """Send the tenant's custom template as a plain-text WhatsApp message.

    Returns None when no custom template is available (caller should fall back),
    otherwise returns the (success, provider_status, error) tuple of send_message.
    """
    message = render_tenant_template(db, tenant_id, template_type, context)
    if message is None:
        return None
    try:
        from .whatsapp_service import whatsapp_service

        return whatsapp_service.send_message(phone, message)
    except Exception as exc:
        logger.warning("WhatsApp custom template send failed for %s/%s: %s", tenant_id, template_type, exc)
        return False, None, str(exc)