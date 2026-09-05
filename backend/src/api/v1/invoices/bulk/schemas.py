from pydantic import BaseModel
from typing import List


class BulkOperationRequest(BaseModel):
    invoiceIds: List[str]


class BulkOperationResponse(BaseModel):
    message: str
    processed_count: int
    failed_count: int
    errors: List[str] = []
