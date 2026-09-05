from fastapi import APIRouter, Depends, HTTPException, status
from ...api.dependencies import require_super_admin
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ...config.database import get_db, get_plans
from ...config.core_models import Plan
from ...models.user_models import PlansResponse, PlanUpdate

router = APIRouter(prefix="/plans", tags=["plans"])

@router.get("", response_model=PlansResponse, dependencies=[Depends(require_super_admin)])
async def get_available_plans(db: Session = Depends(get_db)):
    """Get all subscription plans (including inactive ones for admin)"""
    # Get ALL plans, not just active ones, for admin management
    plans = db.query(Plan).all()
    
    # Convert UUID id to string for each plan
    plans_out = []
    for plan in plans:
        plan_dict = plan.__dict__.copy()
        if isinstance(plan_dict.get('id'), (str, type(None))):
            pass
        else:
            plan_dict['id'] = str(plan_dict['id'])
        # Remove SQLAlchemy internal state if present
        plan_dict.pop('_sa_instance_state', None)
        plans_out.append(plan_dict)
    return PlansResponse(plans=plans_out)

@router.get("/debug", dependencies=[Depends(require_super_admin)])
async def debug_plans(db: Session = Depends(get_db)):
    """Debug endpoint to check all plans"""
    all_plans = db.query(Plan).all()
    active_plans = db.query(Plan).filter(Plan.isActive == True).all()
    inactive_plans = db.query(Plan).filter(Plan.isActive == False).all()
    
    return {
        "total_plans": len(all_plans),
        "active_plans": len(active_plans),
        "inactive_plans": len(inactive_plans),
        "all_plans": [
            {
                "id": str(plan.id),
                "name": plan.name,
                "isActive": plan.isActive
            } for plan in all_plans
        ]
    }

@router.put("/{plan_id}/activate", dependencies=[Depends(require_super_admin)])
async def activate_plan(plan_id: str, db: Session = Depends(get_db)):
    """Activate a subscription plan"""
    try:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found"
            )
        
        plan.isActive = True
        db.commit()
        
        return {"message": f"Plan '{plan.name}' has been activated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate plan: {str(e)}"
        )

@router.put("/{plan_id}/deactivate", dependencies=[Depends(require_super_admin)])
async def deactivate_plan(plan_id: str, db: Session = Depends(get_db)):
    """Deactivate a subscription plan"""
    try:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found"
            )
        
        plan.isActive = False
        db.commit()
        
        return {"message": f"Plan '{plan.name}' has been deactivated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate plan: {str(e)}"
        )

@router.put("/{plan_id}", dependencies=[Depends(require_super_admin)])
async def update_plan(plan_id: str, plan_update: PlanUpdate, db: Session = Depends(get_db)):
    """Update a subscription plan"""
    try:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found"
            )
        
        # Update fields if provided
        if plan_update.name is not None:
            plan.name = plan_update.name
        if plan_update.description is not None:
            plan.description = plan_update.description
        if plan_update.price is not None:
            plan.price = plan_update.price
        if plan_update.billingCycle is not None:
            plan.billingCycle = plan_update.billingCycle
        if plan_update.maxProjects is not None:
            plan.maxProjects = plan_update.maxProjects
        if plan_update.maxUsers is not None:
            plan.maxUsers = plan_update.maxUsers
        if plan_update.features is not None:
            plan.features = plan_update.features
        if plan_update.isActive is not None:
            plan.isActive = plan_update.isActive
        
        db.commit()
        
        return {"message": f"Plan '{plan.name}' has been updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update plan: {str(e)}"
        )