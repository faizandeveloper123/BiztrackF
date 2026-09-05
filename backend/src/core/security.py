import time
import hashlib
import re
from typing import Dict, List, Optional, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import json
import logging
from datetime import datetime, timedelta
from collections import defaultdict, deque
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityMiddleware:
    def __init__(self):
        # Rate limiting storage
        self.rate_limit_store: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.tenant_rate_limit_store: Dict[str, Dict[str, deque]] = defaultdict(lambda: defaultdict(lambda: deque(maxlen=1000)))
        
        # Security patterns
        self.sql_injection_patterns = [
            r"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)",
            r"(\b(and|or)\s+\d+\s*[=<>])",
            r"(\b(and|or)\s+['\"].*['\"])",
            r"(--|#|/\*|\*/)",
            r"(\bxp_|sp_|sysobjects|syscolumns)",
            r"(\bwaitfor\s+delay)",
            r"(\bchar\s*\(\s*\d+\s*\))",
        ]
        
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
            r"<form[^>]*>",
            r"<input[^>]*>",
        ]
        
        # Rate limit configurations
        self.rate_limits = {
            "default": {"requests": 100, "window": 60},  # 100 requests per minute
            "auth": {"requests": 10, "window": 60},      # 10 auth attempts per minute
            "api": {"requests": 1000, "window": 60},     # 1000 API calls per minute
            "tenant": {"requests": 500, "window": 60},   # 500 requests per tenant per minute
        }
    
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            # 1. Rate Limiting (check before processing)
            await self._check_rate_limits(request)
            
            # 2. Input Validation (check before processing)
            await self._validate_inputs(request)
            
            # 3. Process request and get response
            response = await call_next(request)
            
            # 4. Add security headers to response
            self._add_security_headers(response)
            
            # 5. Logging
            await self._log_request(request, response, start_time)
            
            return response
            
        except HTTPException as e:
            # Log security violations
            logger.warning(f"Security violation: {e.detail} from {request.client.host}")
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail, "error_code": "SECURITY_VIOLATION"}
            )
        except Exception as e:
            logger.error(f"Unexpected error in security middleware: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "error_code": "INTERNAL_ERROR"}
            )
    
    def _add_security_headers(self, response):
        """Add security headers to response"""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    async def _check_rate_limits(self, request: Request):
        """Check rate limits for the request"""
        client_ip = request.client.host
        endpoint = request.url.path
        tenant_id = request.headers.get("X-Tenant-ID")
        
        # Determine rate limit type
        if endpoint.startswith("/auth"):
            limit_type = "auth"
        elif tenant_id:
            limit_type = "tenant"
        else:
            limit_type = "default"
        
        # Check global rate limit
        if not await self._is_rate_limit_allowed(client_ip, limit_type):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {limit_type} operations"
            )
        
        # Check tenant-specific rate limit
        if tenant_id and not await self._is_tenant_rate_limit_allowed(tenant_id, client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Tenant rate limit exceeded"
            )
    
    async def _is_rate_limit_allowed(self, client_ip: str, limit_type: str) -> bool:
        """Check if rate limit is allowed for client IP"""
        now = time.time()
        window = self.rate_limits[limit_type]["window"]
        max_requests = self.rate_limits[limit_type]["requests"]
        
        key = f"{client_ip}:{limit_type}"
        requests = self.rate_limit_store[key]
        
        # Remove old requests outside the window
        while requests and requests[0] < now - window:
            requests.popleft()
        
        # Check if limit exceeded
        if len(requests) >= max_requests:
            return False
        
        # Add current request
        requests.append(now)
        return True
    
    async def _is_tenant_rate_limit_allowed(self, tenant_id: str, client_ip: str) -> bool:
        """Check if tenant rate limit is allowed"""
        now = time.time()
        window = self.rate_limits["tenant"]["window"]
        max_requests = self.rate_limits["tenant"]["requests"]
        
        key = f"{tenant_id}:{client_ip}"
        requests = self.tenant_rate_limit_store[tenant_id][key]
        
        # Remove old requests outside the window
        while requests and requests[0] < now - window:
            requests.popleft()
        
        # Check if limit exceeded
        if len(requests) >= max_requests:
            return False
        
        # Add current request
        requests.append(now)
        return True
    
    async def _validate_inputs(self, request: Request):
        """Validate request inputs for security threats"""
        # Check query parameters
        for key, value in request.query_params.items():
            if self._contains_malicious_content(value):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Malicious content detected in parameter: {key}"
                )
        
        # Check path parameters
        for key, value in request.path_params.items():
            if self._contains_malicious_content(str(value)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Malicious content detected in path parameter: {key}"
                )
        
        # Check headers - be more lenient with common browser headers
        for key, value in request.headers.items():
            if key.lower() in ["user-agent", "referer", "origin"]:
                # Only check for obvious malicious patterns in browser headers
                if self._contains_malicious_content(value):
                    # Log warning instead of blocking
                    logger.warning(f"Potentially suspicious header content: {key} = {value[:100]}")
                    # Don't block the request for normal browser headers
                    continue
    
    def _contains_malicious_content(self, content: str) -> bool:
        """Check if content contains malicious patterns"""
        if not content:
            return False
        
        content_lower = content.lower()
        
        # Check SQL injection patterns - be more specific
        for pattern in self.sql_injection_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        
        # Check XSS patterns - be more specific
        for pattern in self.xss_patterns:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        
        # Check for null byte injection
        if '\x00' in content:
            return True
        
        # Check for path traversal - be more specific
        if '..' in content and ('/../' in content or '\\..\\' in content):
            return True
        
        # Check for double slashes - be more specific
        if '//' in content and content.count('//') > 2:
            return True
        
        return False
    
    async def _log_request(self, request: Request, response, start_time: float):
        """Log request details for security monitoring"""
        duration = time.time() - start_time
        client_ip = request.client.host
        method = request.method
        url = str(request.url)
        status_code = response.status_code
        tenant_id = request.headers.get("X-Tenant-ID", "none")
        
        # Log security-relevant information
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "client_ip": client_ip,
            "method": method,
            "url": url,
            "status_code": status_code,
            "duration": round(duration, 3),
            "tenant_id": tenant_id,
            "user_agent": request.headers.get("user-agent", "unknown"),
            "referer": request.headers.get("referer", "unknown")
        }
        
        # Log suspicious activities
        if status_code >= 400:
            logger.warning(f"Request failed: {json.dumps(log_data)}")
        elif duration > 5.0:  # Log slow requests
            logger.info(f"Slow request: {json.dumps(log_data)}")
        else:
            logger.debug(f"Request processed: {json.dumps(log_data)}")

# Global security middleware instance
security_middleware = SecurityMiddleware()
