import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .audit import audit_logger, AuditEventType, AuditSeverity

logger = logging.getLogger(__name__)

class ErrorHandler:
    """Comprehensive error handling system"""
    
    def __init__(self):
        self.error_codes = {
            "VALIDATION_ERROR": "VAL001",
            "AUTHENTICATION_ERROR": "AUTH001",
            "AUTHORIZATION_ERROR": "AUTH002",
            "TENANT_ISOLATION_ERROR": "TENANT001",
            "SUBSCRIPTION_ERROR": "SUB001",
            "RATE_LIMIT_ERROR": "RATE001",
            "DATABASE_ERROR": "DB001",
            "EXTERNAL_SERVICE_ERROR": "EXT001",
            "INTERNAL_ERROR": "INT001",
            "NOT_FOUND_ERROR": "NF001",
            "CONFLICT_ERROR": "CONF001"
        }
    
    async def handle_validation_error(
        self,
        request: Request,
        exc: RequestValidationError
    ) -> JSONResponse:
        """Handle request validation errors"""
        error_details = []
        
        for error in exc.errors():
            error_detail = {
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            }
            error_details.append(error_detail)
        
        error_response = {
            "error_code": self.error_codes["VALIDATION_ERROR"],
            "error_type": "validation_error",
            "message": "Request validation failed",
            "details": error_details,
            "timestamp": self._get_timestamp()
        }
        
        logger.error(f"Validation error for {request.method} {request.url}: {error_details}")
        
        try:
            body = await request.body()
            if body:
                import json
                try:
                    body_data = json.loads(body)
                    logger.error(f"Request body: {json.dumps(body_data, indent=2)}")
                except:
                    logger.error(f"Request body (raw): {body}")
        except Exception as e:
            logger.error(f"Could not read request body: {str(e)}")
        
        self._log_error(
            request=request,
            error_type="validation_error",
            error_code=self.error_codes["VALIDATION_ERROR"],
            details=error_details,
            severity=AuditSeverity.LOW
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response
        )
    
    async def handle_http_exception(
        self,
        request: Request,
        exc: HTTPException
    ) -> JSONResponse:
        """Handle HTTP exceptions"""
        error_response = {
            "error_code": self._get_error_code_for_status(exc.status_code),
            "error_type": "http_error",
            "message": exc.detail,
            "status_code": exc.status_code,
            "timestamp": self._get_timestamp()
        }
        
        # Log the HTTP error
        self._log_error(
            request=request,
            error_type="http_error",
            error_code=error_response["error_code"],
            details={"status_code": exc.status_code, "message": exc.detail},
            severity=self._get_severity_for_status(exc.status_code)
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )
    
    async def handle_generic_exception(
        self,
        request: Request,
        exc: Exception
    ) -> JSONResponse:
        """Handle generic exceptions"""
        error_response = {
            "error_code": self.error_codes["INTERNAL_ERROR"],
            "error_type": "internal_error",
            "message": "An unexpected error occurred",
            "timestamp": self._get_timestamp()
        }
        
        # Log the internal error
        self._log_error(
            request=request,
            error_type="internal_error",
            error_code=self.error_codes["INTERNAL_ERROR"],
            details={"exception_type": type(exc).__name__, "message": str(exc)},
            severity=AuditSeverity.CRITICAL
        )
        
        # Log full traceback for debugging
        logger.error(f"Unhandled exception: {str(exc)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response
        )
    
    def _get_error_code_for_status(self, status_code: int) -> str:
        """Get appropriate error code for HTTP status code"""
        if status_code == 400:
            return self.error_codes["VALIDATION_ERROR"]
        elif status_code == 401:
            return self.error_codes["AUTHENTICATION_ERROR"]
        elif status_code == 403:
            return self.error_codes["AUTHORIZATION_ERROR"]
        elif status_code == 404:
            return self.error_codes["NOT_FOUND_ERROR"]
        elif status_code == 409:
            return self.error_codes["CONFLICT_ERROR"]
        elif status_code == 422:
            return self.error_codes["VALIDATION_ERROR"]
        elif status_code == 429:
            return self.error_codes["RATE_LIMIT_ERROR"]
        elif status_code >= 500:
            return self.error_codes["INTERNAL_ERROR"]
        else:
            return self.error_codes["INTERNAL_ERROR"]
    
    def _get_severity_for_status(self, status_code: int) -> AuditSeverity:
        """Get appropriate severity level for HTTP status code"""
        if status_code >= 500:
            return AuditSeverity.CRITICAL
        elif status_code >= 400:
            return AuditSeverity.HIGH
        elif status_code >= 300:
            return AuditSeverity.MEDIUM
        else:
            return AuditSeverity.LOW
    
    def _log_error(
        self,
        request: Request,
        error_type: str,
        error_code: str,
        details: Dict[str, Any],
        severity: AuditSeverity
    ):
        """Log error for audit purposes"""
        try:
            # Extract user and tenant info
            user_id = None
            tenant_id = None
            
            # Try to get user info from request state
            if hasattr(request.state, 'user'):
                user_id = str(request.state.user.id)
            
            # Get tenant ID from headers
            tenant_id = request.headers.get("X-Tenant-ID")
            
            # Log the error
            audit_logger.log_event(
                event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
                user_id=user_id,
                tenant_id=tenant_id,
                resource_type="error_handling",
                action=f"Error occurred: {error_type}",
                details={
                    "error_code": error_code,
                    "error_type": error_type,
                    "url": str(request.url),
                    "method": request.method,
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent"),
                    **(details if isinstance(details, dict) else {})
                },
                severity=severity,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                success=False
            )
            
        except Exception as e:
            # Fallback logging if audit logging fails
            logger.error(f"Failed to log error for audit: {str(e)}")
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

# Global error handler instance
error_handler = ErrorHandler()

# Custom exception classes
class ValidationError(HTTPException):
    def __init__(self, detail: str, field: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )
        self.field = field

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )

class AuthorizationError(HTTPException):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class TenantIsolationError(HTTPException):
    def __init__(self, detail: str = "Tenant isolation violation"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class SubscriptionError(HTTPException):
    def __init__(self, detail: str = "Subscription validation failed"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class RateLimitError(HTTPException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail
        )

class DatabaseError(HTTPException):
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )

class ExternalServiceError(HTTPException):
    def __init__(self, detail: str = "External service error"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail
        )

class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )

class ConflictError(HTTPException):
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail
        )

# Error response models
class ErrorResponse:
    """Standard error response format"""
    
    def __init__(
        self,
        error_code: str,
        error_type: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None
    ):
        self.error_code = error_code
        self.error_type = error_type
        self.message = message
        self.details = details or {}
        self.timestamp = timestamp or self._get_timestamp()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code,
            "error_type": self.error_type,
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp
        }
    
    def _get_timestamp(self) -> str:
        from datetime import datetime
        return datetime.utcnow().isoformat()

# Error handling decorator
def handle_errors(func):
    """Decorator to handle errors in API endpoints"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unhandled error in {func.__name__}: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred"
            )
    return wrapper
