from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import logging

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission
from ...config.quality_control_crud import (
    create_quality_check, get_quality_check_by_id, get_all_quality_checks,
    get_quality_checks_by_status, get_quality_checks_by_priority,
    get_quality_checks_by_inspection_type, get_quality_checks_by_assigned_user,
    update_quality_check, delete_quality_check, get_next_quality_check_number,
    create_quality_inspection, get_quality_inspection_by_id,
    get_quality_inspections_by_check, get_quality_inspections_by_inspector,
    get_all_quality_inspections,
    update_quality_inspection, delete_quality_inspection,
    create_quality_defect, get_quality_defect_by_id,
    get_quality_defects_by_severity, get_quality_defects_by_status,
    get_all_quality_defects,
    update_quality_defect, delete_quality_defect,
    create_quality_report, get_quality_report_by_id,
    get_quality_reports_by_type, get_all_quality_reports,
    update_quality_report, delete_quality_report,
    get_quality_dashboard_stats, get_recent_quality_checks,
    get_upcoming_quality_checks, get_critical_defects
)
from ...config.quality_control_models import (
    QualityCheck, QualityInspection, QualityStatus
)
from ...models.quality_control import (
    QualityCheckCreate, QualityCheckUpdate, QualityCheckResponse, QualityChecksResponse,
    QualityInspectionCreate, QualityInspectionUpdate, QualityInspectionResponse, QualityInspectionsResponse,
    QualityDefectCreate, QualityDefectUpdate, QualityDefectResponse, QualityDefectsResponse,
    QualityReportCreate, QualityReportUpdate, QualityReportResponse, QualityReportsResponse,
    QualityDashboard, QualityCheckFilters, QualityInspectionFilters, QualityDefectFilters
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quality-control", tags=["Quality Control"])


def _user_name(user) -> Optional[str]:
    """Best-effort display name for a user object (relationship-loaded)."""
    if not user:
        return None
    return user.firstName or user.userName or user.email


def _inspection_counts(db: Session, check_ids: List[str]) -> Dict[str, dict]:
    """Aggregated inspection counts for a batch of quality checks."""
    result = {
        cid: {"total": 0, "passed": 0, "failed": 0, "pending": 0, "in_progress": 0}
        for cid in check_ids
    }
    if not check_ids:
        return result

    rows = (
        db.query(
            QualityInspection.quality_check_id,
            QualityInspection.status,
            func.count(QualityInspection.id),
        )
        .filter(QualityInspection.quality_check_id.in_(check_ids))
        .group_by(QualityInspection.quality_check_id, QualityInspection.status)
        .all()
    )
    for check_id, status, count in rows:
        key = str(check_id)
        if key not in result:
            result[key] = {"total": 0, "passed": 0, "failed": 0, "pending": 0, "in_progress": 0}
        entry = result[key]
        entry["total"] += count
        if status == QualityStatus.PASSED:
            entry["passed"] += count
        elif status == QualityStatus.FAILED:
            entry["failed"] += count
        elif status == QualityStatus.PENDING:
            entry["pending"] += count
        elif status == QualityStatus.IN_PROGRESS:
            entry["in_progress"] += count
        else:
            entry["pending"] += count
    return result


def _check_to_dict(check, counts: dict) -> dict:
    c = counts.get(str(check.id), {"total": 0, "passed": 0, "failed": 0, "pending": 0, "in_progress": 0})
    return {
        "id": str(check.id),
        "tenant_id": str(check.tenant_id),
        "title": check.title,
        "description": check.description,
        "inspection_type": check.inspection_type,
        "priority": check.priority,
        "quality_standard": check.quality_standard,
        "criteria": check.criteria or [],
        "acceptance_criteria": check.acceptance_criteria or {},
        "tolerance_limits": check.tolerance_limits or {},
        "required_equipment": check.required_equipment or [],
        "required_skills": check.required_skills or [],
        "estimated_duration_minutes": check.estimated_duration_minutes or 0,
        "project_id": str(check.project_id) if check.project_id else None,
        "assigned_to_id": str(check.assigned_to_id) if check.assigned_to_id else None,
        "scheduled_date": check.scheduled_date,
        "tags": check.tags or [],
        "created_by_id": str(check.created_by_id),
        "created_at": check.created_at,
        "updated_at": check.updated_at,
        "status": check.status,
        "completion_percentage": check.completion_percentage or 0.0,
        "total_inspections": c["total"],
        "passed_inspections": c["passed"],
        "failed_inspections": c["failed"],
        "pending_inspections": c["pending"],
    }


def _inspection_to_dict(inspection) -> dict:
    return {
        "id": str(inspection.id),
        "tenant_id": str(inspection.tenant_id),
        "quality_check_id": str(inspection.quality_check_id),
        "inspector_id": str(inspection.inspector_id),
        "inspection_date": inspection.inspection_date,
        "status": inspection.status,
        "results": inspection.results or {},
        "measurements": inspection.measurements or {},
        "defects_found": inspection.defects_found or [],
        "corrective_actions": inspection.corrective_actions or [],
        "notes": inspection.notes,
        "photos": inspection.photos or [],
        "documents": inspection.documents or [],
        "compliance_score": inspection.compliance_score or 0.0,
        "created_at": inspection.created_at,
        "updated_at": inspection.updated_at,
        "inspector_name": _user_name(getattr(inspection, "inspector", None)),
        "quality_check_title": (
            inspection.quality_check.title if getattr(inspection, "quality_check", None) else None
        ),
    }


def _defect_to_dict(defect) -> dict:
    return {
        "id": str(defect.id),
        "tenant_id": str(defect.tenant_id),
        "defect_number": defect.defect_number,
        "title": defect.title,
        "description": defect.description,
        "severity": defect.severity,
        "category": defect.category,
        "location": defect.location,
        "detected_date": defect.detected_date,
        "detected_by_id": str(defect.detected_by_id),
        "quality_check_id": str(defect.quality_check_id) if defect.quality_check_id else None,
        "project_id": str(defect.project_id) if defect.project_id else None,
        "status": defect.status,
        "priority": defect.priority,
        "assigned_to_id": str(defect.assigned_to_id) if defect.assigned_to_id else None,
        "estimated_resolution_date": defect.estimated_resolution_date,
        "actual_resolution_date": defect.actual_resolution_date,
        "resolution_notes": defect.resolution_notes,
        "cost_impact": defect.cost_impact or 0.0,
        "tags": defect.tags or [],
        "created_at": defect.created_at,
        "updated_at": defect.updated_at,
        "detected_by_name": _user_name(getattr(defect, "detected_by", None)),
        "assigned_to_name": _user_name(getattr(defect, "assigned_to", None)),
    }


def _report_to_dict(report) -> dict:
    return {
        "id": str(report.id),
        "tenant_id": str(report.tenant_id),
        "report_number": report.report_number,
        "title": report.title,
        "report_type": report.report_type,
        "period_start": report.period_start,
        "period_end": report.period_end,
        "summary": report.summary,
        "key_findings": report.key_findings or [],
        "recommendations": report.recommendations or [],
        "metrics": report.metrics or {},
        "generated_by_id": str(report.generated_by_id),
        "tags": report.tags or [],
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "generated_by_name": _user_name(getattr(report, "generated_by", None)),
    }

# Quality Check endpoints
@router.get("/checks", response_model=List[QualityCheckResponse])
async def get_quality_checks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    inspection_type: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    scheduled_date_from: Optional[datetime] = Query(None),
    scheduled_date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get all quality checks with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if status_filter:
            quality_checks = get_quality_checks_by_status(status_filter, db, tenant_id, skip, limit)
        elif priority:
            quality_checks = get_quality_checks_by_priority(priority, db, tenant_id, skip, limit)
        elif inspection_type:
            quality_checks = get_quality_checks_by_inspection_type(inspection_type, db, tenant_id, skip, limit)
        elif assigned_to_id:
            quality_checks = get_quality_checks_by_assigned_user(assigned_to_id, db, tenant_id, skip, limit)
        else:
            quality_checks = get_all_quality_checks(db, tenant_id, skip, limit)
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            quality_checks = [
                check for check in quality_checks
                if search_lower in check.title.lower() or 
                   (check.description and search_lower in check.description.lower()) or
                   search_lower in check.check_number.lower()
            ]
        
        counts = _inspection_counts(db, [str(c.id) for c in quality_checks])
        return [_check_to_dict(check, counts) for check in quality_checks]
    except Exception as e:
        logger.error(f"Error getting quality checks: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality checks")

@router.get("/checks/{check_id}", response_model=QualityCheckResponse)
async def get_quality_check(
    check_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get quality check by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        quality_check = get_quality_check_by_id(db, check_id, tenant_id)
        if not quality_check:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality check not found")
        
        counts = _inspection_counts(db, [str(quality_check.id)])
        return _check_to_dict(quality_check, counts)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality check {check_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality check")

@router.post("/checks", response_model=QualityCheckResponse)
async def create_quality_check_endpoint(
    check_data: QualityCheckCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_CREATE.value))
):
    """Create a new quality check"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        check_dict = check_data.dict()
        
        quality_check = create_quality_check(db, check_dict, tenant_id, current_user.id)
        counts = _inspection_counts(db, [str(quality_check.id)])
        return _check_to_dict(quality_check, counts)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality check: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality check")

@router.put("/checks/{check_id}", response_model=QualityCheckResponse)
async def update_quality_check_endpoint(
    check_id: str,
    check_data: QualityCheckUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_UPDATE.value))
):
    """Update quality check"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in check_data.dict().items() if v is not None}
        
        quality_check = update_quality_check(db, check_id, update_dict, tenant_id)
        if not quality_check:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality check not found")
        
        counts = _inspection_counts(db, [str(quality_check.id)])
        return _check_to_dict(quality_check, counts)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality check {check_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality check")

@router.delete("/checks/{check_id}")
async def delete_quality_check_endpoint(
    check_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_DELETE.value))
):
    """Delete quality check"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_check(db, check_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality check not found")
        
        return {"message": "Quality check deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality check {check_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality check")

# Quality Inspection endpoints
@router.get("/inspections", response_model=List[QualityInspectionResponse])
async def get_quality_inspections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None),
    inspector_id: Optional[str] = Query(None),
    quality_check_id: Optional[str] = Query(None),
    inspection_date_from: Optional[datetime] = Query(None),
    inspection_date_to: Optional[datetime] = Query(None),
    compliance_score_min: Optional[float] = Query(None),
    compliance_score_max: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get all quality inspections with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if quality_check_id:
            inspections = get_quality_inspections_by_check(quality_check_id, db, tenant_id, skip, limit)
        elif inspector_id:
            inspections = get_quality_inspections_by_inspector(inspector_id, db, tenant_id, skip, limit)
        else:
            inspections = get_all_quality_inspections(db, tenant_id, skip, limit)
        
        if search:
            search_lower = search.lower()
            inspections = [
                i for i in inspections
                if search_lower in (i.quality_check.title or "").lower()
                or search_lower in (_user_name(getattr(i, "inspector", None)) or "").lower()
            ]
        
        return [_inspection_to_dict(i) for i in inspections]
    except Exception as e:
        logger.error(f"Error getting quality inspections: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality inspections")

@router.get("/inspections/{inspection_id}", response_model=QualityInspectionResponse)
async def get_quality_inspection(
    inspection_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get quality inspection by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        inspection = get_quality_inspection_by_id(db, inspection_id, tenant_id)
        if not inspection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality inspection not found")
        
        return _inspection_to_dict(inspection)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality inspection")

@router.post("/inspections", response_model=QualityInspectionResponse)
async def create_quality_inspection_endpoint(
    inspection_data: QualityInspectionCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_CREATE.value))
):
    """Create a new quality inspection"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        inspection_dict = inspection_data.dict()
        
        inspection = create_quality_inspection(db, inspection_dict, tenant_id)
        return _inspection_to_dict(inspection)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality inspection: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality inspection")

