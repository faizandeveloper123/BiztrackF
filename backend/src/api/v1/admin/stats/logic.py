from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .....models.platform import Tenant as TenantModel, User, Subscription, Plan
from .....models.rbac import TenantUser
from ..http_common import require_super_admin


async def get_admin_stats(
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        total_tenants = db.query(TenantModel).count()
        active_tenants = db.query(TenantModel).filter(TenantModel.isActive == True).count()

        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.isActive == True).count()
        super_admins = db.query(User).filter(User.userRole == "super_admin").count()

        tenant_assigned_users = db.query(TenantUser).filter(TenantUser.isActive == True).count()
        active_tenant_users = db.query(TenantUser).filter(TenantUser.isActive == True).count()

        total_subscriptions = db.query(Subscription).count()
        active_subscriptions = db.query(Subscription).filter(Subscription.isActive == True).count()

        plan_stats = db.query(
            Plan.name,
            Plan.planType,
            func.count(Subscription.id).label('count')
        ).join(Subscription, Plan.id == Subscription.planId).group_by(
            Plan.name, Plan.planType
        ).all()

        plan_distribution = [
            {
                "planName": stat.name,
                "planType": stat.planType,
                "count": stat.count
            }
            for stat in plan_stats
        ]

        return {
            "tenants": {
                "total": total_tenants,
                "active": active_tenants,
                "inactive": total_tenants - active_tenants
            },
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": total_users - active_users,
                "superAdmins": super_admins,
                "tenantAssigned": tenant_assigned_users,
                "systemUsers": total_users - tenant_assigned_users
            },
            "subscriptions": {
                "total": total_subscriptions,
                "active": active_subscriptions,
                "inactive": total_subscriptions - active_subscriptions
            },
            "planDistribution": plan_distribution
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin stats: {str(e)}"
        )
