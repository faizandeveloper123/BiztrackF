from datetime import date
from typing import Any, Dict, Optional


def _format_currency(value: Any) -> str:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        amount = 0.0
    return f"{amount:,.2f}"


def _vehicle_line(vehicle_info: Dict[str, Any]) -> str:
    if not vehicle_info:
        return "your vehicle"
    parts = [
        vehicle_info.get("make"),
        vehicle_info.get("model"),
        vehicle_info.get("year"),
        vehicle_info.get("registration_number"),
    ]
    cleaned = [str(p).strip() for p in parts if p and str(p).strip()]
    return " ".join(cleaned) if cleaned else "your vehicle"


def build_job_card_message(jc, subject: str = "created") -> str:
    """Build a customer-facing WhatsApp message for a job card."""
    customer = getattr(jc, "customer_name", "") or "there"
    number = getattr(jc, "job_card_number", "") or ""
    title = getattr(jc, "title", "") or ""
    status = getattr(jc, "status", "") or ""
    vehicle = _vehicle_line(getattr(jc, "vehicle_info", {}) or {})

    lines = [f"Hi {customer}! 👋"]
    if subject == "created":
        lines.append(
            f"We've received your request and {title or 'a job card'} "
            f"({number}) has been created. Status: {status}."
        )
    elif subject == "completed":
        lines.append(
            f"Good news! Your job card {number} ({title}) is now {status} and ready. 🎉"
        )
    elif subject == "status":
        lines.append(
            f"Your job card {number} ({title}) status has been updated to: {status}."
        )
    else:
        lines.append(
            f"Update on your job card {number} ({title}): status is now {status}."
        )

    if vehicle != "your vehicle":
        lines.append(f"Vehicle: {vehicle}")

    lines.append("")
    lines.append("If you have any questions, feel free to contact us.")
    return "\n".join(lines)


def _format_date_dmy(value) -> str:
    if not value:
        return ""
    try:
        return value.strftime("%d/%m/%Y")
    except Exception:
        return str(value)


def _format_date_long(value) -> str:
    if not value:
        return ""
    try:
        return value.strftime("%A, %d %B %Y")
    except Exception:
        return str(value)


def _booking_vehicle(booking) -> str:
    parts = [
        getattr(booking, "vehicle_registration", ""),
        getattr(booking, "vehicle_make", ""),
        getattr(booking, "vehicle_model", ""),
    ]
    cleaned = [str(p).strip() for p in parts if p and str(p).strip()]
    return " ".join(cleaned) or "your vehicle"


def _booking_time_slot(booking) -> str:
    if getattr(booking, "start_time", None):
        end = getattr(booking, "end_time", "") or ""
        return f"{booking.start_time} – {end}".strip(" –")
    return ""


def mot_confirmation_params(booking, branding: Dict[str, Optional[str]]) -> list:
    """Dynamic body_params for the MOT booking confirmation template."""
    company = branding.get("company_name") or branding.get("tenant_name") or "Workshop"
    price = _format_currency(getattr(booking, "price", None))
    return [
        getattr(booking, "customer_name", "") or "Customer",
        _booking_vehicle(booking),
        company,
        _format_date_dmy(getattr(booking, "booking_date", None)),
        _booking_time_slot(booking),
        price,
        str(getattr(booking, "id", "")).replace("-", "").upper()[:8],
    ]


def mot_cancellation_params(booking, branding: Dict[str, Optional[str]]) -> list:
    """Dynamic body_params for the MOT cancellation template."""
    return [
        getattr(booking, "customer_name", "") or "Customer",
        _booking_vehicle(booking),
        _format_date_dmy(getattr(booking, "booking_date", None)),
        str(getattr(booking, "id", "")).replace("-", "").upper()[:8],
    ]


def mot_reminder_params(booking, branding: Dict[str, Optional[str]], days_left: int) -> list:
    """Dynamic body_params for the MOT expiration reminder template."""
    company = branding.get("company_name") or branding.get("tenant_name") or "Workshop"
    return [
        getattr(booking, "customer_name", "") or "Customer",
        _booking_vehicle(booking),
        _format_date_dmy(getattr(booking, "mot_expiry_date", None)),
        str(days_left),
        str(getattr(booking, "id", "")).replace("-", "").upper()[:8],
        company,
    ]


def mot_expired_params(booking, branding: Dict[str, Optional[str]]) -> list:
    """Dynamic body_params for the MOT expired template."""
    company = branding.get("company_name") or branding.get("tenant_name") or "Workshop"
    return [
        getattr(booking, "customer_name", "") or "Customer",
        _booking_vehicle(booking),
        _format_date_dmy(getattr(booking, "mot_expiry_date", None)),
        str(getattr(booking, "id", "")).replace("-", "").upper()[:8],
        company,
    ]