@router.put("/inspections/{inspection_id}", response_model=QualityInspectionResponse)
async def update_quality_inspection_endpoint(
    inspection_id: str,
    inspection_data: QualityInspectionUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_UPDATE.value))
):
    """Update quality inspection"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in inspection_data.dict().items() if v is not None}
        
        inspection = update_quality_inspection(db, inspection_id, update_dict, tenant_id)
        if not inspection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality inspection not found")
        
        return _inspection_to_dict(inspection)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality inspection")

@router.delete("/inspections/{inspection_id}")
async def delete_quality_inspection_endpoint(
    inspection_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_DELETE.value))
):
    """Delete quality inspection"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_inspection(db, inspection_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality inspection not found")
        
        return {"message": "Quality inspection deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality inspection")

# Quality Defect endpoints
@router.get("/defects", response_model=List[QualityDefectResponse])
async def get_quality_defects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    detected_date_from: Optional[datetime] = Query(None),
    detected_date_to: Optional[datetime] = Query(None),
    cost_impact_min: Optional[float] = Query(None),
    cost_impact_max: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get all quality defects with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if severity:
            defects = get_quality_defects_by_severity(severity, db, tenant_id, skip, limit)
        elif status_filter:
            defects = get_quality_defects_by_status(status_filter, db, tenant_id, skip, limit)
        else:
            defects = get_all_quality_defects(db, tenant_id, skip, limit)
        
        if search:
            search_lower = search.lower()
            defects = [
                d for d in defects
                if search_lower in d.title.lower()
                or search_lower in (d.description or "").lower()
                or search_lower in d.defect_number.lower()
            ]
        
        return [_defect_to_dict(d) for d in defects]
    except Exception as e:
        logger.error(f"Error getting quality defects: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality defects")

