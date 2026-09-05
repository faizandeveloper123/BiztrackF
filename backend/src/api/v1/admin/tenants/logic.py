from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .....models.platform import Tenant as TenantModel, User, Subscription, Plan
from .....models.rbac import TenantUser
from .....models.crm import Customer
from .....models.invoices import Invoice
from .....models.projects import Project
from ..http_common import require_super_admin
from .schemas import TenantStatusUpdate, TenantDeleteRequest, TenantStripeToggle


async def toggle_tenant_stripe(
    tenant_id: str,
    toggle_data: TenantStripeToggle,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )

        tenant.stripe_required = toggle_data.stripe_required
        tenant.updatedAt = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": (
                "Stripe/payment required. Users must pay to access."
                if toggle_data.stripe_required
                else "Testing mode enabled. Users can log in with just credentials (no Stripe)."
            ),
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "stripe_required": tenant.stripe_required,
                "isActive": tenant.isActive
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating tenant stripe setting: {str(e)}"
        )


async def get_all_tenants(
    skip: int,
    limit: int,
    search: Optional[str],
    is_active: Optional[bool],
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        query = db.query(TenantModel)

        if search:
            query = query.filter(
                TenantModel.name.ilike(f"%{search}%") |
                TenantModel.domain.ilike(f"%{search}%") |
                TenantModel.description.ilike(f"%{search}%")
            )

        if is_active is not None:
            query = query.filter(TenantModel.isActive == is_active)

        total = query.count()

        tenants = query.offset(skip).limit(limit).all()

        tenant_data = []
        for tenant in tenants:
            subscription = db.query(Subscription).filter(
                Subscription.tenant_id == tenant.id
            ).first()

            user_count = db.query(TenantUser).filter(
                TenantUser.tenant_id == tenant.id,
                TenantUser.isActive == True
            ).count()

            plan_info = None
            if subscription:
                plan = db.query(Plan).filter(Plan.id == subscription.planId).first()
                if plan:
                    plan_info = {
                        "id": str(plan.id),
                        "name": plan.name,
                        "planType": plan.planType,
                        "price": plan.price,
                        "billingCycle": plan.billingCycle
                    }

            tenant_data.append({
                "id": str(tenant.id),
                "name": tenant.name,
                "domain": tenant.domain,
                "description": tenant.description,
                "isActive": tenant.isActive,
                "stripe_required": getattr(tenant, "stripe_required", True),
                "createdAt": tenant.createdAt,
                "updatedAt": tenant.updatedAt,
                "settings": tenant.settings,
                "userCount": user_count,
                "subscription": {
                    "id": str(subscription.id) if subscription else None,
                    "isActive": subscription.isActive if subscription else False,
                "status": subscription.status if subscription else None,
                    "startDate": subscription.startDate if subscription else None,
                    "endDate": subscription.endDate if subscription else None,
                    "plan": plan_info
                } if subscription else None
            })

        return tenant_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tenants: {str(e)}"
        )


async def get_tenant_details(
    tenant_id: str,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )

        subscription = db.query(Subscription).filter(
            Subscription.tenant_id == tenant.id
        ).first()

        plan_info = None
        if subscription:
            plan = db.query(Plan).filter(Plan.id == subscription.planId).first()
            if plan:
                plan_info = {
                    "id": str(plan.id),
                    "name": plan.name,
                    "description": plan.description,
                    "planType": plan.planType,
                    "price": plan.price,
                    "billingCycle": plan.billingCycle,
                    "maxProjects": plan.maxProjects,
                    "maxUsers": plan.maxUsers,
                    "features": plan.features,
                    "modules": plan.modules if hasattr(plan, 'modules') else []
                }

        tenant_users = db.query(TenantUser).filter(
            TenantUser.tenant_id == tenant.id
        ).all()

        user_data = []
        for tenant_user in tenant_users:
            user = db.query(User).filter(User.id == tenant_user.userId).first()
            if user:
                user_data.append({
                    "id": str(user.id),
                    "userName": user.userName,
                    "email": user.email,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "userRole": user.userRole,
                    "isActive": user.isActive,
                    "createdAt": user.createdAt,
                    "lastLogin": user.lastLogin,
                    "tenantRole": tenant_user.role,
                    "tenantPermissions": tenant_user.permissions
                })

        stats = {
            "totalUsers": len(user_data),
            "activeUsers": len([u for u in user_data if u["isActive"]]),
            "totalProjects": 0,
            "totalCustomers": 0,
            "totalInvoices": 0,
            "storageUsed": 0,
            "lastActivity": tenant.updatedAt
        }

        return {
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "domain": tenant.domain,
                "description": tenant.description,
                "isActive": tenant.isActive,
                "stripe_required": getattr(tenant, "stripe_required", True),
                "createdAt": tenant.createdAt,
                "updatedAt": tenant.updatedAt,
                "settings": tenant.settings
            },
            "subscription": {
                "id": str(subscription.id) if subscription else None,
                "isActive": subscription.isActive if subscription else False,
                "status": subscription.status if subscription else None,
                "startDate": subscription.startDate if subscription else None,
                "endDate": subscription.endDate if subscription else None,
                "plan": plan_info
            } if subscription else None,
            "users": user_data,
            "statistics": stats
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tenant details: {str(e)}"
        )


