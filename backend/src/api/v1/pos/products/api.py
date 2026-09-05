from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.inventory_models import ProductCreate, ProductUpdate, ProductsResponse, ProductResponse
from . import logic
from .schemas import ProductCodeLookupResponse

router = APIRouter()


@router.get("/products", response_model=ProductsResponse)
async def list_pos_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:view")),
):
    return logic.list_pos_products(
        db, tenant_context, category, search, low_stock, is_active, page, limit
    )


@router.get("/products/search")
async def search_products(
    q: str = Query(..., description="Search query for product name, SKU, or barcode"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:view")),
):
    return logic.search_pos_products(db, tenant_context, q)


@router.get("/products/lookup", response_model=ProductCodeLookupResponse)
async def lookup_product_code(
    code: str = Query(..., description="Scanned QR or barcode value"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:view")),
):
    return logic.lookup_product_code(db, tenant_context, code)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_pos_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:view")),
):
    return logic.get_pos_product(db, tenant_context, product_id)


@router.post("/products", response_model=ProductResponse)
async def create_pos_product(
    product_data: ProductCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:create")),
):
    return logic.create_pos_product(db, tenant_context, current_user, product_data)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_pos_product(
    product_id: str,
    product_data: ProductUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:update")),
):
    return logic.update_pos_product(db, tenant_context, product_id, product_data)


@router.delete("/products/{product_id}")
async def delete_pos_product(
    product_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:delete")),
):
    return logic.delete_pos_product(db, tenant_context, product_id)