@router.get("/defects/{defect_id}", response_model=QualityDefectResponse)
async def get_quality_defect(
    defect_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get quality defect by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        defect = get_quality_defect_by_id(db, defect_id, tenant_id)
        if not defect:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality defect not found")
        
        return _defect_to_dict(defect)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality defect {defect_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality defect")

@router.post("/defects", response_model=QualityDefectResponse)
async def create_quality_defect_endpoint(
    defect_data: QualityDefectCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_CREATE.value))
):
    """Create a new quality defect"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        defect_dict = defect_data.dict()
        
        defect = create_quality_defect(db, defect_dict, tenant_id)
        return _defect_to_dict(defect)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality defect: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality defect")

@router.put("/defects/{defect_id}", response_model=QualityDefectResponse)
async def update_quality_defect_endpoint(
    defect_id: str,
    defect_data: QualityDefectUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_UPDATE.value))
):
    """Update quality defect"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in defect_data.dict().items() if v is not None}
        
        defect = update_quality_defect(db, defect_id, update_dict, tenant_id)
        if not defect:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality defect not found")
        
        return _defect_to_dict(defect)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality defect {defect_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality defect")

@router.delete("/defects/{defect_id}")
async def delete_quality_defect_endpoint(
    defect_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_DELETE.value))
):
    """Delete quality defect"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_defect(db, defect_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality defect not found")
        
        return {"message": "Quality defect deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality defect {defect_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality defect")

# Quality Report endpoints
@router.get("/reports", response_model=List[QualityReportResponse])
async def get_quality_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    report_type: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get all quality reports with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if report_type:
            reports = get_quality_reports_by_type(report_type, db, tenant_id, skip, limit)
        else:
            reports = get_all_quality_reports(db, tenant_id, skip, limit)
        
        return [_report_to_dict(r) for r in reports]
    except Exception as e:
        logger.error(f"Error getting quality reports: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality reports")

@router.get("/reports/{report_id}", response_model=QualityReportResponse)
async def get_quality_report(
    report_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get quality report by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        report = get_quality_report_by_id(db, report_id, tenant_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality report not found")
        
        return _report_to_dict(report)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality report {report_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality report")

@router.post("/reports", response_model=QualityReportResponse)
async def create_quality_report_endpoint(
    report_data: QualityReportCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_CREATE.value))
):
    """Create a new quality report"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        report_dict = report_data.dict()
        
        report = create_quality_report(db, report_dict, tenant_id)
        return _report_to_dict(report)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality report: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality report")

