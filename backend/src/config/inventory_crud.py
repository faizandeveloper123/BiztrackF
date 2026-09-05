from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from .inventory_models import Product, Warehouse, PurchaseOrder, Receiving, StorageLocation, StockMovement
from .hrm_models import Supplier

# Product functions
def get_product_by_id(product_id: str, db: Session, tenant_id: str = None) -> Optional[Product]:
    query = db.query(Product).filter(Product.id == product_id)
    if tenant_id:
        query = query.filter(Product.tenant_id == tenant_id)
    return query.first()

def get_product_by_sku(sku: str, db: Session, tenant_id: str = None) -> Optional[Product]:
    query = db.query(Product).filter(Product.sku == sku)
    if tenant_id:
        query = query.filter(Product.tenant_id == tenant_id)
    return query.first()

def get_product_by_barcode(barcode: str, db: Session, tenant_id: str = None) -> Optional[Product]:
    query = db.query(Product).filter(Product.barcode == barcode)
    if tenant_id:
        query = query.filter(Product.tenant_id == tenant_id)
    return query.first()

def get_all_products(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Product]:
    query = db.query(Product)
    if tenant_id:
        query = query.filter(Product.tenant_id == tenant_id)
    return query.order_by(Product.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_products(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Product]:
    """Get all products (alias for get_all_products)"""
    return get_all_products(db, tenant_id, skip, limit)

def get_products_by_category(category: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Product]:
    query = db.query(Product).filter(Product.category == category)
    if tenant_id:
        query = query.filter(Product.tenant_id == tenant_id)
    return query.order_by(Product.createdAt.desc()).offset(skip).limit(limit).all()

def get_low_stock_products(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Product]:
    query = db.query(Product).filter(
        Product.stockQuantity <= Product.minStockLevel,
        Product.isActive == True
    )
    if tenant_id:
        query = query.filter(Product.tenant_id == tenant_id)
    return query.order_by(Product.stockQuantity.asc()).offset(skip).limit(limit).all()

def create_product(product_data: dict, db: Session) -> Product:
    db_product = Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(product_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Product]:
    product = get_product_by_id(product_id, db, tenant_id)
    if product:
        for key, value in update_data.items():
            if key == 'updatedAt':
                continue
            if hasattr(product, key):
                setattr(product, key, value)
        product.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(product)
    return product

def delete_product(product_id: str, db: Session, tenant_id: str = None) -> bool:
    product = get_product_by_id(product_id, db, tenant_id)
    if product:
        db.delete(product)
        db.commit()
        return True
    return False

# Warehouse functions
def get_warehouse_by_id(warehouse_id: str, db: Session, tenant_id: str = None) -> Optional[Warehouse]:
    query = db.query(Warehouse).filter(Warehouse.id == warehouse_id)
    if tenant_id:
        query = query.filter(Warehouse.tenant_id == tenant_id)
    return query.first()

def get_warehouse_by_code(code: str, db: Session, tenant_id: str = None) -> Optional[Warehouse]:
    query = db.query(Warehouse).filter(Warehouse.code == code)
    if tenant_id:
        query = query.filter(Warehouse.tenant_id == tenant_id)
    return query.first()

def get_all_warehouses(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Warehouse]:
    query = db.query(Warehouse)
    if tenant_id:
        query = query.filter(Warehouse.tenant_id == tenant_id)
    return query.order_by(Warehouse.createdAt.desc()).offset(skip).limit(limit).all()

def get_active_warehouses(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Warehouse]:
    query = db.query(Warehouse).filter(Warehouse.isActive == True)
    if tenant_id:
        query = query.filter(Warehouse.tenant_id == tenant_id)
    return query.order_by(Warehouse.createdAt.desc()).offset(skip).limit(limit).all()

# Alias functions for backward compatibility
def get_warehouses(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Warehouse]:
    """Get all warehouses (alias for get_all_warehouses)"""
    return get_all_warehouses(db, tenant_id, skip, limit)

def create_warehouse(warehouse_data: dict, db: Session) -> Warehouse:
    db_warehouse = Warehouse(**warehouse_data)
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

def update_warehouse(warehouse_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Warehouse]:
    warehouse = get_warehouse_by_id(warehouse_id, db, tenant_id)
    if warehouse:
        for key, value in update_data.items():
            if hasattr(warehouse, key) and value is not None:
                setattr(warehouse, key, value)
        warehouse.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(warehouse)
    return warehouse

def delete_warehouse(warehouse_id: str, db: Session, tenant_id: str = None) -> bool:
    """Delete warehouse and all related records"""
    try:
        warehouse = get_warehouse_by_id(warehouse_id, db, tenant_id)
        if not warehouse:
            return False
        
        # Delete related stock movements first
        from .inventory_models import StockMovement
        stock_movements = db.query(StockMovement).filter(
            StockMovement.warehouseId == warehouse_id
        ).all()
        for movement in stock_movements:
            db.delete(movement)
        
        # Delete related storage locations
        from .inventory_models import StorageLocation
        storage_locations = db.query(StorageLocation).filter(
            StorageLocation.warehouseId == warehouse_id
        ).all()
        for location in storage_locations:
            db.delete(location)
        
        # Delete related purchase orders
        from .inventory_models import PurchaseOrder
        purchase_orders = db.query(PurchaseOrder).filter(
            PurchaseOrder.warehouseId == warehouse_id
        ).all()
        for po in purchase_orders:
            db.delete(po)
        
        # Delete related receivings
        from .inventory_models import Receiving
        receivings = db.query(Receiving).filter(
            Receiving.warehouseId == warehouse_id
        ).all()
        for receiving in receivings:
            db.delete(receiving)
        
        # Finally delete the warehouse
        db.delete(warehouse)
        db.commit()
        return True
        
    except Exception as e:
        db.rollback()
        print(f"Error deleting warehouse: {str(e)}")
        return False

# PurchaseOrder functions
def get_purchase_order_by_id(po_id: str, db: Session, tenant_id: str = None) -> Optional[PurchaseOrder]:
    query = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id)
    if tenant_id:
        query = query.filter(PurchaseOrder.tenant_id == tenant_id)
    return query.first()

