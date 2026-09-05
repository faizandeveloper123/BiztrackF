from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

from ..dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...models.user_models import User
from ...models.reports_models import (
    ReportsDashboard, ProjectMetrics, HRMMetrics,
    InventoryMetrics, FinancialMetrics, MonthlyTrend, DepartmentPerformance,
    ReportsFilters, SavedReportItem, SavedReportsListResponse, SavedReportTitleBody,
)
from ...config.reports_crud import (
    get_reports_dashboard_data,
    get_project_analytics, get_financial_analytics
)
from ...config.saved_reports_crud import (
    list_saved_reports,
    create_saved_report,
    get_saved_report,
    delete_saved_report,
    update_saved_report_title,
)
from ...services.s3_service import s3_service

SAVED_REPORT_MAX_BYTES = 10 * 1024 * 1024

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=ReportsDashboard)
def get_reports_dashboard(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get comprehensive reports dashboard data"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        dashboard_data = get_reports_dashboard_data(db, tenant_id, filters)
        
        return ReportsDashboard(**dashboard_data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Dashboard error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

@router.get("/projects/analytics")
def get_project_analytics_endpoint(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get detailed project analytics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        analytics_data = get_project_analytics(db, tenant_id, filters)
        return {"success": True, "data": analytics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project analytics: {str(e)}")

@router.get("/financial/analytics")
def get_financial_analytics_endpoint(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get detailed financial analytics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        analytics_data = get_financial_analytics(db, tenant_id, filters)
        return {"success": True, "data": analytics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get financial analytics: {str(e)}")

@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get quick summary statistics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        dashboard_data = get_reports_dashboard_data(db, tenant_id)
        
        # Extract key metrics for quick summary
        summary = {
            "total_projects": dashboard_data["projects"]["total_projects"],
            "active_projects": dashboard_data["projects"]["active_projects"],
            "total_employees": dashboard_data["hrm"]["total_employees"],
            "active_employees": dashboard_data["hrm"]["active_employees"],
            "total_revenue": dashboard_data["financial"]["total_revenue"],
            "net_profit": dashboard_data["financial"]["net_profit"],
            "total_stock_value": dashboard_data["inventory"]["total_stock_value"]
        }
        
        return {"success": True, "summary": summary}
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Summary error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")

@router.get("/export")
def export_reports(
    report_type: str = Query("dashboard"),
    format: str = Query("json"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Export reports data"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        if report_type == "dashboard":
            data = get_reports_dashboard_data(db, tenant_id)
        elif report_type == "projects":
            data = get_project_analytics(db, tenant_id, filters)
        elif report_type == "financial":
            data = get_financial_analytics(db, tenant_id, filters)
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")
        
        return {
            "success": True,
            "data": data,
            "exported_at": datetime.utcnow().isoformat(),
            "format": format,
            "report_type": report_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export reports: {str(e)}")


def _saved_report_file_type_and_ext(filename: Optional[str]) -> tuple[str, str]:
    if not filename:
        raise HTTPException(status_code=400, detail="Filename required")
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return "pdf", ext
    if ext == ".csv":
        return "csv", ext
    raise HTTPException(status_code=400, detail="Only PDF and CSV files are allowed")


@router.get("/saved", response_model=SavedReportsListResponse)
def list_saved_report_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    rows = list_saved_reports(db, tenant_id)
    return SavedReportsListResponse(
        reports=[SavedReportItem.model_validate(r) for r in rows]
    )


@router.post("/saved", response_model=SavedReportItem)
async def upload_saved_report_file(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    if not title or not str(title).strip():
        raise HTTPException(status_code=400, detail="Title is required")
    tenant_id = str(tenant_context["tenant_id"])
    file_type, _ext = _saved_report_file_type_and_ext(file.filename)
    content = await file.read()
    if len(content) > SAVED_REPORT_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {SAVED_REPORT_MAX_BYTES // (1024 * 1024)}MB)",
        )
    try:
        result = s3_service.upload_file(
            file_content=content,
            tenant_id=tenant_id,
            folder="reports",
            original_filename=file.filename or f"report.{file_type}",
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    uid = str(current_user.id) if getattr(current_user, "id", None) else None
    row = create_saved_report(
        db,
        tenant_id=tenant_id,
        user_id=uid,
        title=title.strip(),
        file_type=file_type,
        file_url=result["file_url"],
        s3_key=result["s3_key"],
        original_filename=result.get("original_filename") or file.filename,
        file_size=len(content),
    )
    return SavedReportItem.model_validate(row)


@router.patch("/saved/{report_id}", response_model=SavedReportItem)
def rename_saved_report(
    report_id: str,
    body: SavedReportTitleBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    row = update_saved_report_title(db, report_id, tenant_id, body.title)
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    return SavedReportItem.model_validate(row)


@router.delete("/saved/{report_id}")
def remove_saved_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
):
    tenant_id = str(tenant_context["tenant_id"])
    existing = get_saved_report(db, report_id, tenant_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")
    s3_service.delete_file(existing.s3_key)
    delete_saved_report(db, report_id, tenant_id)
    return {"success": True}
