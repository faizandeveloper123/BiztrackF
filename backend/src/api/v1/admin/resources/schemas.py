from pydantic import BaseModel


class ResourceDeleteResponse(BaseModel):
    success: bool
    message: str
