from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .....models.platform import Tenant as TenantModel, Subscription, Plan
from ..http_common import require_super_admin


async def get_all_subscriptions(
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        subscriptions = db.query(Subscription).join(TenantModel, Subscription.tenant_id == TenantModel.id).all()

        subscription_list = []
        status_counts = {
            'active': 0,
            'trial': 0,
            'cancelled': 0,
            'expired': 0,
            'inactive': 0,
        }

        for sub in subscriptions:
            tenant = db.query(TenantModel).filter(TenantModel.id == sub.tenant_id).first()
            plan = db.query(Plan).filter(Plan.id == sub.planId).first()

            status_lower = sub.status.lower()
            if status_lower in status_counts:
                status_counts[status_lower] += 1

            subscription_list.append({
                'id': str(sub.id),
                'tenant_id': str(sub.tenant_id),
                'tenant_name': tenant.name if tenant else None,
                'status': sub.status,
                'startDate': sub.startDate.isoformat() if sub.startDate else None,
                'endDate': sub.endDate.isoformat() if sub.endDate else None,
                'autoRenew': sub.autoRenew,
                'plan': {
                    'id': str(plan.id) if plan else None,
                    'name': plan.name if plan else 'Unknown',
                    'planType': plan.planType if plan else None,
                    'price': plan.price if plan else 0,
                    'billingCycle': plan.billingCycle if plan else None,
                } if plan else None,
                'stripe_customer_id': sub.stripe_customer_id,
                'stripe_subscription_id': sub.stripe_subscription_id,
            })

        stats = {
            'total': len(subscription_list),
            'active': status_counts['active'],
            'trial': status_counts['trial'],
            'cancelled': status_counts['cancelled'],
            'expired': status_counts['expired'],
            'inactive': status_counts['inactive'],
        }

        return {
            'subscriptions': subscription_list,
            'stats': stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching subscriptions: {str(e)}"
        )
