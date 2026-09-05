from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Header
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import stripe
import logging

from ...config.database import get_db, get_subscription_by_tenant, get_plan_by_id, update_subscription
from ...config.core_models import Subscription
from ...services.subscription_service import subscription_service
from ...services.stripe_service import stripe_service
from ...services.paypal_service import paypal_service
from ...api.dependencies import get_current_user, require_tenant_admin_or_super_admin
from ...core.audit import audit_logger, AuditEventType, AuditSeverity
from ...models.user_models import PlanUpgradeRequest, UsageSummary, PlanLimits
from ...models.common import SubscriptionStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def _apply_paypal_subscription_activation(
    db: Session,
    tenant_id: str,
    paypal_subscription_id: str,
) -> bool:
    subscription = get_subscription_by_tenant(tenant_id, db)
    if not subscription:
        logger.error("Subscription not found for tenant_id: %s", tenant_id)
        return False

    paypal_service.activate_subscription(paypal_subscription_id)
    paypal_subscription_data = paypal_service.get_subscription(paypal_subscription_id)
    paypal_status = (paypal_subscription_data or {}).get("status")

    if paypal_status not in {"active", "approved"}:
        logger.warning(
            "PayPal subscription %s not active yet (status=%s)",
            paypal_subscription_id,
            paypal_status,
        )
        return False

    subscription.payment_provider = "paypal"
    subscription.paypal_subscription_id = paypal_subscription_id
    subscription.status = SubscriptionStatus.ACTIVE.value
    subscription.startDate = datetime.utcnow()

    if paypal_subscription_data and paypal_subscription_data.get("current_period_end"):
        subscription.endDate = paypal_subscription_data["current_period_end"]
    else:
        subscription.endDate = datetime.utcnow() + timedelta(days=30)

    subscription.updatedAt = datetime.utcnow()
    db.commit()

    audit_logger.log_event(
        event_type=AuditEventType.SUBSCRIPTION_CHANGED,
        user_id=None,
        tenant_id=tenant_id,
        action="Subscription activated via PayPal",
        details={"paypal_subscription_id": paypal_subscription_id},
        severity=AuditSeverity.MEDIUM,
    )
    return True

