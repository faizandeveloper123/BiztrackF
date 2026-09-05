from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .schemas import LoginCredentials, AuthResponse
from . import logic

router = APIRouter()


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginCredentials, db: Session = Depends(get_db)):
    return await logic.login(credentials, db)
