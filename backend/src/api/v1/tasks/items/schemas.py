from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .....models.projects.enums import TaskStatus, TaskPriority
from .....models.common import Pagination

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    projectId: str
    assignedToId: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    estimatedMinutes: Optional[int] = None
    estimatedSeconds: Optional[int] = None
    reminderHours: Optional[int] = None
    reminderMinutes: Optional[int] = None
    reminderSeconds: Optional[int] = None
    actualHours: float = 0.0
    tags: List[str] = []
    parentTaskId: Optional[str] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return TaskStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return TaskPriority(v)
        return v
    
    @field_validator('description', 'dueDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v
    
    @field_validator('projectId', mode='before')
    @classmethod
    def validate_project_id(cls, v):
        if v == '' or v is None:
            raise ValueError('Project ID cannot be empty')
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignedToId: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    estimatedMinutes: Optional[int] = None
    estimatedSeconds: Optional[int] = None
    reminderHours: Optional[int] = None
    reminderMinutes: Optional[int] = None
    reminderSeconds: Optional[int] = None
    actualHours: Optional[float] = None
    tags: Optional[List[str]] = None
    parentTaskId: Optional[str] = None
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return TaskStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return TaskPriority(v)
        return v
    
    @field_validator('description', 'dueDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    project: str
    assignedTo: Optional[Dict[str, Any]] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    estimatedMinutes: Optional[int] = None
    estimatedSeconds: Optional[int] = None
    reminderHours: Optional[int] = None
    reminderMinutes: Optional[int] = None
    reminderSeconds: Optional[int] = None
    actualHours: float = 0.0
    tags: List[str] = []
    createdBy: Dict[str, Any]
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SubTask(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    projectId: str
    assignedToId: Optional[str] = None
    createdById: str
    parentTaskId: Optional[str] = None
    dueDate: Optional[str] = None
    estimatedHours: Optional[float] = None
    estimatedMinutes: Optional[int] = None
    estimatedSeconds: Optional[int] = None
    reminderHours: Optional[int] = None
    reminderMinutes: Optional[int] = None
    reminderSeconds: Optional[int] = None
    actualHours: float = 0.0
    trackedSeconds: Optional[int] = None
    remainingSeconds: Optional[int] = None
    activeTimerStartedAt: Optional[str] = None
    isTimerActive: bool = False
    isTimeLow: bool = False
    tags: List[str] = []
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    assignedTo: Optional[Dict[str, Any]] = None
    createdBy: Dict[str, Any]
    subtasks: List['SubTask'] = []
    subtaskCount: int = 0
    completedSubtaskCount: int = 0

    class Config:
        from_attributes = True

SubTask.model_rebuild()


class TasksResponse(BaseModel):
    tasks: List[SubTask]
    pagination: Pagination
