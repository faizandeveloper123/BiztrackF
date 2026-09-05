from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission
from ...models.user_models import User
from ...models.installment_models import (
    InstallmentPlanCreate,
    InstallmentPlanUpdate,
    InstallmentPlanResponse,
    InstallmentResponse,
    ApplyPaymentRequest,
)
from ...config.installment_crud import (
    get_installment_plan_by_id,
    get_installment_plans_by_invoice,
    get_all_installment_plans,
    get_active_installment_plan_for_invoice,
    get_installment_by_id,
    create_installment_plan,
    update_installment_plan,
    apply_payment_to_installment,
    get_installments_by_plan,
)
from ...api.v1.invoices.items.logic import get_invoice_by_id

router = APIRouter(prefix="/installments", tags=["Installments"])


def _plan_to_response(plan, installments=None):
    if installments is None:
        installments = []
    return InstallmentPlanResponse(
        id=str(plan.id),
        tenant_id=str(plan.tenant_id),
        invoice_id=str(plan.invoice_id),
        total_amount=plan.total_amount,
        currency=plan.currency or "USD",
        number_of_installments=plan.number_of_installments,
        frequency=plan.frequency,
        first_due_date=plan.first_due_date,
        status=plan.status,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        installments=[
            InstallmentResponse(
                id=str(i.id),
                tenant_id=str(i.tenant_id),
                installment_plan_id=str(i.installment_plan_id),
                sequence_number=i.sequence_number,
                due_date=i.due_date,
                amount=i.amount,
                status=i.status,
                paid_amount=i.paid_amount or 0.0,
                payment_id=str(i.payment_id) if i.payment_id else None,
                created_at=i.created_at,
                updated_at=i.updated_at,
            )
            for i in installments
        ],
    )


@router.post("/installment-plans", response_model=InstallmentPlanResponse)
def create_plan(
    body: InstallmentPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_CREATE.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    invoice = get_invoice_by_id(body.invoice_id, db, tenant_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    active = get_active_installment_plan_for_invoice(body.invoice_id, db, tenant_id)
    if active:
        raise HTTPException(status_code=400, detail="Invoice already has an active installment plan")
    if body.number_of_installments < 1:
        raise HTTPException(status_code=400, detail="number_of_installments must be at least 1")
    if body.total_amount <= 0:
        raise HTTPException(status_code=400, detail="total_amount must be positive")
    plan = create_installment_plan(
        tenant_id=tenant_id,
        invoice_id=body.invoice_id,
        total_amount=body.total_amount,
        number_of_installments=body.number_of_installments,
        frequency=body.frequency,
        first_due_date=body.first_due_date,
        currency=body.currency,
        db=db,
    )
    installments = get_installments_by_plan(str(plan.id), db, tenant_id)
    return _plan_to_response(plan, installments)


@router.get("/installment-plans", response_model=List[InstallmentPlanResponse])
def list_plans(
    invoice_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    if invoice_id:
        plans = get_installment_plans_by_invoice(invoice_id, db, tenant_id)
    else:
        plans = get_all_installment_plans(db, tenant_id, skip, limit)
    result = []
    for plan in plans:
        installments = get_installments_by_plan(str(plan.id), db, tenant_id)
        result.append(_plan_to_response(plan, installments))
    return result


@router.get("/installment-plans/{plan_id}/customer-info-pdf")
def download_customer_info_pdf(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    try:
        from .customer_info_pdf import generate_customer_info_pdf
        pdf_bytes = generate_customer_info_pdf(plan_id, db, tenant_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=customer-info-{plan_id}.pdf"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


@router.get("/installment-plans/{plan_id}", response_model=InstallmentPlanResponse)
def get_plan(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    plan = get_installment_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    installments = get_installments_by_plan(plan_id, db, tenant_id)
    return _plan_to_response(plan, installments)


@router.get("/invoices/{invoice_id}/installment-plan", response_model=Optional[InstallmentPlanResponse])
def get_invoice_installment_plan(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_VIEW.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    plan = get_active_installment_plan_for_invoice(invoice_id, db, tenant_id)
    if not plan:
        return None
    installments = get_installments_by_plan(str(plan.id), db, tenant_id)
    return _plan_to_response(plan, installments)


@router.patch("/installment-plans/{plan_id}", response_model=InstallmentPlanResponse)
def update_plan(
    plan_id: str,
    body: InstallmentPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_UPDATE.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    plan = get_installment_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Installment plan not found")
    update_data = body.model_dump(exclude_unset=True)
    update_installment_plan(plan_id, update_data, db, tenant_id)
    plan = get_installment_plan_by_id(plan_id, db, tenant_id)
    installments = get_installments_by_plan(plan_id, db, tenant_id)
    return _plan_to_response(plan, installments)


@router.post(
    "/installment-plans/{plan_id}/installments/{installment_id}/apply-payment",
    response_model=InstallmentResponse,
)
def apply_payment(
    plan_id: str,
    installment_id: str,
    body: ApplyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.SALES_UPDATE.value)),
):
    tenant_id = str(tenant_context["tenant_id"])
    inst = apply_payment_to_installment(
        plan_id=plan_id,
        installment_id=installment_id,
        amount=body.amount,
        payment_id=body.payment_id,
        db=db,
        tenant_id=tenant_id,
    )
    if not inst:
        raise HTTPException(status_code=404, detail="Installment or plan not found")
    return InstallmentResponse(
        id=str(inst.id),
        tenant_id=str(inst.tenant_id),
        installment_plan_id=str(inst.installment_plan_id),
        sequence_number=inst.sequence_number,
        due_date=inst.due_date,
        amount=inst.amount,
        status=inst.status,
        paid_amount=inst.paid_amount or 0.0,
        payment_id=str(inst.payment_id) if inst.payment_id else None,
        created_at=inst.created_at,
        updated_at=inst.updated_at,
    )
