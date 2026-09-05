import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..config.database import (
    get_db, get_tenant_by_id, get_subscription_by_tenant,
    get_tenant_users, get_all_projects, get_all_tasks,
    get_leads, get_contacts, get_companies, get_opportunities,
    get_sales_activities
    # get_all_events  # Temporarily disabled - events functionality not implemented
)
from ..core.audit import audit_logger, AuditEventType, AuditSeverity

logger = logging.getLogger(__name__)

class SubscriptionService:
    """Comprehensive subscription and billing service"""
    
    def __init__(self):
        self.usage_cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def validate_subscription_access(
        self,
        tenant_id: str,
        feature: str,
        action: str = "access"
    ) -> Dict[str, Any]:
        """Validate if tenant can access a feature based on their subscription"""
        try:
            # Get tenant context
            tenant_context = await self._get_tenant_context(tenant_id)
            
            # Check subscription status
            if not self._is_subscription_active(tenant_context):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Subscription is not active"
                )
            
            # Check feature access
            if not self._has_feature_access(tenant_context, feature):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Feature '{feature}' not available in your current plan"
                )
            
            # Check usage limits
            usage_info = await self._check_usage_limits(tenant_context, feature, action)
            
            # Log access attempt
            audit_logger.log_event(
                event_type=AuditEventType.DATA_READ,
                tenant_id=tenant_id,
                resource_type=feature,
                action=f"Feature access: {feature}",
                details={
                    "feature": feature,
                    "action": action,
                    "plan_type": tenant_context["plan_type"],
                    "usage": usage_info
                },
                severity=AuditSeverity.LOW
            )
            
            return {
                "access_granted": True,
                "tenant_context": tenant_context,
                "usage_info": usage_info
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Subscription validation failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Subscription validation failed"
            )
    
    async def check_plan_limits(
        self,
        tenant_id: str,
        resource_type: str,
        action: str = "create"
    ) -> Dict[str, Any]:
        """Check if an action would exceed plan limits"""
        try:
            tenant_context = await self._get_tenant_context(tenant_id)
            
            if not self._is_subscription_active(tenant_context):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Subscription is not active"
                )
            
            # Get current usage
            current_usage = await self._get_current_usage(tenant_id, resource_type)
            
            # Check limits based on plan
            limits = self._get_plan_limits(tenant_context, resource_type)
            
            # Determine if action is allowed
            can_proceed = True
            reason = None
            
            if action == "create":
                if limits.get("max_count") and current_usage["count"] >= limits["max_count"]:
                    can_proceed = False
                    reason = f"Maximum {resource_type} limit reached ({current_usage['count']}/{limits['max_count']})"
                
                if limits.get("max_storage_mb") and current_usage.get("storage_mb", 0) >= limits["max_storage_mb"]:
                    can_proceed = False
                    reason = f"Storage limit reached ({current_usage.get('storage_mb', 0)}/{limits['max_storage_mb']} MB)"
            
            return {
                "can_proceed": can_proceed,
                "reason": reason,
                "current_usage": current_usage,
                "limits": limits,
                "plan_type": tenant_context["plan_type"]
            }
            
        except Exception as e:
            logger.error(f"Plan limit check failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Plan limit check failed"
            )
    
    async def get_usage_summary(self, tenant_id: str) -> Dict[str, Any]:
        """Get comprehensive usage summary for a tenant"""
        try:
            tenant_context = await self._get_tenant_context(tenant_id)
            usage_data = {}
            
            # Check cache first
            cache_key = f"usage_{tenant_id}"
            if cache_key in self.usage_cache:
                cached_data = self.usage_cache[cache_key]
                if datetime.utcnow().timestamp() - cached_data["cached_at"] < self.cache_ttl:
                    return cached_data["data"]
            
            # Get usage for different resource types
            usage_data["users"] = await self._get_current_usage(tenant_id, "users")
            usage_data["projects"] = await self._get_current_usage(tenant_id, "projects")
            usage_data["tasks"] = await self._get_current_usage(tenant_id, "tasks")
            usage_data["crm_leads"] = await self._get_current_usage(tenant_id, "crm_leads")
            usage_data["crm_contacts"] = await self._get_current_usage(tenant_id, "crm_contacts")
            usage_data["crm_companies"] = await self._get_current_usage(tenant_id, "crm_companies")
            usage_data["crm_opportunities"] = await self._get_current_usage(tenant_id, "crm_opportunities")
            usage_data["events"] = await self._get_current_usage(tenant_id, "events")
            
            # Calculate total storage (estimate)
            usage_data["storage_mb"] = await self._estimate_storage_usage(tenant_id)
            
            # Get plan limits
            limits = {
                "max_users": tenant_context.get("max_users"),
                "max_projects": tenant_context.get("max_projects"),
                "features": tenant_context.get("features", []),
                "plan_type": tenant_context["plan_type"]
            }
            
            # Calculate usage percentages
            usage_percentages = {}
            for resource, usage in usage_data.items():
                if resource in limits and limits[resource]:
                    usage_percentages[resource] = (usage["count"] / limits[resource]) * 100
                else:
                    usage_percentages[resource] = 0
            
            summary = {
                "tenant_id": tenant_id,
                "plan_type": tenant_context["plan_type"],
                "subscription_status": tenant_context["subscription_status"],
                "trial_ends": tenant_context.get("trial_ends"),
                "usage": usage_data,
                "limits": limits,
                "usage_percentages": usage_percentages,
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # Cache the result
            self.usage_cache[cache_key] = {
                "data": summary,
                "cached_at": datetime.utcnow().timestamp()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Usage summary generation failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Usage summary generation failed"
            )
    
    async def upgrade_plan(
        self,
        tenant_id: str,
        new_plan_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Upgrade tenant to a new plan"""
        try:
            db = next(get_db())
            
            # Validate current subscription
            current_subscription = get_subscription_by_tenant(tenant_id, db)
            if not current_subscription:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No subscription found for tenant"
                )
            
            # Get new plan details
            from ..config.database import get_plan_by_id
            new_plan = get_plan_by_id(new_plan_id, db)
            if not new_plan:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="New plan not found"
                )
            
            # Check if upgrade is valid
            if not self._is_valid_upgrade(current_subscription.plan, new_plan):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid plan upgrade"
                )
            
            if current_subscription.stripe_subscription_id:
                from ..services.stripe_service import stripe_service
                stripe_updated = stripe_service.update_subscription_price(
                    current_subscription.stripe_subscription_id,
                    new_plan.price,
                    new_plan.name
                )
                if not stripe_updated:
                    logger.warning(f"Failed to update Stripe subscription {current_subscription.stripe_subscription_id}, but proceeding with database update")
            
            current_subscription.planId = new_plan.id
            current_subscription.stripe_price_id = None
            current_subscription.updatedAt = datetime.utcnow()
            
            if current_subscription.status == "trial":
                current_subscription.status = "active"
                current_subscription.startDate = datetime.utcnow()
                current_subscription.endDate = datetime.utcnow() + timedelta(days=30)
            
            db.commit()
            
            # Log the upgrade
            audit_logger.log_event(
                event_type=AuditEventType.PLAN_UPGRADED,
                user_id=user_id,
                tenant_id=tenant_id,
                action="Plan upgrade",
                details={
                    "old_plan": current_subscription.plan.name if current_subscription.plan else "Unknown",
                    "new_plan": new_plan.name,
                    "new_plan_type": new_plan.planType,
                    "upgrade_date": datetime.utcnow().isoformat()
                },
                severity=AuditSeverity.MEDIUM
            )
            
            # Clear usage cache
            cache_key = f"usage_{tenant_id}"
            if cache_key in self.usage_cache:
                del self.usage_cache[cache_key]
            
            return {
                "success": True,
                "message": f"Successfully upgraded to {new_plan.name} plan",
                "new_plan": {
                    "id": str(new_plan.id),
                    "name": new_plan.name,
                    "type": new_plan.planType,
                    "features": new_plan.features
                }
            }
            
        except Exception as e:
            logger.error(f"Plan upgrade failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Plan upgrade failed"
            )
        finally:
            if 'db' in locals():
                db.close()
    
    async def _get_tenant_context(self, tenant_id: str) -> Dict[str, Any]:
        """Get tenant context with subscription information"""
        db = next(get_db())
        
        try:
            tenant = get_tenant_by_id(tenant_id, db)
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found"
                )
            
            subscription = get_subscription_by_tenant(tenant_id, db)
            if not subscription:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No subscription found"
                )
            
            plan = subscription.plan
            if not plan:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Plan information not found"
                )
            
            return {
                "tenant_id": tenant_id,
                "tenant_name": tenant.name,
                "subscription_id": str(subscription.id),
                "plan_id": str(plan.id),
                "plan_type": plan.planType,
                "plan_name": plan.name,
                "max_projects": plan.maxProjects,
                "max_users": plan.maxUsers,
                "features": plan.features or [],
                "subscription_status": subscription.status,
                "trial_ends": subscription.endDate if subscription.status == "trial" else None
            }
            
        finally:
            db.close()
    
    def _is_subscription_active(self, tenant_context: Dict[str, Any]) -> bool:
        """Check if subscription is active"""
        status = tenant_context.get("subscription_status")
        return status in ["active", "trial"]
    
    def _has_feature_access(self, tenant_context: Dict[str, Any], feature: str) -> bool:
        """Check if tenant has access to a specific feature"""
        features = tenant_context.get("features", [])
        return feature in features or "*" in features
    
    async def _check_usage_limits(self, tenant_context: Dict[str, Any], feature: str, action: str) -> Dict[str, Any]:
        """Check usage limits for a specific feature"""
        # This would be implemented based on the specific feature
        # For now, return basic usage info
        return {
            "feature": feature,
            "action": action,
            "limits_applied": True
        }
    
    async def _get_current_usage(self, tenant_id: str, resource_type: str) -> Dict[str, Any]:
        """Get current usage for a specific resource type"""
        db = next(get_db())
        
        try:
            count = 0
            storage_mb = 0
            
            if resource_type == "users":
                count = len(get_tenant_users(tenant_id, db))
            elif resource_type == "projects":
                count = len(get_all_projects(db, tenant_id=tenant_id))
            elif resource_type == "tasks":
                count = len(get_all_tasks(db, tenant_id=tenant_id))
            elif resource_type == "crm_leads":
                count = len(get_leads(db, tenant_id=tenant_id))
            elif resource_type == "crm_contacts":
                count = len(get_contacts(db, tenant_id=tenant_id))
            elif resource_type == "crm_companies":
                count = len(get_companies(db, tenant_id=tenant_id))
            elif resource_type == "crm_opportunities":
                count = len(get_opportunities(db, tenant_id=tenant_id))
            elif resource_type == "events":
                # Temporarily disabled - events functionality not implemented
                count = 0
            
            return {
                "count": count,
                "storage_mb": storage_mb,
                "last_updated": datetime.utcnow().isoformat()
            }
            
        finally:
            db.close()
    
    def _get_plan_limits(self, tenant_context: Dict[str, Any], resource_type: str) -> Dict[str, Any]:
        """Get plan limits for a specific resource type"""
        limits = {}
        
        if resource_type == "users":
            limits["max_count"] = tenant_context.get("max_users")
        elif resource_type == "projects":
            limits["max_count"] = tenant_context.get("max_projects")
        elif resource_type == "storage":
            # Storage limits would be based on plan type
            plan_type = tenant_context.get("plan_type", "starter")
            if plan_type == "starter":
                limits["max_storage_mb"] = 1024  # 1GB
            elif plan_type == "professional":
                limits["max_storage_mb"] = 10240  # 10GB
            elif plan_type == "enterprise":
                limits["max_storage_mb"] = 102400  # 100GB
        
        return limits
    
    async def _estimate_storage_usage(self, tenant_id: str) -> float:
        """Estimate storage usage for a tenant (simplified)"""
        # This would calculate actual storage usage
        # For now, return a placeholder
        return 0.0
    
    def _is_valid_upgrade(self, current_plan, new_plan) -> bool:
        """Check if plan upgrade is valid"""
        # Simple validation - could be enhanced with business rules
        return True

# Global subscription service instance
subscription_service = SubscriptionService()
