from typing import Optional

from pydantic import BaseModel


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int


class LogoutResponse(BaseModel):
    message: str
