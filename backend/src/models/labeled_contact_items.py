from pydantic import BaseModel, Field, field_validator
from typing import Literal, List

ContactLabel = Literal["work", "personal", "other"]


class LabeledEmailItem(BaseModel):
    value: str
    label: ContactLabel = "personal"

    @field_validator("value", mode="before")
    @classmethod
    def strip_value(cls, v):
        if v is None:
            return ""
        return str(v).strip()


class LabeledPhoneItem(BaseModel):
    value: str
    label: ContactLabel = "work"

    @field_validator("value", mode="before")
    @classmethod
    def strip_value(cls, v):
        if v is None:
            return ""
        return str(v).strip()


def filter_nonempty_emails(items: List[LabeledEmailItem]) -> List[LabeledEmailItem]:
    return [x for x in items if x.value]


def filter_nonempty_phones(items: List[LabeledPhoneItem]) -> List[LabeledPhoneItem]:
    return [x for x in items if x.value]
