from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ....config.core_crud import get_tenant_by_domain
from ....services.rbac_service import RBACService
from .settings.logic import get_or_create_mot_settings_row


def resolve_mot_tenant_by_domain(
    domain: str,
    db: Session,
    *,
    require_enabled: bool = True,
):
    tenant = get_tenant_by_domain(domain, db)
    if not tenant or not tenant.isActive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found",
        )

    plan_type = RBACService._get_tenant_plan_type(db, str(tenant.id))
    if plan_type != "workshop":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MOT booking is not available for this workshop",
        )

    settings = get_or_create_mot_settings_row(db, str(tenant.id))
    if require_enabled and not settings.public_booking_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MOT booking is not enabled for this workshop",
        )

    return tenant, settings
