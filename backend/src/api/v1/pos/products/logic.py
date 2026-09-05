import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....models.inventory_models import (
    Product as PydanticProduct,
    ProductCreate,
    ProductUpdate,
    ProductsResponse,
    ProductResponse,
    ProductCategory,
    WORKSHOP_CATEGORIES,
)
from .....config.database import (
    get_products,
    get_product_by_id,
    create_product,
    update_product,
    delete_product,
)
from ..categories.logic import get_pos_categories
from .schemas import default_category_values
from .code_lookup import lookup_product_code as resolve_product_code


def convert_db_product_to_pydantic(db_product, supplier_name: Optional[str] = None):
    supplier_id = getattr(db_product, "supplierId", None)
    pack_size = getattr(db_product, "packSize", None) or 1

    return PydanticProduct(
        id=str(db_product.id),
        tenant_id=str(db_product.tenant_id),
        name=db_product.name,
        sku=db_product.sku,
        description=db_product.description,
        category=db_product.category or "other",
        brand=getattr(db_product, "brand", None),
        productType=getattr(db_product, "productType", None),
        packSize=pack_size,
        salePrice=db_product.salePrice,
        costPerUnitPrice=db_product.costPerUnitPrice,
        stockQuantity=db_product.stockQuantity,
        minStockLevel=db_product.minStockLevel,
        maxStockLevel=db_product.maxStockLevel,
        unitOfMeasure=db_product.unit or "piece",
        barcode=db_product.barcode,
        expiryDate=db_product.expiryDate.isoformat() if db_product.expiryDate else None,
        batchNumber=db_product.batchNumber,
        serialNumber=db_product.serialNumber,
        mfgDate=db_product.mfgDate.isoformat() if getattr(db_product, "mfgDate", None) else None,
        dateOfPurchase=db_product.dateOfPurchase.isoformat() if getattr(db_product, "dateOfPurchase", None) else None,
        modelNo=getattr(db_product, "modelNo", None),
        isActive=db_product.isActive,
        imageUrl=None,
        weight=None,
        dimensions=None,
        supplierId=str(supplier_id) if supplier_id else None,
        supplierName=supplier_name,
        leadTime=None,
        reorderPoint=None,
        reorderQuantity=None,
        isSerialized=False,
        isBatchTracked=False,
        storageLocation=None,
        warehouseId=None,
        lastStockCount=None,
        lastStockMovement=None,
        createdBy="system",
        createdAt=db_product.createdAt,
        updatedAt=db_product.updatedAt,
    )


def build_product_supplier_name_map(db: Session, tenant_id: str, db_products) -> dict:
    from .....config.hrm_models import Supplier
    import uuid as uuid_lib

    supplier_ids = []
    for product in db_products:
        supplier_id = getattr(product, "supplierId", None)
        if supplier_id:
            supplier_ids.append(supplier_id)

    if not supplier_ids:
        return {}

    rows = (
        db.query(Supplier.id, Supplier.name)
        .filter(
            Supplier.tenant_id == uuid_lib.UUID(str(tenant_id)),
            Supplier.id.in_(supplier_ids),
        )
        .all()
    )
    return {str(supplier_id): name for supplier_id, name in rows}


def convert_single_product_to_pydantic(db: Session, tenant_id: str, db_product):
    supplier_map = build_product_supplier_name_map(db, tenant_id, [db_product])
    supplier_id = getattr(db_product, "supplierId", None)
    supplier_name = supplier_map.get(str(supplier_id)) if supplier_id else None
    return convert_db_product_to_pydantic(db_product, supplier_name)


def convert_products_to_pydantic(db: Session, tenant_id: str, db_products):
    supplier_map = build_product_supplier_name_map(db, tenant_id, db_products)
    return [
        convert_db_product_to_pydantic(
            db_product,
            supplier_map.get(str(getattr(db_product, "supplierId", "") or "")),
        )
        for db_product in db_products
    ]


