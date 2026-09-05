from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from ..users.schemas import UserResponse
from .schemas import RegisterRequest
from . import logic

router = APIRouter()


@router.post("/register", response_model=UserResponse)
async def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    return await logic.register(user_data, db)
