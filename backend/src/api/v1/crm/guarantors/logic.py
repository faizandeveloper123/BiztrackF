from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .....models.crm import CustomerGuarantor
from ..customers.logic import get_customer_by_id
from ..http_common import require_tenant, tenant_id_str, visible_or_404
from .schemas import GuarantorCreate, GuarantorUpdate, GuarantorResponse


def _create_guarantor(db: Session, customer_id: str, guarantor_data: Dict[str, Any], tenant_id: str) -> CustomerGuarantor:
    if not get_customer_by_id(db, customer_id, tenant_id):
        raise ValueError("Customer not found")
    data = {**guarantor_data, "tenant_id": tenant_id, "customer_id": customer_id}
    data["createdAt"] = datetime.utcnow()
    data["updatedAt"] = datetime.utcnow()
    guarantor = CustomerGuarantor(**data)
    db.add(guarantor)
    db.commit()
    db.refresh(guarantor)
    return guarantor


def get_guarantors_by_customer(db: Session, customer_id: str, tenant_id: str) -> List[CustomerGuarantor]:
    return db.query(CustomerGuarantor).filter(
        and_(CustomerGuarantor.customer_id == customer_id, CustomerGuarantor.tenant_id == tenant_id)
    ).order_by(CustomerGuarantor.display_order.asc(), CustomerGuarantor.createdAt.asc()).all()


def _get_guarantor_by_id(db: Session, guarantor_id: str, tenant_id: str) -> Optional[CustomerGuarantor]:
    return db.query(CustomerGuarantor).filter(
        and_(CustomerGuarantor.id == guarantor_id, CustomerGuarantor.tenant_id == tenant_id)
    ).first()


def _update_guarantor(db: Session, guarantor_id: str, guarantor_data: Dict[str, Any], tenant_id: str) -> Optional[CustomerGuarantor]:
    guarantor = _get_guarantor_by_id(db, guarantor_id, tenant_id)
    if not guarantor:
        return None
    guarantor_data["updatedAt"] = datetime.utcnow()
    for field, value in guarantor_data.items():
        if hasattr(guarantor, field):
            setattr(guarantor, field, value)
    db.commit()
    db.refresh(guarantor)
    return guarantor


def _delete_guarantor(db: Session, guarantor_id: str, tenant_id: str) -> bool:
    guarantor = _get_guarantor_by_id(db, guarantor_id, tenant_id)
    if not guarantor:
        return False
    db.delete(guarantor)
    db.commit()
    return True


def _visible_customer(db: Session, customer_id: str, tenant_context: dict, current_user):
    tid = tenant_id_str(tenant_context)
    cust = get_customer_by_id(db, customer_id, tid)
    return visible_or_404(cust, tenant_context, current_user, detail="Customer not found")


def get_customer_guarantors(customer_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    _visible_customer(db, customer_id, ctx, current_user)
    guarantors = get_guarantors_by_customer(db, customer_id, tenant_id_str(ctx))
    return [GuarantorResponse.model_validate(g) for g in guarantors]


def create_guarantor_endpoint(customer_id: str, data: GuarantorCreate, db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    _visible_customer(db, customer_id, ctx, current_user)
    try:
        guarantor = _create_guarantor(db, customer_id, data.model_dump(), tenant_id_str(ctx))
        return GuarantorResponse.model_validate(guarantor)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


def update_guarantor_endpoint(guarantor_id: str, data: GuarantorUpdate, db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    tid = tenant_id_str(ctx)
    g = _get_guarantor_by_id(db, guarantor_id, tid)
    if not g:
        raise HTTPException(status_code=404, detail="Guarantor not found")
    _visible_customer(db, str(g.customer_id), ctx, current_user)
    guarantor = _update_guarantor(db, guarantor_id, data.model_dump(exclude_unset=True), tid)
    if not guarantor:
        raise HTTPException(status_code=404, detail="Guarantor not found")
    return GuarantorResponse.model_validate(guarantor)


def delete_guarantor_endpoint(guarantor_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    tid = tenant_id_str(ctx)
    g = _get_guarantor_by_id(db, guarantor_id, tid)
    if not g:
        raise HTTPException(status_code=404, detail="Guarantor not found")
    _visible_customer(db, str(g.customer_id), ctx, current_user)
    if not _delete_guarantor(db, guarantor_id, tid):
        raise HTTPException(status_code=404, detail="Guarantor not found")
    return {"message": "Guarantor deleted successfully"}
