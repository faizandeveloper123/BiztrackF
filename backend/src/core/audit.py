import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import Request, Response
from sqlalchemy.orm import Session
import uuid
from enum import Enum

from ..config.database import get_db

# Configure audit logging
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Create file handler for audit logs
import os
if not os.path.exists("logs"):
    os.makedirs("logs")

audit_file_handler = logging.FileHandler("logs/audit.log")
audit_file_handler.setLevel(logging.INFO)
audit_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
audit_file_handler.setFormatter(audit_formatter)
audit_logger.addHandler(audit_file_handler)

class AuditEventType(str, Enum):
    """Types of audit events"""
    # Authentication events
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    
    # Data access events
    DATA_READ = "data_read"
    DATA_CREATE = "data_create"
    DATA_UPDATE = "data_update"
    DATA_DELETE = "data_delete"
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    
    # User management events
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_ROLE_CHANGED = "user_role_changed"
    USER_PERMISSIONS_CHANGED = "user_permissions_changed"
    
    # Tenant events
    TENANT_CREATED = "tenant_created"
    TENANT_UPDATED = "tenant_updated"
    TENANT_DELETED = "tenant_deleted"
    SUBSCRIPTION_CHANGED = "subscription_changed"
    PLAN_UPGRADED = "plan_upgraded"
    PLAN_DOWNGRADED = "plan_downgraded"
    
    # Security events
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_BREACH_ATTEMPT = "data_breach_attempt"
    
    # System events
    SYSTEM_CONFIGURATION_CHANGED = "system_configuration_changed"
    BACKUP_CREATED = "backup_created"
    MAINTENANCE_MODE_ENABLED = "maintenance_mode_enabled"
    MAINTENANCE_MODE_DISABLED = "maintenance_mode_disabled"

