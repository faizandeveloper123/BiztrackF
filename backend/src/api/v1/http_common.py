from typing import Optional, Tuple

from fastapi import HTTPException, status


def require_tenant(tenant_context: Optional[dict]) -> dict:
    if not tenant_context:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context required")
    return tenant_context


def tenant_id_str(tenant_context: Optional[dict]) -> str:
    return str(require_tenant(tenant_context)["tenant_id"])


def skip_limit(page: int, limit: int) -> Tuple[int, int]:
    return (page - 1) * limit, limit
