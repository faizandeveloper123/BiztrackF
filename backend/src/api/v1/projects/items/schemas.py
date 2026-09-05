from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from .....models.projects.enums import ProjectStatus, ProjectPriority
from .....models.common import Pagination
from .....models.user_models import TeamMember

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: ProjectPriority = ProjectPriority.MEDIUM
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: int = 0
    budget: Optional[float] = None
    actualCost: float = 0.0
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: str
    teamMemberIds: List[str] = []
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return ProjectStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return ProjectPriority(v)
        return v
    
    @field_validator('description', 'notes', 'clientEmail', 'startDate', 'endDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v
    
    @field_validator('projectManagerId', mode='before')
    @classmethod
    def validate_project_manager_id(cls, v):
        if v == '' or v is None:
            raise ValueError('Project manager ID cannot be empty')
        return v
    
    @field_validator('teamMemberIds', mode='before')
    @classmethod
    def validate_team_member_ids(cls, v):
        if isinstance(v, list):
            filtered = [member_id for member_id in v if member_id is not None and member_id != '']
            return filtered
        return v

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: Optional[int] = None
    budget: Optional[float] = None
    actualCost: Optional[float] = None
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: Optional[str] = None
    teamMemberIds: Optional[List[str]] = None

    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        if isinstance(v, str):
            return ProjectStatus(v)
        return v
    
    @field_validator('priority', mode='before')
    @classmethod
    def validate_priority(cls, v):
        if isinstance(v, str):
            return ProjectPriority(v)
        return v
    
    @field_validator('description', 'notes', 'clientEmail', 'startDate', 'endDate', mode='before')
    @classmethod
    def validate_optional_strings(cls, v):
        if v == '':
            return None
        return v

class Project(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: int = 0
    budget: Optional[float] = None
    actualCost: float = 0.0
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: str
    createdById: Optional[str] = None
    projectManager: TeamMember
    teamMembers: List[TeamMember] = []
    deletionStatus: str = "none"
    deletionRequestedById: Optional[str] = None
    deletionRequestedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    activities: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


class ProjectsResponse(BaseModel):
    projects: List[Project]
    pagination: Pagination
