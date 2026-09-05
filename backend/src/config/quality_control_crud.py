from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging

from .quality_control_models import (
    QualityCheck, QualityInspection, QualityDefect, QualityReport,
    QualityStatus, QualityPriority, InspectionType, DefectSeverity, QualityStandard
)

logger = logging.getLogger(__name__)

# Quality Check CRUD operations
def create_quality_check(db: Session, check_data: Dict[str, Any], tenant_id: str, created_by_id: str) -> QualityCheck:
    """Create a new quality check"""
    try:
        # Generate check number
        check_number = f"QC-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
        
        check = QualityCheck(
            tenant_id=tenant_id,
            created_by_id=created_by_id,
            check_number=check_number,
            **check_data
        )
        
        db.add(check)
        db.commit()
        db.refresh(check)
        
        logger.info(f"Created quality check {check.id} for tenant {tenant_id}")
        return check
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating quality check: {str(e)}")
        raise

def get_quality_check_by_id(db: Session, check_id: str, tenant_id: str) -> Optional[QualityCheck]:
    """Get quality check by ID with tenant isolation"""
    try:
        return db.query(QualityCheck).filter(
            and_(
                QualityCheck.id == check_id,
                QualityCheck.tenant_id == tenant_id
            )
        ).first()
    except Exception as e:
        logger.error(f"Error getting quality check {check_id}: {str(e)}")
        return None

def get_all_quality_checks(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityCheck]:
    """Get all quality checks for a tenant with pagination (newest first)"""
    try:
        return db.query(QualityCheck).filter(
            QualityCheck.tenant_id == tenant_id
        ).order_by(desc(QualityCheck.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality checks: {str(e)}")
        return []

def get_quality_checks_by_status(db: Session, status: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityCheck]:
    """Get quality checks by status"""
    try:
        return db.query(QualityCheck).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.status == status
            )
        ).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality checks by status: {str(e)}")
        return []

def get_quality_checks_by_priority(db: Session, priority: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityCheck]:
    """Get quality checks by priority"""
    try:
        return db.query(QualityCheck).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.priority == priority
            )
        ).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality checks by priority: {str(e)}")
        return []

def get_quality_checks_by_inspection_type(db: Session, inspection_type: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityCheck]:
    """Get quality checks by inspection type"""
    try:
        return db.query(QualityCheck).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.inspection_type == inspection_type
            )
        ).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality checks by inspection type: {str(e)}")
        return []

def get_quality_checks_by_assigned_user(db: Session, assigned_to_id: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityCheck]:
    """Get quality checks assigned to a specific user"""
    try:
        return db.query(QualityCheck).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.assigned_to_id == assigned_to_id
            )
        ).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality checks by assigned user: {str(e)}")
        return []

def update_quality_check(db: Session, check_id: str, update_data: Dict[str, Any], tenant_id: str) -> Optional[QualityCheck]:
    """Update quality check"""
    try:
        check = get_quality_check_by_id(db, check_id, tenant_id)
        if not check:
            return None
            
        for key, value in update_data.items():
            if hasattr(check, key):
                setattr(check, key, value)
        
        check.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(check)
        
        logger.info(f"Updated quality check {check_id}")
        return check
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating quality check {check_id}: {str(e)}")
        return None

def delete_quality_check(db: Session, check_id: str, tenant_id: str) -> bool:
    """Delete quality check"""
    try:
        check = get_quality_check_by_id(db, check_id, tenant_id)
        if not check:
            return False
            
        db.delete(check)
        db.commit()
        
        logger.info(f"Deleted quality check {check_id}")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting quality check {check_id}: {str(e)}")
        return False

def get_next_quality_check_number(db: Session, tenant_id: str) -> str:
    """Get next quality check number"""
    try:
        current_month = datetime.utcnow().strftime('%Y%m')
        prefix = f"QC-{current_month}-"
        
        # Get the highest number for current month
        last_check = db.query(QualityCheck).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.check_number.like(f"{prefix}%")
            )
        ).order_by(desc(QualityCheck.check_number)).first()
        
        if last_check:
            # Extract the numeric part and increment
            last_number = int(last_check.check_number.split('-')[-1], 16)
            next_number = f"{prefix}{format(last_number + 1, '08x').upper()}"
        else:
            next_number = f"{prefix}{format(1, '08x').upper()}"
            
        return next_number
        
    except Exception as e:
        logger.error(f"Error generating quality check number: {str(e)}")
        return f"QC-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"

