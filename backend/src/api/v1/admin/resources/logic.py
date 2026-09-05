from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .....models.platform import Tenant as TenantModel
from .....models.rbac import TenantUser
from .....models.crm import Customer
from .....models.invoices import Invoice
from .....models.invoice_models import InvoiceResponse
from .....models.projects import Project
from .....api.v1.invoices.db_common import delete_invoice_dependencies
from .....api.v1.invoices.shared import transform_invoice_to_pydantic
from ..http_common import require_super_admin
from .schemas import ResourceDeleteResponse


async def get_tenant_invoice_details(
    tenant_id: str,
    invoice_id: str,
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

        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant.id
            )
        ).first()

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        try:
            pydantic_invoice = transform_invoice_to_pydantic(invoice)
            return InvoiceResponse(invoice=pydantic_invoice)
        except Exception as validation_error:
            print(f"Validation error in InvoiceResponse: {validation_error}")
            print(f"Invoice items: {invoice.items}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create invoice response: {str(validation_error)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching invoice details: {str(e)}"
        )


async def delete_tenant_user(
    tenant_id: str,
    user_id: str,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        tenant_user = db.query(TenantUser).filter(
            TenantUser.tenant_id == tenant_id,
            TenantUser.userId == user_id
        ).first()

        if not tenant_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in this tenant"
            )

        db.delete(tenant_user)
        db.commit()

        return ResourceDeleteResponse(
            success=True,
            message="User removed from tenant successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing user from tenant: {str(e)}"
        )


async def delete_tenant_invoice(
    tenant_id: str,
    invoice_id: str,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        invoice = db.query(Invoice).filter(
            Invoice.id == invoice_id,
            Invoice.tenant_id == tenant_id
        ).first()

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )

        delete_invoice_dependencies(db, invoice_id, tenant_id)
        db.delete(invoice)
        db.commit()

        return ResourceDeleteResponse(
            success=True,
            message="Invoice deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting invoice: {str(e)}"
        )


async def delete_tenant_project(
    tenant_id: str,
    project_id: str,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.tenant_id == tenant_id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        db.delete(project)
        db.commit()

        return ResourceDeleteResponse(
            success=True,
            message="Project deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting project: {str(e)}"
        )


async def delete_tenant_customer(
    tenant_id: str,
    customer_id: str,
    db: Session,
    current_user,
):
    require_super_admin(current_user)

    try:
        customer = db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.tenant_id == tenant_id
        ).first()

        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        db.delete(customer)
        db.commit()

        return ResourceDeleteResponse(
            success=True,
            message="Customer deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting customer: {str(e)}"
        )
