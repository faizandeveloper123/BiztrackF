from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from .custom_options_models import (
    CustomEventType, CustomDepartment, CustomLeaveType, CustomLeadSource,
    CustomContactSource, CustomCompanyIndustry, CustomContactType, CustomIndustry
)

# CustomEventType functions
def get_custom_event_type_by_id(event_type_id: str, db: Session, tenant_id: str = None) -> Optional[CustomEventType]:
    query = db.query(CustomEventType).filter(CustomEventType.id == event_type_id)
    if tenant_id:
        query = query.filter(CustomEventType.tenant_id == tenant_id)
    return query.first()

def get_all_custom_event_types(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomEventType]:
    query = db.query(CustomEventType)
    if tenant_id:
        query = query.filter(CustomEventType.tenant_id == tenant_id)
    return query.order_by(CustomEventType.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_event_types(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomEventType]:
    query = db.query(CustomEventType).filter(CustomEventType.isActive == True)
    if tenant_id:
        query = query.filter(CustomEventType.tenant_id == tenant_id)
    return query.order_by(CustomEventType.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_event_type(event_type_data: dict, db: Session) -> CustomEventType:
    db_event_type = CustomEventType(**event_type_data)
    db.add(db_event_type)
    db.commit()
    db.refresh(db_event_type)
    return db_event_type

def update_custom_event_type(event_type_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomEventType]:
    event_type = get_custom_event_type_by_id(event_type_id, db, tenant_id)
    if event_type:
        for key, value in update_data.items():
            if hasattr(event_type, key) and value is not None:
                setattr(event_type, key, value)
        event_type.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(event_type)
    return event_type

def delete_custom_event_type(event_type_id: str, db: Session, tenant_id: str = None) -> bool:
    event_type = get_custom_event_type_by_id(event_type_id, db, tenant_id)
    if event_type:
        db.delete(event_type)
        db.commit()
        return True
    return False

# CustomDepartment functions
def get_custom_department_by_id(department_id: str, db: Session, tenant_id: str = None) -> Optional[CustomDepartment]:
    query = db.query(CustomDepartment).filter(CustomDepartment.id == department_id)
    if tenant_id:
        query = query.filter(CustomDepartment.tenant_id == tenant_id)
    return query.first()

def get_all_custom_departments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomDepartment]:
    query = db.query(CustomDepartment)
    if tenant_id:
        query = query.filter(CustomDepartment.tenant_id == tenant_id)
    return query.order_by(CustomDepartment.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_departments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomDepartment]:
    query = db.query(CustomDepartment).filter(CustomDepartment.isActive == True)
    if tenant_id:
        query = query.filter(CustomDepartment.tenant_id == tenant_id)
    return query.order_by(CustomDepartment.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_department(department_data: dict, db: Session) -> CustomDepartment:
    db_department = CustomDepartment(**department_data)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

def update_custom_department(department_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomDepartment]:
    department = get_custom_department_by_id(department_id, db, tenant_id)
    if department:
        for key, value in update_data.items():
            if hasattr(department, key) and value is not None:
                setattr(department, key, value)
        department.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(department)
    return department

def delete_custom_department(department_id: str, db: Session, tenant_id: str = None) -> bool:
    department = get_custom_department_by_id(department_id, db, tenant_id)
    if department:
        db.delete(department)
        db.commit()
        return True
    return False

# CustomLeaveType functions
def get_custom_leave_type_by_id(leave_type_id: str, db: Session, tenant_id: str = None) -> Optional[CustomLeaveType]:
    query = db.query(CustomLeaveType).filter(CustomLeaveType.id == leave_type_id)
    if tenant_id:
        query = query.filter(CustomLeaveType.tenant_id == tenant_id)
    return query.first()

def get_all_custom_leave_types(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomLeaveType]:
    query = db.query(CustomLeaveType)
    if tenant_id:
        query = query.filter(CustomLeaveType.tenant_id == tenant_id)
    return query.order_by(CustomLeaveType.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_leave_types(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomLeaveType]:
    query = db.query(CustomLeaveType).filter(CustomLeaveType.isActive == True)
    if tenant_id:
        query = query.filter(CustomLeaveType.tenant_id == tenant_id)
    return query.order_by(CustomLeaveType.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_leave_type(leave_type_data: dict, db: Session) -> CustomLeaveType:
    db_leave_type = CustomLeaveType(**leave_type_data)
    db.add(db_leave_type)
    db.commit()
    db.refresh(db_leave_type)
    return db_leave_type

def update_custom_leave_type(leave_type_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomLeaveType]:
    leave_type = get_custom_leave_type_by_id(leave_type_id, db, tenant_id)
    if leave_type:
        for key, value in update_data.items():
            if hasattr(leave_type, key) and value is not None:
                setattr(leave_type, key, value)
        leave_type.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(leave_type)
    return leave_type

def delete_custom_leave_type(leave_type_id: str, db: Session, tenant_id: str = None) -> bool:
    leave_type = get_custom_leave_type_by_id(leave_type_id, db, tenant_id)
    if leave_type:
        db.delete(leave_type)
        db.commit()
        return True
    return False

# CustomLeadSource functions
def get_custom_lead_source_by_id(lead_source_id: str, db: Session, tenant_id: str = None) -> Optional[CustomLeadSource]:
    query = db.query(CustomLeadSource).filter(CustomLeadSource.id == lead_source_id)
    if tenant_id:
        query = query.filter(CustomLeadSource.tenant_id == tenant_id)
    return query.first()

def get_all_custom_lead_sources(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomLeadSource]:
    query = db.query(CustomLeadSource)
    if tenant_id:
        query = query.filter(CustomLeadSource.tenant_id == tenant_id)
    return query.order_by(CustomLeadSource.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_lead_sources(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomLeadSource]:
    query = db.query(CustomLeadSource).filter(CustomLeadSource.isActive == True)
    if tenant_id:
        query = query.filter(CustomLeadSource.tenant_id == tenant_id)
    return query.order_by(CustomLeadSource.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_lead_source(lead_source_data: dict, db: Session) -> CustomLeadSource:
    db_lead_source = CustomLeadSource(**lead_source_data)
    db.add(db_lead_source)
    db.commit()
    db.refresh(db_lead_source)
    return db_lead_source

def update_custom_lead_source(lead_source_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomLeadSource]:
    lead_source = get_custom_lead_source_by_id(lead_source_id, db, tenant_id)
    if lead_source:
        for key, value in update_data.items():
            if hasattr(lead_source, key) and value is not None:
                setattr(lead_source, key, value)
        lead_source.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(lead_source)
    return lead_source

def delete_custom_lead_source(lead_source_id: str, db: Session, tenant_id: str = None) -> bool:
    lead_source = get_custom_lead_source_by_id(lead_source_id, db, tenant_id)
    if lead_source:
        db.delete(lead_source)
        db.commit()
        return True
    return False

# CustomContactSource functions
def get_custom_contact_source_by_id(contact_source_id: str, db: Session, tenant_id: str = None) -> Optional[CustomContactSource]:
    query = db.query(CustomContactSource).filter(CustomContactSource.id == contact_source_id)
    if tenant_id:
        query = query.filter(CustomContactSource.tenant_id == tenant_id)
    return query.first()

def get_all_custom_contact_sources(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomContactSource]:
    query = db.query(CustomContactSource)
    if tenant_id:
        query = query.filter(CustomContactSource.tenant_id == tenant_id)
    return query.order_by(CustomContactSource.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_contact_sources(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomContactSource]:
    query = db.query(CustomContactSource).filter(CustomContactSource.isActive == True)
    if tenant_id:
        query = query.filter(CustomContactSource.tenant_id == tenant_id)
    return query.order_by(CustomContactSource.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_contact_source(contact_source_data: dict, db: Session) -> CustomContactSource:
    db_contact_source = CustomContactSource(**contact_source_data)
    db.add(db_contact_source)
    db.commit()
    db.refresh(db_contact_source)
    return db_contact_source

def update_custom_contact_source(contact_source_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomContactSource]:
    contact_source = get_custom_contact_source_by_id(contact_source_id, db, tenant_id)
    if contact_source:
        for key, value in update_data.items():
            if hasattr(contact_source, key) and value is not None:
                setattr(contact_source, key, value)
        contact_source.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(contact_source)
    return contact_source

def delete_custom_contact_source(contact_source_id: str, db: Session, tenant_id: str = None) -> bool:
    contact_source = get_custom_contact_source_by_id(contact_source_id, db, tenant_id)
    if contact_source:
        db.delete(contact_source)
        db.commit()
        return True
    return False

# CustomCompanyIndustry functions
def get_custom_company_industry_by_id(industry_id: str, db: Session, tenant_id: str = None) -> Optional[CustomCompanyIndustry]:
    query = db.query(CustomCompanyIndustry).filter(CustomCompanyIndustry.id == industry_id)
    if tenant_id:
        query = query.filter(CustomCompanyIndustry.tenant_id == tenant_id)
    return query.first()

def get_all_custom_company_industries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomCompanyIndustry]:
    query = db.query(CustomCompanyIndustry)
    if tenant_id:
        query = query.filter(CustomCompanyIndustry.tenant_id == tenant_id)
    return query.order_by(CustomCompanyIndustry.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_company_industries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomCompanyIndustry]:
    query = db.query(CustomCompanyIndustry).filter(CustomCompanyIndustry.isActive == True)
    if tenant_id:
        query = query.filter(CustomCompanyIndustry.tenant_id == tenant_id)
    return query.order_by(CustomCompanyIndustry.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_company_industry(industry_data: dict, db: Session) -> CustomCompanyIndustry:
    db_industry = CustomCompanyIndustry(**industry_data)
    db.add(db_industry)
    db.commit()
    db.refresh(db_industry)
    return db_industry

def update_custom_company_industry(industry_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomCompanyIndustry]:
    industry = get_custom_company_industry_by_id(industry_id, db, tenant_id)
    if industry:
        for key, value in update_data.items():
            if hasattr(industry, key) and value is not None:
                setattr(industry, key, value)
        industry.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(industry)
    return industry

def delete_custom_company_industry(industry_id: str, db: Session, tenant_id: str = None) -> bool:
    industry = get_custom_company_industry_by_id(industry_id, db, tenant_id)
    if industry:
        db.delete(industry)
        db.commit()
        return True
    return False

# CustomContactType functions
def get_custom_contact_type_by_id(contact_type_id: str, db: Session, tenant_id: str = None) -> Optional[CustomContactType]:
    query = db.query(CustomContactType).filter(CustomContactType.id == contact_type_id)
    if tenant_id:
        query = query.filter(CustomContactType.tenant_id == tenant_id)
    return query.first()

def get_all_custom_contact_types(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomContactType]:
    query = db.query(CustomContactType)
    if tenant_id:
        query = query.filter(CustomContactType.tenant_id == tenant_id)
    return query.order_by(CustomContactType.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_contact_types(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomContactType]:
    query = db.query(CustomContactType).filter(CustomContactType.isActive == True)
    if tenant_id:
        query = query.filter(CustomContactType.tenant_id == tenant_id)
    return query.order_by(CustomContactType.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_contact_type(contact_type_data: dict, db: Session) -> CustomContactType:
    db_contact_type = CustomContactType(**contact_type_data)
    db.add(db_contact_type)
    db.commit()
    db.refresh(db_contact_type)
    return db_contact_type

def update_custom_contact_type(contact_type_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomContactType]:
    contact_type = get_custom_contact_type_by_id(contact_type_id, db, tenant_id)
    if contact_type:
        for key, value in update_data.items():
            if hasattr(contact_type, key) and value is not None:
                setattr(contact_type, key, value)
        contact_type.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(contact_type)
    return contact_type

def delete_custom_contact_type(contact_type_id: str, db: Session, tenant_id: str = None) -> bool:
    contact_type = get_custom_contact_type_by_id(contact_type_id, db, tenant_id)
    if contact_type:
        db.delete(contact_type)
        db.commit()
        return True
    return False

# CustomIndustry functions
def get_custom_industry_by_id(industry_id: str, db: Session, tenant_id: str = None) -> Optional[CustomIndustry]:
    query = db.query(CustomIndustry).filter(CustomIndustry.id == industry_id)
    if tenant_id:
        query = query.filter(CustomIndustry.tenant_id == tenant_id)
    return query.first()

def get_all_custom_industries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomIndustry]:
    query = db.query(CustomIndustry)
    if tenant_id:
        query = query.filter(CustomIndustry.tenant_id == tenant_id)
    return query.order_by(CustomIndustry.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_custom_industries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomIndustry]:
    query = db.query(CustomIndustry).filter(CustomIndustry.isActive == True)
    if tenant_id:
        query = query.filter(CustomIndustry.tenant_id == tenant_id)
    return query.order_by(CustomIndustry.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_industry(industry_data: dict, db: Session) -> CustomIndustry:
    db_industry = CustomIndustry(**industry_data)
    db.add(db_industry)
    db.commit()
    db.refresh(db_industry)
    return db_industry

def update_custom_industry(industry_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomIndustry]:
    industry = get_custom_industry_by_id(industry_id, db, tenant_id)
    if industry:
        for key, value in update_data.items():
            if hasattr(industry, key) and value is not None:
                setattr(industry, key, value)
        industry.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(industry)
    return industry

def delete_custom_industry(industry_id: str, db: Session, tenant_id: str = None) -> bool:
    industry = get_custom_industry_by_id(industry_id, db, tenant_id)
    if industry:
        db.delete(industry)
        db.commit()
        return True
    return False