async def update_tenant_status(
    tenant_id: str,
    status_data: TenantStatusUpdate,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )

        tenant.isActive = status_data.is_active
        tenant.updatedAt = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": f"Tenant {'activated' if status_data.is_active else 'deactivated'} successfully",
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "isActive": tenant.isActive
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating tenant status: {str(e)}"
        )


async def delete_tenant(
    tenant_id: str,
    delete_request: TenantDeleteRequest,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )

        tenant_name = tenant.name

        if delete_request.deleteAllData:
            try:
                tenant_users = db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id).all()
                user_ids = [str(tu.userId) for tu in tenant_users]

                db.execute(text("DELETE FROM tenant_users WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                db.commit()

                rbac_tables = ["roles", "custom_roles"]
                for table in rbac_tables:
                    try:
                        db.execute(text(f"DELETE FROM {table} WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                        db.commit()
                    except Exception as e:
                        print(f"Warning: Could not delete from {table}: {e}")
                        db.rollback()

                core_tables = [
                    "payments", "invoices", "projects", "customers", "leads",
                    "chart_of_accounts",
                    "journal_entries", "ledger_transactions", "financial_periods",
                    "budgets", "quality_checks", "audit_logs"
                ]

                for table in core_tables:
                    try:
                        db.execute(text(f"DELETE FROM {table} WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                        db.commit()
                    except Exception as e:
                        print(f"Warning: Could not delete from {table}: {e}")
                        db.rollback()
                        continue

                for user_id in user_ids:
                    try:
                        other_tenants_count = db.execute(
                            text("SELECT COUNT(*) FROM tenant_users WHERE \"userId\" = :user_id"),
                            {"user_id": user_id}
                        ).scalar()

                        if other_tenants_count == 0:
                            user_ref_tables = [
                                "chart_of_accounts", "journal_entries", "ledger_transactions",
                                "quality_checks", "financial_periods", "budgets"
                            ]

                            for table in user_ref_tables:
                                try:
                                    db.execute(text(f"DELETE FROM {table} WHERE created_by = :user_id"), {"user_id": user_id})
                                except Exception as e:
                                    print(f"Warning: Could not delete user references from {table}: {e}")

                            db.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
                            db.commit()
                    except Exception as e:
                        print(f"Warning: Could not delete user {user_id}: {e}")
                        db.rollback()
                        continue

                try:
                    db.execute(text("DELETE FROM subscriptions WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                    db.commit()
                except Exception as e:
                    print(f"Warning: Could not delete subscription: {e}")
                    db.rollback()

            except Exception as e:
                print(f"Error during tenant data deletion: {e}")
                db.rollback()

        db.query(TenantModel).filter(TenantModel.id == tenant_id).delete()
        db.commit()

        return {
            "success": True,
            "message": f"Tenant '{tenant_name}' {'and all its data' if delete_request.deleteAllData else ''} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting tenant: {str(e)}"
        )


async def get_tenant_complete_details(
    tenant_id: str,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )

        subscription = db.query(Subscription).filter(
            Subscription.tenant_id == tenant.id
        ).first()

        plan_info = None
        if subscription:
            plan = db.query(Plan).filter(Plan.id == subscription.planId).first()
            if plan:
                plan_info = {
                    "id": str(plan.id),
                    "name": plan.name,
                    "description": plan.description,
                    "planType": plan.planType,
                    "price": plan.price,
                    "billingCycle": plan.billingCycle,
                    "maxProjects": plan.maxProjects,
                    "maxUsers": plan.maxUsers,
                    "features": plan.features,
                    "modules": plan.modules if hasattr(plan, 'modules') else []
                }

        tenant_users = db.query(TenantUser).filter(
            TenantUser.tenant_id == tenant.id
        ).all()

        user_data = []
        for tenant_user in tenant_users:
            user = db.query(User).filter(User.id == tenant_user.userId).first()
            if user:
                user_data.append({
                    "id": str(user.id),
                    "userName": user.userName,
                    "email": user.email,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "userRole": user.userRole,
                    "isActive": user.isActive,
                    "createdAt": user.createdAt,
                    "lastLogin": user.lastLogin,
                    "tenantUserActive": tenant_user.isActive
                })

        invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant.id).all()
        invoice_data = []
        for invoice in invoices:
            invoice_data.append({
                "id": str(invoice.id),
                "invoiceNumber": invoice.invoiceNumber,
                "customerName": invoice.customerName,
                "customerEmail": invoice.customerEmail,
                "total": invoice.total,
                "status": invoice.status,
                "issueDate": invoice.issueDate,
                "dueDate": invoice.dueDate,
                "createdAt": invoice.createdAt
            })

        projects = db.query(Project).filter(Project.tenant_id == tenant.id).all()
        project_data = []
        for project in projects:
            project_data.append({
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "status": project.status,
                "startDate": project.startDate,
                "endDate": project.endDate,
                "createdAt": project.createdAt
            })

        customers = db.query(Customer).filter(Customer.tenant_id == tenant.id).all()
        customer_data = []
        for customer in customers:
            customer_data.append({
                "id": str(customer.id),
                "customerId": customer.customerId,
                "name": f"{customer.firstName} {customer.lastName}",
                "email": customer.email,
                "phone": customer.phone,
                "mobile": customer.mobile,
                "customerType": customer.customerType,
                "customerStatus": customer.customerStatus,
                "createdAt": customer.createdAt
            })

        total_users = len(user_data)
        active_users = len([u for u in user_data if u["isActive"]])
        total_projects = len(project_data)
        total_customers = len(customer_data)
        total_invoices = len(invoice_data)

        total_invoice_value = sum(invoice["total"] for invoice in invoice_data)

        last_activities = []
        if user_data:
            last_activities.extend([u["lastLogin"] for u in user_data if u["lastLogin"]])
        if invoice_data:
            last_activities.extend([i["createdAt"] for i in invoice_data])
        if project_data:
            last_activities.extend([p["createdAt"] for p in project_data])
        if customer_data:
            last_activities.extend([c["createdAt"] for c in customer_data])

        last_activity = max(last_activities) if last_activities else tenant.createdAt

        return {
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "domain": tenant.domain,
                "description": tenant.description,
                "isActive": tenant.isActive,
                "stripe_required": getattr(tenant, "stripe_required", True),
                "createdAt": tenant.createdAt,
                "updatedAt": tenant.updatedAt,
                "settings": tenant.settings
            },
            "subscription": {
                "id": str(subscription.id) if subscription else None,
                "isActive": subscription.isActive if subscription else False,
                "status": subscription.status if subscription else None,
                "startDate": subscription.startDate if subscription else None,
                "endDate": subscription.endDate if subscription else None,
                "plan": plan_info
            } if subscription else None,
            "users": user_data,
            "invoices": invoice_data,
            "projects": project_data,
            "customers": customer_data,
            "statistics": {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "totalProjects": total_projects,
                "totalCustomers": total_customers,
                "totalInvoices": total_invoices,
                "totalInvoiceValue": total_invoice_value,
                "lastActivity": last_activity
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching complete tenant details: {str(e)}"
        )
