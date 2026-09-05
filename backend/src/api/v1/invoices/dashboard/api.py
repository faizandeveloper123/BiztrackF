from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import InvoiceDashboard
from . import logic

router = APIRouter()


@router.get("/dashboard/overview", response_model=InvoiceDashboard)
def get_invoice_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoice_dashboard:view")),
):
    return logic.get_invoice_dashboard_endpoint(db, current_user, tenant_context)
