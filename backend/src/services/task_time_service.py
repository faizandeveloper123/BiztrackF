from datetime import datetime
from typing import Any, Dict, Optional, Tuple

from sqlalchemy.orm import Session

from ..config.hrm_models import TimeEntry as DBTimeEntry
from ..models.projects import Task as DBTask
from .email_service import EmailService


def duration_to_seconds(hours: int = 0, minutes: int = 0, seconds: int = 0) -> int:
    return max(0, int(hours or 0)) * 3600 + max(0, int(minutes or 0)) * 60 + max(0, int(seconds or 0))


def seconds_to_duration(total_seconds: Optional[int]) -> Tuple[int, int, int]:
    if not total_seconds or total_seconds <= 0:
        return 0, 0, 0
    total = int(total_seconds)
    hours = total // 3600
    minutes = (total % 3600) // 60
    seconds = total % 60
    return hours, minutes, seconds


def format_duration_hms(total_seconds: Optional[int]) -> str:
    hours, minutes, seconds = seconds_to_duration(total_seconds)
    return f"{hours}h {minutes}m {seconds}s"


def resolve_estimated_duration_seconds(task: DBTask) -> Optional[int]:
    if task.estimatedDurationSeconds and task.estimatedDurationSeconds > 0:
        return int(task.estimatedDurationSeconds)
    if task.estimatedHours and task.estimatedHours > 0:
        return int(round(float(task.estimatedHours) * 3600))
    return None


def normalize_task_duration_fields(task_dict: dict) -> dict:
    data = dict(task_dict)
    hours = data.pop("estimatedHours", None)
    minutes = data.pop("estimatedMinutes", None)
    seconds = data.pop("estimatedSeconds", None)
    reminder_hours = data.pop("reminderHours", None)
    reminder_minutes = data.pop("reminderMinutes", None)
    reminder_seconds = data.pop("reminderSeconds", None)

    if hours is not None or minutes is not None or seconds is not None:
        if minutes is None and seconds is None and hours is not None:
            try:
                fractional_hours = float(hours)
                total = int(round(fractional_hours * 3600))
            except (TypeError, ValueError):
                total = 0
        else:
            total = duration_to_seconds(
                int(hours or 0),
                int(minutes or 0),
                int(seconds or 0),
            )
        data["estimatedDurationSeconds"] = total if total > 0 else None
        data["estimatedHours"] = round(total / 3600, 4) if total > 0 else None

    if (
        reminder_hours is not None
        or reminder_minutes is not None
        or reminder_seconds is not None
    ):
        reminder_total = duration_to_seconds(
            int(reminder_hours or 0),
            int(reminder_minutes or 0),
            int(reminder_seconds or 0),
        )
        data["reminderThresholdSeconds"] = reminder_total if reminder_total > 0 else None

    if data.get("estimatedDurationSeconds") or data.get("reminderThresholdSeconds"):
        data["timeReminderSentAt"] = None

    for key in (
        "estimatedMinutes",
        "estimatedSeconds",
        "reminderHours",
        "reminderMinutes",
        "reminderSeconds",
    ):
        data.pop(key, None)

    return data


def get_task_time_tracking(db: Session, task_id: str, tenant_id: str) -> Dict[str, Any]:
    entries = (
        db.query(DBTimeEntry)
        .filter(
            DBTimeEntry.taskId == task_id,
            DBTimeEntry.tenant_id == tenant_id,
        )
        .all()
    )

    tracked_seconds = 0
    active_timer_started_at = None

    for entry in entries:
        if entry.endTime and entry.hours:
            tracked_seconds += int(round(float(entry.hours) * 3600))
        elif entry.startTime and not entry.endTime:
            elapsed = max(0, int((datetime.utcnow() - entry.startTime).total_seconds()))
            tracked_seconds += elapsed
            active_timer_started_at = entry.startTime.isoformat()

    return {
        "trackedSeconds": tracked_seconds,
        "activeTimerStartedAt": active_timer_started_at,
        "isTimerActive": active_timer_started_at is not None,
    }


def build_task_time_fields(db: Session, task: DBTask) -> Dict[str, Any]:
    tracking = get_task_time_tracking(db, str(task.id), str(task.tenant_id))
    estimated_seconds = resolve_estimated_duration_seconds(task)
    est_h, est_m, est_s = seconds_to_duration(estimated_seconds)
    rem_h, rem_m, rem_s = seconds_to_duration(task.reminderThresholdSeconds)

    remaining_seconds = None
    is_time_low = False
    if estimated_seconds and estimated_seconds > 0:
        remaining_seconds = max(0, estimated_seconds - tracking["trackedSeconds"])
        threshold = task.reminderThresholdSeconds or 0
        is_time_low = threshold > 0 and remaining_seconds <= threshold

    return {
        "estimatedDurationSeconds": estimated_seconds,
        "estimatedHours": est_h,
        "estimatedMinutes": est_m,
        "estimatedSeconds": est_s,
        "reminderHours": rem_h,
        "reminderMinutes": rem_m,
        "reminderSeconds": rem_s,
        "remainingSeconds": remaining_seconds,
        "isTimeLow": is_time_low,
        **tracking,
    }


def sync_task_actual_hours(db: Session, task: DBTask) -> None:
    tracking = get_task_time_tracking(db, str(task.id), str(task.tenant_id))
    task.actualHours = round(tracking["trackedSeconds"] / 3600, 4)
    task.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(task)


def check_and_send_task_time_reminder(db: Session, task: DBTask) -> bool:
    if not task.assignedToId or not task.assignedTo or not task.assignedTo.email:
        return False
    if task.status and getattr(task.status, "value", str(task.status)) == "completed":
        return False

    estimated_seconds = resolve_estimated_duration_seconds(task)
    threshold = task.reminderThresholdSeconds or 0
    if not estimated_seconds or threshold <= 0:
        return False

    tracking = get_task_time_tracking(db, str(task.id), str(task.tenant_id))
    remaining_seconds = max(0, estimated_seconds - tracking["trackedSeconds"])
    if remaining_seconds > threshold:
        return False
    if task.timeReminderSentAt:
        return False

    assignee_name = (
        f"{task.assignedTo.firstName or ''} {task.assignedTo.lastName or ''}".strip()
        or task.assignedTo.userName
        or "there"
    )
    email_service = EmailService()
    sent = email_service.send_task_time_reminder_email(
        to_email=task.assignedTo.email,
        assignee_name=assignee_name,
        task_title=task.title,
        remaining_time=format_duration_hms(remaining_seconds),
        estimated_time=format_duration_hms(estimated_seconds),
        tracked_time=format_duration_hms(tracking["trackedSeconds"]),
    )
    if sent:
        task.timeReminderSentAt = datetime.utcnow()
        db.commit()
        db.refresh(task)
    return sent


def process_task_time_reminders_for_tasks(db: Session, tasks: list[DBTask]) -> None:
    for task in tasks:
        try:
            check_and_send_task_time_reminder(db, task)
        except Exception:
            continue
