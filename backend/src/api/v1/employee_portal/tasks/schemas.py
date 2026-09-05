from typing import Optional

from pydantic import BaseModel, Field


class EmployeeTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    projectId: Optional[str] = None
    dueDate: Optional[str] = None
    priority: str = "medium"


class EmployeeTaskLog(BaseModel):
    hours: float = Field(gt=0)
    notes: Optional[str] = None
    status: Optional[str] = None
