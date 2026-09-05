from fastapi import FastAPI, Request, Response, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import logging

# Configure logging
logger = logging.getLogger(__name__)

from .config.database import create_tables, get_plans, get_db
from .api.v1 import auth, users, tenants, plans, sales, crm, hrm, healthcare, ngo, custom_options, invoices, invoice_customization, installments, delivery_notes, pos, inventory, subscriptions, job_cards, vehicles, quality_control, ledger, admin, file_upload, deduct_stock, customer_import, dashboard, investments, reports, notifications, events, profile, workshop, mot, agent_portal
from .api.v1.rbac.router import router as rbac_router
from .api.v1.projects.router import router as projects_router
from .api.v1.tasks.router import router as tasks_router
from .api.v1.banking.router import router as banking_router
from .api.v1.employee_portal import router as employee_portal_router
from .core.security import security_middleware
from .core.tenant_middleware import tenant_middleware
from .core.audit import audit_logger
from .core.monitoring import system_monitor, perform_health_check
from .core.error_handling import error_handler
from .core.security import security_middleware as security_middleware_instance
from fastapi.exceptions import RequestValidationError

app = FastAPI(title="BizTrack - Project Management & Sales API", version="1.0.0")

# Background scheduler for MOT reminders
import threading

def _mot_reminder_scheduler():
    """Run MOT reminders every hour in the background."""
    import time as _time
    from .config.database import SessionLocal
    from .api.v1.mot.bookings.notifications import process_all_tenants_mot_reminders

    while True:
        _time.sleep(3600)
        try:
            db = SessionLocal()
            try:
                process_all_tenants_mot_reminders(db)
            except Exception:
                pass
            finally:
                db.close()
        except Exception:
            pass

# Ensure tables are created at startup
@app.on_event("startup")
async def on_startup():
    create_tables()
    logging.info("🚀 BizTrack API started successfully")
    logging.info("🔒 Security middleware enabled")
    logging.info("🏢 Tenant isolation middleware enabled")
    logging.info("📊 Monitoring system enabled")
    logging.info("📝 Audit logging enabled")

    scheduler_thread = threading.Thread(target=_mot_reminder_scheduler, daemon=True)
    scheduler_thread.start()
    logging.info("⏰ MOT reminder scheduler started (runs every hour)")

# Tenant middleware
@app.middleware("http")
async def tenant_middleware_func(request: Request, call_next):
    # Skip tenant validation for non-tenant endpoints
    if tenant_middleware._should_skip_tenant_validation(request):
        return await call_next(request)
    
    try:
        # Extract tenant ID from header
        tenant_id = request.headers.get("X-Tenant-ID")
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Tenant-ID header is required"
            )
        
        # Validate tenant and subscription
        tenant_context = await tenant_middleware._validate_tenant_and_subscription(tenant_id, request)
        
        # Add tenant context to request state
        request.state.tenant_context = tenant_context
        
        # Check plan limits
        await tenant_middleware._check_plan_limits(tenant_context, request)
        
        # Process request
        response = await call_next(request)
        
        # Add tenant info to response headers
        response.headers["X-Tenant-ID"] = tenant_id
        response.headers["X-Tenant-Name"] = tenant_context["tenant_name"]
        response.headers["X-Plan-Type"] = tenant_context["plan_type"]
        
        return response
        
    except HTTPException as e:
        logger.warning(f"Tenant validation failed: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail, "error_code": "TENANT_VALIDATION_FAILED"}
        )
    except Exception as e:
        logger.error(f"Unexpected error in tenant middleware: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_code": "TENANT_MIDDLEWARE_ERROR"}
        )

# Security middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        # 1. Rate Limiting (check before processing)
        await security_middleware_instance._check_rate_limits(request)
        
        # 2. Input Validation (check before processing)
        await security_middleware_instance._validate_inputs(request)
        
        # 3. Process request and get response
        response = await call_next(request)
        
        # 4. Add security headers to response
        security_middleware_instance._add_security_headers(response)
        
        # 5. Logging
        await security_middleware_instance._log_request(request, response, start_time)
        
        return response
        
    except HTTPException as e:
        # Log security violations
        logger.warning(f"Security violation: {e.detail} from {request.client.host}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail, "error_code": "SECURITY_VIOLATION"}
        )
    except Exception as e:
        from sqlalchemy.exc import OperationalError, DisconnectionError
        if isinstance(e, (OperationalError, DisconnectionError)):
            logger.warning(f"Database connection error in security middleware (non-critical): {str(e)}")
        logger.error(f"Unexpected error in security middleware: {str(e)}")
        raise

