from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import logging
from .hrm_models import Employee, JobPosting, PerformanceReview, TimeEntry, LeaveRequest, Payroll, Benefits, Supplier, Training, Application, TrainingEnrollment

logger = logging.getLogger(__name__)

# Employee functions
def get_employee_by_id(employee_id: str, db: Session, tenant_id: str = None) -> Optional[Employee]:
    query = db.query(Employee).filter(Employee.id == employee_id)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.first()

def get_employee_by_user_id(user_id: str, db: Session, tenant_id: str = None) -> Optional[Employee]:
    query = db.query(Employee).filter(Employee.userId == user_id)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.first()

def get_all_employees(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Employee]:
    query = db.query(Employee)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.order_by(Employee.createdAt.desc()).offset(skip).limit(limit).all()

def get_employees_by_department(department: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Employee]:
    query = db.query(Employee).filter(Employee.department == department)
    if tenant_id:
        query = query.filter(Employee.tenant_id == tenant_id)
    return query.order_by(Employee.createdAt.desc()).offset(skip).limit(limit).all()

def create_employee(employee_data: dict, db: Session) -> Employee:
    db_employee = Employee(**employee_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(employee_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Employee]:
    employee = get_employee_by_id(employee_id, db, tenant_id)
    if not employee:
        return None
    
    for key, value in update_data.items():
        if hasattr(employee, key) and value is not None:
            if key == 'department' and hasattr(value, 'value'):
                setattr(employee, key, value.value)
            elif key == 'hireDate' and isinstance(value, str):
                setattr(employee, key, datetime.strptime(value, "%Y-%m-%d").date())
            elif key == 'managerId' and value:
                setattr(employee, key, uuid.UUID(value))
            elif key == 'employeeType':
                if hasattr(value, 'value'):
                    setattr(employee, key, value.value)
                elif isinstance(value, str):
                    setattr(employee, key, value)
                else:
                    setattr(employee, key, str(value))
            elif key == 'employmentStatus':
                if hasattr(value, 'value'):
                    setattr(employee, key, value.value)
                elif isinstance(value, str):
                    setattr(employee, key, value)
                else:
                    setattr(employee, key, str(value))
            else:
                setattr(employee, key, value)
    
    employee.updatedAt = datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(employee)
    except Exception as e:
        logger.error(f"Error committing employee update to database: {str(e)}", exc_info=True)
        db.rollback()
        raise
    
    return employee

def delete_employee(employee_id: str, db: Session, tenant_id: str = None) -> bool:
    from sqlalchemy import or_
    from .hrm_models import (
        EmployeeDevice,
        LeaveRequest,
        TimeEntry,
        PerformanceReview,
        Payroll,
        TrainingEnrollment,
        Employee,
    )

    employee = get_employee_by_id(employee_id, db, tenant_id)
    if not employee:
        return False
    uid = employee.id
    db.query(EmployeeDevice).filter(EmployeeDevice.employeeId == uid).delete(synchronize_session=False)
    db.query(LeaveRequest).filter(LeaveRequest.employeeId == uid).delete(synchronize_session=False)
    db.query(TimeEntry).filter(TimeEntry.employeeId == uid).delete(synchronize_session=False)
    db.query(PerformanceReview).filter(
        or_(PerformanceReview.employeeId == uid, PerformanceReview.reviewerId == uid)
    ).delete(synchronize_session=False)
    db.query(Payroll).filter(Payroll.employeeId == uid).delete(synchronize_session=False)
    db.query(TrainingEnrollment).filter(TrainingEnrollment.employeeId == uid).delete(synchronize_session=False)
    db.query(Employee).filter(Employee.managerId == uid).update(
        {Employee.managerId: None}, synchronize_session=False
    )
    db.delete(employee)
    db.commit()
    return True

# JobPosting functions
def get_job_posting_by_id(job_id: str, db: Session, tenant_id: str = None) -> Optional[JobPosting]:
    query = db.query(JobPosting).filter(JobPosting.id == job_id)
    if tenant_id:
        query = query.filter(JobPosting.tenant_id == tenant_id)
    return query.first()

def get_all_job_postings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    query = db.query(JobPosting)
    if tenant_id:
        query = query.filter(JobPosting.tenant_id == tenant_id)
    return query.order_by(JobPosting.postedDate.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_job_postings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    """Get all job postings (alias for get_all_job_postings)"""
    return get_all_job_postings(db, tenant_id, skip, limit)

def get_active_job_postings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JobPosting]:
    query = db.query(JobPosting).filter(JobPosting.isActive == True)
    if tenant_id:
        query = query.filter(JobPosting.tenant_id == tenant_id)
    return query.order_by(JobPosting.postedDate.desc()).offset(skip).limit(limit).all()

def create_job_posting(job_data: dict, db: Session) -> JobPosting:
    db_job = JobPosting(**job_data)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job_posting(db: Session, job_id: str, update_data: dict, tenant_id: str = None) -> Optional[JobPosting]:
    job = get_job_posting_by_id(job_id, db, tenant_id)
    if job:
        for key, value in update_data.items():
            if hasattr(job, key) and value is not None:
                # Handle empty strings for UUID fields
                if key in ['hiringManagerId', 'managerId'] and value == '':
                    value = None
                setattr(job, key, value)
        job.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(job)
    return job

def delete_job_posting(job_id: str, db: Session, tenant_id: str = None) -> bool:
    job = get_job_posting_by_id(job_id, db, tenant_id)
    if job:
        db.delete(job)
        db.commit()
        return True
    return False

# PerformanceReview functions
def get_performance_review_by_id(review_id: str, db: Session, tenant_id: str = None) -> Optional[PerformanceReview]:
    query = db.query(PerformanceReview).filter(PerformanceReview.id == review_id)
    if tenant_id:
        query = query.filter(PerformanceReview.tenant_id == tenant_id)
    return query.first()

def get_all_performance_reviews(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PerformanceReview]:
    query = db.query(PerformanceReview)
    if tenant_id:
        query = query.filter(PerformanceReview.tenant_id == tenant_id)
    return query.order_by(PerformanceReview.reviewDate.desc()).offset(skip).limit(limit).all()

def get_performance_reviews_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PerformanceReview]:
    query = db.query(PerformanceReview).filter(PerformanceReview.employeeId == employee_id)
    if tenant_id:
        query = query.filter(PerformanceReview.tenant_id == tenant_id)
    return query.order_by(PerformanceReview.reviewDate.desc()).offset(skip).limit(limit).all()

