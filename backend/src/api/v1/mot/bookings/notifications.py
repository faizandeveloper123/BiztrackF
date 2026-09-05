import html
import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from .....config.core_crud import get_tenant_by_id
from .....config.invoice_customization_models import InvoiceCustomization
from .....models.mot import MotBooking
from .....services.email_service import EmailService
from .....services.invoice_share import get_share_base_url

logger = logging.getLogger(__name__)

DELIVERY_LABELS = {
    "drop_off": "Drop off — own onward travel",
    "wait_security": "Wait on site while vehicle is tested",
    "wait_on_site": "Wait on site while vehicle is tested",
}


def _format_booking_date(value: date) -> str:
    return value.strftime("%A, %d %B %Y")


def _format_price(value: Any) -> str:
    if value is None:
        return "—"
    amount = float(value) if not isinstance(value, (int, float)) else value
    return f"£{amount:,.2f}"


def _short_ref(booking_id: str) -> str:
    return str(booking_id).replace("-", "").upper()[:8]


def _load_branding(db: Session, tenant_id: str) -> Dict[str, Optional[str]]:
    tenant = get_tenant_by_id(tenant_id, db)
    if not tenant:
        return {
            "tenant_name": "Workshop",
            "tenant_domain": "",
            "logo_url": None,
            "company_name": "Workshop",
            "company_email": None,
            "company_phone": None,
            "company_address": None,
            "primary_color": "#2563eb",
            "footer_text": None,
        }

    customization = (
        db.query(InvoiceCustomization)
        .filter(
            InvoiceCustomization.tenant_id == tenant_id,
            InvoiceCustomization.is_active == True,
        )
        .first()
    )

    company_name = customization.company_name if customization else tenant.name
    return {
        "tenant_name": tenant.name,
        "tenant_domain": tenant.domain or "",
        "logo_url": tenant.logo_url or (customization.company_logo_url if customization else None),
        "company_name": company_name,
        "company_email": customization.company_email if customization else None,
        "company_phone": customization.company_phone if customization else None,
        "company_address": customization.company_address if customization else None,
        "primary_color": (customization.primary_color if customization else None) or "#2563eb",
        "footer_text": customization.footer_text if customization else None,
    }


def _vehicle_line(booking: MotBooking) -> str:
    parts = [
        booking.vehicle_registration,
        booking.vehicle_make,
        booking.vehicle_model,
        booking.vehicle_year,
    ]
    cleaned = [p.strip() for p in parts if p and str(p).strip()]
    return " · ".join(cleaned) if cleaned else "Your vehicle"


def _build_confirmation_url(tenant_domain: str, booking_id: str) -> Optional[str]:
    if not tenant_domain:
        return None
    base = get_share_base_url()
    return f"{base}/{tenant_domain}/mot/bookings/{booking_id}/confirmation"


def _build_booking_url(tenant_domain: str) -> Optional[str]:
    if not tenant_domain:
        return None
    base = get_share_base_url()
    return f"{base}/{tenant_domain}/mot/book"