@router.put("/reports/{report_id}", response_model=QualityReportResponse)
async def update_quality_report_endpoint(
    report_id: str,
    report_data: QualityReportUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_UPDATE.value))
):
    """Update quality report"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in report_data.dict().items() if v is not None}
        
        report = update_quality_report(db, report_id, update_dict, tenant_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality report not found")
        
        return _report_to_dict(report)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality report {report_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality report")

@router.delete("/reports/{report_id}")
async def delete_quality_report_endpoint(
    report_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_DELETE.value))
):
    """Delete quality report"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_report(db, report_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality report not found")
        
        return {"message": "Quality report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality report {report_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality report")

# Dashboard and Statistics endpoints
@router.get("/dashboard")
async def get_quality_dashboard(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get quality control dashboard data"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        stats = get_quality_dashboard_stats(db, tenant_id)
        recent_checks = get_recent_quality_checks(db, tenant_id, 5)
        upcoming_checks = get_upcoming_quality_checks(db, tenant_id, 5)
        critical_defects = get_critical_defects(db, tenant_id, 5)
        
        return {
            "stats": stats,
            "recent_checks": recent_checks,
            "upcoming_checks": upcoming_checks,
            "critical_defects": critical_defects
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality dashboard: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality dashboard")

@router.get("/stats")
async def get_quality_statistics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.QUALITY_VIEW.value))
):
    """Get quality control statistics"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        stats = get_quality_dashboard_stats(db, tenant_id)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality statistics: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality statistics")