class AuditSeverity(str, Enum):
    """Severity levels for audit events"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuditLogger:
    """Comprehensive audit logging system"""
    
    def __init__(self):
        self.sensitive_fields = {
            "password", "hashedPassword", "token", "secret", "key",
            "credit_card", "ssn", "social_security", "passport"
        }
    
    def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        action: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: AuditSeverity = AuditSeverity.MEDIUM,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ):
        """Log an audit event"""
        try:
            # Sanitize sensitive data
            sanitized_details = self._sanitize_sensitive_data(details) if details else {}
            
            # Create audit record
            audit_record = {
                "event_id": str(uuid.uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": event_type.value,
                "severity": severity.value,
                "user_id": user_id,
                "tenant_id": tenant_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "action": action,
                "details": sanitized_details,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "success": success,
                "error_message": error_message
            }
            
            # Log to file using the class logger
            logging.getLogger("audit").info(json.dumps(audit_record))
            
            # Store in database for long-term retention
            self._store_audit_record(audit_record)
            
        except Exception as e:
            # Fallback logging if audit system fails
            logging.error(f"Audit logging failed: {str(e)}")
    
    def _sanitize_sensitive_data(self, data: Any) -> Any:
        """Remove or mask sensitive data from audit logs"""
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                if key.lower() in self.sensitive_fields:
                    sanitized[key] = "[REDACTED]"
                elif isinstance(value, dict):
                    sanitized[key] = self._sanitize_sensitive_data(value)
                elif isinstance(value, list):
                    sanitized[key] = [
                        self._sanitize_sensitive_data(item) for item in value
                    ]
                else:
                    sanitized[key] = value
            return sanitized
        elif isinstance(data, list):
            return [self._sanitize_sensitive_data(item) for item in data]
        else:
            return data
    
    def _store_audit_record(self, audit_record: Dict[str, Any]):
        """Store audit record in database"""
        db = None
        try:
            from sqlalchemy.exc import OperationalError, DisconnectionError
            db = next(get_db())
            
            # Validate tenant_id exists before creating audit record
            tenant_id = audit_record.get("tenant_id")
            if tenant_id:
                from ..config.core_crud import get_tenant_by_id
                tenant = get_tenant_by_id(tenant_id, db)
                if not tenant:
                    logging.warning(f"Tenant {tenant_id} not found, skipping audit record")
                    return
            
            # Create audit record in database
            from ..config.database import AuditLog
            db_audit = AuditLog(
                eventId=audit_record["event_id"],
                eventType=audit_record["event_type"],
                severity=audit_record["severity"],
                userId=audit_record["user_id"],
                tenant_id=audit_record["tenant_id"],
                resourceType=audit_record["resource_type"],
                resourceId=audit_record["resource_id"],
                action=audit_record["action"],
                details=audit_record["details"],
                ipAddress=audit_record["ip_address"],
                userAgent=audit_record["user_agent"],
                success=audit_record["success"],
                errorMessage=audit_record["error_message"],
                timestamp=datetime.fromisoformat(audit_record["timestamp"])
            )
            
            db.add(db_audit)
            db.commit()
            
        except (OperationalError, DisconnectionError) as e:
            logging.warning(f"Database connection error while storing audit record (non-critical): {str(e)}")
        except Exception as e:
            logging.error(f"Failed to store audit record in database: {str(e)}")
        finally:
            if db is not None:
                try:
                    db.close()
                except Exception:
                    pass
    
    def log_http_request(
        self,
        request: Request,
        response: Response,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        processing_time: Optional[float] = None
    ):
        """Log HTTP request/response for audit purposes"""
        try:
            # Determine event type based on request method
            if request.method == "GET":
                event_type = AuditEventType.DATA_READ
            elif request.method == "POST":
                event_type = AuditEventType.DATA_CREATE
            elif request.method == "PUT" or request.method == "PATCH":
                event_type = AuditEventType.DATA_UPDATE
            elif request.method == "DELETE":
                event_type = AuditEventType.DATA_DELETE
            else:
                event_type = AuditEventType.DATA_READ
            
            # Determine severity based on response status
            if response.status_code >= 500:
                severity = AuditSeverity.CRITICAL
            elif response.status_code >= 400:
                severity = AuditSeverity.HIGH
            elif response.status_code >= 300:
                severity = AuditSeverity.MEDIUM
            else:
                severity = AuditSeverity.LOW
            
            # Extract resource information from URL
            path_parts = request.url.path.split("/")
            resource_type = path_parts[1] if len(path_parts) > 1 else None
            resource_id = path_parts[2] if len(path_parts) > 2 and path_parts[2] != "" else None
            
            # Log the event
            self.log_event(
                event_type=event_type,
                user_id=user_id,
                tenant_id=tenant_id,
                resource_type=resource_type,
                resource_id=resource_id,
                action=f"{request.method} {request.url.path}",
                details={
                    "method": request.method,
                    "url": str(request.url),
                    "query_params": dict(request.query_params),
                    "status_code": response.status_code,
                    "processing_time": processing_time,
                    "request_size": 0,  # request.body is not available in middleware context
                    "response_size": 0  # response.body might not be available
                },
                severity=severity,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                success=response.status_code < 400
            )
            
        except Exception as e:
            logging.error(f"HTTP request audit logging failed: {str(e)}")
    
    def log_security_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: AuditSeverity = AuditSeverity.HIGH,
        ip_address: Optional[str] = None
    ):
        """Log security-related events"""
        self.log_event(
            event_type=event_type,
            user_id=user_id,
            tenant_id=tenant_id,
            details=details,
            severity=severity,
            ip_address=ip_address,
            success=False
        )
    
    def log_user_activity(
        self,
        user_id: str,
        tenant_id: Optional[str] = None,
        action: str = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log user activity for compliance tracking"""
        self.log_event(
            event_type=AuditEventType.DATA_READ,
            user_id=user_id,
            tenant_id=tenant_id,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            details=details,
            severity=AuditSeverity.LOW
        )

# Global audit logger instance
audit_logger = AuditLogger()

# Decorator for automatic audit logging
def audit_log(
    event_type: AuditEventType,
    resource_type: Optional[str] = None,
    severity: AuditSeverity = AuditSeverity.MEDIUM
):
    """Decorator to automatically log function calls for audit purposes"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            
            try:
                # Extract user and tenant info from function arguments
                user_id = None
                tenant_id = None
                
                for arg in args:
                    if hasattr(arg, 'id') and hasattr(arg, 'tenant_id'):
                        user_id = str(arg.id)
                        tenant_id = str(arg.tenant_id) if arg.tenant_id else None
                        break
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Log successful execution
                processing_time = (datetime.utcnow() - start_time).total_seconds()
                audit_logger.log_event(
                    event_type=event_type,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    resource_type=resource_type,
                    action=f"Function call: {func.__name__}",
                    details={
                        "function_name": func.__name__,
                        "processing_time": processing_time,
                        "success": True
                    },
                    severity=severity
                )
                
                return result
                
            except Exception as e:
                # Log failed execution
                processing_time = (datetime.utcnow() - start_time).total_seconds()
                audit_logger.log_event(
                    event_type=event_type,
                    user_id=user_id,
                    tenant_id=tenant_id,
                    resource_type=resource_type,
                    action=f"Function call: {func.__name__}",
                    details={
                        "function_name": func.__name__,
                        "processing_time": processing_time,
                        "error": str(e),
                        "success": False
                    },
                    severity=severity
                )
                raise
                
        return wrapper
    return decorator
