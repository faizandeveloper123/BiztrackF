from typing import Optional

from pydantic import BaseModel


class LeaveRequestSelfCreate(BaseModel):
    leaveType: str
    startDate: str
    endDate: str
    totalDays: float = 1
    reason: str


class LeaveApprovalBody(BaseModel):
    action: str
    rejectionReason: Optional[str] = None
