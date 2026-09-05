from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .vehicle_models import Vehicle


def get_vehicle_by_id(vehicle_id: str, db: Session, tenant_id: str) -> Optional[Vehicle]:
    return db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.tenant_id == tenant_id, Vehicle.is_active == True).first()


def get_all_vehicles(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
) -> List[Vehicle]:
    query = db.query(Vehicle).filter(Vehicle.tenant_id == tenant_id, Vehicle.is_active == True)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Vehicle.registration_number.ilike(term),
                Vehicle.vin.ilike(term),
                Vehicle.make.ilike(term),
                Vehicle.model.ilike(term),
                Vehicle.year.ilike(term),
                Vehicle.color.ilike(term),
            )
        )
    return query.order_by(Vehicle.updated_at.desc()).offset(skip).limit(limit).all()


def create_vehicle(vehicle_data: dict, db: Session, tenant_id: str) -> Vehicle:
    data = {k: v for k, v in vehicle_data.items() if hasattr(Vehicle, k)}
    data["tenant_id"] = tenant_id
    db_vehicle = Vehicle(**data)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


def update_vehicle(vehicle_id: str, update_data: dict, db: Session, tenant_id: str) -> Optional[Vehicle]:
    vehicle = get_vehicle_by_id(vehicle_id, db, tenant_id)
    if not vehicle:
        return None
    for k, v in update_data.items():
        if hasattr(vehicle, k):
            setattr(vehicle, k, v)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(vehicle_id: str, db: Session, tenant_id: str) -> bool:
    vehicle = get_vehicle_by_id(vehicle_id, db, tenant_id)
    if not vehicle:
        return False
    vehicle.is_active = False
    db.commit()
    return True
