import logging
from datetime import date, datetime as dt, timedelta
from typing import List, Optional
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .....models.mot import MotBooking
from ...repository import create_entity, delete_by_id
from .schemas import (
    MotBookingCreate,
    MotBookingUpdate,
    MotBookingStatusUpdate,
    MotBookingsResponse,
    MotBookingStats,
)
from .shared import mot_booking_to_schema
from .notifications import notify_mot_booking_confirmation

logger = logging.getLogger(__name__)


def _next_mot_due_date(booking_date: date) -> date:
    return booking_date + timedelta(days=365)


def _get_mot_booking_row(
    booking_id: str,
    db: Session,
    tenant_id: Optional[str] = None,
) -> Optional[MotBooking]:
    query = db.query(MotBooking).filter(MotBooking.id == booking_id)
    if tenant_id is not None:
        query = query.filter(MotBooking.tenant_id == tenant_id)
    return query.first()


def _resolve_customer_fields(body):
    if not (body.customer_name and body.customer_name.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="customer_name is required",
        )
    return body.customer_name.strip(), body.customer_phone, body.customer_email


def _apply_booking_filters(
    query,
    *,
    tenant_id: str,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
):
    query = query.filter(MotBooking.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(MotBooking.is_active == is_active)
    if status_filter:
        query = query.filter(MotBooking.status == status_filter)
    if test_type:
        query = query.filter(MotBooking.test_type == test_type)
    if date_from is not None:
        query = query.filter(MotBooking.booking_date >= date_from)
    if date_to is not None:
        query = query.filter(MotBooking.booking_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            MotBooking.customer_name.ilike(search_lower)
            | MotBooking.vehicle_registration.ilike(search_lower)
            | MotBooking.customer_phone.ilike(search_lower)
            | MotBooking.vehicle_make.ilike(search_lower)
            | MotBooking.vehicle_model.ilike(search_lower)
        )
    return query


def get_mot_bookings(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> List[MotBooking]:
    query = _apply_booking_filters(
        db.query(MotBooking),
        tenant_id=tenant_id,
        status_filter=status_filter,
        test_type=test_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
    )
    return (
        query.order_by(MotBooking.booking_date.desc(), MotBooking.start_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_mot_bookings_count(
    db: Session,
    tenant_id: str,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> int:
    query = _apply_booking_filters(
        db.query(MotBooking),
        tenant_id=tenant_id,
        status_filter=status_filter,
        test_type=test_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
    )
    return query.count()


def _map_bookings(rows: List[MotBooking]):
    return [mot_booking_to_schema(row) for row in rows]


def list_mot_bookings(
    db: Session,
    tenant_id: str,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
    page: int = 1,
    limit: int = 100,
) -> MotBookingsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    skip = (page - 1) * limit
    rows = get_mot_bookings(
        db,
        tenant_id,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        test_type=test_type,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
    )
    total = get_mot_bookings_count(
        db,
        tenant_id,
        status_filter=status_filter,
        test_type=test_type,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
    )
    return MotBookingsResponse(bookings=_map_bookings(rows), total=total)


def list_mot_bookings_calendar(
    db: Session,
    tenant_id: str,
    date_from: str,
    date_to: str,
) -> MotBookingsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date()
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date()
    rows = get_mot_bookings(
        db,
        tenant_id,
        skip=0,
        limit=1000,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        is_active=True,
    )
    bookings = _map_bookings(rows)
    return MotBookingsResponse(bookings=bookings, total=len(bookings))


def get_mot_booking(booking_id: str, db: Session, tenant_id: str):
    row = _get_mot_booking_row(booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    return mot_booking_to_schema(row)


def create_mot_booking_record(body: MotBookingCreate, db: Session, tenant_id: str):
    customer_name, customer_phone, customer_email = _resolve_customer_fields(body)
    data = body.model_dump(exclude={"customer_name", "customer_phone", "customer_email"})
    data["customer_name"] = customer_name
    data["customer_phone"] = customer_phone
    data["customer_email"] = customer_email
    data["tenant_id"] = tenant_id
    data["is_active"] = True
    if not data.get("mot_expiry_date"):
        data["mot_expiry_date"] = _next_mot_due_date(data.get("booking_date") or date.today())
    if isinstance(data.get("price"), Decimal):
        data["price"] = float(data["price"])
    row = create_entity(MotBooking, data, db)
    try:
        notify_mot_booking_confirmation(db, row, tenant_id)
    except Exception as exc:
        logger.warning("MOT booking confirmation email failed for %s: %s", row.id, exc)
    return mot_booking_to_schema(row)


def update_mot_booking_record(booking_id: str, body: MotBookingUpdate, db: Session, tenant_id: str):
    row = _get_mot_booking_row(booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    update_data = body.model_dump(exclude_unset=True)
    if body.customer_name is not None:
        if not body.customer_name.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="customer_name is required")
        update_data["customer_name"] = body.customer_name.strip()
    if "price" in update_data and isinstance(update_data["price"], Decimal):
        update_data["price"] = float(update_data["price"])
    for key, value in update_data.items():
        if hasattr(row, key):
            setattr(row, key, value)
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    return mot_booking_to_schema(row)


def update_mot_booking_status(booking_id: str, body: MotBookingStatusUpdate, db: Session, tenant_id: str):
    row = _get_mot_booking_row(booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    row.status = body.status
    if body.result_notes is not None:
        row.result_notes = body.result_notes
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    return mot_booking_to_schema(row)


def delete_mot_booking_record(booking_id: str, db: Session, tenant_id: str) -> None:
    row = _get_mot_booking_row(booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    delete_by_id(MotBooking, booking_id, db)


def get_mot_booking_stats(db: Session, tenant_id: str) -> MotBookingStats:
    today = date.today()
    week_end = today + timedelta(days=7)
    base = db.query(MotBooking).filter(
        MotBooking.is_active == True,
        MotBooking.tenant_id == tenant_id,
    )
    total = base.count()
    today_count = base.filter(MotBooking.booking_date == today).count()
    upcoming = base.filter(
        MotBooking.booking_date >= today,
        MotBooking.booking_date <= week_end,
        MotBooking.status.in_(["scheduled", "confirmed"]),
    ).count()
    status_counts = dict(
        db.query(MotBooking.status, func.count(MotBooking.id))
        .filter(MotBooking.is_active == True, MotBooking.tenant_id == tenant_id)
        .group_by(MotBooking.status)
        .all()
    )
    return MotBookingStats(
        total_bookings=total,
        today_bookings=today_count,
        upcoming_week=upcoming,
        scheduled_count=status_counts.get("scheduled", 0),
        confirmed_count=status_counts.get("confirmed", 0),
        in_progress_count=status_counts.get("in_progress", 0),
        passed_count=status_counts.get("passed", 0),
        failed_count=status_counts.get("failed", 0),
        cancelled_count=status_counts.get("cancelled", 0) + status_counts.get("no_show", 0),
    )
