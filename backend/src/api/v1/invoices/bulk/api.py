from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import BulkOperationRequest, BulkOperationResponse
from . import logic

router = APIRouter()


@router.post("/bulk/send", response_model=BulkOperationResponse)
def bulk_send_invoices(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.bulk_send_invoices_endpoint(request, db, current_user, tenant_context)


@router.post("/bulk/mark-as-paid", response_model=BulkOperationResponse)
def bulk_mark_invoices_as_paid(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.bulk_mark_invoices_as_paid_endpoint(request, db, current_user, tenant_context)


@router.post("/bulk/mark-as-unpaid", response_model=BulkOperationResponse)
def bulk_mark_invoices_as_unpaid(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.bulk_mark_invoices_as_unpaid_endpoint(request, db, current_user, tenant_context)


@router.post("/bulk/delete", response_model=BulkOperationResponse)
def bulk_delete_invoices(
    request: BulkOperationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:delete")),
):
    return logic.bulk_delete_invoices_endpoint(request, db, current_user, tenant_context)
