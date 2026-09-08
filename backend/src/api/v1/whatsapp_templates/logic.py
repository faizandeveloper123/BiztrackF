from datetime import datetime
from typing import Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ....models.whatsapp_template import WhatsAppTemplate
from ....services.whatsapp_template_service import (
    TEMPLATE_TYPES,
    get_or_create_tenant_template,
    mot_booking_context,
    mot_reminder_context,
    render_message,
)
from .schemas import (
    WhatsAppTemplatePreviewRequest,
    WhatsAppTemplatePreviewResponse,
    WhatsAppTemplateResponse,
    WhatsAppTemplateUpdate,
)


def _to_response(row: WhatsAppTemplate) -> WhatsAppTemplateResponse:
    def _iso(value) -> Optional[str]:
        if not value:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    return WhatsAppTemplateResponse(
        id=str(row.id),
        template_type=row.template_type,
        name=row.name,
        body=row.body,
        is_active=bool(row.is_active),
        created_at=_iso(getattr(row, "created_at", None)),
        updated_at=_iso(getattr(row, "updated_at", None)),
    )


def list_templates(db: Session, tenant_id: str) -> List[WhatsAppTemplateResponse]:
    rows = (
        db.query(WhatsAppTemplate)
        .filter(WhatsAppTemplate.tenant_id == tenant_id)
        .order_by(WhatsAppTemplate.template_type)
        .all()
    )
    return [_to_response(row) for row in rows]


def get_template(db: Session, tenant_id: str, template_type: str) -> WhatsAppTemplateResponse:
    if template_type not in TEMPLATE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown template type '{template_type}'. Valid types: {', '.join(TEMPLATE_TYPES)}",
        )
    row, _ = get_or_create_tenant_template(db, tenant_id, template_type)
    return _to_response(row)


def update_template(
    db: Session,
    tenant_id: str,
    template_type: str,
    body: WhatsAppTemplateUpdate,
) -> WhatsAppTemplateResponse:
    if template_type not in TEMPLATE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown template type '{template_type}'. Valid types: {', '.join(TEMPLATE_TYPES)}",
        )
    row, _ = get_or_create_tenant_template(db, tenant_id, template_type)

    if body.name is not None:
        row.name = body.name.strip() or TEMPLATE_TYPES[template_type]["name"]
    if body.body is not None:
        if not str(body.body).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Template body cannot be empty")
        row.body = body.body
    if body.is_active is not None:
        row.is_active = body.is_active

    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _to_response(row)


def reset_template(db: Session, tenant_id: str, template_type: str) -> WhatsAppTemplateResponse:
    if template_type not in TEMPLATE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown template type '{template_type}'. Valid types: {', '.join(TEMPLATE_TYPES)}",
        )
    row, _ = get_or_create_tenant_template(db, tenant_id, template_type)
    meta = TEMPLATE_TYPES[template_type]
    row.name = meta["name"]
    row.body = meta["body"]
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _to_response(row)


def delete_template(db: Session, tenant_id: str, template_type: str) -> None:
    row = (
        db.query(WhatsAppTemplate)
        .filter(
            WhatsAppTemplate.tenant_id == tenant_id,
            WhatsAppTemplate.template_type == template_type,
        )
        .first()
    )
    if row:
        db.delete(row)
        db.commit()


def preview_template(db: Session, tenant_id: str, req: WhatsAppTemplatePreviewRequest):
    if req.template_type not in TEMPLATE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown template type '{req.template_type}'",
        )

    body = (req.body or "").strip() if req.body is not None else None
    if not body:
        row, _ = get_or_create_tenant_template(db, tenant_id, req.template_type)
        body = row.body

    context = _build_preview_context(db, tenant_id, req)
    rendered = render_message(body, context)

    return WhatsAppTemplatePreviewResponse(
        template_type=req.template_type,
        template_name=TEMPLATE_TYPES[req.template_type]["name"],
        body=body,
        rendered=rendered,
    )


def _build_preview_context(db: Session, tenant_id: str, req: WhatsAppTemplatePreviewRequest) -> Dict[str, str]:
    from ....models.mot.mot_booking import MotBooking

    booking = None
    if req.booking_id:
        booking = (
            db.query(MotBooking)
            .filter(MotBooking.id == req.booking_id, MotBooking.tenant_id == tenant_id)
            .first()
        )
    if booking is None:
        booking = (
            db.query(MotBooking)
            .filter(MotBooking.tenant_id == tenant_id)
            .order_by(MotBooking.created_at.desc())
            .first()
        )

    if booking is not None:
        branding = {"company_name": None, "tenant_name": "Workshop"}
        ctx = mot_booking_context(booking, branding)
        if req.template_type == "mot_reminder":
            ctx = mot_reminder_context(booking, branding, days_left=7)
        return ctx

    from ....services.whatsapp_template_service import job_card_context

    from ....config.job_card_crud import get_all_job_cards

    jc = None
    jcs = get_all_job_cards(db, tenant_id, limit=1)
    if jcs:
        jc = jcs[0]
    if jc is not None:
        return job_card_context(jc, {"company_name": None, "tenant_name": "Workshop"})

    return {
        "customer_name": "John Smith",
        "customer_phone": "+441234567890",
        "vehicle": "AB12 CDE · Tesla · Model 3",
        "vehicle_registration": "AB12 CDE",
        "vehicle_make": "Tesla",
        "vehicle_model": "Model 3",
        "vehicle_year": "2022",
        "booking_date": "08/09/2026",
        "booking_date_long": "Tuesday, 08 September 2026",
        "start_time": "09:00",
        "end_time": "10:00",
        "time_slot": "09:00 – 10:00",
        "ref": "4F2A9C1B",
        "price": "£49.00",
        "price_raw": "49.00",
        "company_name": "Workshop",
        "test_type": "standard",
        "delivery_option": "drop_off",
        "status": "scheduled",
        "days_left": "7",
        "mot_expiry_date": "15/09/2026",
        "mot_expiry_date_long": "Tuesday, 15 September 2026",
        "job_card_number": "JC-000123",
        "title": "Brake pads replacement",
        "priority": "medium",
        "planned_date": "Wednesday, 09 September 2026",
        "planned_date_slug": "09/09/2026",
    }