def get_purchase_order_by_number(po_number: str, db: Session, tenant_id: str = None) -> Optional[PurchaseOrder]:
    query = db.query(PurchaseOrder).filter(PurchaseOrder.poNumber == po_number)
    if tenant_id:
        query = query.filter(PurchaseOrder.tenant_id == tenant_id)
    return query.first()

def get_all_purchase_orders(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PurchaseOrder]:
    query = db.query(PurchaseOrder)
    if tenant_id:
        query = query.filter(PurchaseOrder.tenant_id == tenant_id)
    return query.order_by(PurchaseOrder.orderDate.desc()).offset(skip).limit(limit).all()

# Alias function for backward compatibility
def get_purchase_orders(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PurchaseOrder]:
    """Get all purchase orders (alias for get_all_purchase_orders)"""
    return get_all_purchase_orders(db, tenant_id, skip, limit)

def get_purchase_orders_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PurchaseOrder]:
    query = db.query(PurchaseOrder).filter(PurchaseOrder.status == status)
    if tenant_id:
        query = query.filter(PurchaseOrder.tenant_id == tenant_id)
    return query.order_by(PurchaseOrder.orderDate.desc()).offset(skip).limit(limit).all()

def get_purchase_orders_by_supplier(supplier_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[PurchaseOrder]:
    query = db.query(PurchaseOrder).filter(PurchaseOrder.supplierId == supplier_id)
    if tenant_id:
        query = query.filter(PurchaseOrder.tenant_id == tenant_id)
    return query.order_by(PurchaseOrder.orderDate.desc()).offset(skip).limit(limit).all()

def create_purchase_order(po_data: dict, db: Session) -> PurchaseOrder:
    db_po = PurchaseOrder(**po_data)
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    return db_po

def update_purchase_order(po_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[PurchaseOrder]:
    po = get_purchase_order_by_id(po_id, db, tenant_id)
    if po:
        nullable_fields = {
            "jobCardId", "vehicleId", "purchaseForType", "vehicleReg",
            "department", "deliveryLocation", "requisitionNumber", "batchNumber", "notes",
        }
        for key, value in update_data.items():
            if hasattr(po, key) and (key in nullable_fields or value is not None):
                setattr(po, key, value)
        po.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(po)
    return po

def delete_purchase_order(po_id: str, db: Session, tenant_id: str = None) -> bool:
    po = get_purchase_order_by_id(po_id, db, tenant_id)
    if not po:
        return False

    receiving_query = db.query(Receiving).filter(Receiving.purchaseOrderId == po.id)
    if tenant_id:
        receiving_query = receiving_query.filter(Receiving.tenant_id == tenant_id)
    has_receivings = receiving_query.first() is not None
    if has_receivings:
        raise ValueError("Cannot delete purchase order with linked receivings")

    try:
        db.delete(po)
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        raise ValueError("Cannot delete purchase order because related records exist")
    return False

# Receiving functions
def get_receiving_by_id(receiving_id: str, db: Session, tenant_id: str = None) -> Optional[Receiving]:
    query = db.query(Receiving).filter(Receiving.id == receiving_id)
    if tenant_id:
        query = query.filter(Receiving.tenant_id == tenant_id)
    return query.first()

def get_receiving_by_number(receiving_number: str, db: Session, tenant_id: str = None) -> Optional[Receiving]:
    query = db.query(Receiving).filter(Receiving.receivingNumber == receiving_number)
    if tenant_id:
        query = query.filter(Receiving.tenant_id == tenant_id)
    return query.first()

def get_all_receivings(db: Session, tenant_id: str = None, status: str = None, skip: int = 0, limit: int = 100) -> List[Receiving]:
    query = db.query(Receiving)
    if tenant_id:
        query = query.filter(Receiving.tenant_id == tenant_id)
    if status:
        query = query.filter(Receiving.status == status)
    return query.order_by(Receiving.createdAt.desc()).offset(skip).limit(limit).all()

# Alias function for backward compatibility
def get_receivings(db: Session, tenant_id: str = None, status: str = None, skip: int = 0, limit: int = 100) -> List[Receiving]:
    """Get all receivings (alias for get_all_receivings)"""
    return get_all_receivings(db, tenant_id, status, skip, limit)

def get_receivings_by_purchase_order(po_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Receiving]:
    query = db.query(Receiving).filter(Receiving.purchaseOrderId == po_id)
    if tenant_id:
        query = query.filter(Receiving.tenant_id == tenant_id)
    return query.order_by(Receiving.createdAt.desc()).offset(skip).limit(limit).all()

def create_receiving(receiving_data: dict, db: Session) -> Receiving:
    db_receiving = Receiving(**receiving_data)
    db.add(db_receiving)
    db.commit()
    db.refresh(db_receiving)
    return db_receiving

def update_receiving(receiving_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Receiving]:
    receiving = get_receiving_by_id(receiving_id, db, tenant_id)
    if receiving:
        for key, value in update_data.items():
            if hasattr(receiving, key) and value is not None:
                setattr(receiving, key, value)
        receiving.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(receiving)
    return receiving

def delete_receiving(receiving_id: str, db: Session, tenant_id: str = None) -> bool:
    receiving = get_receiving_by_id(receiving_id, db, tenant_id)
    if receiving:
        db.delete(receiving)
        db.commit()
        return True
    return False

# StorageLocation functions
def get_active_storage_locations(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[StorageLocation]:
    query = db.query(StorageLocation).filter(StorageLocation.isActive == True)
    if tenant_id:
        query = query.filter(StorageLocation.tenant_id == tenant_id)
    return query.order_by(StorageLocation.createdAt.desc()).offset(skip).limit(limit).all()

def get_storage_location_by_id(location_id: str, db: Session, tenant_id: str = None) -> Optional[StorageLocation]:
    query = db.query(StorageLocation).filter(StorageLocation.id == location_id)
    if tenant_id:
        query = query.filter(StorageLocation.tenant_id == tenant_id)
    return query.first()

def get_storage_location_by_code(code: str, db: Session, tenant_id: str = None) -> Optional[StorageLocation]:
    query = db.query(StorageLocation).filter(StorageLocation.code == code)
    if tenant_id:
        query = query.filter(StorageLocation.tenant_id == tenant_id)
    return query.first()

def create_storage_location(storage_location_data: dict, db: Session) -> StorageLocation:
    if storage_location_data.get('parentLocationId') == '':
        storage_location_data['parentLocationId'] = None
    
    db_storage_location = StorageLocation(**storage_location_data)
    db.add(db_storage_location)
    db.commit()
    db.refresh(db_storage_location)
    return db_storage_location

def update_storage_location(location_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[StorageLocation]:
    if not isinstance(update_data, dict):
        raise TypeError("update_data must be a dict")
    if update_data.get('parentLocationId') == '':
        update_data['parentLocationId'] = None
        
    location = get_storage_location_by_id(location_id, db, tenant_id)
    if location:
        for key, value in update_data.items():
            if hasattr(location, key) and value is not None:
                setattr(location, key, value)
        location.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(location)
    return location

def delete_storage_location(location_id: str, tenant_id: str, db: Session) -> bool:
    location = get_storage_location_by_id(location_id, db, tenant_id)
    if location:
        db.delete(location)
        db.commit()
        return True
    return False

def get_storage_locations_by_warehouse(warehouse_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[StorageLocation]:
    query = db.query(StorageLocation).filter(StorageLocation.warehouseId == warehouse_id)
    if tenant_id:
        query = query.filter(StorageLocation.tenant_id == tenant_id)
    return query.order_by(StorageLocation.createdAt.desc()).offset(skip).limit(limit).all()

def get_all_storage_locations(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[StorageLocation]:
    query = db.query(StorageLocation)
    if tenant_id:
        query = query.filter(StorageLocation.tenant_id == tenant_id)
    return query.order_by(StorageLocation.createdAt.desc()).offset(skip).limit(limit).all()

# Alias function for backward compatibility
def get_storage_locations(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[StorageLocation]:
    """Get all storage locations (alias for get_all_storage_locations)"""
    return get_all_storage_locations(db, tenant_id, skip, limit)

# Stock Movement functions
def get_stock_movement_by_id(movement_id: str, db: Session, tenant_id: str = None) -> Optional[StockMovement]:
    """Get a stock movement by ID"""
    query = db.query(StockMovement).filter(StockMovement.id == movement_id)
    if tenant_id:
        query = query.filter(StockMovement.tenant_id == tenant_id)
    return query.first()

def get_stock_movements(db: Session, tenant_id: str = None, product_id: str = None, warehouse_id: str = None, skip: int = 0, limit: int = 100) -> List[StockMovement]:
    """Get stock movements with optional filters"""
    query = db.query(StockMovement)
    
    if tenant_id:
        query = query.filter(StockMovement.tenant_id == tenant_id)
    if product_id:
        query = query.filter(StockMovement.productId == product_id)
    if warehouse_id:
        query = query.filter(StockMovement.warehouseId == warehouse_id)
    
    return query.order_by(StockMovement.createdAt.desc()).offset(skip).limit(limit).all()

def create_stock_movement(movement_data: dict, db: Session) -> StockMovement:
    """Create a new stock movement"""
    db_movement = StockMovement(**movement_data)
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement

def update_stock_movement(movement_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[StockMovement]:
    """Update a stock movement"""
    query = db.query(StockMovement).filter(StockMovement.id == movement_id)
    if tenant_id:
        query = query.filter(StockMovement.tenant_id == tenant_id)
    
    db_movement = query.first()
    if not db_movement:
        return None
    
    for key, value in update_data.items():
        if hasattr(db_movement, key):
            setattr(db_movement, key, value)
    
    db.commit()
    db.refresh(db_movement)
    return db_movement

def delete_stock_movement(movement_id: str, db: Session, tenant_id: str = None) -> bool:
    """Delete a stock movement"""
    movement = get_stock_movement_by_id(movement_id, db, tenant_id)
    if movement:
        db.delete(movement)
        db.commit()
        return True
    return False

# Inventory dashboard functions
def get_inventory_dashboard_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    # Get basic counts
    total_products = db.query(Product).filter(Product.tenant_id == tenant_id, Product.isActive == True).count()
    low_stock_products = db.query(Product).filter(
        Product.tenant_id == tenant_id,
        Product.isActive == True,
        Product.stockQuantity <= Product.minStockLevel
    ).count()
    out_of_stock_products = db.query(Product).filter(
        Product.tenant_id == tenant_id,
        Product.isActive == True,
        Product.stockQuantity == 0
    ).count()
    total_warehouses = db.query(Warehouse).filter(Warehouse.tenant_id == tenant_id, Warehouse.isActive == True).count()
    total_suppliers = db.query(Supplier).filter(Supplier.tenant_id == tenant_id, Supplier.isActive == True).count()
    pending_purchase_orders = db.query(PurchaseOrder).filter(
        PurchaseOrder.tenant_id == tenant_id,
        PurchaseOrder.status.in_(["draft", "submitted", "approved", "ordered"])
    ).count()
    pending_receivings = db.query(Receiving).filter(
        Receiving.tenant_id == tenant_id,
        Receiving.status.in_(["pending", "in_progress"])
    ).count()
    
    # Calculate total stock value
    total_stock_value = db.query(
        func.sum(Product.stockQuantity * Product.costPerUnitPrice)
    ).filter(
        Product.tenant_id == tenant_id,
        Product.isActive == True
    ).scalar() or 0.0
    
    # Get low stock alerts
    low_stock_alerts = []
    low_stock_products_list = db.query(Product).filter(
        Product.tenant_id == tenant_id,
        Product.isActive == True,
        Product.stockQuantity <= Product.minStockLevel
    ).limit(10).all()
    
    for product in low_stock_products_list:
        alert_type = "out_of_stock" if product.stockQuantity == 0 else "low_stock"
        message = f"Product {product.name} (SKU: {product.sku}) is running low on stock. Current: {product.stockQuantity}, Minimum: {product.minStockLevel}"
        
        low_stock_alerts.append({
            "productId": str(product.id),
            "productName": product.name,
            "sku": product.sku,
            "currentStock": product.stockQuantity,
            "minStockLevel": product.minStockLevel,
            "alertType": alert_type,
            "message": message
        })
    
    return {
        "totalProducts": total_products,
        "lowStockProducts": low_stock_products,
        "outOfStockProducts": out_of_stock_products,
        "totalWarehouses": total_warehouses,
        "totalSuppliers": total_suppliers,
        "pendingPurchaseOrders": pending_purchase_orders,
        "pendingReceivings": pending_receivings,
        "totalStockValue": total_stock_value,
        "lowStockAlerts": low_stock_alerts
    }