def create_performance_review(review_data: dict, db: Session) -> PerformanceReview:
    db_review = PerformanceReview(**review_data)
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def update_performance_review(review_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[PerformanceReview]:
    from datetime import datetime
    review = get_performance_review_by_id(review_id, db, tenant_id)
    if review:
        for key, value in update_data.items():
            if value is not None:
                # Handle special field mappings
                if key == 'nextReviewDate':
                    if isinstance(value, str) and value.strip():
                        setattr(review, key, datetime.fromisoformat(value))
                    elif isinstance(value, str) and not value.strip():
                        # Set to None for empty strings
                        setattr(review, key, None)
                elif key == 'overallRating':
                    print(f"Updating overallRating from {review.rating} to {value}")
                    setattr(review, 'rating', value)
                elif key == 'achievements':
                    setattr(review, 'strengths', "\n".join(value) if isinstance(value, list) else value)
                elif key == 'areasOfImprovement':
                    setattr(review, 'areasForImprovement', "\n".join(value) if isinstance(value, list) else value)
                elif key == 'goals':
                    setattr(review, key, "\n".join(value) if isinstance(value, list) else value)
                elif key == 'feedback':
                    setattr(review, 'comments', value)
                elif key == 'reviewType':
                    setattr(review, 'reviewType', value.value if hasattr(value, 'value') else value)
                elif key == 'technicalRating':
                    setattr(review, 'technicalRating', value)
                elif key == 'communicationRating':
                    setattr(review, 'communicationRating', value)
                elif key == 'teamworkRating':
                    setattr(review, 'teamworkRating', value)
                elif key == 'leadershipRating':
                    setattr(review, 'leadershipRating', value)
                elif key == 'status':
                    setattr(review, 'isCompleted', value == 'completed')
                elif hasattr(review, key):
                    setattr(review, key, value)
        review.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(review)
    return review

def delete_performance_review(review_id: str, db: Session, tenant_id: str = None) -> bool:
    review = get_performance_review_by_id(review_id, db, tenant_id)
    if review:
        db.delete(review)
        db.commit()
        return True
    return False

# TimeEntry functions
def get_time_entry_by_id(entry_id: str, db: Session, tenant_id: str = None) -> Optional[TimeEntry]:
    query = db.query(TimeEntry).filter(TimeEntry.id == entry_id)
    if tenant_id:
        query = query.filter(TimeEntry.tenant_id == tenant_id)
    return query.first()

def get_all_time_entries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
    query = db.query(TimeEntry)
    if tenant_id:
        query = query.filter(TimeEntry.tenant_id == tenant_id)
    return query.order_by(TimeEntry.date.desc()).offset(skip).limit(limit).all()

def get_time_entries_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
    query = db.query(TimeEntry).filter(TimeEntry.employeeId == employee_id)
    if tenant_id:
        query = query.filter(TimeEntry.tenant_id == tenant_id)
    return query.order_by(TimeEntry.date.desc()).offset(skip).limit(limit).all()

def create_time_entry(entry_data: dict, db: Session) -> TimeEntry:
    db_entry = TimeEntry(**entry_data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_time_entry(entry_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[TimeEntry]:
    entry = get_time_entry_by_id(entry_id, db, tenant_id)
    if entry:
        for key, value in update_data.items():
            if hasattr(entry, key) and value is not None:
                setattr(entry, key, value)
        entry.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(entry)
    return entry

def delete_time_entry(entry_id: str, db: Session, tenant_id: str = None) -> bool:
    entry = get_time_entry_by_id(entry_id, db, tenant_id)
    if entry:
        db.delete(entry)
        db.commit()
        return True
    return False

# LeaveRequest functions
def get_leave_request_by_id(request_id: str, db: Session, tenant_id: str = None) -> Optional[LeaveRequest]:
    query = db.query(LeaveRequest).filter(LeaveRequest.id == request_id)
    if tenant_id:
        query = query.filter(LeaveRequest.tenant_id == tenant_id)
    return query.first()

def get_all_leave_requests(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    query = db.query(LeaveRequest)
    if tenant_id:
        query = query.filter(LeaveRequest.tenant_id == tenant_id)
    return query.order_by(LeaveRequest.createdAt.desc()).offset(skip).limit(limit).all()

def get_leave_requests_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    query = db.query(LeaveRequest).filter(LeaveRequest.employeeId == employee_id)
    if tenant_id:
        query = query.filter(LeaveRequest.tenant_id == tenant_id)
    return query.order_by(LeaveRequest.createdAt.desc()).offset(skip).limit(limit).all()

def create_leave_request(request_data: dict, db: Session) -> LeaveRequest:
    db_request = LeaveRequest(**request_data)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def update_leave_request(request_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[LeaveRequest]:
    request = get_leave_request_by_id(request_id, db, tenant_id)
    if request:
        for key, value in update_data.items():
            if hasattr(request, key) and value is not None:
                setattr(request, key, value)
        request.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(request)
    return request

def delete_leave_request(request_id: str, db: Session, tenant_id: str = None) -> bool:
    request = get_leave_request_by_id(request_id, db, tenant_id)
    if request:
        db.delete(request)
        db.commit()
        return True
    return False

# Payroll functions
def get_payroll_by_id(payroll_id: str, db: Session, tenant_id: str = None) -> Optional[Payroll]:
    query = db.query(Payroll).filter(Payroll.id == payroll_id)
    if tenant_id:
        query = query.filter(Payroll.tenant_id == tenant_id)
    return query.first()

def get_all_payrolls(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payroll]:
    query = db.query(Payroll)
    if tenant_id:
        query = query.filter(Payroll.tenant_id == tenant_id)
    return query.order_by(Payroll.startDate.desc()).offset(skip).limit(limit).all()

def get_payrolls_by_employee(employee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payroll]:
    query = db.query(Payroll).filter(Payroll.employeeId == employee_id)
    if tenant_id:
        query = query.filter(Payroll.tenant_id == tenant_id)
    return query.order_by(Payroll.startDate.desc()).offset(skip).limit(limit).all()

def create_payroll(payroll_data: dict, db: Session) -> Payroll:
    db_payroll = Payroll(**payroll_data)
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    return db_payroll

def update_payroll(payroll_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Payroll]:
    payroll = get_payroll_by_id(payroll_id, db, tenant_id)
    if payroll:
        # Map frontend field names to database field names
        field_mapping = {
            'payPeriod': 'payPeriod',
            'startDate': 'startDate',
            'endDate': 'endDate',
            'basicSalary': 'baseSalary',
            'allowances': 'allowances',  # Now stored in DB
            'deductions': 'deductions',
            'overtimePay': 'overtimePay',  # Store as direct value
            'bonus': 'bonuses',
            'netPay': 'netPay',
            'status': 'isProcessed',  # Convert status to boolean
            'paymentDate': 'processedAt',
            'notes': 'notes'  # Not stored in DB, but keep for compatibility
        }
        
        for key, value in update_data.items():
            if key in field_mapping:
                db_field = field_mapping[key]
                if db_field == 'isProcessed':
                    # Convert status string to boolean
                    payroll.isProcessed = value == 'processed'
                    if payroll.isProcessed and not payroll.processedAt:
                        payroll.processedAt = datetime.utcnow()
                elif db_field == 'processedAt' and value:
                    # Convert date string to datetime
                    payroll.processedAt = datetime.fromisoformat(value) if isinstance(value, str) else value
                elif db_field == 'startDate' and value:
                    # Convert date string to date
                    payroll.startDate = datetime.fromisoformat(value).date() if isinstance(value, str) else value
                elif db_field == 'endDate' and value:
                    # Convert date string to date
                    payroll.endDate = datetime.fromisoformat(value).date() if isinstance(value, str) else value
                elif db_field == 'baseSalary':
                    payroll.baseSalary = value
                elif db_field == 'allowances':
                    payroll.allowances = value
                elif db_field == 'deductions':
                    payroll.deductions = value
                elif db_field == 'bonuses':
                    payroll.bonuses = value
                elif db_field == 'netPay':
                    payroll.netPay = value
                elif db_field == 'overtimePay':
                    # Store overtimePay directly and update overtimeHours/overtimeRate
                    # For simplicity, we'll store it as overtimeHours with rate=1
                    payroll.overtimeHours = value
                    payroll.overtimeRate = 1.0
                elif hasattr(payroll, db_field):
                    setattr(payroll, db_field, value)
        
        payroll.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(payroll)
    return payroll

def delete_payroll(payroll_id: str, db: Session, tenant_id: str = None) -> bool:
    payroll = get_payroll_by_id(payroll_id, db, tenant_id)
    if payroll:
        db.delete(payroll)
        db.commit()
        return True
    return False

# Benefits functions
def get_benefit_by_id(benefit_id: str, db: Session, tenant_id: str = None) -> Optional[Benefits]:
    query = db.query(Benefits).filter(Benefits.id == benefit_id)
    if tenant_id:
        query = query.filter(Benefits.tenant_id == tenant_id)
    return query.first()

def get_all_benefits(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Benefits]:
    query = db.query(Benefits)
    if tenant_id:
        query = query.filter(Benefits.tenant_id == tenant_id)
    return query.order_by(Benefits.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_benefits(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Benefits]:
    query = db.query(Benefits).filter(Benefits.isActive == True)
    if tenant_id:
        query = query.filter(Benefits.tenant_id == tenant_id)
    return query.order_by(Benefits.createdAt.desc()).offset(skip).limit(limit).all()

def create_benefit(benefit_data: dict, db: Session) -> Benefits:
    db_benefit = Benefits(**benefit_data)
    db.add(db_benefit)
    db.commit()
    db.refresh(db_benefit)
    return db_benefit

def update_benefit(benefit_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Benefits]:
    benefit = get_benefit_by_id(benefit_id, db, tenant_id)
    if benefit:
        for key, value in update_data.items():
            if hasattr(benefit, key) and value is not None:
                setattr(benefit, key, value)
        benefit.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(benefit)
    return benefit

def delete_benefit(benefit_id: str, db: Session, tenant_id: str = None) -> bool:
    benefit = get_benefit_by_id(benefit_id, db, tenant_id)
    if benefit:
        db.delete(benefit)
        db.commit()
        return True
    return False

# Alias functions for backward compatibility
def get_employees(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Employee]:
    """Get all employees (alias for get_all_employees)"""
    return get_all_employees(db, tenant_id, skip, limit)

def get_benefits(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Benefits]:
    """Get all benefits (alias for get_all_benefits)"""
    return get_all_benefits(db, tenant_id, skip, limit)

def get_performance_reviews(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PerformanceReview]:
    """Get all performance reviews (alias for get_all_performance_reviews)"""
    return get_all_performance_reviews(db, tenant_id, skip, limit)

def get_time_entries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[TimeEntry]:
    """Get all time entries (alias for get_all_time_entries)"""
    return get_all_time_entries(db, tenant_id, skip, limit)

def get_leave_requests(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LeaveRequest]:
    """Get all leave requests (alias for get_all_leave_requests)"""
    return get_all_leave_requests(db, tenant_id, skip, limit)

def get_payroll(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payroll]:
    """Get all payroll records (alias for get_all_payrolls)"""
    return get_all_payrolls(db, tenant_id, skip, limit)

# Placeholder functions for models not yet implemented
def get_training_by_id(training_id: str, db: Session, tenant_id: str = None) -> Optional[Any]:
    from .hrm_models import Training
    query = db.query(Training).filter(Training.id == training_id)
    if tenant_id:
        query = query.filter(Training.tenant_id == tenant_id)
    return query.first()

def get_all_trainings(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    from .hrm_models import Training
    query = db.query(Training)
    if tenant_id:
        query = query.filter(Training.tenant_id == tenant_id)
    return query.order_by(Training.createdAt.desc()).offset(skip).limit(limit).all()

def get_training(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    """Get all trainings (alias for get_all_trainings)"""
    return get_all_trainings(db, tenant_id, skip, limit)

def create_training(training_data: dict, db: Session) -> Any:
    from .hrm_models import Training
    db_training = Training(**training_data)
    db.add(db_training)
    db.commit()
    db.refresh(db_training)
    return db_training

def update_training(training_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Any]:
    from .hrm_models import Training
    training = get_training_by_id(training_id, db, tenant_id)
    if training:
        for key, value in update_data.items():
            if hasattr(training, key) and value is not None:
                setattr(training, key, value)
        training.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(training)
    return training

def delete_training(training_id: str, db: Session, tenant_id: str = None) -> bool:
    from .hrm_models import Training
    training = get_training_by_id(training_id, db, tenant_id)
    if training:
        db.delete(training)
        db.commit()
        return True
    return False

def get_training_enrollment_by_id(enrollment_id: str, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - TrainingEnrollment model not yet implemented
    return None

def get_all_training_enrollments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    # Placeholder - TrainingEnrollment model not yet implemented
    return []

def get_training_enrollments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    """Get all training enrollments (alias for get_all_training_enrollments)"""
    return get_all_training_enrollments(db, tenant_id, skip, limit)

def create_training_enrollment(enrollment_data: dict, db: Session) -> Any:
    # Placeholder - TrainingEnrollment model not yet implemented
    return None

def update_training_enrollment(enrollment_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - TrainingEnrollment model not yet implemented
    return None

def delete_training_enrollment(enrollment_id: str, db: Session, tenant_id: str = None) -> bool:
    # Placeholder - TrainingEnrollment model not yet implemented
    return False

def get_application_by_id(application_id: str, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - Application model not yet implemented
    return None

def get_all_applications(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    # Placeholder - Application model not yet implemented
    return []

def get_applications(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Any]:
    """Get all applications (alias for get_all_applications)"""
    return get_all_applications(db, tenant_id, skip, limit)

def create_application(application_data: dict, db: Session) -> Any:
    # Placeholder - Application model not yet implemented
    return None

def update_application(application_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Any]:
    # Placeholder - Application model not yet implemented
    return None

def delete_application(application_id: str, db: Session, tenant_id: str = None) -> bool:
    # Placeholder - Application model not yet implemented
    return False

# HRM Dashboard functions
def get_hrm_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get HRM dashboard statistics"""
    
    total_employees = db.query(Employee).filter(Employee.tenant_id == tenant_id).count()
    active_employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.employmentStatus == "active"
    ).count()
    
    recent_hires = db.query(Employee).filter(
        Employee.tenant_id == tenant_id
    ).order_by(Employee.hireDate.desc()).limit(5).all()
    
    job_postings = db.query(JobPosting).filter(
        JobPosting.tenant_id == tenant_id,
        JobPosting.isActive == True
    ).all()
    
    upcoming_reviews = db.query(PerformanceReview).filter(
        PerformanceReview.tenant_id == tenant_id,
        PerformanceReview.reviewDate >= datetime.now()
    ).order_by(PerformanceReview.reviewDate.asc()).limit(5).all()
    
    pending_leave_requests = db.query(LeaveRequest).filter(
        LeaveRequest.tenant_id == tenant_id,
        LeaveRequest.status == "pending"
    ).all()
    
    applications = db.query(Application).filter(
        Application.tenant_id == tenant_id
    ).order_by(Application.createdAt.desc()).limit(5).all()
    
    training_programs = db.query(Training).filter(
        Training.tenant_id == tenant_id
    ).order_by(Training.createdAt.desc()).limit(5).all()
    
    department_count = db.query(
        Employee.department,
        func.count(Employee.id)
    ).filter(
        Employee.tenant_id == tenant_id
    ).group_by(Employee.department).all()
    
    department_distribution = {dept: count for dept, count in department_count}
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    new_hires = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.hireDate >= thirty_days_ago
    ).count()
    
    turnover_rate = 0.0
    if total_employees > 0:
        terminated = db.query(Employee).filter(
            Employee.tenant_id == tenant_id,
            Employee.employmentStatus == "terminated"
        ).count()
        turnover_rate = (terminated / total_employees) * 100
    
    avg_salary = db.query(func.avg(Employee.salary)).filter(
        Employee.tenant_id == tenant_id,
        Employee.employmentStatus == "active"
    ).scalar() or 0.0
    
    pending_applications = db.query(Application).filter(
        Application.tenant_id == tenant_id,
        Application.status == "applied"
    ).count()
    
    total_completed_training = 0
    total_enrollments = 0
    training_completion_rate = 0.0
    if total_enrollments > 0:
        training_completion_rate = (total_completed_training / total_enrollments) * 100
    
    return {
        "metrics": {
            "totalEmployees": total_employees,
            "activeEmployees": active_employees,
            "newHires": new_hires,
            "turnoverRate": round(turnover_rate, 2),
            "averageSalary": round(avg_salary, 2),
            "openPositions": len(job_postings),
            "pendingApplications": pending_applications,
            "upcomingReviews": len(upcoming_reviews),
            "pendingLeaveRequests": len(pending_leave_requests),
            "trainingCompletionRate": round(training_completion_rate, 2)
        },
        "recentHires": [],
        "upcomingReviews": [],
        "pendingLeaveRequests": [],
        "openJobPostings": [],
        "recentApplications": [],
        "departmentDistribution": department_distribution or {},
        "trainingPrograms": []
    }

# Supplier functions
def get_supplier_by_id(supplier_id: str, db: Session, tenant_id: str = None) -> Optional[Supplier]:
    query = db.query(Supplier).filter(Supplier.id == supplier_id)
    if tenant_id:
        query = query.filter(Supplier.tenant_id == tenant_id)
    return query.first()

def get_supplier_by_code(code: str, db: Session, tenant_id: str = None) -> Optional[Supplier]:
    query = db.query(Supplier).filter(Supplier.code == code)
    if tenant_id:
        query = query.filter(Supplier.tenant_id == tenant_id)
    return query.first()

def get_all_suppliers(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Supplier]:
    query = db.query(Supplier)
    if tenant_id:
        query = query.filter(Supplier.tenant_id == tenant_id)
    return query.order_by(Supplier.createdAt.desc()).offset(skip).limit(limit).all()

def get_suppliers(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Supplier]:
    """Get all suppliers (alias for get_all_suppliers)"""
    return get_all_suppliers(db, tenant_id, skip, limit)

def get_active_suppliers(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Supplier]:
    query = db.query(Supplier).filter(Supplier.isActive == True)
    if tenant_id:
        query = query.filter(Supplier.tenant_id == tenant_id)
    return query.order_by(Supplier.createdAt.desc()).offset(skip).limit(limit).all()

def create_supplier(supplier_data: dict, db: Session) -> Supplier:
    db_supplier = Supplier(**supplier_data)
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def update_supplier(supplier_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Supplier]:
    supplier = get_supplier_by_id(supplier_id, db, tenant_id)
    if supplier:
        for key, value in update_data.items():
            if hasattr(supplier, key) and value is not None:
                setattr(supplier, key, value)
        supplier.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(supplier)
    return supplier

def delete_supplier(supplier_id: str, db: Session, tenant_id: str = None) -> bool:
    supplier = get_supplier_by_id(supplier_id, db, tenant_id)
    if supplier:
        db.delete(supplier)
        db.commit()
        return True
    return False
