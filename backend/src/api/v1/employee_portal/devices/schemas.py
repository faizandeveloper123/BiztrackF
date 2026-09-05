from typing import Optional

from pydantic import BaseModel


class EmployeeDeviceCreate(BaseModel):
    employeeId: str
    name: str
    deviceType: str = "other"
    serialNumber: Optional[str] = None
    model: Optional[str] = None
    notes: Optional[str] = None


class EmployeeDeviceUpdate(BaseModel):
    name: Optional[str] = None
    deviceType: Optional[str] = None
    serialNumber: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    returnedAt: Optional[str] = None
