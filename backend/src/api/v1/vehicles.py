from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...models.user_models import User
from ...models.vehicle_models import VehicleCreate, VehicleUpdate, VehicleResponse
from ...config.vehicle_crud import (
    get_vehicle_by_id,
    get_all_vehicles,
    create_vehicle,
    update_vehicle,
    delete_vehicle,
)

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


def _vehicle_to_response(v) -> VehicleResponse:
    return VehicleResponse(
        id=str(v.id),
        tenant_id=str(v.tenant_id),
        make=v.make,
        model=v.model,
        year=v.year,
        color=v.color,
        vin=v.vin,
        registration_number=v.registration_number,
        mileage=v.mileage,
        engine_number=v.engine_number,
        notes=v.notes,
        is_active=v.is_active,
        created_at=v.created_at,
        updated_at=v.updated_at,
    )


@router.get("", response_model=List[VehicleResponse])
def list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    vehicles = get_all_vehicles(db, tenant_id, skip=skip, limit=limit, search=search)
    return [_vehicle_to_response(v) for v in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    v = get_vehicle_by_id(vehicle_id, db, tenant_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return _vehicle_to_response(v)


@router.post("", response_model=VehicleResponse)
def create_vehicle_endpoint(
    body: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    data = body.model_dump(exclude_unset=True)
    v = create_vehicle(data, db, tenant_id)
    return _vehicle_to_response(v)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle_endpoint(
    vehicle_id: str,
    body: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    v = get_vehicle_by_id(vehicle_id, db, tenant_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    data = body.model_dump(exclude_unset=True)
    update_vehicle(vehicle_id, data, db, tenant_id)
    v = get_vehicle_by_id(vehicle_id, db, tenant_id)
    return _vehicle_to_response(v)


@router.delete("/{vehicle_id}")
def delete_vehicle_endpoint(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    if not delete_vehicle(vehicle_id, db, tenant_id):
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted"}
