from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ...config.database import get_db
from ..dependencies import get_current_user, get_tenant_context
from ...models.user_models import User as UserModel
from ...config.database import (
    CustomEventType, CustomDepartment, CustomLeaveType, CustomLeadSource,
    CustomContactSource, CustomCompanyIndustry, CustomContactType, CustomIndustry
)

router = APIRouter(prefix="/custom-options", tags=["custom-options"])

# Custom Event Types
@router.post("/event-types")
async def create_custom_event_type(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_type = CustomEventType(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_type)
    db.commit()
    db.refresh(custom_type)
    
    return {
        "id": custom_type.id,
        "name": custom_type.name,
        "description": custom_type.description,
        "tenant_id": custom_type.tenant_id,
        "createdBy": custom_type.createdBy,
        "createdAt": custom_type.createdAt,
        "updatedAt": custom_type.updatedAt
    }

@router.get("/event-types")
async def get_custom_event_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_types = db.query(CustomEventType).filter(
        CustomEventType.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": ct.id,
            "name": ct.name,
            "description": ct.description,
            "createdAt": ct.createdAt
        }
        for ct in custom_types
    ]

# Custom Departments
@router.post("/departments")
async def create_custom_department(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_dept = CustomDepartment(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_dept)
    db.commit()
    db.refresh(custom_dept)
    
    return {
        "id": custom_dept.id,
        "name": custom_dept.name,
        "description": custom_dept.description,
        "tenant_id": custom_dept.tenant_id,
        "createdBy": custom_dept.createdBy,
        "createdAt": custom_dept.createdAt,
        "updatedAt": custom_dept.updatedAt
    }

@router.get("/departments")
async def get_custom_departments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_depts = db.query(CustomDepartment).filter(
        CustomDepartment.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": cd.id,
            "name": cd.name,
            "description": cd.description,
            "createdAt": cd.createdAt
        }
        for cd in custom_depts
    ]

# Custom Leave Types
@router.post("/leave-types")
async def create_custom_leave_type(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_leave = CustomLeaveType(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_leave)
    db.commit()
    db.refresh(custom_leave)
    
    return {
        "id": custom_leave.id,
        "name": custom_leave.name,
        "description": custom_leave.description,
        "tenant_id": custom_leave.tenant_id,
        "createdBy": custom_leave.createdBy,
        "createdAt": custom_leave.createdAt,
        "updatedAt": custom_leave.updatedAt
    }

@router.get("/leave-types")
async def get_custom_leave_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_leaves = db.query(CustomLeaveType).filter(
        CustomLeaveType.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": cl.id,
            "name": cl.name,
            "description": cl.description,
            "createdAt": cl.createdAt
        }
        for cl in custom_leaves
    ]

# Custom Lead Sources
@router.post("/lead-sources")
async def create_custom_lead_source(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_source = CustomLeadSource(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_source)
    db.commit()
    db.refresh(custom_source)
    
    return {
        "id": custom_source.id,
        "name": custom_source.name,
        "description": custom_source.description,
        "tenant_id": custom_source.tenant_id,
        "createdBy": custom_source.createdBy,
        "createdAt": custom_source.createdAt,
        "updatedAt": custom_source.updatedAt
    }

@router.get("/lead-sources")
async def get_custom_lead_sources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_sources = db.query(CustomLeadSource).filter(
        CustomLeadSource.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": cs.id,
            "name": cs.name,
            "description": cs.description,
            "createdAt": cs.createdAt
        }
        for cs in custom_sources
    ]

# Custom Contact Sources
@router.post("/contact-sources")
async def create_custom_contact_source(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_source = CustomContactSource(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_source)
    db.commit()
    db.refresh(custom_source)
    
    return {
        "id": custom_source.id,
        "name": custom_source.name,
        "description": custom_source.description,
        "tenant_id": custom_source.tenant_id,
        "createdBy": custom_source.createdBy,
        "createdAt": custom_source.createdAt,
        "updatedAt": custom_source.updatedAt
    }

@router.get("/contact-sources")
async def get_custom_contact_sources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_sources = db.query(CustomContactSource).filter(
        CustomContactSource.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": cs.id,
            "name": cs.name,
            "description": cs.description,
            "createdAt": cs.createdAt
        }
        for cs in custom_sources
    ]

# Custom Company Industries
@router.post("/company-industries")
async def create_custom_company_industry(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_industry = CustomCompanyIndustry(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_industry)
    db.commit()
    db.refresh(custom_industry)
    
    return {
        "id": custom_industry.id,
        "name": custom_industry.name,
        "description": custom_industry.description,
        "tenant_id": custom_industry.tenant_id,
        "createdBy": custom_industry.createdBy,
        "createdAt": custom_industry.createdAt,
        "updatedAt": custom_industry.updatedAt
    }

@router.get("/company-industries")
async def get_custom_company_industries(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_industries = db.query(CustomCompanyIndustry).filter(
        CustomCompanyIndustry.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": ci.id,
            "name": ci.name,
            "description": ci.description,
            "createdAt": ci.createdAt
        }
        for ci in custom_industries
    ]

# Custom Contact Types
@router.post("/contact-types")
async def create_custom_contact_type(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_type = CustomContactType(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_type)
    db.commit()
    db.refresh(custom_type)
    
    return {
        "id": custom_type.id,
        "name": custom_type.name,
        "description": custom_type.description,
        "tenant_id": custom_type.tenant_id,
        "createdBy": custom_type.createdBy,
        "createdAt": custom_type.createdAt,
        "updatedAt": custom_type.updatedAt
    }

@router.get("/contact-types")
async def get_custom_contact_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_types = db.query(CustomContactType).filter(
        CustomContactType.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": ct.id,
            "name": ct.name,
            "description": ct.description,
            "createdAt": ct.createdAt
        }
        for ct in custom_types
    ]

# Custom Industries
@router.post("/industries")
async def create_custom_industry(
    name: str,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_industry = CustomIndustry(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        tenant_id=tenant_context["tenant_id"],
        createdBy=current_user.id
    )
    
    db.add(custom_industry)
    db.commit()
    db.refresh(custom_industry)
    
    return {
        "id": custom_industry.id,
        "name": custom_industry.name,
        "description": custom_industry.description,
        "tenant_id": custom_industry.tenant_id,
        "createdBy": custom_industry.createdBy,
        "createdAt": custom_industry.createdAt,
        "updatedAt": custom_industry.updatedAt
    }

@router.get("/industries")
async def get_custom_industries(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    custom_industries = db.query(CustomIndustry).filter(
        CustomIndustry.tenant_id == tenant_context["tenant_id"]
    ).all()
    
    return [
        {
            "id": ci.id,
            "name": ci.name,
            "description": ci.description,
            "createdAt": ci.createdAt
        }
        for ci in custom_industries
    ]
