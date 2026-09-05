from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from ....config.database import get_db
from ....api.dependencies import get_current_user, get_tenant_context
from ....api.v1.admin.shared import is_super_admin
from ....services.rbac_service import RBACService
from ....config.core_crud import get_tenant_by_id
from .bookings.schemas import (
    MotBooking,
    MotBookingCreate,
    MotBookingUpdate,
    MotBookingStatusUpdate,
    MotBookingsResponse,
    MotBookingStats,
)
from .bookings import logic as booking_logic
from .bookings.notifications import process_mot_due_reminders, process_all_tenants_mot_reminders
from .settings.schemas import MotSettingsResponse, MotSettingsUpdate
from .settings import logic as settings_logic
from .tenant_context import resolve_mot_tenant_by_domain

public_router = APIRouter(prefix="/public/mot", tags=["public-mot"])
admin_router = APIRouter(prefix="/mot", tags=["mot-admin"])


def require_mot_admin(
    current_user=Depends(get_current_user),
    tenant_context=Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    if is_super_admin(current_user):
        return current_user

    if not tenant_context:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MOT admin access required",
        )

    plan_type = RBACService._get_tenant_plan_type(db, tenant_context["tenant_id"])
    if plan_type != "workshop":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MOT management is available for workshop plans only",
        )

    return current_user


def _admin_tenant_context(
    tenant_context=Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    if not tenant_context:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required",
        )
    tenant = get_tenant_by_id(tenant_context["tenant_id"], db)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    return tenant_context, tenant


@public_router.get("/{tenant_domain}/settings", response_model=MotSettingsResponse)
async def get_public_mot_settings(
    tenant_domain: str,
    db: Session = Depends(get_db),
):
    tenant, settings = resolve_mot_tenant_by_domain(tenant_domain, db, require_enabled=True)
    return settings_logic.get_mot_settings(db, str(tenant.id), tenant)


@public_router.get("/{tenant_domain}/bookings/calendar", response_model=MotBookingsResponse)
async def list_public_mot_bookings_calendar(
    tenant_domain: str,
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    tenant, _ = resolve_mot_tenant_by_domain(tenant_domain, db, require_enabled=True)
    return booking_logic.list_mot_bookings_calendar(db, str(tenant.id), date_from, date_to)


@public_router.post("/{tenant_domain}/bookings", response_model=MotBooking, status_code=status.HTTP_201_CREATED)
async def create_public_mot_booking(
    tenant_domain: str,
    body: MotBookingCreate,
    db: Session = Depends(get_db),
):
    tenant, _ = resolve_mot_tenant_by_domain(tenant_domain, db, require_enabled=True)
    return booking_logic.create_mot_booking_record(body, db, str(tenant.id))


@public_router.get("/{tenant_domain}/bookings/{booking_id}", response_model=MotBooking)
async def get_public_mot_booking(
    tenant_domain: str,
    booking_id: str,
    db: Session = Depends(get_db),
):
    tenant, _ = resolve_mot_tenant_by_domain(tenant_domain, db, require_enabled=True)
    return booking_logic.get_mot_booking(booking_id, db, str(tenant.id))


@public_router.put("/{tenant_domain}/bookings/{booking_id}", response_model=MotBooking)
async def update_public_mot_booking(
    tenant_domain: str,
    booking_id: str,
    body: MotBookingUpdate,
    db: Session = Depends(get_db),
):
    tenant, _ = resolve_mot_tenant_by_domain(tenant_domain, db, require_enabled=True)
    return booking_logic.update_mot_booking_record(booking_id, body, db, str(tenant.id))


@public_router.patch("/{tenant_domain}/bookings/{booking_id}/status", response_model=MotBooking)
async def update_public_mot_booking_status(
    tenant_domain: str,
    booking_id: str,
    body: MotBookingStatusUpdate,
    db: Session = Depends(get_db),
):
    if body.status not in ("cancelled",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only cancellation is allowed via public booking",
        )
    tenant, _ = resolve_mot_tenant_by_domain(tenant_domain, db, require_enabled=True)
    return booking_logic.update_mot_booking_status(booking_id, body, db, str(tenant.id))


@admin_router.get("/settings", response_model=MotSettingsResponse)
async def get_mot_settings_admin(
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, tenant = admin_context
    return settings_logic.get_mot_settings(db, tenant_context["tenant_id"], tenant)


@admin_router.patch("/settings", response_model=MotSettingsResponse)
async def update_mot_settings_admin(
    body: MotSettingsUpdate,
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, tenant = admin_context
    return settings_logic.update_mot_settings(db, tenant_context["tenant_id"], tenant, body)


@admin_router.get("/bookings/stats", response_model=MotBookingStats)
async def get_mot_booking_stats(
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    return booking_logic.get_mot_booking_stats(db, tenant_context["tenant_id"])


@admin_router.get("/bookings", response_model=MotBookingsResponse)
async def list_mot_bookings_admin(
    status_filter: Optional[str] = Query(None, alias="status"),
    test_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    try:
        process_mot_due_reminders(db, tenant_context["tenant_id"])
    except Exception:
        pass
    return booking_logic.list_mot_bookings(
        db,
        tenant_context["tenant_id"],
        status_filter=status_filter,
        test_type=test_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@admin_router.get("/bookings/calendar", response_model=MotBookingsResponse)
async def list_mot_bookings_calendar_admin(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    return booking_logic.list_mot_bookings_calendar(db, tenant_context["tenant_id"], date_from, date_to)


@admin_router.get("/bookings/{booking_id}", response_model=MotBooking)
async def get_mot_booking_admin(
    booking_id: str,
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    return booking_logic.get_mot_booking(booking_id, db, tenant_context["tenant_id"])


@admin_router.post("/bookings", response_model=MotBooking, status_code=status.HTTP_201_CREATED)
async def create_mot_booking_admin(
    body: MotBookingCreate,
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    return booking_logic.create_mot_booking_record(body, db, tenant_context["tenant_id"])


@admin_router.put("/bookings/{booking_id}", response_model=MotBooking)
async def update_mot_booking_admin(
    booking_id: str,
    body: MotBookingUpdate,
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    return booking_logic.update_mot_booking_record(booking_id, body, db, tenant_context["tenant_id"])


@admin_router.patch("/bookings/{booking_id}/status", response_model=MotBooking)
async def update_mot_booking_status_admin(
    booking_id: str,
    body: MotBookingStatusUpdate,
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    return booking_logic.update_mot_booking_status(booking_id, body, db, tenant_context["tenant_id"])


@admin_router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mot_booking_admin(
    booking_id: str,
    db: Session = Depends(get_db),
    admin_context=Depends(_admin_tenant_context),
    _=Depends(require_mot_admin),
):
    tenant_context, _ = admin_context
    booking_logic.delete_mot_booking_record(booking_id, db, tenant_context["tenant_id"])


@admin_router.post("/reminders/trigger", status_code=status.HTTP_200_OK)
async def trigger_mot_reminders(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    def _run_reminders():
        from ....config.database import SessionLocal
        session = SessionLocal()
        try:
            process_all_tenants_mot_reminders(session)
        except Exception:
            pass
        finally:
            session.close()

    background_tasks.add_task(_run_reminders)
    return {"message": "MOT reminders processing triggered"}
