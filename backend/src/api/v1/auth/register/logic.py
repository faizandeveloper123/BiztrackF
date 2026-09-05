from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import get_user_by_email, get_user_by_username, create_user
from .....core.auth import get_password_hash
from ..users.schemas import UserResponse
from .schemas import RegisterRequest


async def register(user_data: RegisterRequest, db: Session):
    if get_user_by_email(user_data.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(user_data.userName, db):
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump()
    user_dict.pop('password')
    user_dict['hashedPassword'] = hashed_password

    try:
        db_user = create_user(user_dict, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return UserResponse(
        userId=str(db_user.id),
        userName=db_user.userName,
        email=db_user.email,
        firstName=db_user.firstName,
        lastName=db_user.lastName,
        userRole=db_user.userRole,
        avatar=db_user.avatar,
        permissions=[]
    )
