from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid
import logging
import re
import secrets
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

from ...models.user_models import User
from ...models.hrm_models import (
    Employee, EmployeeCreate, EmployeeUpdate, HRMEmployeesResponse,
    JobPosting, JobPostingCreate, JobPostingUpdate, HRMJobPostingsResponse,
    Application, ApplicationCreate, ApplicationUpdate, HRMApplicationsResponse,
    PerformanceReview, PerformanceReviewCreate, PerformanceReviewUpdate, HRMReviewsResponse,
    TimeEntry, TimeEntryCreate, TimeEntryUpdate, HRMTimeEntriesResponse,
    LeaveRequest, LeaveRequestCreate, LeaveRequestUpdate, HRMLeaveRequestsResponse,
    Payroll, PayrollCreate, PayrollUpdate, HRMPayrollResponse,
    Benefits, BenefitsCreate, BenefitsUpdate, HRMBenefitsResponse,
    Training, TrainingCreate, TrainingUpdate, HRMTrainingResponse,
    TrainingEnrollment, TrainingEnrollmentCreate, TrainingEnrollmentUpdate, HRMEnrollmentsResponse,
    HRMDashboard, HRMEmployeeFilters, HRMJobFilters, HRMApplicationFilters, HRMReviewFilters,
    HRMTimeFilters, HRMLeaveFilters, HRMPayrollFilters, HRMTrainingFilters,
    Department, EmploymentStatus, EmployeeType, JobStatus, ApplicationStatus,
    Supplier, SupplierCreate, SupplierUpdate, SupplierResponse, SuppliersResponse
)
from ...config.hrm_models import Employee as DBEmployee
from ...services.s3_service import s3_service
from ...config.database import (
    get_db, get_user_by_id, get_user_by_email, get_user_by_username, get_employee_by_user_id,
    get_employees, get_employee_by_id, create_employee, update_employee, delete_employee,
    get_job_postings, get_job_posting_by_id, create_job_posting, update_job_posting, delete_job_posting,
    get_applications, get_application_by_id, create_application, update_application, delete_application,
    get_performance_reviews, get_performance_review_by_id, create_performance_review, update_performance_review, delete_performance_review,
    get_time_entries, get_time_entry_by_id, create_time_entry, update_time_entry, delete_time_entry,
    get_leave_requests, get_leave_request_by_id, create_leave_request, update_leave_request, delete_leave_request,
    get_payroll, get_payroll_by_id, create_payroll, update_payroll, delete_payroll,
    get_benefits, get_benefit_by_id, create_benefit, update_benefit, delete_benefit,
    get_training, get_training_by_id, create_training, update_training, delete_training,
    get_training_enrollments, get_training_enrollment_by_id, create_training_enrollment, update_training_enrollment, delete_training_enrollment,
    get_hrm_dashboard_data,
    get_suppliers, get_supplier_by_id, get_supplier_by_code, create_supplier, update_supplier, delete_supplier
)
from ...config.core_crud import (
    create_user,
    update_user,
)
from ...core.auth import get_password_hash
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission

router = APIRouter(prefix="/hrm", tags=["hrm"])

