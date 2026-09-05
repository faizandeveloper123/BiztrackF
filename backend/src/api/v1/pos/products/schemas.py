from pydantic import BaseModel
from typing import Any, Dict, Optional

from .....models.inventory_models import ProductCategory


class ProductFilters(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    lowStock: Optional[bool] = None
    isActive: Optional[bool] = None


class CategoryCreate(BaseModel):
    name: str


class ProductCodeLookupResponse(BaseModel):
    source: str
    codeType: str
    existsInCatalog: bool
    existingProductId: Optional[str] = None
    suggested: Dict[str, Any]
    message: str


def default_category_values():
    return [e.value for e in ProductCategory]
