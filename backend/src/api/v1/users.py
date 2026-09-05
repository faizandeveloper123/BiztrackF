from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from ...models.user_models import User, UserCreate, UserUpdate, UsersResponse
from ...config.database import (
    get_db, get_user_by_email, get_user_by_username,
    get_user_by_id, create_user, get_all_users, update_user
)
from ...config.core_models import TenantUser
from ...core.auth import get_password_hash
from ...api.dependencies import get_current_user, get_tenant_context, require_super_admin, require_tenant_admin_or_super_admin
from ...services.rbac_service import RBACService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=UsersResponse, dependencies=[Depends(require_tenant_admin_or_super_admin)])
async def get_users(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all users (tenant-scoped if tenant context provided)"""
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    users = get_all_users(db, tenant_id=tenant_id)
    user_list = []
    for user in users:
        user_list.append(User(
            userId=str(user.id),
            userName=user.userName,
            email=user.email,
            firstName=user.firstName,
            lastName=user.lastName,
            userRole=user.userRole,
            avatar=user.avatar,
            permissions=[]
        ))
    
    return UsersResponse(users=user_list)

@router.get("/{user_id}", response_model=User, dependencies=[Depends(require_tenant_admin_or_super_admin)])
async def get_user(
    user_id: str, 
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get a specific user"""
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check tenant access if tenant context is provided
    if tenant_context and str(user.tenant_id) != tenant_context["tenant_id"]:
        raise HTTPException(status_code=403, detail="Access denied to this user")
    
    return User(
        userId=str(user.id),
        userName=user.userName,
        email=user.email,
        firstName=user.firstName,
        lastName=user.lastName,
        userRole=user.userRole,
        avatar=user.avatar,
        permissions=[]
    )

@router.post("", response_model=User, dependencies=[Depends(require_super_admin)])
async def create_new_user(
    user_data: UserCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new user (admin only)"""
    # Check if current user is admin
    if current_user.userRole != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create users"
        )
    
    # Check if user already exists
    if get_user_by_email(user_data.email, db):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check username uniqueness - tenant-scoped if tenant context available, otherwise global
    if tenant_context:
        if not RBACService.validate_username_uniqueness(db, user_data.userName, tenant_context["tenant_id"]):
            raise HTTPException(status_code=400, detail="Username already taken in this tenant")
    else:
        if get_user_by_username(user_data.userName, db):
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop('password')
    user_dict['hashedPassword'] = hashed_password
    
    # Set tenant_id if tenant context is provided
    if tenant_context:
        user_dict['tenant_id'] = tenant_context["tenant_id"]
    
    try:
        db_user = create_user(user_dict, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    
    return User(
        userId=str(db_user.id),
        userName=db_user.userName,
        email=db_user.email,
        firstName=db_user.firstName,
        lastName=db_user.lastName,
        userRole=db_user.userRole,
        avatar=db_user.avatar,
        permissions=[]
    )

@router.put("/{user_id}", response_model=User, dependencies=[Depends(require_tenant_admin_or_super_admin)])
async def update_user_info(
    user_id: str,
    user_data: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Update user information"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Update user request - User ID: {user_id}, Current User ID: {current_user.id}, Current User Role: {current_user.userRole}, Tenant Context: {tenant_context['tenant_id'] if tenant_context else 'None'}")
    
    user = get_user_by_id(user_id, db)
    if not user:
        logger.error(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"Target user found - User ID: {user.id}, User Role: {user.userRole}")
    
    if str(current_user.id) != user_id:
        logger.info(f"User is updating someone else - checking permissions")
        
        if tenant_context:
            from ...config.database import get_user_tenants
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
    
    update_dict = user_data.dict(exclude_unset=True)
    logger.info(f"Updating user with data: {update_dict}")
    try:
        updated_user = update_user(user_id, update_dict, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found or could not be updated")
    logger.info(f"User updated successfully: {updated_user.id}")
    
    return User(
        userId=str(updated_user.id),
        userName=updated_user.userName,
        email=updated_user.email,
        firstName=updated_user.firstName,
        lastName=updated_user.lastName,
        userRole=updated_user.userRole,
        avatar=updated_user.avatar,
        permissions=[]
    )

@router.delete("/{user_id}", dependencies=[Depends(require_super_admin)])
async def delete_user(
    user_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Delete a user (admin only)"""
    # Check if current user is admin
    if current_user.userRole != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    # Check if user exists
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check tenant access if tenant context is provided
    if tenant_context and str(user.tenant_id) != tenant_context["tenant_id"]:
        raise HTTPException(status_code=403, detail="Access denied to this user")
    
    # Don't allow deleting self
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    tenant_users = db.query(TenantUser).filter(TenantUser.userId == user.id).all()
    for tenant_user in tenant_users:
        db.delete(tenant_user)
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}