def get_allowed_category_values(
    db: Session,
    tenant_id: str,
    plan_type: Optional[str] = None,
) -> List[str]:
    default = (
        WORKSHOP_CATEGORIES
        if (plan_type or "").lower() == "workshop"
        else default_category_values()
    )
    custom = [c.name for c in get_pos_categories(db, tenant_id)]
    return default + custom


def list_pos_products(
    db: Session,
    tenant_context: dict,
    category: Optional[str],
    search: Optional[str],
    low_stock: Optional[bool],
    is_active: Optional[bool],
    page: int,
    limit: int,
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        skip = (page - 1) * limit
        products = get_products(db, tenant_context["tenant_id"], skip, limit)

        if category or search or low_stock is not None or is_active is not None:
            filtered_products = []
            for product in products:
                if category and product.category != category:
                    continue
                if search:
                    search_lower = search.lower()
                    if not any([
                        search_lower in (product.name or "").lower(),
                        search_lower in (product.sku or "").lower(),
                        search_lower in (product.description or "").lower(),
                    ]):
                        continue
                if low_stock is not None:
                    if low_stock and product.stockQuantity > product.lowStockThreshold:
                        continue
                    if not low_stock and product.stockQuantity <= product.lowStockThreshold:
                        continue
                if is_active is not None and product.isActive != is_active:
                    continue
                filtered_products.append(product)
            products = filtered_products

        pydantic_products = convert_products_to_pydantic(
            db,
            tenant_context["tenant_id"],
            products,
        )
        total = len(pydantic_products)

        return ProductsResponse(
            products=pydantic_products,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")


def search_pos_products(db: Session, tenant_context: dict, q: str):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        products = get_products(db, tenant_context["tenant_id"], 0, 100)
        pydantic_products = convert_products_to_pydantic(
            db,
            tenant_context["tenant_id"],
            products,
        )

        search_lower = q.lower()
        matching_products = []
        for product in pydantic_products:
            if (
                search_lower in product.name.lower()
                or search_lower in product.sku.lower()
                or (product.barcode and search_lower in product.barcode.lower())
                or (product.productType and search_lower in product.productType.lower())
                or (product.brand and search_lower in product.brand.lower())
                or (product.supplierName and search_lower in product.supplierName.lower())
                or (product.category and search_lower in product.category.lower())
            ):
                matching_products.append(product)

        return {"products": matching_products[:10], "total": len(matching_products)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching products: {str(e)}")


def lookup_product_code(db: Session, tenant_context: dict, code: str):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        return resolve_product_code(db, tenant_context["tenant_id"], code)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error looking up product code: {str(e)}")


def get_pos_product(db: Session, tenant_context: dict, product_id: str):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        db_product = get_product_by_id(product_id, db, tenant_context["tenant_id"])
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        pydantic_product = convert_single_product_to_pydantic(
            db,
            tenant_context["tenant_id"],
            db_product,
        )
        return ProductResponse(product=pydantic_product)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product: {str(e)}")


def create_pos_product(
    db: Session,
    tenant_context: dict,
    current_user,
    product_data: ProductCreate,
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    allowed = get_allowed_category_values(
        db,
        tenant_context["tenant_id"],
        tenant_context.get("plan_type"),
    )
    if product_data.category not in allowed:
        raise HTTPException(status_code=400, detail="Invalid category")
    try:
        product_dict = product_data.dict()

        def opt(v):
            return None if v is None or v == "" else v

        def opt_date(v):
            if v is None or v == "":
                return None
            if hasattr(v, "isoformat"):
                return v
            return v

        mapped_data = {
            "name": product_dict.get("name"),
            "sku": product_dict.get("sku"),
            "description": opt(product_dict.get("description")),
            "category": product_dict.get("category"),
            "brand": opt(product_dict.get("brand")),
            "productType": opt(product_dict.get("productType")),
            "packSize": product_dict.get("packSize", 1),
            "supplierId": opt(product_dict.get("supplierId")),
            "costPerUnitPrice": product_dict.get("costPerUnitPrice"),
            "salePrice": product_dict.get("salePrice", 0),
            "stockQuantity": product_dict.get("stockQuantity", 0),
            "minStockLevel": product_dict.get("minStockLevel", 0),
            "maxStockLevel": product_dict.get("maxStockLevel"),
            "unit": product_dict.get("unitOfMeasure", "piece"),
            "weight": None,
            "dimensions": None,
            "barcode": opt(product_dict.get("barcode")),
            "expiryDate": opt_date(product_dict.get("expiryDate")),
            "batchNumber": opt(product_dict.get("batchNumber")),
            "serialNumber": opt(product_dict.get("serialNumber")),
            "mfgDate": opt_date(product_dict.get("mfgDate")),
            "dateOfPurchase": opt_date(product_dict.get("dateOfPurchase")),
            "modelNo": opt(product_dict.get("modelNo")),
            "isActive": product_dict.get("isActive", True),
        }

        payload = {
            "id": str(uuid.uuid4()),
            **mapped_data,
            "tenant_id": tenant_context["tenant_id"],
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }

        db_product = create_product(payload, db)
        pydantic_product = convert_single_product_to_pydantic(
            db,
            tenant_context["tenant_id"],
            db_product,
        )
        pydantic_product.createdBy = str(current_user.id)
        return ProductResponse(product=pydantic_product)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


def update_pos_product(
    db: Session,
    tenant_context: dict,
    product_id: str,
    product_data: ProductUpdate,
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    if "category" in product_data.dict(exclude_unset=True):
        allowed = get_allowed_category_values(
            db,
            tenant_context["tenant_id"],
            tenant_context.get("plan_type"),
        )
        if product_data.category not in allowed:
            raise HTTPException(status_code=400, detail="Invalid category")
    try:
        product_dict = product_data.dict(exclude_unset=True)
        mapped_data = {}
        field_map = {
            "name": "name",
            "sku": "sku",
            "description": "description",
            "category": "category",
            "brand": "brand",
            "productType": "productType",
            "packSize": "packSize",
            "supplierId": "supplierId",
            "costPerUnitPrice": "costPerUnitPrice",
            "salePrice": "salePrice",
            "stockQuantity": "stockQuantity",
            "minStockLevel": "minStockLevel",
            "maxStockLevel": "maxStockLevel",
            "barcode": "barcode",
            "batchNumber": "batchNumber",
            "serialNumber": "serialNumber",
            "isActive": "isActive",
            "modelNo": "modelNo",
        }
        for src, dst in field_map.items():
            if src in product_dict:
                val = product_dict[src]
                mapped_data[dst] = val if src in ("isActive", "packSize", "costPerUnitPrice", "salePrice", "stockQuantity", "minStockLevel", "maxStockLevel") else (val or None)
        if "unitOfMeasure" in product_dict:
            mapped_data["unit"] = product_dict["unitOfMeasure"]
        for date_field in ("expiryDate", "mfgDate", "dateOfPurchase"):
            if date_field in product_dict:
                v = product_dict[date_field]
                mapped_data[date_field] = None if v is None or v == "" else v

        mapped_data["updatedAt"] = datetime.now()
        db_product = update_product(
            product_id,
            mapped_data,
            db,
            tenant_context["tenant_id"],
        )
        if not db_product:
            raise HTTPException(status_code=404, detail="Product not found")
        pydantic_product = convert_single_product_to_pydantic(
            db,
            tenant_context["tenant_id"],
            db_product,
        )
        return ProductResponse(product=pydantic_product)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")


def delete_pos_product(db: Session, tenant_context: dict, product_id: str):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    try:
        success = delete_product(product_id, db, tenant_context["tenant_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")
