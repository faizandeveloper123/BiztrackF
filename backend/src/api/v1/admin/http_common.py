from fastapi import HTTPException, status

from .shared import is_super_admin


def require_super_admin(current_user):
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
