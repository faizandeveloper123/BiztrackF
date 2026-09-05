import json
import re
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

import requests
from sqlalchemy.orm import Session

from .....config.database import get_product_by_barcode


FOOD_CATEGORY_KEYWORDS = {
    "food": "food",
    "beverages": "beverages",
    "drinks": "beverages",
    "beauty": "beauty",
    "cosmetics": "beauty",
    "electronics": "electronics",
    "clothing": "clothing",
    "home": "home",
    "sports": "sports",
    "books": "books",
    "automotive": "automotive",
}


def _clean_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _clean_number(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clean_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def is_barcode_like(code: str) -> bool:
    normalized = re.sub(r"\s+", "", code)
    return bool(re.fullmatch(r"\d{4,14}", normalized))


def map_external_category(raw_categories: Any) -> str:
    if not raw_categories:
        return "other"
    if isinstance(raw_categories, list):
        joined = " ".join(str(item) for item in raw_categories).lower()
    else:
        joined = str(raw_categories).lower()
    for keyword, category in FOOD_CATEGORY_KEYWORDS.items():
        if keyword in joined:
            return category
    return "other"


def parse_structured_code(raw_code: str) -> Optional[Dict[str, Any]]:
    trimmed = raw_code.strip()
    if not trimmed:
        return None

    if trimmed.startswith("{") and trimmed.endswith("}"):
        try:
            payload = json.loads(trimmed)
            if isinstance(payload, dict):
                return normalize_suggested_fields(payload, trimmed)
        except json.JSONDecodeError:
            pass

    if trimmed.startswith("biztrack:"):
        try:
            payload = json.loads(trimmed[len("biztrack:"):])
            if isinstance(payload, dict):
                return normalize_suggested_fields(payload, trimmed)
        except json.JSONDecodeError:
            pass

    parsed_url = urlparse(trimmed)
    if parsed_url.scheme in {"http", "https"} and parsed_url.query:
        query = parse_qs(parsed_url.query)
        flattened = {key: values[0] for key, values in query.items() if values}
        if flattened:
            return normalize_suggested_fields(flattened, trimmed)

    return None


def normalize_suggested_fields(payload: Dict[str, Any], fallback_code: str) -> Dict[str, Any]:
    barcode = _clean_str(payload.get("barcode") or payload.get("gtin") or payload.get("ean") or payload.get("upc"))
    sku = _clean_str(payload.get("sku") or payload.get("code") or barcode or fallback_code)
    name = _clean_str(payload.get("name") or payload.get("productName") or payload.get("product_name"))
    description = _clean_str(payload.get("description") or payload.get("generic_name"))
    brand = _clean_str(payload.get("brand") or payload.get("company") or payload.get("brands"))
    category = _clean_str(payload.get("category"))
    product_type = _clean_str(payload.get("productType") or payload.get("type"))
    model_no = _clean_str(payload.get("modelNo") or payload.get("model") or payload.get("model_number"))
    batch_number = _clean_str(payload.get("batchNumber") or payload.get("batch"))
    serial_number = _clean_str(payload.get("serialNumber") or payload.get("serial"))
    expiry_date = _clean_str(payload.get("expiryDate") or payload.get("expiry"))
    mfg_date = _clean_str(payload.get("mfgDate") or payload.get("manufacturingDate"))
    date_of_purchase = _clean_str(payload.get("dateOfPurchase") or payload.get("purchaseDate"))
    unit_of_measure = _clean_str(payload.get("unitOfMeasure") or payload.get("unit"))

    suggested: Dict[str, Any] = {
        "name": name,
        "sku": sku,
        "description": description,
        "brand": brand,
        "category": category or "other",
        "productType": product_type,
        "packSize": _clean_int(payload.get("packSize")) or 1,
        "salePrice": _clean_number(payload.get("salePrice") or payload.get("unitPrice") or payload.get("price")),
        "costPerUnitPrice": _clean_number(payload.get("costPerUnitPrice") or payload.get("costPrice") or payload.get("cost")),
        "stockQuantity": _clean_int(payload.get("stockQuantity") or payload.get("quantity")),
        "minStockLevel": _clean_int(payload.get("minStockLevel")),
        "unitOfMeasure": unit_of_measure or "piece",
        "barcode": barcode or (_clean_str(fallback_code) if is_barcode_like(fallback_code) else None),
        "expiryDate": expiry_date,
        "batchNumber": batch_number,
        "serialNumber": serial_number,
        "mfgDate": mfg_date,
        "dateOfPurchase": date_of_purchase,
        "modelNo": model_no,
    }
    return {key: value for key, value in suggested.items() if value is not None}


def db_product_to_suggested(db_product) -> Dict[str, Any]:
    return normalize_suggested_fields(
        {
            "name": db_product.name,
            "sku": db_product.sku,
            "description": db_product.description,
            "brand": getattr(db_product, "brand", None),
            "category": db_product.category,
            "productType": getattr(db_product, "productType", None),
            "packSize": getattr(db_product, "packSize", None),
            "salePrice": db_product.salePrice,
            "costPerUnitPrice": db_product.costPerUnitPrice,
            "stockQuantity": db_product.stockQuantity,
            "minStockLevel": db_product.minStockLevel,
            "unitOfMeasure": db_product.unit,
            "barcode": db_product.barcode,
            "expiryDate": db_product.expiryDate.isoformat() if db_product.expiryDate else None,
            "batchNumber": db_product.batchNumber,
            "serialNumber": db_product.serialNumber,
            "mfgDate": db_product.mfgDate.isoformat() if getattr(db_product, "mfgDate", None) else None,
            "dateOfPurchase": db_product.dateOfPurchase.isoformat()
            if getattr(db_product, "dateOfPurchase", None)
            else None,
            "modelNo": getattr(db_product, "modelNo", None),
        },
        db_product.barcode or db_product.sku,
    )


def lookup_open_food_facts(barcode: str) -> Optional[Dict[str, Any]]:
    try:
        response = requests.get(
            f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json",
            timeout=5,
            headers={"User-Agent": "BizTrack/1.0"},
        )
        if response.status_code != 200:
            return None
        payload = response.json()
        if payload.get("status") != 1:
            return None
        product = payload.get("product") or {}
        name = (
            _clean_str(product.get("product_name"))
            or _clean_str(product.get("product_name_en"))
            or _clean_str(product.get("generic_name"))
        )
        if not name:
            return None
        return normalize_suggested_fields(
            {
                "name": name,
                "sku": barcode,
                "description": product.get("generic_name") or product.get("ingredients_text"),
                "brand": (product.get("brands") or "").split(",")[0].strip() if product.get("brands") else None,
                "category": map_external_category(product.get("categories_tags") or product.get("categories")),
                "barcode": barcode,
                "salePrice": product.get("price"),
            },
            barcode,
        )
    except requests.RequestException:
        return None


def lookup_product_code(db: Session, tenant_id: str, raw_code: str) -> Dict[str, Any]:
    code = raw_code.strip()
    if not code:
        return {
            "source": "invalid",
            "codeType": "unknown",
            "existsInCatalog": False,
            "existingProductId": None,
            "suggested": {},
            "message": "Scanned code is empty.",
        }

    structured = parse_structured_code(code)
    lookup_barcode = None
    if structured and structured.get("barcode"):
        lookup_barcode = structured["barcode"]
    elif is_barcode_like(code):
        lookup_barcode = re.sub(r"\s+", "", code)

    if lookup_barcode:
        existing = get_product_by_barcode(db, lookup_barcode, tenant_id)
        if existing:
            return {
                "source": "catalog",
                "codeType": "barcode",
                "existsInCatalog": True,
                "existingProductId": str(existing.id),
                "suggested": db_product_to_suggested(existing),
                "message": "A product with this barcode already exists in your catalog.",
            }

    if structured:
        return {
            "source": "qr_json",
            "codeType": "qr",
            "existsInCatalog": False,
            "existingProductId": None,
            "suggested": structured,
            "message": "Product details loaded from QR code.",
        }

    if lookup_barcode:
        external = lookup_open_food_facts(lookup_barcode)
        if external:
            return {
                "source": "openfoodfacts",
                "codeType": "barcode",
                "existsInCatalog": False,
                "existingProductId": None,
                "suggested": external,
                "message": "Product details loaded from barcode database.",
            }
        return {
            "source": "barcode",
            "codeType": "barcode",
            "existsInCatalog": False,
            "existingProductId": None,
            "suggested": normalize_suggested_fields({"barcode": lookup_barcode, "sku": lookup_barcode}, lookup_barcode),
            "message": "Barcode captured. Fill in remaining product details.",
        }

    return {
        "source": "raw_code",
        "codeType": "qr",
        "existsInCatalog": False,
        "existingProductId": None,
        "suggested": normalize_suggested_fields({"sku": code, "name": code}, code),
        "message": "Code captured. Fill in remaining product details.",
    }