def _build_mot_booking_email(
    booking: MotBooking,
    branding: Dict[str, Optional[str]],
) -> Dict[str, str]:
    company = branding["company_name"] or branding["tenant_name"] or "Workshop"
    primary = branding["primary_color"] or "#2563eb"
    customer = html.escape(booking.customer_name or "Customer")
    vehicle = html.escape(_vehicle_line(booking))
    booking_date = _format_booking_date(booking.booking_date)
    time_slot = f"{booking.start_time} – {booking.end_time}"
    delivery = DELIVERY_LABELS.get(booking.delivery_option or "", booking.delivery_option or "—")
    delivery = html.escape(delivery or "—")
    price = _format_price(booking.price)
    ref = _short_ref(str(booking.id))
    confirmation_url = _build_confirmation_url(
        branding.get("tenant_domain") or "",
        str(booking.id),
    )

    contact_lines = []
    if branding.get("company_phone"):
        contact_lines.append(branding["company_phone"])
    if branding.get("company_email"):
        contact_lines.append(branding["company_email"])
    if branding.get("company_address"):
        contact_lines.append(branding["company_address"])
    contact_html = "<br>".join(html.escape(line).replace("\n", "<br>") for line in contact_lines) if contact_lines else ""

    logo_html = ""
    if branding.get("logo_url"):
        logo_url = html.escape(branding["logo_url"])
        logo_html = (
            f'<img src="{logo_url}" alt="{html.escape(company)}" '
            f'style="max-height:48px;max-width:180px;margin-bottom:12px;" />'
        )

    cta_html = ""
    if confirmation_url:
        safe_url = html.escape(confirmation_url)
        cta_html = f"""
        <tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <a href="{safe_url}" style="display:inline-block;background:{primary};color:#ffffff;
              text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;
              border-radius:10px;">View booking details</a>
          </td>
        </tr>"""

    footer_note = branding.get("footer_text") or f"Thank you for choosing {company}."
    footer_note_html = html.escape(footer_note)

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:{primary};padding:32px 32px 28px;text-align:center;">
              {logo_html}
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">{html.escape(company)}</p>
              <h1 style="margin:10px 0 0;color:#ffffff;font-size:28px;line-height:1.25;font-weight:800;">Your MOT is booked</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">Hi {customer},</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                We've confirmed your MOT appointment. Please find your booking summary below.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Reference</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">#{ref}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Date &amp; time</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">{html.escape(booking_date)}</p>
                    <p style="margin:6px 0 0;color:#475569;font-size:14px;">{html.escape(time_slot)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Vehicle</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">{vehicle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Collection option</p>
                    <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.5;">{delivery}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Estimated total</p>
                    <p style="margin:0;color:{primary};font-size:22px;font-weight:800;">{html.escape(price)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {cta_html}
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">
                Need to make a change? Use the link above or contact us directly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#ffffff;font-size:14px;font-weight:700;">{html.escape(company)}</p>
              {f'<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">{contact_html}</p>' if contact_html else ''}
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">{footer_note_html}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    plain_lines = [
        f"Hi {booking.customer_name or 'Customer'},",
        "",
        f"Your MOT appointment with {company} is confirmed.",
        "",
        f"Reference: #{ref}",
        f"Date: {booking_date}",
        f"Time: {time_slot}",
        f"Vehicle: {_vehicle_line(booking)}",
        f"Collection: {DELIVERY_LABELS.get(booking.delivery_option or '', booking.delivery_option or '—')}",
        f"Estimated total: {price}",
    ]
    if confirmation_url:
        plain_lines.extend(["", f"View booking: {confirmation_url}"])
    if contact_lines:
        plain_lines.extend(["", "Contact us:", *contact_lines])
    plain_lines.extend(["", footer_note])
    plain_body = "\n".join(line for line in plain_lines if line is not None)

    subject = f"Your MOT is booked — {company} · {booking_date}"
    return {
        "subject": subject,
        "html_body": html_body,
        "plain_body": plain_body,
        "company_name": company,
        "reply_to": branding.get("company_email"),
    }


def notify_mot_booking_confirmation(db: Session, booking: MotBooking, tenant_id: str) -> bool:
    to_email = (booking.customer_email or "").strip()
    if not to_email:
        logger.info("MOT booking %s has no customer email; skipping confirmation email", booking.id)
        return False

    branding = _load_branding(db, tenant_id)
    content = _build_mot_booking_email(booking, branding)
    email_service = EmailService()
    return email_service.send_mot_booking_confirmation_email(
        to_email=to_email,
        customer_name=booking.customer_name or "Customer",
        tenant_name=content["company_name"],
        subject=content["subject"],
        html_body=content["html_body"],
        plain_body=content["plain_body"],
        reply_to=content.get("reply_to"),
    )


def _build_mot_due_reminder_email(
    booking: MotBooking,
    branding: Dict[str, Optional[str]],
) -> Dict[str, str]:
    company = branding["company_name"] or branding["tenant_name"] or "Workshop"
    primary = branding["primary_color"] or "#2563eb"
    customer = html.escape(booking.customer_name or "Customer")
    vehicle = html.escape(_vehicle_line(booking))
    due_date = _format_booking_date(booking.mot_expiry_date)
    ref = _short_ref(str(booking.id))
    booking_url = _build_booking_url(branding.get("tenant_domain") or "")

    contact_lines = []
    if branding.get("company_phone"):
        contact_lines.append(branding["company_phone"])
    if branding.get("company_email"):
        contact_lines.append(branding["company_email"])
    if branding.get("company_address"):
        contact_lines.append(branding["company_address"])
    contact_html = "<br>".join(html.escape(line).replace("\n", "<br>") for line in contact_lines) if contact_lines else ""

    logo_html = ""
    if branding.get("logo_url"):
        logo_url = html.escape(branding["logo_url"])
        logo_html = (
            f'<img src="{logo_url}" alt="{html.escape(company)}" '
            f'style="max-height:48px;max-width:180px;margin-bottom:12px;" />'
        )

    cta_html = ""
    if booking_url:
        safe_url = html.escape(booking_url)
        cta_html = f"""
        <tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <a href="{safe_url}" style="display:inline-block;background:{primary};color:#ffffff;
              text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;
              border-radius:10px;">Book MOT</a>
          </td>
        </tr>"""

    footer_note = branding.get("footer_text") or f"Thank you for choosing {company}."
    footer_note_html = html.escape(footer_note)

    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:{primary};padding:32px 32px 28px;text-align:center;">
              {logo_html}
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">{html.escape(company)}</p>
              <h1 style="margin:10px 0 0;color:#ffffff;font-size:28px;line-height:1.25;font-weight:800;">Your MOT is due soon</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">Hi {customer},</p>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
                Your MOT is due on <strong>{html.escape(due_date)}</strong>. Book your appointment today to stay road-legal.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">MOT due date</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">{html.escape(due_date)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Vehicle</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">{vehicle}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Reference</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:700;">#{ref}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {cta_html}
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">
                If you have any questions, please don't hesitate to contact us.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#ffffff;font-size:14px;font-weight:700;">{html.escape(company)}</p>
              {f'<p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">{contact_html}</p>' if contact_html else ''}
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">{footer_note_html}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    plain_lines = [
        f"Hi {booking.customer_name or 'Customer'},",
        "",
        f"Your MOT is due on {due_date}. Book your appointment today to stay road-legal.",
        "",
        f"Vehicle: {_vehicle_line(booking)}",
        f"Reference: #{ref}",
    ]
    if booking_url:
        plain_lines.extend(["", f"Book MOT: {booking_url}"])
    if contact_lines:
        plain_lines.extend(["", "Contact us:", *contact_lines])
    plain_lines.extend(["", footer_note])
    plain_body = "\n".join(line for line in plain_lines if line is not None)

    subject = f"MOT due {due_date} — book now · {company}"
    return {
        "subject": subject,
        "html_body": html_body,
        "plain_body": plain_body,
        "company_name": company,
        "reply_to": branding.get("company_email"),
    }


def notify_mot_due_reminder(db: Session, booking: MotBooking, tenant_id: str) -> bool:
    to_email = (booking.customer_email or "").strip()
    if not to_email:
        logger.info("MOT booking %s has no customer email; skipping due reminder", booking.id)
        return False

    branding = _load_branding(db, tenant_id)
    content = _build_mot_due_reminder_email(booking, branding)
    email_service = EmailService()
    return email_service.send_mot_due_reminder_email(
        to_email=to_email,
        customer_name=booking.customer_name or "Customer",
        tenant_name=content["company_name"],
        subject=content["subject"],
        html_body=content["html_body"],
        plain_body=content["plain_body"],
        reply_to=content.get("reply_to"),
    )


REMINDER_THRESHOLD_DAYS = [30]


def _get_sent_reminders(booking: MotBooking) -> set:
    meta = booking.booking_meta or {}
    sent = meta.get("mot_reminders")
    if not isinstance(sent, list):
        return set()
    return {str(item) for item in sent}


def _mark_reminder_sent(db: Session, booking: MotBooking, key: str) -> None:
    meta = dict(booking.booking_meta or {})
    sent = _get_sent_reminders(booking)
    sent.add(key)
    meta["mot_reminders"] = sorted(sent)
    booking.booking_meta = meta
    booking.mot_reminder_sent_at = datetime.utcnow()


def _fetch_workshop_owner_email(db: Session, tenant_id: str) -> Optional[str]:
    try:
        from .....models.rbac.tenant_user import TenantUser
        from .....models.rbac.role import Role
        from .....models.user import User

        from .....services.rbac_service import TenantRole

        row = (
            db.query(User.email)
            .join(TenantUser, TenantUser.userId == User.id)
            .join(Role, Role.id == TenantUser.role_id)
            .filter(
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True,
                Role.isActive == True,
                Role.name == TenantRole.OWNER.value,
            )
            .first()
        )
        return (row[0] or "").strip() if row else None
    except Exception as exc:
        logger.warning("Could not resolve workshop owner email for %s: %s", tenant_id, exc)
        return None


def _due_reminder_email(booking: MotBooking, branding: Dict[str, Optional[str]], days_left: int) -> Dict[str, str]:
    if days_left <= 1:
        urgency = "due tomorrow"
        title = "Your MOT is due tomorrow"
        intro = "Don't forget — your MOT is due <strong>tomorrow</strong>."
    elif days_left <= 7:
        urgency = f"in {days_left} days"
        title = "Your MOT is due very soon"
        intro = f"Your MOT is due <strong>in {days_left} days</strong>. Book now to avoid a gap in your MOT."
    else:
        urgency = f"in {days_left} days"
        title = f"Your MOT expires in {days_left} days"
        intro = f"Your MOT certificate lasts for a year. It expires in <strong>{days_left} days</strong>. Renew now to stay road-legal."

    base = _build_mot_due_reminder_email(booking, branding)
    base["subject"] = f"MOT {urgency} — book now · {base['company_name']}"
    base["html_body"] = base["html_body"].replace(
        "Your MOT is due soon",
        title,
    ).replace(
        "Your MOT is due on <strong>",
        f"{intro} Your MOT is due on <strong>",
    )
    return base


def process_mot_due_reminders(db: Session, tenant_id: str) -> int:
    today = date.today()
    due_bookings: List[MotBooking] = (
        db.query(MotBooking)
        .filter(
            MotBooking.tenant_id == tenant_id,
            MotBooking.is_active == True,
            MotBooking.mot_expiry_date.isnot(None),
            MotBooking.mot_expiry_date >= today,
        )
        .all()
    )
    sent_count = 0
    for booking in due_bookings:
        try:
            days_left = (booking.mot_expiry_date - today).days
            sent_keys = _get_sent_reminders(booking)
            for threshold in REMINDER_THRESHOLD_DAYS:
                if days_left > threshold:
                    continue
                key = f"mot_reminder_{threshold}d"
                if key in sent_keys:
                    continue
                to_email = (booking.customer_email or "").strip()
                if not to_email:
                    continue
                branding = _load_branding(db, tenant_id)
                content = _due_reminder_email(booking, branding, days_left)
                email_service = EmailService()
                ok = email_service.send_mot_due_reminder_email(
                    to_email=to_email,
                    customer_name=booking.customer_name or "Customer",
                    tenant_name=content["company_name"],
                    subject=content["subject"],
                    html_body=content["html_body"],
                    plain_body=content["plain_body"],
                    reply_to=content.get("reply_to"),
                )
                if ok:
                    _mark_reminder_sent(db, booking, key)
                    db.commit()
                    db.refresh(booking)
                    sent_count += 1
                break
        except Exception as exc:
            logger.warning("MOT due reminder failed for %s: %s", booking.id, exc)
            db.rollback()
    return sent_count


def process_all_tenants_mot_reminders(db: Session) -> int:
    from sqlalchemy import text

    from .....config.core_crud import get_all_tenants

    lock_key = "biztrack_mot_due_reminders"
    acquired = db.execute(
        text("SELECT pg_try_advisory_lock(hashtext(:key))"), {"key": lock_key}
    ).scalar()
    if not acquired:
        logger.info("MOT reminder pass skipped: another worker holds the advisory lock")
        return 0
    try:
        total = 0
        for tenant in get_all_tenants(db):
            row = db.query(MotBooking).filter(MotBooking.tenant_id == tenant.id).first()
            if row is None:
                continue
            try:
                total += process_mot_due_reminders(db, str(tenant.id))
            except Exception as exc:
                logger.warning("MOT reminder pass failed for tenant %s: %s", tenant.id, exc)
        return total
    finally:
        db.execute(text("SELECT pg_advisory_unlock(hashtext(:key))"), {"key": lock_key})
        db.commit()
