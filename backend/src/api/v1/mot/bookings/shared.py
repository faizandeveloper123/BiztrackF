from datetime import date
from .....models.mot import MotBooking
from .schemas import MotBooking as MotBookingSchema, MotBookingExpiryStatus


def compute_expiry_status(mot_expiry_date) -> MotBookingExpiryStatus:
    if not mot_expiry_date:
        return MotBookingExpiryStatus(days_left=None, expiry_phase="unknown", mot_expiry_date=None)
    today = date.today()
    days_left = (mot_expiry_date - today).days
    if days_left < 0:
        phase = "expired"
    elif days_left <= 30:
        phase = "red"
    elif days_left <= 180:
        phase = "yellow"
    else:
        phase = "green"
    return MotBookingExpiryStatus(
        days_left=max(days_left, 0) if days_left >= 0 else 0,
        expiry_phase=phase,
        mot_expiry_date=mot_expiry_date,
    )


def mot_booking_to_schema(row: MotBooking) -> MotBookingSchema:
    return MotBookingSchema(
        id=str(row.id),
        customer_name=row.customer_name or "",
        customer_phone=row.customer_phone,
        customer_email=row.customer_email,
        vehicle_registration=row.vehicle_registration,
        vehicle_make=row.vehicle_make,
        vehicle_model=row.vehicle_model,
        vehicle_year=row.vehicle_year,
        delivery_option=row.delivery_option,
        booking_meta=row.booking_meta if row.booking_meta else None,
        booking_date=row.booking_date,
        start_time=row.start_time,
        end_time=row.end_time,
        test_type=row.test_type or "standard",
        status=row.status or "scheduled",
        price=row.price or 0,
        mileage=row.mileage,
        mot_expiry_date=row.mot_expiry_date,
        mot_reminder_sent_at=row.mot_reminder_sent_at,
        notes=row.notes,
        result_notes=row.result_notes,
        is_active=row.is_active if row.is_active is not None else True,
        created_at=row.created_at,
        updated_at=row.updated_at,
        expiry_status=compute_expiry_status(row.mot_expiry_date),
    )
