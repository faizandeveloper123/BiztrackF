import logging
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import (
    get_user_by_email,
    get_user_by_username,
    get_user_tenants,
    get_user_by_id,
    update_user,
)
from .....services.rbac_service import RBACService
from .schemas import UserUpdate, UserResponse

logger = logging.getLogger(__name__)


async def update_user_info(
    user_id: str,
    user_data: UserUpdate,
    db: Session,
    current_user,
    tenant_context: Optional[dict],
):
    logger.info(f"Update user request - User ID: {user_id}, Current User ID: {current_user.id}, Current User Role: {current_user.userRole}, Tenant Context: {tenant_context['tenant_id'] if tenant_context else 'None'}")

    user = get_user_by_id(user_id, db)
    if not user:
        logger.error(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"Target user found - User ID: {user.id}, User Role: {user.userRole}")

    if str(current_user.id) != user_id:
        logger.info(f"User is updating someone else - checking permissions")

        if tenant_context:
            user_tenants = get_user_tenants(str(user.id), db)
            user_tenant_ids = [str(tu.tenant_id) for tu in user_tenants]

            if tenant_context['tenant_id'] not in user_tenant_ids:
                logger.error(f"Tenant mismatch - Current tenant: {tenant_context['tenant_id']}, Target user tenants: {user_tenant_ids}")
                raise HTTPException(status_code=403, detail="Not authorized to update this user")

            logger.info(f"Same tenant confirmed - allowing update")
        else:
            if current_user.tenant_id != user.tenant_id:
                logger.error(f"Tenant mismatch - Current user tenant: {current_user.tenant_id}, Target user tenant: {user.tenant_id}")
                raise HTTPException(status_code=403, detail="Not authorized to update this user")

            logger.info(f"Same tenant confirmed - allowing update")
    else:
        logger.info(f"User is updating themselves - allowing update")

    if user_data.email and user_data.email.strip().lower() != (user.email or "").strip().lower():
        existing_user = get_user_by_email(user_data.email, db)
        if existing_user and str(existing_user.id) != user_id:
            raise HTTPException(status_code=400, detail="Email already registered")

    if user_data.userName and user_data.userName != user.userName:
        if tenant_context:
            if not RBACService.validate_username_uniqueness(db, user_data.userName, tenant_context["tenant_id"], exclude_user_id=user_id):
                raise HTTPException(status_code=400, detail="Username already taken in this tenant")
        else:
            existing_user = get_user_by_username(user_data.userName, db)
            if existing_user and str(existing_user.id) != user_id:
                raise HTTPException(status_code=400, detail="Username already taken")

    update_dict = user_data.model_dump(exclude_unset=True)
    logger.info(f"Updating user with data: {update_dict}")
    try:
        updated_user = update_user(user_id, update_dict, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if not updated_user:
        logger.error(f"Failed to update user: {user_id}")
        raise HTTPException(status_code=404, detail="User not found or could not be updated")

    logger.info(f"User updated successfully: {updated_user.id}")

    return UserResponse(
        userId=str(updated_user.id),
        userName=updated_user.userName,
        email=updated_user.email,
        firstName=updated_user.firstName,
        lastName=updated_user.lastName,
        userRole=updated_user.userRole,
        avatar=updated_user.avatar,
        permissions=[]
    )
