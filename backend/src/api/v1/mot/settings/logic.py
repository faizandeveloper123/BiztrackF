from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.mot.mot_settings import DEFAULT_MOT_INSPECTION_PRICE, MotSettings
from .....models.platform.tenant import Tenant
from .schemas import MotSettingsResponse, MotSettingsUpdate


def get_or_create_mot_settings_row(db: Session, tenant_id: str) -> MotSettings:
    row = db.query(MotSettings).filter(MotSettings.tenant_id == tenant_id).first()
    if row:
        return row
    row = MotSettings(
        tenant_id=tenant_id,
        inspection_price=DEFAULT_MOT_INSPECTION_PRICE,
        public_booking_enabled=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _settings_response(row: MotSettings, tenant: Tenant) -> MotSettingsResponse:
    return MotSettingsResponse(
        inspection_price=Decimal(str(row.inspection_price)),
        public_booking_enabled=bool(row.public_booking_enabled),
        tenant_domain=tenant.domain,
        tenant_name=tenant.name,
        tenant_logo_url=tenant.logo_url,
    )


def get_mot_settings(db: Session, tenant_id: str, tenant: Tenant) -> MotSettingsResponse:
    row = get_or_create_mot_settings_row(db, tenant_id)
    return _settings_response(row, tenant)


def update_mot_settings(
    db: Session,
    tenant_id: str,
    tenant: Tenant,
    body: MotSettingsUpdate,
) -> MotSettingsResponse:
    row = get_or_create_mot_settings_row(db, tenant_id)

    if body.inspection_price is not None:
        price = Decimal(str(body.inspection_price))
        if price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="inspection_price must be zero or greater",
            )
        row.inspection_price = price

    if body.public_booking_enabled is not None:
        row.public_booking_enabled = body.public_booking_enabled

    db.commit()
    db.refresh(row)
    return _settings_response(row, tenant)
