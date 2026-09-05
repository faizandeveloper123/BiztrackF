from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...config.database import get_db, get_user_by_id
from ...api.dependencies import get_current_user, get_tenant_context
from ...models.user_models import User
from ...models.job_card_models import JobCardCreate, JobCardUpdate, JobCardResponse
from ...config.job_card_crud import (
    get_job_card_by_id,
    get_all_job_cards,
    get_next_job_card_number,
    create_job_card,
    update_job_card,
    delete_job_card,
    get_job_card_stats,
)

router = APIRouter(prefix="/job-cards", tags=["Job Cards"])


def _job_card_to_response(jc) -> JobCardResponse:
    assigned_to_name = None
    if getattr(jc, "assigned_to", None):
        u = jc.assigned_to
        assigned_to_name = f"{getattr(u, 'firstName', '') or ''} {getattr(u, 'lastName', '') or ''}".strip() or getattr(u, "userName", "")
    return JobCardResponse(
        id=str(jc.id),
        tenant_id=str(jc.tenant_id),
        job_card_number=jc.job_card_number,
        title=jc.title,
        description=jc.description,
        status=jc.status,
        priority=jc.priority,
        purchase_order_id=str(jc.purchase_order_id) if getattr(jc, "purchase_order_id", None) else None,
        invoice_id=str(jc.invoice_id) if getattr(jc, "invoice_id", None) else None,
        customer_id=str(jc.customer_id) if jc.customer_id else None,
        customer_name=jc.customer_name,
        customer_phone=jc.customer_phone,
        vehicle_info=jc.vehicle_info or {},
        assigned_to_id=str(jc.assigned_to_id) if jc.assigned_to_id else None,
        assigned_to_name=assigned_to_name,
        created_by_id=str(jc.created_by_id),
        planned_date=jc.planned_date,
        completed_at=jc.completed_at,
        labor_estimate=jc.labor_estimate or 0.0,
        parts_estimate=jc.parts_estimate or 0.0,
        vat_rate=getattr(jc, "vat_rate", None),
        attachments=jc.attachments or [],
        items=jc.items or [],
        is_active=jc.is_active,
        created_at=jc.created_at,
        updated_at=jc.updated_at,
    )


@router.get("", response_model=List[JobCardResponse])
def list_job_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    cards = get_all_job_cards(
        db, tenant_id, skip=skip, limit=limit,
        status=status, assigned_to_id=assigned_to_id,
    )
    return [_job_card_to_response(c) for c in cards]


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    return get_job_card_stats(db, tenant_id)


