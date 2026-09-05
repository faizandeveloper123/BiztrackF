from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from .....models.pos import POSShift as POSShiftORM


def get_pos_shift_by_id(
    db: Session,
    shift_id: str,
    tenant_id: str = None,
) -> Optional[POSShiftORM]:
    query = db.query(POSShiftORM).filter(POSShiftORM.id == shift_id)
    if tenant_id:
        query = query.filter(POSShiftORM.tenant_id == tenant_id)
    return query.first()


def get_all_pos_shifts(
    db: Session,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> List[POSShiftORM]:
    query = db.query(POSShiftORM)
    if tenant_id:
        query = query.filter(POSShiftORM.tenant_id == tenant_id)
    return query.order_by(POSShiftORM.createdAt.desc()).offset(skip).limit(limit).all()


def get_pos_shifts(
    db: Session,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
) -> List[POSShiftORM]:
    return get_all_pos_shifts(db, tenant_id, skip, limit)


def get_open_pos_shift(
    db: Session,
    tenant_id: str,
    employee_id: str,
) -> Optional[POSShiftORM]:
    query = db.query(POSShiftORM).filter(
        POSShiftORM.employeeId == employee_id,
        POSShiftORM.status == "open",
    )
    if tenant_id:
        query = query.filter(POSShiftORM.tenant_id == tenant_id)
    return query.first()


def create_pos_shift(db: Session, shift_data: dict) -> POSShiftORM:
    db_shift = POSShiftORM(**shift_data)
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift


def update_pos_shift(
    db: Session,
    shift_id: str,
    update_data: dict,
    tenant_id: str = None,
) -> Optional[POSShiftORM]:
    shift = get_pos_shift_by_id(db, shift_id, tenant_id)
    if shift:
        for key, value in update_data.items():
            if hasattr(shift, key) and value is not None:
                setattr(shift, key, value)
        shift.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(shift)
    return shift


def delete_pos_shift(db: Session, shift_id: str, tenant_id: str = None) -> bool:
    shift = get_pos_shift_by_id(db, shift_id, tenant_id)
    if shift:
        db.delete(shift)
        db.commit()
        return True
    return False


def list_pos_shifts_endpoint(
    db: Session,
    tenant_context: dict,
    status: Optional[str],
    cashier_id: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    page: int,
    limit: int,
):
    from fastapi import HTTPException
    from ..shared import convert_db_shift_to_pydantic
    from .schemas import POSShiftsResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        skip = (page - 1) * limit
        shifts = get_pos_shifts(db, tenant_context["tenant_id"], skip, limit)
        if status or cashier_id or date_from or date_to:
            filtered_shifts = []
            for shift in shifts:
                if status and shift.status != status:
                    continue
                if cashier_id and str(shift.employeeId) != cashier_id:
                    continue
                if date_from:
                    from_date = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
                    if shift.startTime < from_date:
                        continue
                if date_to:
                    to_date = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
                    if shift.startTime > to_date:
                        continue
                filtered_shifts.append(shift)
            shifts = filtered_shifts
        pydantic_shifts = [convert_db_shift_to_pydantic(s) for s in shifts]
        total = len(pydantic_shifts)
        return POSShiftsResponse(
            shifts=pydantic_shifts,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching shifts: {str(e)}")


def get_pos_shift_endpoint(db: Session, tenant_context: dict, shift_id: str):
    from fastapi import HTTPException
    from ..shared import convert_db_shift_to_pydantic
    from .schemas import POSShiftResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        shift = get_pos_shift_by_id(db, shift_id, tenant_context["tenant_id"])
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        return POSShiftResponse(shift=convert_db_shift_to_pydantic(shift))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching shift: {str(e)}")


def open_pos_shift_endpoint(db: Session, tenant_context: dict, current_user, shift_data):
    import uuid as uuid_lib
    from fastapi import HTTPException
    from ..shared import convert_db_shift_to_pydantic, generate_shift_number
    from .schemas import POSShiftResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        existing_open_shift = get_open_pos_shift(
            db,
            tenant_context["tenant_id"],
            str(current_user.id),
        )
        if existing_open_shift:
            raise HTTPException(status_code=400, detail="User already has an open shift")
        db_shift_data = {
            "id": str(uuid_lib.uuid4()),
            "shiftNumber": generate_shift_number(),
            "tenant_id": tenant_context["tenant_id"],
            "employeeId": str(current_user.id),
            "startTime": datetime.now(),
            "openingAmount": shift_data.openingBalance,
            "totalSales": 0.0,
            "totalTransactions": 0,
            "status": "open",
            "notes": shift_data.notes,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }
        db_shift = create_pos_shift(db, db_shift_data)
        return POSShiftResponse(shift=convert_db_shift_to_pydantic(db_shift))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating shift: {str(e)}")


def update_pos_shift_endpoint(db: Session, tenant_context: dict, shift_id: str, shift_data):
    from fastapi import HTTPException
    from ..shared import convert_db_shift_to_pydantic
    from .schemas import POSShiftResponse

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        update_dict = shift_data.dict(exclude_unset=True)
        if "closingBalance" in update_dict:
            update_dict["closingAmount"] = update_dict.pop("closingBalance")
        if "status" in update_dict and update_dict["status"] is not None:
            update_dict["status"] = (
                update_dict["status"].value
                if hasattr(update_dict["status"], "value")
                else update_dict["status"]
            )
        db_shift = update_pos_shift(db, shift_id, update_dict, tenant_context["tenant_id"])
        if not db_shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        return POSShiftResponse(shift=convert_db_shift_to_pydantic(db_shift))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating shift: {str(e)}")


def get_current_open_shift_endpoint(db: Session, tenant_context: dict, current_user):
    from fastapi import HTTPException
    from ..shared import convert_db_shift_to_pydantic

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        shift = get_open_pos_shift(db, tenant_context["tenant_id"], str(current_user.id))
        if shift:
            return {"shift": convert_db_shift_to_pydantic(shift)}
        return {"shift": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching open shift: {str(e)}")