# Audit middleware
@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Extract user and tenant info for audit
        user_id = None
        tenant_id = None
        
        # Try to get user info from request state if available
        if hasattr(request.state, 'user'):
            user_id = str(request.state.user.id)
        
        # Get tenant ID from headers
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # Log the request for audit purposes
        try:
            audit_logger.log_http_request(
                request=request,
                response=response,
                user_id=user_id,
                tenant_id=tenant_id,
                processing_time=processing_time
            )
        except Exception as e:
            from sqlalchemy.exc import OperationalError, DisconnectionError
            if isinstance(e, (OperationalError, DisconnectionError)):
                logger.warning(f"Database connection error in audit middleware (non-critical): {str(e)}")
            else:
                logger.error(f"Audit logging failed: {str(e)}")
        
        return response
        
    except Exception as e:
        logger.error(f"Audit middleware error: {str(e)}")
        raise

# Include all routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(rbac_router)
app.include_router(profile.router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(tenants.router)
app.include_router(plans.router)
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(sales.router)
app.include_router(crm.router)
app.include_router(agent_portal.router)
app.include_router(customer_import.router)
app.include_router(hrm.router)
app.include_router(employee_portal_router)
app.include_router(custom_options.router)
app.include_router(invoices.router)
app.include_router(invoice_customization.router)
app.include_router(installments.router)
app.include_router(delivery_notes.router)
app.include_router(pos.router)
app.include_router(inventory.router)
app.include_router(deduct_stock.router)
app.include_router(subscriptions.router)
app.include_router(job_cards.router)
app.include_router(vehicles.router)
app.include_router(quality_control.router)
app.include_router(workshop.router)
app.include_router(mot.public_router)
app.include_router(mot.admin_router)
app.include_router(ledger.router)
app.include_router(banking_router)
app.include_router(investments.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(file_upload.router)
app.include_router(notifications.router)
app.include_router(healthcare.router)
app.include_router(ngo.router)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return await error_handler.handle_validation_error(request, exc)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return await error_handler.handle_http_exception(request, exc)

# Mount static files for uploaded content
import os
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return await error_handler.handle_generic_exception(request, exc)

@app.get("/")
def read_root():
    return {
        "message": "BizTrack - Project Management & Sales API", 
        "status": "running",
        "landing_page": "/landing",
        "api_docs": "/docs",
        "health_check": "/health"
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with comprehensive system status"""
    return await perform_health_check()

@app.get("/health/simple")
async def simple_health_check():
    """Simple health check for load balancers"""
    return {"status": "healthy", "service": "BizTrack API", "timestamp": time.time()}

@app.get("/metrics")
async def get_metrics():
    """Get system metrics and performance data"""
    return await system_monitor.get_performance_summary()

@app.get("/metrics/history")
async def get_metrics_history(hours: int = 24):
    """Get metrics history for specified time period"""
    return await system_monitor.get_metrics_history(hours=hours)

# Public plans endpoint - completely bypasses all middleware
@app.get("/public/plans")
async def get_public_plans():
    """Public endpoint to get all available plans - no authentication required"""
    try:
        # Get database session
        from .config.database import get_db
        db = next(get_db())
        
        # Get all active plans
        plans = get_plans(db)
        
        # Convert to response format
        plans_response = []
        for plan in plans:
            plan_dict = {
                "id": str(plan.id),
                "name": plan.name,
                "description": plan.description,
                "planType": plan.planType,
                "price": plan.price,
                "billingCycle": plan.billingCycle,
                "maxProjects": plan.maxProjects,
                "maxUsers": plan.maxUsers,
                "features": plan.features,
                "isActive": plan.isActive
            }
            plans_response.append(plan_dict)
        
        return {"plans": plans_response}
        
    except Exception as e:
        logger.error(f"Error fetching public plans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch plans"
        )


@app.get("/public/i/{code}")
async def public_invoice_pdf_short(
    code: str,
    db: Session = Depends(get_db),
):
    from .services.invoice_share import (
        build_invoice_pdf_response,
        resolve_invoice_from_share_code,
    )

    invoice = resolve_invoice_from_share_code(db, code)
    return build_invoice_pdf_response(invoice, db)


@app.get("/public/invoices/{invoice_id}/pdf")
async def public_invoice_pdf(
    invoice_id: str,
    token: str,
    db: Session = Depends(get_db),
):
    from .services.invoice_share import (
        build_invoice_pdf_response,
        verify_invoice_share_token,
    )
    from .models.invoices import Invoice

    payload = verify_invoice_share_token(token)
    if str(payload.get("invoice_id")) != str(invoice_id):
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice = db.query(Invoice).filter(
        and_(
            Invoice.id == invoice_id,
            Invoice.tenant_id == payload["tenant_id"],
        )
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return build_invoice_pdf_response(invoice, db)