# Quality Inspection CRUD operations
def create_quality_inspection(db: Session, inspection_data: Dict[str, Any], tenant_id: str) -> QualityInspection:
    """Create a new quality inspection"""
    try:
        inspection = QualityInspection(
            tenant_id=tenant_id,
            **inspection_data
        )
        
        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        check = get_quality_check_by_id(db, str(inspection.quality_check_id), tenant_id)
        if check:
            if inspection.status in (QualityStatus.PASSED, QualityStatus.FAILED, QualityStatus.CONDITIONAL_PASS):
                recompute_check_progress(db, str(inspection.quality_check_id), tenant_id)
            elif check.status == QualityStatus.PENDING:
                check.status = QualityStatus.IN_PROGRESS
                check.updated_at = datetime.utcnow()
                db.commit()

        logger.info(f"Created quality inspection {inspection.id} for tenant {tenant_id}")
        return inspection
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating quality inspection: {str(e)}")
        raise

def get_quality_inspection_by_id(db: Session, inspection_id: str, tenant_id: str) -> Optional[QualityInspection]:
    """Get quality inspection by ID with tenant isolation"""
    try:
        return db.query(QualityInspection).filter(
            and_(
                QualityInspection.id == inspection_id,
                QualityInspection.tenant_id == tenant_id
            )
        ).first()
    except Exception as e:
        logger.error(f"Error getting quality inspection {inspection_id}: {str(e)}")
        return None

def get_quality_inspections_by_check(db: Session, check_id: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityInspection]:
    """Get all inspections for a quality check"""
    try:
        return db.query(QualityInspection).filter(
            and_(
                QualityInspection.tenant_id == tenant_id,
                QualityInspection.quality_check_id == check_id
            )
        ).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality inspections by check: {str(e)}")
        return []