@router.get("/usage")
async def get_usage_summary(
    tenant_id: str = Query(..., description="Tenant ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive usage summary for a tenant"""
    try:
        # Verify user has access to this tenant
        from ...api.dependencies import get_tenant_context
        tenant_context = await get_tenant_context(tenant_id)
        
        # Get usage summary
        usage_summary = await subscription_service.get_usage_summary(tenant_id)
        
        # Log the access
        audit_logger.log_event(
            event_type=AuditEventType.DATA_READ,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            resource_type="subscription_usage",
            action="Get usage summary",
            details={"tenant_id": tenant_id}
        )
        
        return usage_summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get usage summary: {str(e)}"
        )

@router.get("/limits")
async def get_plan_limits(
    tenant_id: str = Query(..., description="Tenant ID"),
    resource_type: str = Query(..., description="Resource type (users, projects, etc.)"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check plan limits for a specific resource type"""
    try:
        # Verify user has access to this tenant
        from ...api.dependencies import get_tenant_context
        tenant_context = await get_tenant_context(tenant_id)
        
        # Check plan limits
        limits_check = await subscription_service.check_plan_limits(
            tenant_id=tenant_id,
            resource_type=resource_type,
            action="check"
        )
        
        # Log the access
        audit_logger.log_event(
            event_type=AuditEventType.DATA_READ,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            resource_type="plan_limits",
            action=f"Check limits for {resource_type}",
            details={"resource_type": resource_type, "limits": limits_check}
        )
        
        return limits_check
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check plan limits: {str(e)}"
        )

@router.post("/upgrade")
async def upgrade_plan(
    upgrade_request: PlanUpgradeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade tenant to a new plan"""
    try:
        # Verify user has admin privileges for this tenant
        from ...api.dependencies import get_tenant_context, require_tenant_admin_or_super_admin
        await require_tenant_admin_or_super_admin(current_user, upgrade_request.tenant_id)
        
        # Perform plan upgrade
        upgrade_result = await subscription_service.upgrade_plan(
            tenant_id=upgrade_request.tenant_id,
            new_plan_id=upgrade_request.new_plan_id,
            user_id=str(current_user.id)
        )
        
        # Log the upgrade
        audit_logger.log_event(
            event_type=AuditEventType.PLAN_UPGRADED,
            user_id=str(current_user.id),
            tenant_id=upgrade_request.tenant_id,
            action="Plan upgrade",
            details={
                "old_plan_id": upgrade_request.old_plan_id,
                "new_plan_id": upgrade_request.new_plan_id,
                "upgrade_date": datetime.utcnow().isoformat()
            },
            severity=AuditSeverity.MEDIUM
        )
        
        return upgrade_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan upgrade failed: {str(e)}"
        )

@router.get("/validate")
async def validate_subscription_access(
    tenant_id: str = Query(..., description="Tenant ID"),
    feature: str = Query(..., description="Feature to validate access for"),
    action: str = Query("access", description="Action to validate"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate if tenant can access a specific feature"""
    try:
        # Verify user has access to this tenant
        from ...api.dependencies import get_tenant_context
        tenant_context = await get_tenant_context(tenant_id)
        
        # Validate subscription access
        access_validation = await subscription_service.validate_subscription_access(
            tenant_id=tenant_id,
            feature=feature,
            action=action
        )
        
        # Log the validation
        audit_logger.log_event(
            event_type=AuditEventType.DATA_READ,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            resource_type="subscription_validation",
            action=f"Validate access to {feature}",
            details={
                "feature": feature,
                "action": action,
                "access_granted": access_validation.get("access_granted", False)
            }
        )
        
        return access_validation
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription validation failed: {str(e)}"
        )

@router.get("/billing")
async def get_billing_info(
    tenant_id: str = Query(..., description="Tenant ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get billing information for a tenant"""
    try:
        # Verify user has access to this tenant
        from ...api.dependencies import get_tenant_context
        tenant_context = await get_tenant_context(tenant_id)
        
        # Get billing information from database
        from ...config.database import get_subscription_by_tenant, get_plan_by_id
        
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found for tenant"
            )
        
        plan = get_plan_by_id(str(subscription.planId), db)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Plan information not found"
            )
        
        # Calculate billing information
        billing_info = {
            "tenant_id": tenant_id,
            "subscription_id": str(subscription.id),
            "plan_name": plan.name,
            "plan_type": plan.planType,
            "monthly_price": plan.price,
            "billing_cycle": plan.billingCycle,
            "status": subscription.status,
            "start_date": subscription.startDate.isoformat() if subscription.startDate else None,
            "end_date": subscription.endDate.isoformat() if subscription.endDate else None,
            "auto_renew": subscription.autoRenew,
            "next_billing_date": None,  # Would be calculated based on billing cycle
            "features": plan.features or []
        }
        
        # Calculate next billing date
        if subscription.endDate and subscription.autoRenew:
            if plan.billingCycle == "monthly":
                next_billing = subscription.endDate + timedelta(days=30)
            elif plan.billingCycle == "yearly":
                next_billing = subscription.endDate + timedelta(days=365)
            else:
                next_billing = subscription.endDate
            
            billing_info["next_billing_date"] = next_billing.isoformat()
        
        # Log the access
        audit_logger.log_event(
            event_type=AuditEventType.DATA_READ,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            resource_type="billing_info",
            action="Get billing information",
            details={"tenant_id": tenant_id}
        )
        
        return billing_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get billing information: {str(e)}"
        )

@router.post("/cancel")
async def cancel_subscription(
    tenant_id: str = Query(..., description="Tenant ID"),
    reason: str = Query(..., description="Reason for cancellation"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel tenant subscription"""
    try:
        # Verify user has admin privileges for this tenant
        from ...api.dependencies import get_tenant_context, require_tenant_admin_or_super_admin
        await require_tenant_admin_or_super_admin(current_user, tenant_id)
        
        # Get subscription
        from ...config.database import get_subscription_by_tenant
        
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found for tenant"
            )
        
        if not subscription.stripe_subscription_id and not subscription.paypal_subscription_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription is not linked to a payment provider"
            )

        if subscription.payment_provider == "paypal" and subscription.paypal_subscription_id:
            provider_cancelled = paypal_service.cancel_subscription(
                subscription.paypal_subscription_id,
                reason=reason,
            )
        elif subscription.stripe_subscription_id:
            provider_cancelled = stripe_service.cancel_subscription(
                subscription.stripe_subscription_id,
                immediately=False,
            )
        else:
            provider_cancelled = False
        
        if not provider_cancelled:
            logger.warning(
                "Failed to cancel external subscription for tenant %s, but proceeding with database update",
                tenant_id,
            )
        
        subscription.status = SubscriptionStatus.CANCELLED.value
        subscription.autoRenew = False
        subscription.updatedAt = datetime.utcnow()
        
        db.commit()
        
        # Log the cancellation
        audit_logger.log_event(
            event_type=AuditEventType.SUBSCRIPTION_CHANGED,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            action="Subscription cancelled",
            details={
                "reason": reason,
                "cancellation_date": datetime.utcnow().isoformat(),
                "previous_status": subscription.status
            },
            severity=AuditSeverity.HIGH
        )
        
        return {
            "success": True,
            "message": "Subscription cancelled successfully",
            "cancellation_date": datetime.utcnow().isoformat(),
            "reason": reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription cancellation failed: {str(e)}"
        )

@router.post("/reactivate")
async def reactivate_subscription(
    tenant_id: str = Query(..., description="Tenant ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reactivate cancelled subscription"""
    try:
        # Verify user has admin privileges for this tenant
        from ...api.dependencies import get_tenant_context, require_tenant_admin_or_super_admin
        await require_tenant_admin_or_super_admin(current_user, tenant_id)
        
        # Get subscription
        from ...config.database import get_subscription_by_tenant
        
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found for tenant"
            )
        
        if subscription.status != "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription is not cancelled"
            )
        
        # Reactivate subscription
        subscription.status = "active"
        subscription.autoRenew = True
        subscription.updatedAt = datetime.utcnow()
        
        # Set new end date
        from ...config.database import get_plan_by_id
        plan = get_plan_by_id(str(subscription.planId), db)
        if plan and plan.billingCycle == "monthly":
            subscription.endDate = datetime.utcnow() + timedelta(days=30)
        elif plan and plan.billingCycle == "yearly":
            subscription.endDate = datetime.utcnow() + timedelta(days=365)
        
        db.commit()
        
        # Log the reactivation
        audit_logger.log_event(
            event_type=AuditEventType.SUBSCRIPTION_CHANGED,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            action="Subscription reactivated",
            details={
                "reactivation_date": datetime.utcnow().isoformat(),
                "new_end_date": subscription.endDate.isoformat() if subscription.endDate else None
            },
            severity=AuditSeverity.MEDIUM
        )
        
        return {
            "success": True,
            "message": "Subscription reactivated successfully",
            "reactivation_date": datetime.utcnow().isoformat(),
            "new_end_date": subscription.endDate.isoformat() if subscription.endDate else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription reactivation failed: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    event = stripe_service.verify_webhook(payload, sig_header)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature"
        )
    
    try:
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            tenant_id = session.get('metadata', {}).get('tenant_id')
            
            if not tenant_id:
                logger.warning("checkout.session.completed event missing tenant_id in metadata")
                return {"status": "success", "message": "No tenant_id in metadata"}
            
            subscription = get_subscription_by_tenant(tenant_id, db)
            if not subscription:
                logger.error(f"Subscription not found for tenant_id: {tenant_id}")
                return {"status": "error", "message": f"Subscription not found for tenant_id: {tenant_id}"}
            
            stripe_subscription_id = session.get('subscription')
            stripe_customer_id = session.get('customer')
            
            if not stripe_subscription_id:
                logger.error("checkout.session.completed event missing subscription ID")
                return {"status": "error", "message": "Missing subscription ID in checkout session"}
            
            stripe_subscription_data = stripe_service.get_subscription(stripe_subscription_id)
            
            subscription.stripe_customer_id = stripe_customer_id
            subscription.stripe_subscription_id = stripe_subscription_id
            subscription.payment_provider = "stripe"
            subscription.status = SubscriptionStatus.ACTIVE.value
            subscription.startDate = datetime.utcnow()
            
            if stripe_subscription_data and stripe_subscription_data.get('current_period_end'):
                subscription.endDate = stripe_subscription_data['current_period_end']
            else:
                subscription.endDate = datetime.utcnow() + timedelta(days=30)
                logger.warning(f"Using fallback 30-day period for subscription {stripe_subscription_id}")
            
            subscription.updatedAt = datetime.utcnow()
            
            db.commit()
            
            audit_logger.log_event(
                event_type=AuditEventType.SUBSCRIPTION_CHANGED,
                user_id=None,
                tenant_id=tenant_id,
                action="Subscription activated via Stripe",
                details={
                    "stripe_subscription_id": stripe_subscription_id,
                    "stripe_customer_id": stripe_customer_id
                },
                severity=AuditSeverity.MEDIUM
            )
        
        elif event['type'] == 'customer.subscription.updated':
            stripe_subscription = event['data']['object']
            stripe_subscription_id = stripe_subscription.get('id')
            
            if not stripe_subscription_id:
                logger.warning("customer.subscription.updated event missing subscription ID")
                return {"status": "success"}
            
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_subscription_id
            ).first()
            
            if not subscription:
                logger.warning(f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}")
                return {"status": "success", "message": f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}"}
            
            stripe_status = stripe_subscription.get('status')
            if stripe_status:
                status_mapping = {
                    'active': SubscriptionStatus.ACTIVE.value,
                    'canceled': SubscriptionStatus.CANCELLED.value,
                    'past_due': SubscriptionStatus.EXPIRED.value,
                    'unpaid': SubscriptionStatus.EXPIRED.value,
                    'trialing': SubscriptionStatus.TRIAL.value,
                }
                subscription.status = status_mapping.get(stripe_status, subscription.status)
            
            if stripe_subscription.get('current_period_end'):
                subscription.endDate = datetime.fromtimestamp(
                    stripe_subscription.get('current_period_end')
                )
            
            subscription.updatedAt = datetime.utcnow()
            db.commit()
        
        elif event['type'] == 'customer.subscription.deleted':
            stripe_subscription = event['data']['object']
            stripe_subscription_id = stripe_subscription.get('id')
            
            if not stripe_subscription_id:
                logger.warning("customer.subscription.deleted event missing subscription ID")
                return {"status": "success"}
            
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_subscription_id
            ).first()
            
            if not subscription:
                logger.warning(f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}")
                return {"status": "success", "message": f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}"}
            
            subscription.status = SubscriptionStatus.CANCELLED.value
            subscription.autoRenew = False
            subscription.updatedAt = datetime.utcnow()
            db.commit()
            
            audit_logger.log_event(
                event_type=AuditEventType.SUBSCRIPTION_CHANGED,
                user_id=None,
                tenant_id=str(subscription.tenant_id),
                action="Subscription cancelled via Stripe",
                details={
                    "stripe_subscription_id": stripe_subscription_id
                },
                severity=AuditSeverity.HIGH
            )
        
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            stripe_subscription_id = invoice.get('subscription')
            
            if not stripe_subscription_id:
                logger.warning("invoice.payment_succeeded event missing subscription ID")
                return {"status": "success"}
            
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_subscription_id
            ).first()
            
            if not subscription:
                logger.warning(f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}")
                return {"status": "success", "message": f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}"}
            
            subscription.status = SubscriptionStatus.ACTIVE.value
            if invoice.get('period_end'):
                subscription.endDate = datetime.fromtimestamp(invoice.get('period_end'))
            subscription.updatedAt = datetime.utcnow()
            db.commit()
        
        elif event['type'] == 'invoice.payment_failed':
            invoice = event['data']['object']
            stripe_subscription_id = invoice.get('subscription')
            
            if not stripe_subscription_id:
                logger.warning("invoice.payment_failed event missing subscription ID")
                return {"status": "success"}
            
            subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_subscription_id
            ).first()
            
            if not subscription:
                logger.warning(f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}")
                return {"status": "success", "message": f"Subscription not found for stripe_subscription_id: {stripe_subscription_id}"}
            
            subscription.status = SubscriptionStatus.EXPIRED.value
            subscription.updatedAt = datetime.utcnow()
            db.commit()
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )


