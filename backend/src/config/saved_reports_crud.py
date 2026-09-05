from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from .saved_reports_models import SavedReport


def list_saved_reports(db: Session, tenant_id: str) -> List[SavedReport]:
    return (
        db.query(SavedReport)
        .filter(SavedReport.tenant_id == tenant_id)
        .order_by(desc(SavedReport.createdAt))
        .all()
    )


def get_saved_report(db: Session, report_id: str, tenant_id: str) -> Optional[SavedReport]:
    return (
        db.query(SavedReport)
        .filter(and_(SavedReport.id == report_id, SavedReport.tenant_id == tenant_id))
        .first()
    )


def create_saved_report(
    db: Session,
    tenant_id: str,
    user_id: Optional[str],
    title: str,
    file_type: str,
    file_url: str,
    s3_key: str,
    original_filename: Optional[str],
    file_size: Optional[int],
) -> SavedReport:
    row = SavedReport(
        tenant_id=tenant_id,
        title=title.strip(),
        file_type=file_type,
        file_url=file_url,
        s3_key=s3_key,
        original_filename=original_filename,
        file_size=file_size,
        created_by_id=user_id,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_saved_report_title(
    db: Session, report_id: str, tenant_id: str, title: str
) -> Optional[SavedReport]:
    row = get_saved_report(db, report_id, tenant_id)
    if not row:
        return None
    row.title = title.strip()
    row.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def delete_saved_report(db: Session, report_id: str, tenant_id: str) -> Optional[SavedReport]:
    row = get_saved_report(db, report_id, tenant_id)
    if not row:
        return None
    db.delete(row)
    db.commit()
    return row
