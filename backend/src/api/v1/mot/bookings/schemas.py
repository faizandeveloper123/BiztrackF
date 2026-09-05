from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from .....models.mot.enums import MotBookingStatus, MotTestType


class MotBookingBase(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    vehicle_registration: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    delivery_option: Optional[str] = None
    booking_meta: Optional[Dict[str, Any]] = None
    booking_date: date
    start_time: str
    end_time: str
    test_type: str = MotTestType.STANDARD.value
    status: str = MotBookingStatus.SCHEDULED.value
    price: Decimal = Field(default=Decimal("0"))
    mileage: Optional[str] = None
    mot_expiry_date: Optional[date] = None
    notes: Optional[str] = None
    result_notes: Optional[str] = None


class MotBookingCreate(MotBookingBase):
    pass


class MotBookingUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    vehicle_registration: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_year: Optional[str] = None
    delivery_option: Optional[str] = None
    booking_meta: Optional[Dict[str, Any]] = None
    booking_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    test_type: Optional[str] = None
    status: Optional[str] = None
    price: Optional[Decimal] = None
    mileage: Optional[str] = None
    mot_expiry_date: Optional[date] = None
    notes: Optional[str] = None
    result_notes: Optional[str] = None
    is_active: Optional[bool] = None


class MotBookingStatusUpdate(BaseModel):
    status: str
    result_notes: Optional[str] = None


class MotBookingExpiryStatus(BaseModel):
    days_left: Optional[int] = None
    expiry_phase: str = "unknown"
    mot_expiry_date: Optional[date] = None


class MotBooking(MotBookingBase):
    id: str
    mot_reminder_sent_at: Optional[datetime] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    expiry_status: Optional[MotBookingExpiryStatus] = None

    class Config:
        from_attributes = True


class MotBookingsResponse(BaseModel):
    bookings: List[MotBooking]
    total: int


class MotBookingStats(BaseModel):
    total_bookings: int
    today_bookings: int
    upcoming_week: int
    scheduled_count: int
    confirmed_count: int
    in_progress_count: int
    passed_count: int
    failed_count: int
    cancelled_count: int