def get_quality_inspections_by_inspector(db: Session, inspector_id: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityInspection]:
    """Get quality inspections by inspector"""
    try:
        return db.query(QualityInspection).filter(
            and_(
                QualityInspection.tenant_id == tenant_id,
                QualityInspection.inspector_id == inspector_id
            )
        ).order_by(desc(QualityInspection.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality inspections by inspector: {str(e)}")
        return []

def get_all_quality_inspections(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityInspection]:
    """Get all quality inspections for a tenant (newest first)"""
    try:
        return db.query(QualityInspection).filter(
            QualityInspection.tenant_id == tenant_id
        ).order_by(desc(QualityInspection.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting all quality inspections: {str(e)}")
        return []

def recompute_check_progress(db: Session, check_id: str, tenant_id: str) -> None:
    """Recompute a quality check's status and completion from its inspections."""
    try:
        check = get_quality_check_by_id(db, check_id, tenant_id)
        if not check:
            return
        inspections = db.query(QualityInspection).filter(
            and_(
                QualityInspection.tenant_id == tenant_id,
                QualityInspection.quality_check_id == check_id
            )
        ).all()

        total = len(inspections)
        if total == 0:
            return

        passed = sum(1 for i in inspections if i.status == QualityStatus.PASSED)
        failed = sum(1 for i in inspections if i.status == QualityStatus.FAILED)
        conditional = sum(1 for i in inspections if i.status == QualityStatus.CONDITIONAL_PASS)
        in_progress = sum(1 for i in inspections if i.status == QualityStatus.IN_PROGRESS)

        if failed > 0:
            check.status = QualityStatus.FAILED
        elif passed + conditional == total:
            check.status = QualityStatus.CONDITIONAL_PASS if conditional > 0 else QualityStatus.PASSED
        elif in_progress > 0 or passed + conditional > 0:
            check.status = QualityStatus.IN_PROGRESS
        else:
            check.status = QualityStatus.PENDING

        check.completion_percentage = round((passed / total) * 100, 1) if total else 0.0
        check.updated_at = datetime.utcnow()
        db.commit()
        logger.info(f"Recomputed quality check {check_id} -> {check.status} ({check.completion_percentage}%)")
    except Exception as e:
        db.rollback()
        logger.error(f"Error recomputing quality check {check_id}: {str(e)}")

def update_quality_inspection(db: Session, inspection_id: str, update_data: Dict[str, Any], tenant_id: str) -> Optional[QualityInspection]:
    """Update quality inspection"""
    try:
        inspection = get_quality_inspection_by_id(db, inspection_id, tenant_id)
        if not inspection:
            return None
            
        for key, value in update_data.items():
            if hasattr(inspection, key):
                setattr(inspection, key, value)
        
        inspection.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(inspection)

        recompute_check_progress(db, str(inspection.quality_check_id), tenant_id)

        logger.info(f"Updated quality inspection {inspection_id}")
        return inspection
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating quality inspection {inspection_id}: {str(e)}")
        return None

def delete_quality_inspection(db: Session, inspection_id: str, tenant_id: str) -> bool:
    """Delete quality inspection"""
    try:
        inspection = get_quality_inspection_by_id(db, inspection_id, tenant_id)
        if not inspection:
            return False
            
        db.delete(inspection)
        db.commit()
        
        logger.info(f"Deleted quality inspection {inspection_id}")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting quality inspection {inspection_id}: {str(e)}")
        return False

# Quality Defect CRUD operations
def create_quality_defect(db: Session, defect_data: Dict[str, Any], tenant_id: str) -> QualityDefect:
    """Create a new quality defect"""
    try:
        # Generate defect number
        defect_number = f"DEF-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
        
        defect = QualityDefect(
            tenant_id=tenant_id,
            defect_number=defect_number,
            **defect_data
        )
        
        db.add(defect)
        db.commit()
        db.refresh(defect)
        
        logger.info(f"Created quality defect {defect.id} for tenant {tenant_id}")
        return defect
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating quality defect: {str(e)}")
        raise

def get_quality_defect_by_id(db: Session, defect_id: str, tenant_id: str) -> Optional[QualityDefect]:
    """Get quality defect by ID with tenant isolation"""
    try:
        return db.query(QualityDefect).filter(
            and_(
                QualityDefect.id == defect_id,
                QualityDefect.tenant_id == tenant_id
            )
        ).first()
    except Exception as e:
        logger.error(f"Error getting quality defect {defect_id}: {str(e)}")
        return None

def get_quality_defects_by_severity(db: Session, severity: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityDefect]:
    """Get quality defects by severity"""
    try:
        return db.query(QualityDefect).filter(
            and_(
                QualityDefect.tenant_id == tenant_id,
                QualityDefect.severity == severity
            )
        ).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality defects by severity: {str(e)}")
        return []

def get_quality_defects_by_status(db: Session, status: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityDefect]:
    """Get quality defects by status"""
    try:
        return db.query(QualityDefect).filter(
            and_(
                QualityDefect.tenant_id == tenant_id,
                QualityDefect.status == status
            )
        ).order_by(desc(QualityDefect.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality defects by status: {str(e)}")
        return []

def get_all_quality_defects(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityDefect]:
    """Get all quality defects for a tenant (newest first)"""
    try:
        return db.query(QualityDefect).filter(
            QualityDefect.tenant_id == tenant_id
        ).order_by(desc(QualityDefect.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting all quality defects: {str(e)}")
        return []

def update_quality_defect(db: Session, defect_id: str, update_data: Dict[str, Any], tenant_id: str) -> Optional[QualityDefect]:
    """Update quality defect"""
    try:
        defect = get_quality_defect_by_id(db, defect_id, tenant_id)
        if not defect:
            return None
            
        for key, value in update_data.items():
            if hasattr(defect, key):
                setattr(defect, key, value)
        
        defect.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(defect)
        
        logger.info(f"Updated quality defect {defect_id}")
        return defect
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating quality defect {defect_id}: {str(e)}")
        return None

def delete_quality_defect(db: Session, defect_id: str, tenant_id: str) -> bool:
    """Delete quality defect"""
    try:
        defect = get_quality_defect_by_id(db, defect_id, tenant_id)
        if not defect:
            return False
            
        db.delete(defect)
        db.commit()
        
        logger.info(f"Deleted quality defect {defect_id}")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting quality defect {defect_id}: {str(e)}")
        return False

# Quality Report CRUD operations
def create_quality_report(db: Session, report_data: Dict[str, Any], tenant_id: str) -> QualityReport:
    """Create a new quality report"""
    try:
        # Generate report number
        report_number = f"QR-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
        
        report = QualityReport(
            tenant_id=tenant_id,
            report_number=report_number,
            **report_data
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"Created quality report {report.id} for tenant {tenant_id}")
        return report
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating quality report: {str(e)}")
        raise

def get_quality_report_by_id(db: Session, report_id: str, tenant_id: str) -> Optional[QualityReport]:
    """Get quality report by ID with tenant isolation"""
    try:
        return db.query(QualityReport).filter(
            and_(
                QualityReport.id == report_id,
                QualityReport.tenant_id == tenant_id
            )
        ).first()
    except Exception as e:
        logger.error(f"Error getting quality report {report_id}: {str(e)}")
        return None

def get_quality_reports_by_type(db: Session, report_type: str, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityReport]:
    """Get quality reports by type"""
    try:
        return db.query(QualityReport).filter(
            and_(
                QualityReport.tenant_id == tenant_id,
                QualityReport.report_type == report_type
            )
        ).order_by(desc(QualityReport.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting quality reports by type: {str(e)}")
        return []

def get_all_quality_reports(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[QualityReport]:
    """Get all quality reports for a tenant (newest first)"""
    try:
        return db.query(QualityReport).filter(
            QualityReport.tenant_id == tenant_id
        ).order_by(desc(QualityReport.created_at)).offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting all quality reports: {str(e)}")
        return []

def update_quality_report(db: Session, report_id: str, update_data: Dict[str, Any], tenant_id: str) -> Optional[QualityReport]:
    """Update quality report"""
    try:
        report = get_quality_report_by_id(db, report_id, tenant_id)
        if not report:
            return None
            
        for key, value in update_data.items():
            if hasattr(report, key):
                setattr(report, key, value)
        
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        
        logger.info(f"Updated quality report {report_id}")
        return report
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating quality report {report_id}: {str(e)}")
        return None

def delete_quality_report(db: Session, report_id: str, tenant_id: str) -> bool:
    """Delete quality report"""
    try:
        report = get_quality_report_by_id(db, report_id, tenant_id)
        if not report:
            return False
            
        db.delete(report)
        db.commit()
        
        logger.info(f"Deleted quality report {report_id}")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting quality report {report_id}: {str(e)}")
        return False

# Dashboard and Statistics
def get_quality_dashboard_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get quality control dashboard statistics"""
    try:
        # Quality Check stats
        total_checks = db.query(func.count(QualityCheck.id)).filter(
            QualityCheck.tenant_id == tenant_id
        ).scalar() or 0
        
        pending_checks = db.query(func.count(QualityCheck.id)).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.status == QualityStatus.PENDING
            )
        ).scalar() or 0
        
        in_progress_checks = db.query(func.count(QualityCheck.id)).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.status == QualityStatus.IN_PROGRESS
            )
        ).scalar() or 0
        
        completed_checks = db.query(func.count(QualityCheck.id)).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.status.in_([QualityStatus.PASSED, QualityStatus.FAILED, QualityStatus.CONDITIONAL_PASS])
            )
        ).scalar() or 0
        
        # Quality Inspection stats
        passed_inspections = db.query(func.count(QualityInspection.id)).filter(
            and_(
                QualityInspection.tenant_id == tenant_id,
                QualityInspection.status == QualityStatus.PASSED
            )
        ).scalar() or 0
        
        failed_inspections = db.query(func.count(QualityInspection.id)).filter(
            and_(
                QualityInspection.tenant_id == tenant_id,
                QualityInspection.status == QualityStatus.FAILED
            )
        ).scalar() or 0
        
        # Quality Defect stats
        open_defects = db.query(func.count(QualityDefect.id)).filter(
            and_(
                QualityDefect.tenant_id == tenant_id,
                QualityDefect.status == "open"
            )
        ).scalar() or 0
        
        critical_defects = db.query(func.count(QualityDefect.id)).filter(
            and_(
                QualityDefect.tenant_id == tenant_id,
                QualityDefect.severity == DefectSeverity.CRITICAL
            )
        ).scalar() or 0
        
        # Average compliance score
        avg_compliance = db.query(func.avg(QualityInspection.compliance_score)).filter(
            QualityInspection.tenant_id == tenant_id
        ).scalar() or 0.0
        
        # Total cost impact
        total_cost = db.query(func.sum(QualityDefect.cost_impact)).filter(
            QualityDefect.tenant_id == tenant_id
        ).scalar() or 0.0
        
        return {
            "total_checks": total_checks,
            "pending_checks": pending_checks,
            "in_progress_checks": in_progress_checks,
            "completed_checks": completed_checks,
            "passed_inspections": passed_inspections,
            "failed_inspections": failed_inspections,
            "open_defects": open_defects,
            "critical_defects": critical_defects,
            "average_compliance_score": round(avg_compliance, 2),
            "total_cost_impact": round(total_cost, 2)
        }
        
    except Exception as e:
        logger.error(f"Error getting quality dashboard stats: {str(e)}")
        return {}

def get_recent_quality_checks(db: Session, tenant_id: str, limit: int = 5) -> List[QualityCheck]:
    """Get recent quality checks"""
    try:
        return db.query(QualityCheck).filter(
            QualityCheck.tenant_id == tenant_id
        ).order_by(desc(QualityCheck.created_at)).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting recent quality checks: {str(e)}")
        return []

def get_upcoming_quality_checks(db: Session, tenant_id: str, limit: int = 5) -> List[QualityCheck]:
    """Get upcoming quality checks"""
    try:
        today = datetime.utcnow().date()
        return db.query(QualityCheck).filter(
            and_(
                QualityCheck.tenant_id == tenant_id,
                QualityCheck.scheduled_date >= today,
                QualityCheck.status == QualityStatus.PENDING
            )
        ).order_by(asc(QualityCheck.scheduled_date)).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting upcoming quality checks: {str(e)}")
        return []

def get_critical_defects(db: Session, tenant_id: str, limit: int = 5) -> List[QualityDefect]:
    """Get critical defects"""
    try:
        return db.query(QualityDefect).filter(
            and_(
                QualityDefect.tenant_id == tenant_id,
                QualityDefect.severity.in_([DefectSeverity.CRITICAL, DefectSeverity.BLOCKER])
            )
        ).order_by(desc(QualityDefect.detected_date)).limit(limit).all()
    except Exception as e:
        logger.error(f"Error getting critical defects: {str(e)}")
        return []
