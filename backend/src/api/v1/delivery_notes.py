from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime
import uuid

from ...config.database import get_db
from ...config.database import User
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission
from ...models.invoices import Invoice, DeliveryNote
from ...api.v1.invoices.items.logic import get_invoice_by_id
from pydantic import BaseModel

router = APIRouter(prefix="/delivery-notes", tags=["Delivery Notes"])


class DeliveryNoteCreate(BaseModel):
    invoice_id: str
    note: Optional[str] = None


class DeliveryNoteResponse(BaseModel):
    id: str
    tenant_id: str
    invoice_id: str
    note: Optional[str] = None
    created_by: str
    created_at: datetime
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


def _delivery_note_to_response(dn: DeliveryNote, invoice: Optional[Invoice] = None) -> dict:
    out = {
        "id": str(dn.id),
        "tenant_id": str(dn.tenant_id),
        "invoice_id": str(dn.invoice_id),
        "note": dn.note,
        "created_by": str(dn.created_by),
        "created_at": dn.created_at,
        "invoice_number": None,
        "customer_name": None,
    }
    if invoice:
        out["invoice_number"] = invoice.invoiceNumber
        out["customer_name"] = invoice.customerName
    return out


@router.post("", response_model=DeliveryNoteResponse)
def create_delivery_note(
    body: DeliveryNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_CREATE.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    invoice = get_invoice_by_id(body.invoice_id, db, tenant_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        inv_uuid = uuid.UUID(body.invoice_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid invoice id")
    dn = DeliveryNote(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        invoice_id=inv_uuid,
        note=body.note,
        created_by=current_user.id,
        created_at=datetime.utcnow(),
    )
    db.add(dn)
    db.commit()
    db.refresh(dn)
    return DeliveryNoteResponse(**_delivery_note_to_response(dn, invoice))


@router.get("", response_model=List[DeliveryNoteResponse])
def list_delivery_notes(
    invoice_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    query = db.query(DeliveryNote).filter(DeliveryNote.tenant_id == tenant_id)
    if invoice_id:
        query = query.filter(DeliveryNote.invoice_id == invoice_id)
    notes = query.order_by(desc(DeliveryNote.created_at)).offset(skip).limit(limit).all()
    result = []
    for dn in notes:
        inv = get_invoice_by_id(str(dn.invoice_id), db, tenant_id)
        result.append(DeliveryNoteResponse(**_delivery_note_to_response(dn, inv)))
    return result


@router.get("/{delivery_note_id}", response_model=DeliveryNoteResponse)
def get_delivery_note(
    delivery_note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    dn = db.query(DeliveryNote).filter(
        and_(
            DeliveryNote.id == delivery_note_id,
            DeliveryNote.tenant_id == tenant_id,
        )
    ).first()
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    inv = get_invoice_by_id(str(dn.invoice_id), db, tenant_id)
    return DeliveryNoteResponse(**_delivery_note_to_response(dn, inv))


@router.get("/{delivery_note_id}/download")
def download_delivery_note_pdf(
    delivery_note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    dn = db.query(DeliveryNote).filter(
        and_(
            DeliveryNote.id == delivery_note_id,
            DeliveryNote.tenant_id == tenant_id,
        )
    ).first()
    if not dn:
        raise HTTPException(status_code=404, detail="Delivery note not found")
    invoice = get_invoice_by_id(str(dn.invoice_id), db, tenant_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    from .pdf_generator_modern import generate_delivery_note_pdf
    pdf_content = generate_delivery_note_pdf(dn, invoice, db)
    filename = f"delivery-note-{invoice.invoiceNumber}-{delivery_note_id[:8]}.pdf"
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