# Employee endpoints
@router.get("/employees", response_model=HRMEmployeesResponse)
async def get_hrm_employees(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    employee_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all employees with optional filtering"""
    try:
        skip = (page - 1) * limit
        employees = get_employees(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if department or status or employee_type or search:
            filtered_employees = []
            for employee in employees:
                if department and employee.department != department:
                    continue
                if status and employee.employmentStatus != status:
                    continue
                if employee_type and employee.employeeType != employee_type:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (employee.firstName or "").lower(),
                        search_lower in (employee.lastName or "").lower(),
                        search_lower in (employee.email or "").lower(),
                        search_lower in (employee.position or "").lower()
                    ]):
                        continue
                filtered_employees.append(employee)
            employees = filtered_employees
        
        # Get total count for pagination
        total = len(employees)
        
        # Convert database employees to Pydantic models
        employee_models = []
        for db_employee in employees:
            user = get_user_by_id(str(db_employee.userId), db) if db_employee.userId else None
            
            employee_models.append(Employee(
                id=str(db_employee.id),
                firstName=user.firstName if user else "",
                lastName=user.lastName if user else "",
                email=user.email if user else "",
                phone=db_employee.phone,
                dateOfBirth=db_employee.dateOfBirth.isoformat() if db_employee.dateOfBirth else None,
                hireDate=db_employee.hireDate.isoformat() if db_employee.hireDate else "",
                employeeId=db_employee.employeeId,
                department=db_employee.department or Department.OTHER.value,
                position=db_employee.position,
                employeeType=EmployeeType(db_employee.employeeType) if db_employee.employeeType else EmployeeType.FULL_TIME,
                employmentStatus=EmploymentStatus(db_employee.employmentStatus) if db_employee.employmentStatus else EmploymentStatus.ACTIVE,
                managerId=str(db_employee.managerId) if db_employee.managerId else None,
                salary=db_employee.salary,
                address=db_employee.address,
                emergencyContact=db_employee.emergencyContact,
                emergencyPhone=db_employee.emergencyPhone,
                skills=db_employee.skills if db_employee.skills else [],
                certifications=db_employee.certifications if db_employee.certifications else [],
                notes=db_employee.notes,
                resume_url=db_employee.resume_url if hasattr(db_employee, 'resume_url') else None,
                attachments=db_employee.attachments if db_employee.attachments else [],
                tenant_id=str(db_employee.tenant_id),
                createdBy=str(db_employee.userId) if db_employee.userId else "",
                createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else "",
                updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else ""
            ))
        
        return HRMEmployeesResponse(
            employees=employee_models,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching employees: {str(e)}")

@router.post("/employees", response_model=Employee)
async def create_hrm_employee(
    employee_data: EmployeeCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new employee"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = str(tenant_context["tenant_id"])
        employee_email = employee_data.email.strip().lower()
        first_name = employee_data.firstName.strip()
        last_name = employee_data.lastName.strip()

        linked_user = get_user_by_email(employee_email, db)
        if linked_user:
            if linked_user.tenant_id and str(linked_user.tenant_id) != tenant_id:
                raise HTTPException(status_code=400, detail="Email is already registered in another tenant")
            existing_employee_for_user = get_employee_by_user_id(str(linked_user.id), db, tenant_id)
            if existing_employee_for_user:
                raise HTTPException(status_code=400, detail="This user already has an employee profile")
            user_id = linked_user.id
            user_updates = {}
            if linked_user.firstName != first_name:
                user_updates["firstName"] = first_name
            if linked_user.lastName != last_name:
                user_updates["lastName"] = last_name
            if linked_user.email and linked_user.email.strip().lower() != employee_email:
                user_updates["email"] = employee_email
            if user_updates:
                try:
                    update_user(str(linked_user.id), user_updates, db)
                except ValueError as e:
                    raise HTTPException(status_code=400, detail=str(e)) from e
        else:
            username_base = re.sub(r"[^a-z0-9_]", "_", (employee_email.split("@")[0] if "@" in employee_email else employee_data.employeeId.lower())).strip("_")
            if not username_base:
                username_base = "employee"
            username = username_base
            suffix = 1
            while get_user_by_username(username, db):
                username = f"{username_base}_{suffix}"
                suffix += 1
            try:
                new_user = create_user(
                    {
                        "tenant_id": tenant_id,
                        "userName": username,
                        "email": employee_email,
                        "firstName": first_name,
                        "lastName": last_name,
                        "userRole": "team_member",
                        "hashedPassword": get_password_hash(secrets.token_urlsafe(24)),
                        "isActive": True,
                    },
                    db,
                )
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e)) from e
            user_id = new_user.id

        db_employee = DBEmployee(
            tenant_id=tenant_context["tenant_id"],
            userId=user_id,
            employeeId=employee_data.employeeId,
            department=employee_data.department.value if hasattr(employee_data.department, 'value') else employee_data.department,
            position=employee_data.position,
            hireDate=datetime.strptime(employee_data.hireDate, "%Y-%m-%d").date() if employee_data.hireDate else datetime.now().date(),
            salary=employee_data.salary,
            managerId=uuid.UUID(employee_data.managerId) if employee_data.managerId else None,
            notes=employee_data.notes,
            resume_url=employee_data.resume_url,
            attachments=employee_data.attachments if employee_data.attachments else [],
            phone=employee_data.phone,
            dateOfBirth=datetime.strptime(employee_data.dateOfBirth, "%Y-%m-%d").date() if employee_data.dateOfBirth else None,
            address=employee_data.address,
            emergencyContact=employee_data.emergencyContact,
            emergencyPhone=employee_data.emergencyPhone,
            skills=employee_data.skills if employee_data.skills else [],
            certifications=employee_data.certifications if employee_data.certifications else [],
            employeeType=employee_data.employeeType.value if hasattr(employee_data.employeeType, 'value') else employee_data.employeeType,
            employmentStatus=employee_data.employmentStatus.value if hasattr(employee_data.employmentStatus, 'value') else employee_data.employmentStatus
        )
        
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        
        # Convert to response model
        return Employee(
            id=str(db_employee.id),
            firstName=employee_data.firstName,
            lastName=employee_data.lastName,
            email=employee_data.email,
            phone=employee_data.phone,
            dateOfBirth=employee_data.dateOfBirth,
            hireDate=employee_data.hireDate,
            employeeId=employee_data.employeeId,
            department=employee_data.department,
            position=employee_data.position,
            employeeType=employee_data.employeeType,
            employmentStatus=employee_data.employmentStatus,
            managerId=employee_data.managerId,
            salary=employee_data.salary,
            address=employee_data.address,
            emergencyContact=employee_data.emergencyContact,
            emergencyPhone=employee_data.emergencyPhone,
            skills=employee_data.skills,
            certifications=employee_data.certifications,
            notes=employee_data.notes,
            resume_url=employee_data.resume_url,
            attachments=employee_data.attachments,
            tenant_id=str(db_employee.tenant_id),
            createdBy=str(user_id),
            createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else None,
            updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else None
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating employee: {str(e)}")

@router.get("/employees/{employee_id}", response_model=Employee)
async def get_hrm_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get employee by ID"""
    try:
        db_employee = get_employee_by_id(employee_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        user = get_user_by_id(str(db_employee.userId), db) if db_employee.userId else None
        return Employee(
            id=str(db_employee.id),
            firstName=user.firstName if user else "",
            lastName=user.lastName if user else "",
            email=user.email if user else "",
            phone=db_employee.phone,
            dateOfBirth=db_employee.dateOfBirth.isoformat() if db_employee.dateOfBirth else None,
            hireDate=db_employee.hireDate.isoformat() if db_employee.hireDate else "",
            employeeId=db_employee.employeeId,
            department=db_employee.department or Department.OTHER.value,
            position=db_employee.position,
            employeeType=EmployeeType(db_employee.employeeType) if db_employee.employeeType else EmployeeType.FULL_TIME,
            employmentStatus=EmploymentStatus(db_employee.employmentStatus) if db_employee.employmentStatus else EmploymentStatus.ACTIVE,
            managerId=str(db_employee.managerId) if db_employee.managerId else None,
            salary=db_employee.salary,
            address=db_employee.address,
            emergencyContact=db_employee.emergencyContact,
            emergencyPhone=db_employee.emergencyPhone,
            skills=db_employee.skills if db_employee.skills else [],
            certifications=db_employee.certifications if db_employee.certifications else [],
            notes=db_employee.notes,
            resume_url=db_employee.resume_url if hasattr(db_employee, 'resume_url') else None,
            attachments=db_employee.attachments if db_employee.attachments else [],
            tenant_id=str(db_employee.tenant_id),
            createdBy=str(db_employee.userId) if db_employee.userId else "",
            createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else "",
            updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else "",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching employee: {str(e)}")

@router.put("/employees/{employee_id}", response_model=Employee)
async def update_hrm_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update employee"""
    try:
        update_data = employee_update.dict(exclude_unset=True)
        
        user_fields = ['firstName', 'lastName', 'email']
        user_update_data = {k: v for k, v in update_data.items() if k in user_fields}
        employee_update_data = {k: v for k, v in update_data.items() if k not in user_fields}
        
        db_employee_before = get_employee_by_id(employee_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_employee_before:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        if user_update_data and db_employee_before.userId:
            try:
                update_user(str(db_employee_before.userId), user_update_data, db)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e)) from e
        
        db_employee = update_employee(employee_id, employee_update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        user = get_user_by_id(str(db_employee.userId), db) if db_employee.userId else None
        
        response_employee = Employee(
            id=str(db_employee.id),
            firstName=user.firstName if user else "",
            lastName=user.lastName if user else "",
            email=user.email if user else "",
            phone=db_employee.phone,
            dateOfBirth=db_employee.dateOfBirth.isoformat() if db_employee.dateOfBirth else None,
            hireDate=db_employee.hireDate.isoformat() if db_employee.hireDate else "",
            employeeId=db_employee.employeeId,
            department=db_employee.department or Department.OTHER.value,
            position=db_employee.position,
            employeeType=EmployeeType(db_employee.employeeType) if db_employee.employeeType else EmployeeType.FULL_TIME,
            employmentStatus=EmploymentStatus(db_employee.employmentStatus) if db_employee.employmentStatus else EmploymentStatus.ACTIVE,
            managerId=str(db_employee.managerId) if db_employee.managerId else None,
            salary=db_employee.salary,
            address=db_employee.address,
            emergencyContact=db_employee.emergencyContact,
            emergencyPhone=db_employee.emergencyPhone,
            skills=db_employee.skills if db_employee.skills else [],
            certifications=db_employee.certifications if db_employee.certifications else [],
            notes=db_employee.notes,
            resume_url=db_employee.resume_url if hasattr(db_employee, 'resume_url') else None,
            attachments=db_employee.attachments if db_employee.attachments else [],
            tenant_id=str(db_employee.tenant_id),
            createdBy=str(db_employee.userId) if db_employee.userId else "",
            createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else "",
            updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else ""
        )
        
        return response_employee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating employee: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating employee: {str(e)}")

@router.delete("/employees/{employee_id}")
async def delete_hrm_employee(
    employee_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete employee"""
    try:
        tenant_id = str(tenant_context["tenant_id"]) if tenant_context else None
        employee = get_employee_by_id(employee_id, db, tenant_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        resume_url = employee.resume_url
        attachments = employee.attachments if employee.attachments else []
        
        s3_deletion_errors = []
        
        if resume_url:
            try:
                s3_key = s3_service.extract_s3_key_from_url(resume_url)
                if s3_key:
                    logger.info(f"[DELETE EMPLOYEE] Attempting to delete resume from S3: {s3_key}")
                    success = s3_service.delete_file(s3_key)
                    if not success:
                        s3_deletion_errors.append(f"Failed to delete resume: {s3_key}")
                        logger.warning(f"[DELETE EMPLOYEE] Resume deletion failed (employee will still be deleted): {s3_key}")
            except Exception as e:
                error_msg = f"Error deleting resume from S3: {str(e)}"
                s3_deletion_errors.append(error_msg)
                logger.error(f"[DELETE EMPLOYEE] {error_msg}", exc_info=True)
        
        for attachment_url in attachments:
            try:
                s3_key = s3_service.extract_s3_key_from_url(attachment_url)
                if s3_key:
                    logger.info(f"[DELETE EMPLOYEE] Attempting to delete attachment from S3: {s3_key}")
                    success = s3_service.delete_file(s3_key)
                    if not success:
                        s3_deletion_errors.append(f"Failed to delete attachment: {s3_key}")
                        logger.warning(f"[DELETE EMPLOYEE] Attachment deletion failed (employee will still be deleted): {s3_key}")
            except Exception as e:
                error_msg = f"Error deleting attachment from S3: {str(e)}"
                s3_deletion_errors.append(error_msg)
                logger.error(f"[DELETE EMPLOYEE] {error_msg}", exc_info=True)
        
        success = delete_employee(employee_id, db, tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        if s3_deletion_errors:
            logger.warning(f"[DELETE EMPLOYEE] Employee deleted but S3 files could not be deleted: {s3_deletion_errors}")
            return {
                "message": "Employee deleted successfully",
                "warning": "Some files could not be deleted from storage",
                "errors": s3_deletion_errors
            }
        
        logger.info(f"[DELETE EMPLOYEE] Employee and all associated files deleted successfully")
        return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        err = str(e)
        if "ForeignKeyViolation" in err or "foreign key constraint" in err.lower():
            raise HTTPException(
                status_code=409,
                detail="Cannot delete employee while related leave, time, payroll, or device records exist.",
            )
        raise HTTPException(status_code=500, detail=f"Error deleting employee: {err}")

# Job Posting endpoints
@router.get("/jobs", response_model=HRMJobPostingsResponse)
async def get_hrm_jobs(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all job postings with optional filtering"""
    try:
        skip = (page - 1) * limit
        jobs = get_job_postings(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if department or status or job_type or search:
            filtered_jobs = []
            for job in jobs:
                if department and job.department != department:
                    continue
                if status and job.status != status:
                    continue
                if job_type and job.type != job_type:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (job.title or "").lower(),
                        search_lower in (job.description or "").lower(),
                        search_lower in (job.location or "").lower()
                    ]):
                        continue
                filtered_jobs.append(job)
            jobs = filtered_jobs
        
        # Convert SQLAlchemy models to Pydantic models
        job_postings = []
        for job in jobs:
            job_data = {
                "id": str(job.id),
                "title": job.title,
                "department": Department(job.department) if job.department else None,
                "description": job.description,
                "requirements": job.requirements.split('\n') if job.requirements else [],
                "responsibilities": job.responsibilities or [],
                "location": job.location,
                "type": EmployeeType(job.type) if job.type else None,
                "salaryRange": job.salary,
                "benefits": job.benefits or [],
                "status": JobStatus(job.status) if job.status else None,
                "openDate": job.postedDate.isoformat() if job.postedDate else None,
                "closeDate": job.closingDate.isoformat() if job.closingDate else None,
                "hiringManagerId": str(job.hiringManagerId) if job.hiringManagerId else None,
                "tags": job.tags or [],
                "tenant_id": str(job.tenant_id),
                "createdBy": str(job.createdBy),
                "createdAt": job.createdAt.isoformat() if job.createdAt else None,
                "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None
            }
            job_postings.append(JobPosting(**job_data))
        
        # Get total count for pagination
        total = len(job_postings)
        
        return HRMJobPostingsResponse(
            jobPostings=job_postings,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job postings: {str(e)}")

@router.post("/jobs", response_model=JobPosting)
def create_hrm_job(
    job_data: JobPostingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new job posting"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    tenant_id = tenant_context["tenant_id"]
    
    # Convert Pydantic model to SQLAlchemy model data
    job_dict = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "title": job_data.title,
        "department": job_data.department.value if job_data.department else None,
        "description": job_data.description,
        "requirements": "\n".join(job_data.requirements) if job_data.requirements else None,
        "responsibilities": job_data.responsibilities,
        "salary": job_data.salaryRange,
        "location": job_data.location,
        "type": job_data.type.value if job_data.type else None,
        "status": job_data.status.value if job_data.status else "draft",
        "postedDate": datetime.fromisoformat(job_data.openDate) if job_data.openDate else datetime.utcnow(),
        "closingDate": datetime.fromisoformat(job_data.closeDate) if job_data.closeDate else None,
        "benefits": job_data.benefits,
        "hiringManagerId": job_data.hiringManagerId if job_data.hiringManagerId else None,
        "tags": job_data.tags,
        "createdBy": str(current_user.id),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    db_job = create_job_posting(job_dict, db)
    
    # Convert SQLAlchemy model to Pydantic response model
    response_data = {
        "id": str(db_job.id),
        "title": db_job.title,
        "department": Department(db_job.department) if db_job.department else None,
        "description": db_job.description,
        "requirements": db_job.requirements.split('\n') if db_job.requirements else [],
        "responsibilities": db_job.responsibilities or [],
        "location": db_job.location,
        "type": EmployeeType(db_job.type) if db_job.type else None,
        "salaryRange": db_job.salary,
        "benefits": db_job.benefits or [],
        "status": JobStatus(db_job.status) if db_job.status else None,
        "openDate": db_job.postedDate.isoformat() if db_job.postedDate else None,
        "closeDate": db_job.closingDate.isoformat() if db_job.closingDate else None,
        "hiringManagerId": str(db_job.hiringManagerId) if db_job.hiringManagerId else None,
        "tags": db_job.tags or [],
        "tenant_id": str(db_job.tenant_id),
        "createdBy": str(db_job.createdBy),
        "createdAt": db_job.createdAt.isoformat() if db_job.createdAt else None,
        "updatedAt": db_job.updatedAt.isoformat() if db_job.updatedAt else None
    }
    
    return JobPosting(**response_data)

@router.get("/jobs/{job_id}", response_model=JobPosting)
async def get_hrm_job_by_id(
    job_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get a specific job posting by ID"""
    try:
        job = get_job_posting_by_id(job_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Convert SQLAlchemy model to Pydantic model
        job_data = {
            "id": str(job.id),
            "title": job.title,
            "department": Department(job.department) if job.department else None,
            "description": job.description,
            "requirements": job.requirements.split('\n') if job.requirements else [],
            "responsibilities": job.responsibilities or [],
            "location": job.location,
            "type": EmployeeType(job.type) if job.type else None,
            "salaryRange": job.salary,
            "benefits": job.benefits or [],
            "status": JobStatus(job.status) if job.status else None,
            "openDate": job.postedDate.isoformat() if job.postedDate else None,
            "closeDate": job.closingDate.isoformat() if job.closingDate else None,
            "hiringManagerId": str(job.hiringManagerId) if job.hiringManagerId else None,
            "tags": job.tags or [],
            "tenant_id": str(job.tenant_id),
            "createdBy": str(job.createdBy),
            "createdAt": job.createdAt.isoformat() if job.createdAt else None,
            "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None
        }
        return JobPosting(**job_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job posting: {str(e)}")

@router.put("/jobs/{job_id}", response_model=JobPosting)
async def update_hrm_job(
    job_id: str,
    job_data: JobPostingUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update an existing job posting"""
    try:
        job = update_job_posting(db, job_id, job_data.dict(exclude_unset=True), tenant_context["tenant_id"] if tenant_context else None)
        if not job:
            raise HTTPException(status_code=404, detail="Job posting not found")
        
        # Convert SQLAlchemy model to Pydantic model
        job_data = {
            "id": str(job.id),
            "title": job.title,
            "department": Department(job.department) if job.department else None,
            "description": job.description,
            "requirements": job.requirements.split('\n') if job.requirements else [],
            "responsibilities": job.responsibilities or [],
            "location": job.location,
            "type": EmployeeType(job.type) if job.type else None,
            "salaryRange": job.salary,
            "benefits": job.benefits or [],
            "status": JobStatus(job.status) if job.status else None,
            "openDate": job.postedDate.isoformat() if job.postedDate else None,
            "closeDate": job.closingDate.isoformat() if job.closingDate else None,
            "hiringManagerId": str(job.hiringManagerId) if job.hiringManagerId else None,
            "tags": job.tags or [],
            "tenant_id": str(job.tenant_id),
            "createdBy": str(job.createdBy),
            "createdAt": job.createdAt.isoformat() if job.createdAt else None,
            "updatedAt": job.updatedAt.isoformat() if job.updatedAt else None
        }
        return JobPosting(**job_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating job posting: {str(e)}")

@router.delete("/jobs/{job_id}")
async def delete_hrm_job(
    job_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete a job posting"""
    try:
        success = delete_job_posting(job_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Job posting not found")
        return {"message": "Job posting deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting job posting: {str(e)}")

# Application endpoints
@router.get("/applications", response_model=HRMApplicationsResponse)
async def get_hrm_applications(
    status: Optional[str] = Query(None),
    job_posting_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all applications with optional filtering"""
    try:
        skip = (page - 1) * limit
        applications = get_applications(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if status or job_posting_id or assigned_to or search:
            filtered_applications = []
            for app in applications:
                if status and app.status != status:
                    continue
                if job_posting_id and app.jobPostingId != job_posting_id:
                    continue
                if assigned_to and app.assignedTo != assigned_to:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (app.firstName or "").lower(),
                        search_lower in (app.lastName or "").lower(),
                        search_lower in (app.email or "").lower()
                    ]):
                        continue
                filtered_applications.append(app)
            applications = filtered_applications
        
        # Convert SQLAlchemy models to Pydantic models
        application_list = []
        for app in applications:
            app_data = {
                "id": str(app.id),
                "jobPostingId": str(app.jobPostingId),
                "firstName": app.firstName,
                "lastName": app.lastName,
                "email": app.email,
                "phone": app.phone,
                "resume": app.resume,
                "coverLetter": app.coverLetter,
                "experience": app.experience,
                "education": app.education,
                "skills": app.skills or [],
                "status": ApplicationStatus(app.status) if app.status else None,
                "assignedTo": str(app.assignedTo) if app.assignedTo else None,
                "notes": app.notes,
                "interviewDate": app.interviewDate.isoformat() if app.interviewDate else None,
                "interviewNotes": app.interviewNotes,
                "tenant_id": str(app.tenant_id),
                "createdBy": str(app.createdBy),
                "createdAt": app.createdAt.isoformat() if app.createdAt else None,
                "updatedAt": app.updatedAt.isoformat() if app.updatedAt else None
            }
            application_list.append(Application(**app_data))
        
        # Get total count for pagination
        total = len(application_list)
        
        return HRMApplicationsResponse(
            applications=application_list,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching applications: {str(e)}")

@router.post("/applications", response_model=Application)
def create_hrm_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new application"""
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    tenant_id = tenant_context["tenant_id"]
    
    # Import the SQLAlchemy Application model
    from ...config.hrm_models import Application as DBApplication
    
    # Create database application record
    db_application = DBApplication(
        id=uuid.uuid4(),
        tenant_id=uuid.UUID(tenant_id),
        jobPostingId=uuid.UUID(application_data.jobPostingId),
        firstName=application_data.firstName,
        lastName=application_data.lastName,
        email=application_data.email,
        phone=application_data.phone,
        resume=application_data.resume,
        coverLetter=application_data.coverLetter,
        experience=application_data.experience,
        education=application_data.education,
        skills=application_data.skills,
        status=application_data.status.value if application_data.status else "applied",
        assignedTo=uuid.UUID(application_data.assignedTo) if application_data.assignedTo else None,
        notes=application_data.notes,
        interviewDate=datetime.fromisoformat(application_data.interviewDate) if application_data.interviewDate else None,
        interviewNotes=application_data.interviewNotes,
        createdBy=current_user.id,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    # Convert to response format
    response_data = {
        "id": str(db_application.id),
        "jobPostingId": str(db_application.jobPostingId),
        "firstName": db_application.firstName,
        "lastName": db_application.lastName,
        "email": db_application.email,
        "phone": db_application.phone,
        "resume": db_application.resume,
        "coverLetter": db_application.coverLetter,
        "experience": db_application.experience,
        "education": db_application.education,
        "skills": db_application.skills,
        "status": ApplicationStatus(db_application.status) if db_application.status else None,
        "assignedTo": str(db_application.assignedTo) if db_application.assignedTo else None,
        "notes": db_application.notes,
        "interviewDate": db_application.interviewDate.isoformat() if db_application.interviewDate else None,
        "interviewNotes": db_application.interviewNotes,
        "tenant_id": str(db_application.tenant_id),
        "createdBy": str(db_application.createdBy),
        "createdAt": db_application.createdAt.isoformat() if db_application.createdAt else None,
        "updatedAt": db_application.updatedAt.isoformat() if db_application.updatedAt else None
    }
    if db_application.assignedTo:
        try:
            from ...services.notification_service import send_assignment_notification
            from ...config.notification_models import NotificationCategory
            assignee = get_user_by_id(str(db_application.assignedTo), db)
            assigner_name = f"{getattr(current_user, 'firstName', '') or ''} {getattr(current_user, 'lastName', '') or ''}".strip() or getattr(current_user, "userName", "A user")
            if assignee:
                send_assignment_notification(
                    db, str(tenant_id), assignee, assigner_name,
                    "Application", f"{db_application.firstName} {db_application.lastName}",
                    action_url=f"/hrm/applications/{db_application.id}",
                    category=NotificationCategory.HRM
                )
        except Exception:
            pass
    return Application(**response_data)

# Performance Review endpoints
@router.get("/reviews", response_model=HRMReviewsResponse)
async def get_hrm_reviews(
    employee_id: Optional[str] = Query(None),
    review_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    review_period: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all performance reviews with optional filtering"""
    try:
        skip = (page - 1) * limit
        reviews = get_performance_reviews(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or review_type or status or review_period:
            filtered_reviews = []
            for review in reviews:
                if employee_id and review.employeeId != employee_id:
                    continue
                if review_type and review.reviewType != review_type:
                    continue
                if status and review.status != status:
                    continue
                if review_period and review.reviewPeriod != review_period:
                    continue
                filtered_reviews.append(review)
            reviews = filtered_reviews
        
        # Convert SQLAlchemy models to Pydantic models
        review_list = []
        for review in reviews:
            print(f"GET review {review.id} - overallRating: {review.rating}")
            review_list.append(PerformanceReview(
                id=str(review.id),
                tenant_id=str(review.tenant_id),
                employeeId=str(review.employeeId),
                reviewerId=str(review.reviewerId),
                reviewType=review.reviewType or "annual",
                reviewDate=review.reviewDate.isoformat() if review.reviewDate else "",
                reviewPeriod=review.reviewPeriod,
                status="completed" if review.isCompleted else "pending",
                overallRating=review.rating,
                technicalRating=review.technicalRating or 0,
                communicationRating=review.communicationRating or 0,
                teamworkRating=review.teamworkRating or 0,
                leadershipRating=review.leadershipRating or 0,
                goals=review.goals.split('\n') if review.goals else [],
                achievements=review.strengths.split('\n') if review.strengths else [],
                areasForImprovement=review.areasForImprovement.split('\n') if review.areasForImprovement else [],
                comments=review.comments,
                nextReviewDate=review.nextReviewDate.isoformat() if review.nextReviewDate else None,
                createdBy=str(review.createdBy) if review.createdBy else "",
                createdAt=review.createdAt.isoformat() if review.createdAt else "",
                updatedAt=review.updatedAt.isoformat() if review.updatedAt else ""
            ))
        
        # Get total count for pagination
        total = len(review_list)
        
        return HRMReviewsResponse(
            reviews=review_list,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance reviews: {str(e)}")

@router.post("/reviews", response_model=PerformanceReview)
async def create_hrm_review(
    review_data: PerformanceReviewCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new performance review"""
    try:
        # Create database record with only valid fields
        db_data = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            "employeeId": review_data.employeeId,
            "reviewerId": review_data.reviewerId,
            "reviewType": review_data.reviewType.value if review_data.reviewType else "annual",
            "reviewDate": datetime.fromisoformat(review_data.reviewDate) if review_data.reviewDate else datetime.utcnow(),
            "reviewPeriod": review_data.reviewPeriod,
            "rating": review_data.overallRating or 0,
            "technicalRating": review_data.technicalRating or 0,
            "communicationRating": review_data.communicationRating or 0,
            "teamworkRating": review_data.teamworkRating or 0,
            "leadershipRating": review_data.leadershipRating or 0,
            "strengths": "\n".join(review_data.achievements) if review_data.achievements else None,
            "areasForImprovement": "\n".join(review_data.areasOfImprovement) if review_data.areasOfImprovement else None,
            "goals": "\n".join(review_data.goals) if review_data.goals else None,
            "comments": review_data.comments,
            "nextReviewDate": datetime.fromisoformat(review_data.nextReviewDate) if review_data.nextReviewDate else None,
            "isCompleted": review_data.status == "completed" if review_data.status else False,
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        db_review = create_performance_review(db_data, db)
        
        # Convert to response format
        return PerformanceReview(
            id=str(db_review.id),
            tenant_id=str(db_review.tenant_id),
            employeeId=str(db_review.employeeId),
            reviewerId=str(db_review.reviewerId),
            reviewType=db_review.reviewType or "annual",
            reviewDate=db_review.reviewDate.isoformat() if db_review.reviewDate else "",
            reviewPeriod=db_review.reviewPeriod,
            status="completed" if db_review.isCompleted else "pending",
            overallRating=db_review.rating,
            technicalRating=db_review.technicalRating or 0,
            communicationRating=db_review.communicationRating or 0,
            teamworkRating=db_review.teamworkRating or 0,
            leadershipRating=db_review.leadershipRating or 0,
            goals=db_review.goals.split('\n') if db_review.goals else [],
            achievements=db_review.strengths.split('\n') if db_review.strengths else [],
            areasForImprovement=db_review.areasForImprovement.split('\n') if db_review.areasForImprovement else [],
            comments=db_review.comments,
            nextReviewDate=db_review.nextReviewDate.isoformat() if db_review.nextReviewDate else None,
            createdBy=str(db_review.createdBy) if db_review.createdBy else "",
            createdAt=db_review.createdAt.isoformat() if db_review.createdAt else "",
            updatedAt=db_review.updatedAt.isoformat() if db_review.updatedAt else ""
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating performance review: {str(e)}")

@router.get("/reviews/{review_id}", response_model=PerformanceReview)
async def get_hrm_review_by_id(
    review_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get a specific performance review by ID"""
    try:
        review = get_performance_review_by_id(db, review_id, tenant_context["tenant_id"] if tenant_context else None)
        if not review:
            raise HTTPException(status_code=404, detail="Performance review not found")
        return review
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance review: {str(e)}")

@router.put("/reviews/{review_id}", response_model=PerformanceReview)
async def update_hrm_review(
    review_id: str,
    review_data: PerformanceReviewUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update an existing performance review"""
    try:
        db_review = update_performance_review(review_id, review_data.dict(exclude_unset=True), db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_review:
            raise HTTPException(status_code=404, detail="Performance review not found")
        
        print(f"Updated performance review - overallRating: {db_review.rating}")
        
        # Convert to response format
        return PerformanceReview(
            id=str(db_review.id),
            tenant_id=str(db_review.tenant_id),
            employeeId=str(db_review.employeeId),
            reviewerId=str(db_review.reviewerId),
            reviewType=db_review.reviewType or "annual",
            reviewDate=db_review.reviewDate.isoformat() if db_review.reviewDate else "",
            reviewPeriod=db_review.reviewPeriod,
            status="completed" if db_review.isCompleted else "pending",
            overallRating=db_review.rating,
            technicalRating=db_review.technicalRating or 0,
            communicationRating=db_review.communicationRating or 0,
            teamworkRating=db_review.teamworkRating or 0,
            leadershipRating=db_review.leadershipRating or 0,
            goals=db_review.goals.split('\n') if db_review.goals else [],
            achievements=db_review.strengths.split('\n') if db_review.strengths else [],
            areasForImprovement=db_review.areasForImprovement.split('\n') if db_review.areasForImprovement else [],
            comments=db_review.comments,
            nextReviewDate=db_review.nextReviewDate.isoformat() if db_review.nextReviewDate else None,
            createdBy=str(db_review.createdBy) if db_review.createdBy else "",
            createdAt=db_review.createdAt.isoformat() if db_review.createdAt else "",
            updatedAt=db_review.updatedAt.isoformat() if db_review.updatedAt else ""
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating performance review: {str(e)}")

@router.delete("/reviews/{review_id}")
async def delete_hrm_review(
    review_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete a performance review"""
    try:
        success = delete_performance_review(review_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Performance review not found")
        return {"message": "Performance review deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting performance review: {str(e)}")

# Time Entry endpoints
@router.get("/time-entries", response_model=HRMTimeEntriesResponse)
async def get_hrm_time_entries(
    employee_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all time entries with optional filtering"""
    try:
        skip = (page - 1) * limit
        time_entries = get_time_entries(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or start_date or end_date or project_id:
            filtered_entries = []
            for entry in time_entries:
                if employee_id and entry.employeeId != employee_id:
                    continue
                if start_date and entry.date < start_date:
                    continue
                if end_date and entry.date > end_date:
                    continue
                if project_id and entry.projectId != project_id:
                    continue
                filtered_entries.append(entry)
            time_entries = filtered_entries
        
        # Get total count for pagination
        total = len(time_entries)
        
        return HRMTimeEntriesResponse(
            timeEntries=time_entries,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time entries: {str(e)}")

@router.post("/time-entries", response_model=TimeEntry)
async def create_hrm_time_entry(
    time_entry_data: TimeEntryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new time entry"""
    try:
        time_entry = TimeEntry(
            id=str(uuid.uuid4()),
            **time_entry_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(time_entry)
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating time entry: {str(e)}")


# Leave Request endpoints
@router.get("/leave-requests", response_model=HRMLeaveRequestsResponse)
async def get_hrm_leave_requests(
    employee_id: Optional[str] = Query(None),
    leave_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all leave requests with optional filtering"""
    try:
        skip = (page - 1) * limit
        leave_requests = get_leave_requests(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or leave_type or status or start_date or end_date:
            filtered_requests = []
            for request in leave_requests:
                if employee_id and request.employeeId != employee_id:
                    continue
                if leave_type and request.leaveType != leave_type:
                    continue
                if status and request.status != status:
                    continue
                if start_date and request.startDate < start_date:
                    continue
                if end_date and request.endDate > end_date:
                    continue
                filtered_requests.append(request)
            leave_requests = filtered_requests
        
        # Get total count for pagination
        total = len(leave_requests)
        
        # Convert SQLAlchemy models to Pydantic models
        pydantic_requests = []
        for request in leave_requests:
            response_data = {
                "id": str(request.id),
                "tenant_id": str(request.tenant_id),
                "employeeId": str(request.employeeId),
                "leaveType": request.leaveType,
                "startDate": request.startDate.isoformat() if request.startDate else "",
                "endDate": request.endDate.isoformat() if request.endDate else "",
                "totalDays": float(request.days),
                "reason": request.reason,
                "status": request.status,
                "approvedBy": str(request.approvedBy) if request.approvedBy else None,
                "approvedAt": request.approvedAt.isoformat() if request.approvedAt else None,
                "rejectionReason": request.comments,
                "notes": request.comments,
                "createdBy": "",  # Not stored in DB
                "createdAt": request.createdAt.isoformat(),
                "updatedAt": request.updatedAt.isoformat()
            }
            pydantic_requests.append(LeaveRequest(**response_data))
        
        return HRMLeaveRequestsResponse(
            leaveRequests=pydantic_requests,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leave requests: {str(e)}")

@router.post("/leave-requests", response_model=LeaveRequest)
async def create_hrm_leave_request(
    leave_request_data: LeaveRequestCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new leave request"""
    try:
        # Map frontend fields to database fields
        db_data = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            "employeeId": leave_request_data.employeeId,
            "leaveType": leave_request_data.leaveType,
            "startDate": datetime.fromisoformat(leave_request_data.startDate).date() if leave_request_data.startDate else None,
            "endDate": datetime.fromisoformat(leave_request_data.endDate).date() if leave_request_data.endDate else None,
            "days": int(leave_request_data.totalDays) if leave_request_data.totalDays else 1,
            "reason": leave_request_data.reason,
            "status": leave_request_data.status,
            "approvedBy": leave_request_data.approvedBy,
            "approvedAt": datetime.fromisoformat(leave_request_data.approvedAt) if leave_request_data.approvedAt else None,
            "comments": leave_request_data.rejectionReason or leave_request_data.notes,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Create SQLAlchemy model (not Pydantic)
        from ...config.hrm_models import LeaveRequest as LeaveRequestDB
        leave_request = LeaveRequestDB(**db_data)
        
        db.add(leave_request)
        db.commit()
        db.refresh(leave_request)
        
        # Convert to response format
        response_data = {
            "id": str(leave_request.id),
            "tenant_id": str(leave_request.tenant_id),
            "employeeId": str(leave_request.employeeId),
            "leaveType": leave_request.leaveType,
            "startDate": leave_request.startDate.isoformat() if leave_request.startDate else "",
            "endDate": leave_request.endDate.isoformat() if leave_request.endDate else "",
            "totalDays": float(leave_request.days),
            "reason": leave_request.reason,
            "status": leave_request.status,
            "approvedBy": str(leave_request.approvedBy) if leave_request.approvedBy else None,
            "approvedAt": leave_request.approvedAt.isoformat() if leave_request.approvedAt else None,
            "rejectionReason": leave_request.comments,
            "notes": leave_request.comments,
            "createdBy": "",  # Not stored in DB
            "createdAt": leave_request.createdAt.isoformat(),
            "updatedAt": leave_request.updatedAt.isoformat()
        }
        
        return LeaveRequest(**response_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating leave request: {str(e)}")

@router.get("/leave-requests/{leave_request_id}", response_model=LeaveRequest)
async def get_hrm_leave_request(
    leave_request_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get a specific leave request by ID"""
    try:
        leave_request = get_leave_request_by_id(db, leave_request_id, tenant_context["tenant_id"] if tenant_context else None)
        if not leave_request:
            raise HTTPException(status_code=404, detail="Leave request not found")
        
        # Convert to Pydantic model
        response_data = {
            "id": str(leave_request.id),
            "tenant_id": str(leave_request.tenant_id),
            "employeeId": str(leave_request.employeeId),
            "leaveType": leave_request.leaveType,
            "startDate": leave_request.startDate.isoformat() if leave_request.startDate else "",
            "endDate": leave_request.endDate.isoformat() if leave_request.endDate else "",
            "totalDays": float(leave_request.days),
            "reason": leave_request.reason,
            "status": leave_request.status,
            "approvedBy": str(leave_request.approvedBy) if leave_request.approvedBy else None,
            "approvedAt": leave_request.approvedAt.isoformat() if leave_request.approvedAt else None,
            "rejectionReason": leave_request.comments,
            "notes": leave_request.comments,
            "createdBy": "",  # Not stored in DB
            "createdAt": leave_request.createdAt.isoformat(),
            "updatedAt": leave_request.updatedAt.isoformat()
        }
        return LeaveRequest(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leave request: {str(e)}")

@router.put("/leave-requests/{leave_request_id}", response_model=LeaveRequest)
async def update_hrm_leave_request(
    leave_request_id: str,
    leave_request_update: LeaveRequestUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update a leave request"""
    try:
        # Map frontend fields to database fields
        update_data = leave_request_update.dict(exclude_unset=True)
        db_update_data = {}
        
        for key, value in update_data.items():
            if key == 'totalDays':
                db_update_data['days'] = int(value) if value else 1
            elif key == 'rejectionReason' or key == 'notes':
                db_update_data['comments'] = value
            elif key == 'startDate' and value:
                db_update_data['startDate'] = datetime.fromisoformat(value).date()
            elif key == 'endDate' and value:
                db_update_data['endDate'] = datetime.fromisoformat(value).date()
            elif key == 'approvedAt' and value:
                db_update_data['approvedAt'] = datetime.fromisoformat(value)
            else:
                db_update_data[key] = value
        
        updated_request = update_leave_request(
            leave_request_id,
            db_update_data,
            db,
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_request:
            raise HTTPException(status_code=404, detail="Leave request not found")
        
        # Convert to Pydantic model
        response_data = {
            "id": str(updated_request.id),
            "tenant_id": str(updated_request.tenant_id),
            "employeeId": str(updated_request.employeeId),
            "leaveType": updated_request.leaveType,
            "startDate": updated_request.startDate.isoformat() if updated_request.startDate else "",
            "endDate": updated_request.endDate.isoformat() if updated_request.endDate else "",
            "totalDays": float(updated_request.days),
            "reason": updated_request.reason,
            "status": updated_request.status,
            "approvedBy": str(updated_request.approvedBy) if updated_request.approvedBy else None,
            "approvedAt": updated_request.approvedAt.isoformat() if updated_request.approvedAt else None,
            "rejectionReason": updated_request.comments,
            "notes": updated_request.comments,
            "createdBy": "",  # Not stored in DB
            "createdAt": updated_request.createdAt.isoformat(),
            "updatedAt": updated_request.updatedAt.isoformat()
        }
        return LeaveRequest(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating leave request: {str(e)}")

@router.delete("/leave-requests/{leave_request_id}")
async def delete_hrm_leave_request(
    leave_request_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete a leave request"""
    try:
        deleted = delete_leave_request(leave_request_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=404, detail="Leave request not found")
        return {"message": "Leave request deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting leave request: {str(e)}")

# Payroll endpoints
@router.get("/payroll", response_model=HRMPayrollResponse)
async def get_hrm_payroll(
    employee_id: Optional[str] = Query(None),
    pay_period: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all payroll records with optional filtering"""
    try:
        skip = (page - 1) * limit
        payroll_records = get_payroll(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or pay_period or status or start_date or end_date:
            filtered_records = []
            for record in payroll_records:
                if employee_id and record.employeeId != employee_id:
                    continue
                if pay_period and record.payPeriod != pay_period:
                    continue
                if status and record.status != status:
                    continue
                if start_date and record.startDate < start_date:
                    continue
                if end_date and record.endDate > end_date:
                    continue
                filtered_records.append(record)
            payroll_records = filtered_records
        
        # Get total count for pagination
        total = len(payroll_records)
        
        # Convert SQLAlchemy models to Pydantic models
        pydantic_payrolls = []
        for payroll in payroll_records:
            response_data = {
                "id": str(payroll.id),
                "tenant_id": str(payroll.tenant_id),
                "employeeId": str(payroll.employeeId),
                "payPeriod": payroll.payPeriod,
                "startDate": payroll.startDate.isoformat() if payroll.startDate else "",
                "endDate": payroll.endDate.isoformat() if payroll.endDate else "",
                "basicSalary": float(payroll.baseSalary),
                "allowances": float(payroll.allowances),
                "deductions": float(payroll.deductions),
                "overtimePay": float(payroll.overtimeHours),
                "bonus": float(payroll.bonuses),
                "netPay": float(payroll.netPay),
                "status": "processed" if payroll.isProcessed else "draft",
                "paymentDate": payroll.processedAt.isoformat() if payroll.processedAt else None,
                "notes": payroll.notes or "",
                "createdBy": str(payroll.createdBy) if payroll.createdBy else "",
                "createdAt": payroll.createdAt.isoformat(),
                "updatedAt": payroll.updatedAt.isoformat()
            }
            pydantic_payrolls.append(Payroll(**response_data))
        
        return HRMPayrollResponse(
            payroll=pydantic_payrolls,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll records: {str(e)}")

@router.post("/payroll", response_model=Payroll)
async def create_hrm_payroll(
    payroll_data: PayrollCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new payroll record"""
    try:
        # Map frontend fields to database fields
        db_data = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            "employeeId": payroll_data.employeeId,
            "payPeriod": payroll_data.payPeriod,
            "startDate": datetime.fromisoformat(payroll_data.startDate).date() if payroll_data.startDate else None,
            "endDate": datetime.fromisoformat(payroll_data.endDate).date() if payroll_data.endDate else None,
            "baseSalary": payroll_data.basicSalary,
            "allowances": payroll_data.allowances or 0.0,
            "overtimeHours": payroll_data.overtimePay or 0.0,
            "overtimeRate": 1.0,   # Store overtimePay directly in overtimeHours
            "bonuses": payroll_data.bonus,
            "deductions": payroll_data.deductions,
            "netPay": payroll_data.netPay,
            "isProcessed": payroll_data.status == "processed",
            "processedAt": datetime.utcnow() if payroll_data.status == "processed" else None,
            "notes": payroll_data.notes,
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        from ...config.hrm_models import Payroll as PayrollDB
        payroll = PayrollDB(**db_data)
        
        db.add(payroll)
        db.commit()
        db.refresh(payroll)
        
        # Convert to response format
        response_data = {
            "id": str(payroll.id),
            "tenant_id": str(payroll.tenant_id),
            "employeeId": str(payroll.employeeId),
            "payPeriod": payroll.payPeriod,
            "startDate": payroll.startDate.isoformat() if payroll.startDate else "",
            "endDate": payroll.endDate.isoformat() if payroll.endDate else "",
            "basicSalary": float(payroll.baseSalary),
            "allowances": float(payroll.allowances),
            "deductions": float(payroll.deductions),
            "overtimePay": float(payroll.overtimeHours),
            "bonus": float(payroll.bonuses),
            "netPay": float(payroll.netPay),
            "status": "processed" if payroll.isProcessed else "draft",
            "paymentDate": payroll.processedAt.isoformat() if payroll.processedAt else None,
            "notes": payroll.notes or "",
            "createdBy": str(payroll.createdBy) if payroll.createdBy else "",
            "createdAt": payroll.createdAt.isoformat(),
            "updatedAt": payroll.updatedAt.isoformat()
        }
        # Create notification for payroll creation
        try:
            from ...services.notification_service import create_hrm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            # Get employee name for notification
            employee = get_employee_by_id(payroll_data.employeeId, db, tenant_context["tenant_id"])
            employee_name = f"{employee.firstName} {employee.lastName}" if employee else "Employee"
            
            create_hrm_notification_for_all_tenant_users(
                db,
                tenant_context["tenant_id"],
                "New Payroll Record Created",
                f"Payroll record for {employee_name} ({payroll_data.payPeriod}) has been created",
                NotificationType.INFO,
                f"/hrm/payroll/{str(payroll.id)}",
                {"payroll_id": str(payroll.id), "employee_id": payroll_data.employeeId, "pay_period": payroll_data.payPeriod}
            )
        except Exception as notification_error:
            # Don't fail the main operation if notification fails
            pass
        
        return Payroll(**response_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating payroll record: {str(e)}")

@router.get("/payroll/{payroll_id}", response_model=Payroll)
async def get_hrm_payroll_by_id(
    payroll_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get a specific payroll record by ID"""
    try:
        payroll = get_payroll_by_id(payroll_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        
        # Convert to Pydantic model
        response_data = {
            "id": str(payroll.id),
            "tenant_id": str(payroll.tenant_id),
            "employeeId": str(payroll.employeeId),
            "payPeriod": payroll.payPeriod,
            "startDate": payroll.startDate.isoformat() if payroll.startDate else "",
            "endDate": payroll.endDate.isoformat() if payroll.endDate else "",
            "basicSalary": float(payroll.baseSalary),
            "allowances": float(payroll.allowances),
            "deductions": float(payroll.deductions),
            "overtimePay": float(payroll.overtimeHours),
            "bonus": float(payroll.bonuses),
            "netPay": float(payroll.netPay),
            "status": "processed" if payroll.isProcessed else "draft",
            "paymentDate": payroll.processedAt.isoformat() if payroll.processedAt else None,
            "notes": payroll.notes or "",
            "createdBy": str(payroll.createdBy) if payroll.createdBy else "",
            "createdAt": payroll.createdAt.isoformat(),
            "updatedAt": payroll.updatedAt.isoformat()
        }
        return Payroll(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payroll record: {str(e)}")

@router.put("/payroll/{payroll_id}", response_model=Payroll)
async def update_hrm_payroll(
    payroll_id: str,
    payroll_update: PayrollUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update a payroll record"""
    try:
        updated_payroll = update_payroll(
            payroll_id,
            payroll_update.dict(exclude_unset=True),
            db,
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_payroll:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        
        # Convert to Pydantic model
        response_data = {
            "id": str(updated_payroll.id),
            "tenant_id": str(updated_payroll.tenant_id),
            "employeeId": str(updated_payroll.employeeId),
            "payPeriod": updated_payroll.payPeriod,
            "startDate": updated_payroll.startDate.isoformat() if updated_payroll.startDate else "",
            "endDate": updated_payroll.endDate.isoformat() if updated_payroll.endDate else "",
            "basicSalary": float(updated_payroll.baseSalary),
            "allowances": float(updated_payroll.allowances),
            "deductions": float(updated_payroll.deductions),
            "overtimePay": float(updated_payroll.overtimeHours),
            "bonus": float(updated_payroll.bonuses),
            "netPay": float(updated_payroll.netPay),
            "status": "processed" if updated_payroll.isProcessed else "draft",
            "paymentDate": updated_payroll.processedAt.isoformat() if updated_payroll.processedAt else None,
            "notes": updated_payroll.notes or "",
            "createdBy": str(updated_payroll.createdBy) if updated_payroll.createdBy else "",
            "createdAt": updated_payroll.createdAt.isoformat(),
            "updatedAt": updated_payroll.updatedAt.isoformat()
        }
        return Payroll(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating payroll record: {str(e)}")

@router.delete("/payroll/{payroll_id}")
async def delete_hrm_payroll(
    payroll_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete a payroll record"""
    try:
        deleted = delete_payroll(payroll_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=404, detail="Payroll record not found")
        return {"message": "Payroll record deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting payroll record: {str(e)}")

# Benefits endpoints
@router.get("/benefits", response_model=HRMBenefitsResponse)
async def get_hrm_benefits(
    employee_id: Optional[str] = Query(None),
    benefit_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all benefits with optional filtering"""
    try:
        skip = (page - 1) * limit
        benefits = get_benefits(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if employee_id or benefit_type or status:
            filtered_benefits = []
            for benefit in benefits:
                if employee_id and benefit.employeeId != employee_id:
                    continue
                if benefit_type and benefit.benefitType != benefit_type:
                    continue
                if status and benefit.status != status:
                    continue
                filtered_benefits.append(benefit)
            benefits = filtered_benefits
        
        # Get total count for pagination
        total = len(benefits)
        
        return HRMBenefitsResponse(
            benefits=benefits,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching benefits: {str(e)}")

@router.post("/benefits", response_model=Benefits)
async def create_hrm_benefit(
    benefit_data: BenefitsCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new benefit"""
    try:
        benefit = Benefits(
            id=str(uuid.uuid4()),
            **benefit_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(benefit)
        db.commit()
        db.refresh(benefit)
        
        return benefit
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating benefit: {str(e)}")

# Training endpoints
@router.get("/training", response_model=HRMTrainingResponse)
async def get_hrm_training(
    training_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all training programs with optional filtering"""
    try:
        skip = (page - 1) * limit
        training_programs = get_training(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if training_type or status or provider or search:
            filtered_programs = []
            for program in training_programs:
                if training_type and program.trainingType != training_type:
                    continue
                if status and program.status != status:
                    continue
                if provider and program.provider != provider:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (program.title or "").lower(),
                        search_lower in (program.description or "").lower(),
                        search_lower in (program.provider or "").lower()
                    ]):
                        continue
                filtered_programs.append(program)
            training_programs = filtered_programs
        
        # Get total count for pagination
        total = len(training_programs)
        
        # Convert SQLAlchemy models to Pydantic models
        pydantic_trainings = []
        for training in training_programs:
            response_data = {
                "id": str(training.id),
                "tenant_id": str(training.tenant_id),
                "title": training.title,
                "description": training.description,
                "trainingType": training.trainingType,
                "duration": training.duration,
                "cost": float(training.cost),
                "provider": training.provider,
                "startDate": training.startDate.isoformat() if training.startDate else "",
                "endDate": training.endDate.isoformat() if training.endDate else "",
                "maxParticipants": training.maxParticipants,
                "status": training.status,
                "materials": training.materials or [],
                "objectives": training.objectives or [],
                "prerequisites": training.prerequisites or [],
                "createdBy": str(training.createdBy),
                "createdAt": training.createdAt.isoformat(),
                "updatedAt": training.updatedAt.isoformat()
            }
            pydantic_trainings.append(Training(**response_data))
        
        return HRMTrainingResponse(
            training=pydantic_trainings,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training programs: {str(e)}")

@router.post("/training", response_model=Training)
async def create_hrm_training(
    training_data: TrainingCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new training program"""
    try:
        # Map frontend fields to database fields
        db_data = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            "title": training_data.title,
            "description": training_data.description,
            "trainingType": training_data.trainingType,
            "duration": training_data.duration,
            "cost": training_data.cost,
            "provider": training_data.provider,
            "startDate": datetime.fromisoformat(training_data.startDate) if training_data.startDate else None,
            "endDate": datetime.fromisoformat(training_data.endDate) if training_data.endDate else None,
            "maxParticipants": training_data.maxParticipants,
            "status": training_data.status,
            "materials": training_data.materials or [],
            "objectives": training_data.objectives or [],
            "prerequisites": training_data.prerequisites or [],
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        training = create_training(db_data, db)
        
        response_data = {
            "id": str(training.id),
            "tenant_id": str(training.tenant_id),
            "title": training.title,
            "description": training.description,
            "trainingType": training.trainingType,
            "duration": training.duration,
            "cost": float(training.cost),
            "provider": training.provider,
            "startDate": training.startDate.isoformat() if training.startDate else "",
            "endDate": training.endDate.isoformat() if training.endDate else "",
            "maxParticipants": training.maxParticipants,
            "status": training.status,
            "materials": training.materials or [],
            "objectives": training.objectives or [],
            "prerequisites": training.prerequisites or [],
            "createdBy": str(training.createdBy),
            "createdAt": training.createdAt.isoformat(),
            "updatedAt": training.updatedAt.isoformat()
        }
        # Create notification for training creation
        try:
            from ...services.notification_service import create_hrm_notification_for_all_tenant_users
            from ...config.notification_models import NotificationType
            
            create_hrm_notification_for_all_tenant_users(
                db,
                tenant_context["tenant_id"],
                "New Training Program Created",
                f"Training program '{training_data.title}' has been created",
                NotificationType.INFO,
                f"/hrm/training/{str(training.id)}",
                {"training_id": str(training.id), "title": training_data.title, "provider": training_data.provider}
            )
        except Exception as notification_error:
            # Don't fail the main operation if notification fails
            pass
        
        return Training(**response_data)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating training program: {str(e)}")

@router.get("/training/{training_id}", response_model=Training)
async def get_hrm_training_by_id(
    training_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get a specific training program by ID"""
    try:
        training = get_training_by_id(training_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not training:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Convert to Pydantic model
        response_data = {
            "id": str(training.id),
            "tenant_id": str(training.tenant_id),
            "title": training.title,
            "description": training.description,
            "trainingType": training.trainingType,
            "duration": training.duration,
            "cost": float(training.cost),
            "provider": training.provider,
            "startDate": training.startDate.isoformat() if training.startDate else "",
            "endDate": training.endDate.isoformat() if training.endDate else "",
            "maxParticipants": training.maxParticipants,
            "status": training.status,
            "materials": training.materials or [],
            "objectives": training.objectives or [],
            "prerequisites": training.prerequisites or [],
            "createdBy": str(training.createdBy),
            "createdAt": training.createdAt.isoformat(),
            "updatedAt": training.updatedAt.isoformat()
        }
        return Training(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training program: {str(e)}")

@router.put("/training/{training_id}", response_model=Training)
async def update_hrm_training(
    training_id: str,
    training_update: TrainingUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update a training program"""
    try:
        updated_training = update_training(
            training_id,
            training_update.dict(exclude_unset=True),
            db,
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_training:
            raise HTTPException(status_code=404, detail="Training program not found")
        
        # Convert to Pydantic model
        response_data = {
            "id": str(updated_training.id),
            "tenant_id": str(updated_training.tenant_id),
            "title": updated_training.title,
            "description": updated_training.description,
            "trainingType": updated_training.trainingType,
            "duration": updated_training.duration,
            "cost": float(updated_training.cost),
            "provider": updated_training.provider,
            "startDate": updated_training.startDate.isoformat() if updated_training.startDate else "",
            "endDate": updated_training.endDate.isoformat() if updated_training.endDate else "",
            "maxParticipants": updated_training.maxParticipants,
            "status": updated_training.status,
            "materials": updated_training.materials or [],
            "objectives": updated_training.objectives or [],
            "prerequisites": updated_training.prerequisites or [],
            "createdBy": str(updated_training.createdBy),
            "createdAt": updated_training.createdAt.isoformat(),
            "updatedAt": updated_training.updatedAt.isoformat()
        }
        return Training(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating training program: {str(e)}")

@router.delete("/training/{training_id}")
async def delete_hrm_training(
    training_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete a training program"""
    try:
        deleted = delete_training(training_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=404, detail="Training program not found")
        return {"message": "Training program deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting training program: {str(e)}")

# Training Enrollment endpoints
@router.get("/training-enrollments", response_model=HRMEnrollmentsResponse)
async def get_hrm_training_enrollments(
    training_id: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all training enrollments with optional filtering"""
    try:
        skip = (page - 1) * limit
        enrollments = get_training_enrollments(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        # Apply additional filters if provided
        if training_id or employee_id or status:
            filtered_enrollments = []
            for enrollment in enrollments:
                if training_id and enrollment.trainingId != training_id:
                    continue
                if employee_id and enrollment.employeeId != employee_id:
                    continue
                if status and enrollment.status != status:
                    continue
                filtered_enrollments.append(enrollment)
            enrollments = filtered_enrollments
        
        # Get total count for pagination
        total = len(enrollments)
        
        return HRMEnrollmentsResponse(
            enrollments=enrollments,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training enrollments: {str(e)}")

@router.post("/training-enrollments", response_model=TrainingEnrollment)
async def create_hrm_training_enrollment(
    enrollment_data: TrainingEnrollmentCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new training enrollment"""
    try:
        enrollment = TrainingEnrollment(
            id=str(uuid.uuid4()),
            **enrollment_data.dict(),
            tenant_id=tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            createdBy=str(current_user.id),
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        
        return enrollment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating training enrollment: {str(e)}")

@router.get("/training-enrollments/{enrollment_id}", response_model=TrainingEnrollment)
async def get_hrm_training_enrollment(
    enrollment_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get a specific training enrollment by ID"""
    try:
        enrollment = get_training_enrollment_by_id(db, enrollment_id, tenant_context["tenant_id"] if tenant_context else None)
        if not enrollment:
            raise HTTPException(status_code=404, detail="Training enrollment not found")
        return enrollment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training enrollment: {str(e)}")

@router.put("/training-enrollments/{enrollment_id}", response_model=TrainingEnrollment)
async def update_hrm_training_enrollment(
    enrollment_id: str,
    enrollment_update: TrainingEnrollmentUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update a training enrollment"""
    try:
        updated_enrollment = update_training_enrollment(
            db, 
            enrollment_id, 
            enrollment_update.dict(exclude_unset=True),
            tenant_context["tenant_id"] if tenant_context else None
        )
        if not updated_enrollment:
            raise HTTPException(status_code=404, detail="Training enrollment not found")
        return updated_enrollment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating training enrollment: {str(e)}")

@router.delete("/training-enrollments/{enrollment_id}")
async def delete_hrm_training_enrollment(
    enrollment_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete a training enrollment"""
    try:
        deleted = delete_training_enrollment(db, enrollment_id, tenant_context["tenant_id"] if tenant_context else None)
        if not deleted:
            raise HTTPException(status_code=500, detail="Training enrollment not found")
        return {"message": "Training enrollment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting training enrollment: {str(e)}")

def transform_supplier_to_pydantic(db_supplier):
    """Transform database Supplier to Pydantic Supplier model"""
    from ...models.hrm_models import Supplier as PydanticSupplier
    
    postal_code = getattr(db_supplier, 'postalCode', None) or getattr(db_supplier, 'zipCode', None)
    
    return PydanticSupplier(
        id=str(db_supplier.id),
        tenant_id=str(db_supplier.tenant_id),
        code=db_supplier.code,
        name=db_supplier.name,
        contactPerson=getattr(db_supplier, 'contactPerson', None),
        email=getattr(db_supplier, 'email', None),
        phone=getattr(db_supplier, 'phone', None),
        address=getattr(db_supplier, 'address', None),
        city=getattr(db_supplier, 'city', None),
        state=getattr(db_supplier, 'state', None),
        country=getattr(db_supplier, 'country', None),
        postalCode=postal_code,
        website=getattr(db_supplier, 'website', None),
        paymentTerms=getattr(db_supplier, 'paymentTerms', None),
        creditLimit=getattr(db_supplier, 'creditLimit', None),
        isActive=getattr(db_supplier, 'isActive', True),
        createdBy=str(db_supplier.createdBy),
        createdAt=db_supplier.createdAt,
        updatedAt=db_supplier.updatedAt
    )

# Supplier endpoints
@router.get("/suppliers", response_model=SuppliersResponse)
def read_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get all suppliers for the current tenant"""
    try:
        db_suppliers = get_suppliers(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        suppliers = [transform_supplier_to_pydantic(supplier) for supplier in db_suppliers]
        total = len(suppliers)
        return SuppliersResponse(suppliers=suppliers, total=total)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching suppliers: {str(e)}")

@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def read_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get supplier by ID"""
    try:
        db_supplier = get_supplier_by_id(supplier_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        supplier = transform_supplier_to_pydantic(db_supplier)
        return SupplierResponse(supplier=supplier)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching supplier: {str(e)}")

@router.post("/suppliers", response_model=SupplierResponse)
def create_supplier_endpoint(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_CREATE.value))
):
    """Create a new supplier"""
    try:
        # Check if supplier code already exists for this tenant
        existing_supplier = get_supplier_by_code(supplier.code, db, tenant_context["tenant_id"] if tenant_context else None)
        if existing_supplier:
            raise HTTPException(
                status_code=400, 
                detail=f"Supplier with code '{supplier.code}' already exists"
            )
        
        supplier_data = supplier.dict()
        supplier_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_context["tenant_id"] if tenant_context else str(uuid.uuid4()),
            "createdBy": str(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        })
        
        db_supplier = create_supplier(supplier_data, db)
        supplier = transform_supplier_to_pydantic(db_supplier)
        return SupplierResponse(supplier=supplier)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating supplier: {str(e)}")

@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier_endpoint(
    supplier_id: str,
    supplier: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_UPDATE.value))
):
    """Update supplier"""
    try:
        update_data = {k: v for k, v in supplier.dict().items() if v is not None}
        db_supplier = update_supplier(supplier_id, update_data, db, tenant_context["tenant_id"] if tenant_context else None)
        if not db_supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        supplier = transform_supplier_to_pydantic(db_supplier)
        return SupplierResponse(supplier=supplier)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating supplier: {str(e)}")

@router.delete("/suppliers/{supplier_id}")
def delete_supplier_endpoint(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_DELETE.value))
):
    """Delete supplier"""
    try:
        success = delete_supplier(supplier_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return {"message": "Supplier deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting supplier: {str(e)}")

# HRM Dashboard endpoint
@router.get("/dashboard", response_model=HRMDashboard)
async def get_hrm_dashboard(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.HRM_VIEW.value))
):
    """Get HRM dashboard data"""
    try:
        dashboard_data = get_hrm_dashboard_data(db, tenant_context["tenant_id"] if tenant_context else None)
        if not dashboard_data:
            raise HTTPException(status_code=500, detail="Error fetching dashboard data")
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")