@router.get("/{job_card_id}/pdf")
def download_job_card_pdf(
    job_card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    try:
        from .job_card_pdf import generate_job_card_pdf
        pdf_bytes = generate_job_card_pdf(job_card_id, db, tenant_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=job-card-{job_card_id}.pdf"},
    )


@router.get("/{job_card_id}", response_model=JobCardResponse)
def get_job_card(
    job_card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if not jc:
        raise HTTPException(status_code=404, detail="Job card not found")
    return _job_card_to_response(jc)


@router.post("", response_model=JobCardResponse)
def create_job_card_endpoint(
    body: JobCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    job_card_number = get_next_job_card_number(db, tenant_id)
    data = body.model_dump(exclude_unset=True)
    if data.get("planned_date") and isinstance(data["planned_date"], str):
        data["planned_date"] = datetime.fromisoformat(data["planned_date"].replace("Z", "+00:00"))
    if data.get("completed_at") and isinstance(data["completed_at"], str):
        data["completed_at"] = datetime.fromisoformat(data["completed_at"].replace("Z", "+00:00"))
    if data.get("status") == "completed" and not data.get("completed_at"):
        data["completed_at"] = datetime.utcnow()
    data["tenant_id"] = tenant_id
    data["created_by_id"] = str(current_user.id)
    data["job_card_number"] = job_card_number
    data["attachments"] = data.get("attachments") or []
    data["items"] = data.get("items") or []
    if "purchase_order_id" in data:
        data["purchase_order_id"] = data["purchase_order_id"] or None
    if "invoice_id" in data:
        data["invoice_id"] = data["invoice_id"] or None
    if "vat_rate" not in data:
        data["vat_rate"] = 0.15
    jc = create_job_card(data, db, tenant_id)
    from ...config.workshop_document_links import sync_workshop_document_links
    sync_workshop_document_links(
        db,
        tenant_id,
        purchase_order_id=str(jc.purchase_order_id) if jc.purchase_order_id else None,
        job_card_id=str(jc.id),
        invoice_id=str(jc.invoice_id) if jc.invoice_id else None,
    )
    db.commit()
    db.refresh(jc)
    if data.get("assigned_to_id"):
        try:
            from ...services.notification_service import send_assignment_notification
            from ...config.notification_models import NotificationCategory
            assignee = get_user_by_id(data["assigned_to_id"], db)
            assigner_name = f"{getattr(current_user, 'firstName', '') or ''} {getattr(current_user, 'lastName', '') or ''}".strip() or getattr(current_user, "userName", "A user")
            if assignee:
                send_assignment_notification(
                    db, tenant_id, assignee, assigner_name,
                    "Job Card", jc.title,
                    action_url=f"/job-cards/{jc.id}",
                    category=NotificationCategory.PROJECTS
                )
        except Exception:
            pass
    return _job_card_to_response(jc)


@router.put("/{job_card_id}", response_model=JobCardResponse)
def update_job_card_endpoint(
    job_card_id: str,
    body: JobCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if not jc:
        raise HTTPException(status_code=404, detail="Job card not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("planned_date") and isinstance(data["planned_date"], str):
        data["planned_date"] = datetime.fromisoformat(data["planned_date"].replace("Z", "+00:00"))
    if data.get("completed_at") and isinstance(data["completed_at"], str):
        data["completed_at"] = datetime.fromisoformat(data["completed_at"].replace("Z", "+00:00"))
    if (
        data.get("status") == "completed"
        and not data.get("completed_at")
        and str(getattr(jc, "status", "") or "") != "completed"
    ):
        data["completed_at"] = datetime.utcnow()
    if "purchase_order_id" in data:
        data["purchase_order_id"] = data["purchase_order_id"] or None
    if "invoice_id" in data:
        data["invoice_id"] = data["invoice_id"] or None
    update_data = {k: v for k, v in data.items() if hasattr(jc, k)}
    update_job_card(job_card_id, update_data, db, tenant_id)
    jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if jc and any(k in data for k in ("purchase_order_id", "invoice_id")):
        from ...config.workshop_document_links import sync_workshop_document_links
        sync_workshop_document_links(
            db,
            tenant_id,
            purchase_order_id=str(jc.purchase_order_id) if jc.purchase_order_id else None,
            job_card_id=str(jc.id),
            invoice_id=str(jc.invoice_id) if jc.invoice_id else None,
        )
        db.commit()
        jc = get_job_card_by_id(job_card_id, db, tenant_id)
    if "assigned_to_id" in data and data.get("assigned_to_id") and jc:
        try:
            from ...services.notification_service import send_assignment_notification
            from ...config.notification_models import NotificationCategory
            assignee = get_user_by_id(str(jc.assigned_to_id), db)
            assigner_name = f"{getattr(current_user, 'firstName', '') or ''} {getattr(current_user, 'lastName', '') or ''}".strip() or getattr(current_user, "userName", "A user")
            if assignee:
                send_assignment_notification(
                    db, tenant_id, assignee, assigner_name,
                    "Job Card", jc.title,
                    action_url=f"/job-cards/{job_card_id}",
                    category=NotificationCategory.PROJECTS
                )
        except Exception:
            pass
    return _job_card_to_response(jc)


@router.delete("/{job_card_id}")
def delete_job_card_endpoint(
    job_card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    if not delete_job_card(job_card_id, db, tenant_id):
        raise HTTPException(status_code=404, detail="Job card not found")
    return {"message": "Job card deleted"}
