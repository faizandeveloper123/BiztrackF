from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from .notification_models import MobilePushDevice


def get_push_tokens_for_user(db: Session, user_id: str) -> List[str]:
    uid = uuid.UUID(str(user_id)) if user_id else None
    if not uid:
        return []
    rows = (
        db.query(MobilePushDevice.expo_push_token)
        .filter(MobilePushDevice.user_id == uid)
        .all()
    )
    return [r[0] for r in rows if r[0]]


def upsert_push_device(
    db: Session,
    user_id: str,
    expo_push_token: str,
    platform: Optional[str] = None,
) -> MobilePushDevice:
    uid = uuid.UUID(str(user_id))
    token = (expo_push_token or "").strip()
    if not token:
        raise ValueError("token required")

    existing = (
        db.query(MobilePushDevice)
        .filter(
            MobilePushDevice.user_id == uid,
            MobilePushDevice.expo_push_token == token,
        )
        .first()
    )
    now = datetime.utcnow()
    if existing:
        existing.platform = platform or existing.platform
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return existing

    row = MobilePushDevice(
        user_id=uid,
        expo_push_token=token,
        platform=platform,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_push_device(db: Session, user_id: str, expo_push_token: str) -> int:
    uid = uuid.UUID(str(user_id))
    token = (expo_push_token or "").strip()
    q = db.query(MobilePushDevice).filter(
        MobilePushDevice.user_id == uid,
        MobilePushDevice.expo_push_token == token,
    )
    n = q.delete(synchronize_session=False)
    db.commit()
    return n
