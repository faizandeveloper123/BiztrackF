from pydantic import BaseModel
from typing import Optional

class CustomEventType(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomDepartment(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomLeaveType(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomLeadSource(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomContactSource(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomCompanyIndustry(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomContactType(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

class CustomIndustry(BaseModel):
    name: str
    description: Optional[str] = None
    tenant_id: str
    created_by: str