def job_card_params(jc) -> list:
    """Dynamic body_params for the job card notification template."""
    vehicle = "your vehicle"
    vi = getattr(jc, "vehicle_info", None) or {}
    parts = [vi.get("make"), vi.get("model"), vi.get("registration_number")]
    cleaned = [str(p).strip() for p in parts if p and str(p).strip()]
    if cleaned:
        vehicle = " ".join(cleaned)
    return [
        getattr(jc, "customer_name", "") or "Customer",
        getattr(jc, "job_card_number", "") or "",
        getattr(jc, "title", "") or "",
        getattr(jc, "status", "") or "",
        vehicle,
    ]


def build_mot_confirmation_message(booking, branding: Dict[str, Optional[str]]) -> str:
    """Build a WhatsApp confirmation message for a MOT booking."""
    company = branding.get("company_name") or branding.get("tenant_name") or "Workshop"
    customer = getattr(booking, "customer_name", "") or "there"
    booking_date = getattr(booking, "booking_date", None)
    date_str = ""
    if booking_date:
        try:
            date_str = booking_date.strftime("%A, %d %B %Y")
        except Exception:
            date_str = str(booking_date)
    time_slot = f"{booking.start_time} – {booking.end_time}".strip(" –") if getattr(booking, "start_time", None) else ""
    ref = str(getattr(booking, "id", "")).replace("-", "").upper()[:8]
    vehicle = " · ".join(
        p.strip()
        for p in [
            getattr(booking, "vehicle_registration", ""),
            getattr(booking, "vehicle_make", ""),
            getattr(booking, "vehicle_model", ""),
        ]
        if p and str(p).strip()
    ) or "your vehicle"
    price = _format_currency(getattr(booking, "price", None))

    lines = [f"Hi {customer}! 👋"]
    lines.append(f"Your MOT appointment with {company} is confirmed 🚗")
    if ref:
        lines.append(f"Reference: #{ref}")
    if date_str:
        lines.append(f"Date: {date_str}")
    if time_slot:
        lines.append(f"Time: {time_slot}")
    lines.append(f"Vehicle: {vehicle}")
    lines.append(f"Estimated total: £{price}")
    lines.append("")
    lines.append("Need to make a change? Just reply or contact us directly.")
    return "\n".join(lines)


def build_mot_due_reminder_message(booking, branding: Dict[str, Optional[str]], days_left: int) -> str:
    """Build a WhatsApp due-reminder message for a MOT booking."""
    company = branding.get("company_name") or branding.get("tenant_name") or "Workshop"
    customer = getattr(booking, "customer_name", "") or "there"
    expiry = getattr(booking, "mot_expiry_date", None)
    due_str = ""
    if expiry:
        try:
            due_str = expiry.strftime("%A, %d %B %Y")
        except Exception:
            due_str = str(expiry)
    ref = str(getattr(booking, "id", "")).replace("-", "").upper()[:8]

    if days_left <= 1:
        lead = "Your MOT is due tomorrow"
    else:
        lead = f"Your MOT is due in {days_left} days"

    lines = [f"Hi {customer}! 👋"]
    lines.append(f"{lead} — book your appointment today to stay road-legal. 🚗")
    if due_str:
        lines.append(f"MOT due date: {due_str}")
    if ref:
        lines.append(f"Reference: #{ref}")
    lines.append("")
    lines.append(f"Contact {company} to schedule your MOT.")
    return "\n".join(lines)


def build_mot_cancellation_message(booking, branding: Dict[str, Optional[str]]) -> str:
    """Build a WhatsApp cancellation message for a MOT booking."""
    company = branding.get("company_name") or branding.get("tenant_name") or "Workshop"
    customer = getattr(booking, "customer_name", "") or "there"
    booking_date = getattr(booking, "booking_date", None)
    date_str = ""
    if booking_date:
        try:
            date_str = booking_date.strftime("%A, %d %B %Y")
        except Exception:
            date_str = str(booking_date)
    time_slot = f"{booking.start_time} – {booking.end_time}".strip(" –") if getattr(booking, "start_time", None) else ""
    ref = str(getattr(booking, "id", "")).replace("-", "").upper()[:8]
    vehicle = " · ".join(
        p.strip()
        for p in [
            getattr(booking, "vehicle_registration", ""),
            getattr(booking, "vehicle_make", ""),
            getattr(booking, "vehicle_model", ""),
        ]
        if p and str(p).strip()
    ) or "your vehicle"

    lines = [f"Hi {customer}! 👋"]
    lines.append(f"Your MOT appointment with {company} has been cancelled.")
    if date_str:
        lines.append(f"Previously booked: {date_str} {time_slot}".rstrip())
    lines.append(f"Vehicle: {vehicle}")
    if ref:
        lines.append(f"Reference: #{ref}")
    lines.append("")
    lines.append("If you would like to reschedule, just contact us or book again.")
    return "\n".join(lines)