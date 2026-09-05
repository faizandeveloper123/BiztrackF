import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import String, and_, cast, desc, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .....models.crm import Customer, CustomerGuarantor
from .....config.job_card_models import JobCard
from ..db_common import (
    attachment_item_to_dict,
    attachment_url_from_stored,
    attachment_urls_set,
    crm_user_scope_filter,
    delete_s3_for_file_url,
    find_customer_by_any_email,
    prepare_labeled_contact_dict,
)


# Customer CRUD Operations
def create_customer(db: Session, customer_data: Dict[str, Any], tenant_id: str) -> Customer:
    """Create a new customer"""
    try:
        # Generate unique customer ID
        customer_data["customerId"] = _generate_customer_id(db, tenant_id)
        customer_data["tenant_id"] = tenant_id
        customer_data["createdAt"] = datetime.utcnow()
        customer_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['cnic', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes', 'description', 'image_url', 'email']
        for field in optional_fields:
            if field in customer_data and customer_data[field] == '':
                customer_data[field] = None

        prepare_labeled_contact_dict(customer_data, customer_email_blank_string=True)

        uuid_fields = ['assignedToId', 'createdById']
        for field in uuid_fields:
            if field in customer_data and customer_data[field] is None:
                del customer_data[field]
        
        if customer_data.get('cnic'):
            existing_customer = _get_customer_by_cnic(db, customer_data['cnic'], tenant_id)
            if existing_customer:
                raise ValueError(f"Customer with CNIC '{customer_data['cnic']}' already exists")
        
        for em in customer_data.get("emails") or []:
            ev = (em.get("value") or "").strip().lower()
            if not ev:
                continue
            existing_customer = find_customer_by_any_email(db, ev, tenant_id)
            if existing_customer:
                raise ValueError(f"Customer with email '{ev}' already exists")

        atts = customer_data.get('attachments')
        if atts is None:
            customer_data['attachments'] = []
        else:
            customer_data['attachments'] = [attachment_item_to_dict(x) for x in atts]

        customer = Customer(**customer_data)
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
        
    except IntegrityError as e:
        db.rollback()
        err = e.orig
        error_msg = str(err)
        pgcode = getattr(err, 'pgcode', None) or getattr(err, 'sqlstate', None)
        if "cnic" in error_msg.lower():
            raise ValueError("Customer with this CNIC already exists")
        if "email" in error_msg.lower():
            if pgcode == '23502':
                raise ValueError("Database requires customer email. Update the customers table to allow NULL on the email column.")
            if pgcode == '23505':
                raise ValueError("Customer with this email already exists")
            raise ValueError("Customer with this email already exists")
        raise ValueError(f"Database constraint violation: {error_msg}")
    except Exception as e:
        db.rollback()
        raise

def get_customer_by_id(db: Session, customer_id: str, tenant_id: str) -> Optional[Customer]:
    """Get customer by ID"""
    return db.query(Customer).filter(
        and_(Customer.id == customer_id, Customer.tenant_id == tenant_id)
    ).first()

def _get_customer_by_cnic(db: Session, cnic: str, tenant_id: str) -> Optional[Customer]:
    """Get customer by CNIC"""
    return db.query(Customer).filter(
        and_(Customer.cnic == cnic, Customer.tenant_id == tenant_id)
    ).first()

def get_customer_by_email(db: Session, email: str, tenant_id: str) -> Optional[Customer]:
    if email is None or (isinstance(email, str) and not email.strip()):
        return None
    return db.query(Customer).filter(
        and_(Customer.email == email.strip().lower(), Customer.tenant_id == tenant_id)
    ).first()

def get_customers(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_type: Optional[str] = None,
    scope_user_id: Optional[str] = None,
) -> Tuple[List[Customer], int]:
    """Get customers with optional filtering and search. Returns (customers, total_count)."""
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)
    query = crm_user_scope_filter(query, Customer, scope_user_id)
    
    if search:
        normalized_search = ' '.join(search.split())
        search_filter = or_(
            func.regexp_replace(Customer.firstName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            func.regexp_replace(Customer.lastName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            func.regexp_replace(func.concat(Customer.firstName, ' ', Customer.lastName), r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            Customer.customerId.ilike(f"%{normalized_search}%"),
            Customer.phone.ilike(f"%{normalized_search}%"),
            Customer.mobile.ilike(f"%{normalized_search}%"),
            Customer.cnic.ilike(f"%{normalized_search}%"),
            Customer.email.ilike(f"%{normalized_search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Customer.customerStatus == status)
    
    if customer_type:
        query = query.filter(Customer.customerType == customer_type)
    
    total = query.count()
    customers = query.offset(skip).limit(limit).all()
    return (customers, total)

def update_customer(db: Session, customer_id: str, customer_data: Dict[str, Any], tenant_id: str) -> Optional[Customer]:
    """Update customer"""
    try:
        customer = get_customer_by_id(db, customer_id, tenant_id)
        if not customer:
            return None
        
        customer_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['cnic', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes', 'description', 'image_url', 'email']
        for field in optional_fields:
            if field in customer_data and customer_data[field] == '':
                customer_data[field] = None
        if 'attachments' in customer_data:
            new_atts = customer_data.get('attachments')
            if new_atts is None:
                customer_data['attachments'] = []
            else:
                old_urls = attachment_urls_set(customer.attachments)
                new_urls = attachment_urls_set(new_atts)
                for url in old_urls - new_urls:
                    delete_s3_for_file_url(url)
                customer_data['attachments'] = [attachment_item_to_dict(x) for x in new_atts]
        if any(k in customer_data for k in ('emails', 'phones', 'email', 'phone', 'mobile')):
            merged = {
                "emails": list(customer.emails or []),
                "phones": list(customer.phones or []),
                "email": customer.email,
                "phone": customer.phone,
                "mobile": customer.mobile,
            }
            for k in ('emails', 'phones', 'email', 'phone', 'mobile'):
                if k in customer_data:
                    merged[k] = customer_data[k]
            prepare_labeled_contact_dict(merged, customer_email_blank_string=True)
            for k in ('emails', 'phones', 'email', 'phone', 'mobile'):
                customer_data[k] = merged[k]

        uuid_fields = ['assignedToId', 'createdById']
        for field in uuid_fields:
            if field in customer_data and customer_data[field] is None:
                del customer_data[field]
        
        if customer_data.get('cnic') and customer_data['cnic'] != customer.cnic:
            existing_customer = _get_customer_by_cnic(db, customer_data['cnic'], tenant_id)
            if existing_customer and existing_customer.id != customer_id:
                raise ValueError(f"Customer with CNIC '{customer_data['cnic']}' already exists")
        
        for em in customer_data.get("emails") or []:
            ev = (em.get("value") or "").strip().lower()
            if not ev:
                continue
            existing_customer = find_customer_by_any_email(db, ev, tenant_id)
            if existing_customer and str(existing_customer.id) != str(customer_id):
                raise ValueError(f"Customer with email '{ev}' already exists")
        
        for field, value in customer_data.items():
            if hasattr(customer, field):
                setattr(customer, field, value)
        
        db.commit()
        db.refresh(customer)
        return customer
        
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "cnic" in error_msg.lower():
            raise ValueError("Customer with this CNIC already exists")
        elif "email" in error_msg.lower():
            raise ValueError("Customer with this email already exists")
        else:
            raise ValueError(f"Database constraint violation: {error_msg}")
    except Exception as e:
        db.rollback()
        raise

def delete_customer(db: Session, customer_id: str, tenant_id: str) -> bool:
    customer = get_customer_by_id(db, customer_id, tenant_id)
    if not customer:
        return False

    try:
        cust_uuid = uuid.UUID(str(customer_id))
        tenant_uuid = uuid.UUID(str(tenant_id))
    except (ValueError, TypeError):
        return False

    delete_s3_for_file_url(customer.image_url)
    for att in (customer.attachments or []):
        delete_s3_for_file_url(attachment_url_from_stored(att))

    try:
        db.query(CustomerGuarantor).filter(
            and_(
                CustomerGuarantor.customer_id == cust_uuid,
                CustomerGuarantor.tenant_id == tenant_uuid,
            )
        ).delete(synchronize_session=False)

        db.query(JobCard).filter(
            and_(JobCard.customer_id == cust_uuid, JobCard.tenant_id == tenant_uuid)
        ).update({JobCard.customer_id: None}, synchronize_session=False)

        db.delete(customer)
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        raise ValueError(
            "Cannot delete customer because related records still reference them. "
            "Remove or reassign linked records first."
        ) from e

def get_customer_stats(db: Session, tenant_id: str, scope_user_id: Optional[str] = None) -> Dict[str, Any]:
    """Get customer statistics"""
    def _cq():
        q = db.query(Customer).filter(Customer.tenant_id == tenant_id)
        return crm_user_scope_filter(q, Customer, scope_user_id)

    total_customers = _cq().count()
    active_customers = _cq().filter(Customer.customerStatus == "active").count()
    inactive_customers = _cq().filter(Customer.customerStatus == "inactive").count()
    blocked_customers = _cq().filter(Customer.customerStatus == "blocked").count()
    individual_customers = _cq().filter(Customer.customerType == "individual").count()
    business_customers = _cq().filter(Customer.customerType == "business").count()
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_customers = _cq().filter(Customer.createdAt >= thirty_days_ago).count()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": inactive_customers,
        "blocked_customers": blocked_customers,
        "individual_customers": individual_customers,
        "business_customers": business_customers,
        "recent_customers": recent_customers
    }

def _generate_customer_id(db: Session, tenant_id: str) -> str:
    """Generate unique customer ID"""
    last_customer = db.query(Customer).filter(
        Customer.tenant_id == tenant_id
    ).order_by(desc(Customer.customerId)).first()
    
    if last_customer and last_customer.customerId:
        try:
            last_number = int(last_customer.customerId.replace("CUST", ""))
            new_number = last_number + 1
        except ValueError:
            new_number = 1
    else:
        new_number = 1
    
    max_attempts = 1000
    attempts = 0
    
    while attempts < max_attempts:
        candidate_id = f"CUST{new_number:03d}"
        
        existing_customer = db.query(Customer).filter(
            Customer.tenant_id == tenant_id,
            Customer.customerId == candidate_id
        ).first()
        
        if not existing_customer:
            return candidate_id
        
        new_number += 1
        attempts += 1
    
    return f"CUST{str(uuid.uuid4())[:8].upper()}"

def search_customers(
    db: Session, 
    tenant_id: str, 
    search_term: str, 
    limit: int = 20,
    scope_user_id: Optional[str] = None,
) -> List[Customer]:
    """Search customers by name, ID, CNIC, phone, or email"""
    query = db.query(Customer).filter(Customer.tenant_id == tenant_id)
    query = crm_user_scope_filter(query, Customer, scope_user_id)
    
    normalized_search = ' '.join(search_term.split())
    
    search_filter = or_(
        func.regexp_replace(Customer.firstName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
        func.regexp_replace(Customer.lastName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
        func.regexp_replace(func.concat(Customer.firstName, ' ', Customer.lastName), r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
        Customer.customerId.ilike(f"%{normalized_search}%"),
        Customer.phone.ilike(f"%{normalized_search}%"),
        Customer.mobile.ilike(f"%{normalized_search}%"),
        Customer.cnic.ilike(f"%{normalized_search}%"),
        Customer.email.ilike(f"%{normalized_search}%"),
        cast(Customer.emails, String).ilike(f"%{normalized_search}%"),
        cast(Customer.phones, String).ilike(f"%{normalized_search}%"),
    )
    
    return query.filter(search_filter).limit(limit).all()



import logging
import uuid
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....services.s3_service import s3_service
from ..http_common import (
    notify_crm_broadcast,
    require_tenant,
    tenant_id_str,
    user_display_name,
    visible_or_404,
)
from ..shared import _crm_scope_user_id, process_customer_photo_upload, CustomerPhotoUpload
from .schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatsResponse, CustomersListResponse,
)

logger = logging.getLogger(__name__)


def create_customer_endpoint(customer_data: CustomerCreate, db: Session, current_user, tenant_context: Optional[dict] = None):
    """Create a new customer"""
    try:
        ctx = require_tenant(tenant_context)
        payload = customer_data.dict()
        try:
            payload["createdById"] = uuid.UUID(str(current_user.id))
        except (ValueError, TypeError):
            pass
        customer = create_customer(db, payload, ctx["tenant_id"])
        notify_crm_broadcast(
            db, ctx, current_user,
            title="New Customer Created",
            message=f"{user_display_name(current_user)} created a new customer: {customer_data.firstName} {customer_data.lastName}".strip(),
            path=f"/crm/customers/{customer.id}",
            meta={"customer_id": str(customer.id), "created_by": str(current_user.id)},
        )
        return CustomerResponse.from_orm(customer)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create customer: {str(e)}")

def get_customers_endpoint(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_type: Optional[str] = None,
):
    ctx = require_tenant(tenant_context)
    scope = _crm_scope_user_id(ctx, current_user)
    customers, total = get_customers(
        db,
        ctx["tenant_id"],
        skip,
        limit,
        search,
        status,
        customer_type,
        scope_user_id=scope,
    )
    return CustomersListResponse(
        customers=[CustomerResponse.from_orm(c) for c in customers],
        total=total
    )

def get_customer_stats_endpoint(db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    stats = get_customer_stats(db, ctx["tenant_id"], scope_user_id=_crm_scope_user_id(ctx, current_user))
    return CustomerStatsResponse(**stats)


def search_customers_endpoint(
    db: Session, current_user, tenant_context: Optional[dict], q: str, limit: int = 20
):
    ctx = require_tenant(tenant_context)
    tid = tenant_id_str(ctx)
    customers = search_customers(
        db, tid, q, limit, scope_user_id=_crm_scope_user_id(ctx, current_user)
    )
    return [CustomerResponse.from_orm(c) for c in customers]


def _visible_customer(db, customer_id, tenant_context, current_user):
    tid = tenant_id_str(require_tenant(tenant_context))
    return visible_or_404(
        get_customer_by_id(db, customer_id, tid), tenant_context, current_user, detail="Customer not found"
    )


def get_customer_endpoint(customer_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    return CustomerResponse.from_orm(_visible_customer(db, customer_id, tenant_context, current_user))


def update_customer_endpoint(
    customer_id: str, customer_data: CustomerUpdate, db: Session, current_user, tenant_context: Optional[dict] = None
):
    ctx = require_tenant(tenant_context)
    _visible_customer(db, customer_id, ctx, current_user)
    customer = update_customer(db, customer_id, customer_data.dict(exclude_unset=True), ctx["tenant_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    notify_crm_broadcast(
        db, ctx, current_user,
        title="Customer Updated",
        message=f"{user_display_name(current_user)} updated customer: {customer.name}",
        path=f"/crm/customers/{customer_id}",
        meta={"customer_id": customer_id, "updated_by": str(current_user.id)},
    )
    return CustomerResponse.from_orm(customer)


def delete_customer_endpoint(customer_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    _visible_customer(db, customer_id, ctx, current_user)
    try:
        if not delete_customer(db, customer_id, ctx["tenant_id"]):
            raise HTTPException(status_code=404, detail="Customer not found")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"message": "Customer deleted successfully"}


def upload_customer_photo(
    customer_id: str, body: CustomerPhotoUpload, db: Session, current_user, tenant_context: Optional[dict] = None
):
    ctx = require_tenant(tenant_context)
    _visible_customer(db, customer_id, ctx, current_user)
    tid = tenant_id_str(ctx)
    url = process_customer_photo_upload(body.image, tid, customer_id)
    if url:
        customer = update_customer(db, customer_id, {"image_url": url}, tid)
    else:
        customer = get_customer_by_id(db, customer_id, tid)
    return CustomerResponse.from_orm(customer)


def delete_customer_photo(customer_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    ctx = require_tenant(tenant_context)
    customer = _visible_customer(db, customer_id, ctx, current_user)
    tid = tenant_id_str(ctx)
    if customer.image_url and customer.image_url.startswith(("http://", "https://")):
        try:
            s3_key = s3_service.extract_s3_key_from_url(customer.image_url)
            if s3_key:
                s3_service.delete_file(s3_key)
        except Exception as e:
            logger.warning("Failed to delete customer photo from S3: %s", e)
    customer = update_customer(db, customer_id, {"image_url": None}, tid)
    return CustomerResponse.from_orm(customer)

