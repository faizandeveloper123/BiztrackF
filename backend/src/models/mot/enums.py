from enum import Enum


class MotBookingStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class MotTestType(str, Enum):
    STANDARD = "standard"
    RETEST = "retest"
    PRE_MOT = "pre_mot"