@router.post("/paypal/confirm")
async def confirm_paypal_subscription(
    tenant_id: str = Query(..., description="Tenant ID"),
    subscription_id: str = Query(..., description="PayPal subscription ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found for tenant",
            )

        if subscription.paypal_subscription_id and subscription.paypal_subscription_id != subscription_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PayPal subscription ID does not match tenant subscription",
            )

        activated = _apply_paypal_subscription_activation(db, tenant_id, subscription_id)
        if not activated:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PayPal subscription is not active yet. Please wait a moment and try again.",
            )

        return {
            "success": True,
            "message": "PayPal subscription confirmed",
            "subscription": {
                "id": str(subscription.id),
                "status": subscription.status,
                "payment_provider": subscription.payment_provider,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("PayPal confirm failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PayPal confirmation failed: {str(e)}",
        )


@router.post("/paypal/webhook")
async def paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    event = paypal_service.verify_webhook(dict(request.headers), payload)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PayPal webhook",
        )

    try:
        event_type = event.get("event_type")
        resource = event.get("resource") or {}

        if event_type in {
            "BILLING.SUBSCRIPTION.ACTIVATED",
            "BILLING.SUBSCRIPTION.RE-ACTIVATED",
        }:
            paypal_subscription_id = resource.get("id")
            custom_id = resource.get("custom_id") or ""
            tenant_id = custom_id.split(":")[0] if custom_id else None

            if tenant_id and paypal_subscription_id:
                _apply_paypal_subscription_activation(db, tenant_id, paypal_subscription_id)

        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            paypal_subscription_id = resource.get("id")
            subscription = db.query(Subscription).filter(
                Subscription.paypal_subscription_id == paypal_subscription_id
            ).first()
            if subscription:
                subscription.status = SubscriptionStatus.CANCELLED.value
                subscription.autoRenew = False
                subscription.updatedAt = datetime.utcnow()
                db.commit()

        elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
            paypal_subscription_id = resource.get("id")
            subscription = db.query(Subscription).filter(
                Subscription.paypal_subscription_id == paypal_subscription_id
            ).first()
            if subscription:
                subscription.status = SubscriptionStatus.EXPIRED.value
                subscription.updatedAt = datetime.utcnow()
                db.commit()

        elif event_type == "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
            paypal_subscription_id = resource.get("billing_agreement_id") or resource.get("id")
            subscription = db.query(Subscription).filter(
                Subscription.paypal_subscription_id == paypal_subscription_id
            ).first()
            if subscription:
                subscription.status = SubscriptionStatus.EXPIRED.value
                subscription.updatedAt = datetime.utcnow()
                db.commit()

        return {"status": "success"}
    except Exception as e:
        logger.error("PayPal webhook processing failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PayPal webhook processing failed: {str(e)}",
        )

@router.post("/sync")
async def sync_subscription_status(
    tenant_id: str = Query(..., description="Tenant ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        from ...api.dependencies import require_tenant_admin_or_super_admin
        await require_tenant_admin_or_super_admin(current_user, tenant_id)
        
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found for tenant"
            )
        
        if subscription.payment_provider == "paypal" and subscription.paypal_subscription_id:
            paypal_subscription_data = paypal_service.get_subscription(subscription.paypal_subscription_id)
            if not paypal_subscription_data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve subscription from PayPal",
                )

            paypal_status = paypal_subscription_data.get("status")
            if paypal_status:
                status_mapping = {
                    "active": SubscriptionStatus.ACTIVE.value,
                    "cancelled": SubscriptionStatus.CANCELLED.value,
                    "suspended": SubscriptionStatus.EXPIRED.value,
                    "expired": SubscriptionStatus.EXPIRED.value,
                    "approved": SubscriptionStatus.ACTIVE.value,
                }
                subscription.status = status_mapping.get(paypal_status, subscription.status)

            if paypal_subscription_data.get("current_period_end"):
                subscription.endDate = paypal_subscription_data["current_period_end"]
        elif subscription.stripe_subscription_id:
            stripe_subscription_data = stripe_service.get_subscription(subscription.stripe_subscription_id)
            
            if not stripe_subscription_data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve subscription from Stripe"
                )
            
            stripe_status = stripe_subscription_data.get('status')
            if stripe_status:
                status_mapping = {
                    'active': SubscriptionStatus.ACTIVE.value,
                    'canceled': SubscriptionStatus.CANCELLED.value,
                    'past_due': SubscriptionStatus.EXPIRED.value,
                    'unpaid': SubscriptionStatus.EXPIRED.value,
                    'trialing': SubscriptionStatus.TRIAL.value,
                }
                subscription.status = status_mapping.get(stripe_status, subscription.status)
            
            if stripe_subscription_data.get('current_period_end'):
                subscription.endDate = stripe_subscription_data['current_period_end']
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subscription is not linked to a payment provider"
            )
        
        subscription.updatedAt = datetime.utcnow()
        db.commit()
        
        audit_logger.log_event(
            event_type=AuditEventType.SUBSCRIPTION_CHANGED,
            user_id=str(current_user.id),
            tenant_id=tenant_id,
            action="Subscription status synced from payment provider",
            details={
                "payment_provider": subscription.payment_provider,
                "stripe_subscription_id": subscription.stripe_subscription_id,
                "paypal_subscription_id": subscription.paypal_subscription_id,
                "new_status": subscription.status
            },
            severity=AuditSeverity.LOW
        )
        
        return {
            "success": True,
            "message": "Subscription status synced successfully",
            "subscription": {
                "id": str(subscription.id),
                "status": subscription.status,
                "end_date": subscription.endDate.isoformat() if subscription.endDate else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Subscription sync failed: {str(e)}"
        )
