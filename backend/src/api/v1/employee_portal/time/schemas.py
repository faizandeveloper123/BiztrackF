from typing import Optional

from pydantic import BaseModel


class TimeSessionStart(BaseModel):
    projectId: Optional[str] = None
    taskId: Optional[str] = None
    description: Optional[str] = None


class TimeSessionStop(BaseModel):
    notes: Optional[str] = None
