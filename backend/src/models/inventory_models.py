from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .common import Pagination

class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    FOOD = "food"
    BEVERAGES = "beverages"
    PHARMACEUTICALS = "pharmaceuticals"
    OFFICE_SUPPLIES = "office_supplies"
    AUTOMOTIVE = "automotive"
    CONSTRUCTION = "construction"
    CHEMICALS = "chemicals"
    TEXTILES = "textiles"
    FURNITURE = "furniture"
    TOOLS = "tools"
    OTHER = "other"


WORKSHOP_CATEGORIES = [
    "spare_parts",
    "engine_parts",
    "electrical",
    "batteries",
    "tyres",
    "lubricants",
    "filters",
    "brakes",
    "body_parts",
    "accessories",
    "tools",
    "other",
]

class UnitOfMeasure(str, Enum):
    PIECE = "piece"
    KILOGRAM = "kilogram"
    GRAM = "gram"
    LITER = "litre"
    MILLILITER = "millilitre"
    METER = "meter"
    CENTIMETER = "centimeter"
    SQUARE_METER = "square meter"
    CUBIC_METER = "cubic meter"
    BOX = "box"
    PACK = "pack"
    ROLL = "roll"
    SET = "set"
    PAIR = "pair"
    DOZEN = "dozen"
    OTHER = "other"

class StockMovementType(str, Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    RETURN = "return"
    DAMAGE = "damage"
    EXPIRY = "expiry"
    CYCLE_COUNT = "cycle_count"
    INSTOCK = "instock"

class StockMovementStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    ORDERED = "ordered"
    ARRIVED = "arrived"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class ReceivingStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category: str
    brand: Optional[str] = None
    productType: Optional[str] = None
    packSize: int = 1
    salePrice: float
    costPerUnitPrice: float
    stockQuantity: int
    minStockLevel: int = 0
    maxStockLevel: Optional[int] = None
    unitOfMeasure: str = "piece"
    barcode: Optional[str] = None
    expiryDate: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    mfgDate: Optional[str] = None
    dateOfPurchase: Optional[str] = None
    modelNo: Optional[str] = None
    isActive: bool = True
    imageUrl: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    supplierId: Optional[str] = None
    supplierName: Optional[str] = None
    leadTime: Optional[int] = None
    reorderPoint: Optional[int] = None
    reorderQuantity: Optional[int] = None
    isSerialized: bool = False
    isBatchTracked: bool = False
    storageLocation: Optional[str] = None
    warehouseId: Optional[str] = None
    lastStockCount: Optional[datetime] = None
    lastStockMovement: Optional[datetime] = None

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category: str
    brand: Optional[str] = None
    productType: Optional[str] = None
    packSize: int = 1
    supplierId: Optional[str] = None
    salePrice: float
    costPerUnitPrice: float
    stockQuantity: int
    minStockLevel: int = 0
    maxStockLevel: Optional[int] = None
    unitOfMeasure: str = "piece"
    barcode: Optional[str] = None
    expiryDate: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    mfgDate: Optional[str] = None
    dateOfPurchase: Optional[str] = None
    modelNo: Optional[str] = None
    isActive: bool = True
    imageUrl: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    productType: Optional[str] = None
    packSize: Optional[int] = None
    supplierId: Optional[str] = None
    salePrice: Optional[float] = None
    costPerUnitPrice: Optional[float] = None
    stockQuantity: Optional[int] = None
    minStockLevel: Optional[int] = None
    maxStockLevel: Optional[int] = None
    unitOfMeasure: Optional[str] = None
    barcode: Optional[str] = None
    expiryDate: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    mfgDate: Optional[str] = None
    dateOfPurchase: Optional[str] = None
    modelNo: Optional[str] = None
    isActive: Optional[bool] = None
    imageUrl: Optional[str] = None

class Product(ProductBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    country: str
    postalCode: str
    phone: Optional[str] = None
    email: Optional[str] = None
    managerId: Optional[str] = None
    isActive: bool = True
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    temperatureZone: Optional[str] = None
    securityLevel: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    managerId: Optional[str] = None
    isActive: Optional[bool] = None
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    temperatureZone: Optional[str] = None
    securityLevel: Optional[str] = None

class Warehouse(WarehouseBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class StorageLocationBase(BaseModel):
    warehouseId: str
    name: str
    code: str
    description: Optional[str] = None
    locationType: str
    parentLocationId: Optional[str] = None
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    isActive: bool = True

class StorageLocationCreate(StorageLocationBase):
    pass

class StorageLocationUpdate(BaseModel):
    warehouseId: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    locationType: Optional[str] = None
    parentLocationId: Optional[str] = None
    capacity: Optional[float] = None
    usedCapacity: Optional[float] = None
    isActive: Optional[bool] = None

class StorageLocation(StorageLocationBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

    @field_validator('id', 'tenant_id', 'warehouseId', 'parentLocationId', 'createdBy', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        if v is not None:
            return str(v)
        return v

class StockMovementBase(BaseModel):
    productId: str
    warehouseId: str
    locationId: Optional[str] = None
    movementType: StockMovementType
    quantity: int
    unitCost: float
    referenceNumber: Optional[str] = None
    referenceType: Optional[str] = None
    notes: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementUpdate(BaseModel):
    productId: Optional[str] = None
    warehouseId: Optional[str] = None
    locationId: Optional[str] = None
    movementType: Optional[StockMovementType] = None
    quantity: Optional[int] = None
    unitCost: Optional[float] = None
    referenceNumber: Optional[str] = None
    referenceType: Optional[str] = None
    notes: Optional[str] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None

class StockMovement(StockMovementBase):
    id: str
    tenant_id: str
    createdBy: str
    status: StockMovementStatus
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class StockMovementWithProduct(StockMovementBase):
    id: str
    tenant_id: str
    createdBy: str
    status: StockMovementStatus
    createdAt: datetime
    updatedAt: datetime
    productName: Optional[str] = None
    productSku: Optional[str] = None
    productCategory: Optional[str] = None

    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    orderNumber: str
    batchNumber: Optional[str] = None
    supplierId: str
    supplierName: str
    warehouseId: str
    orderDate: str
    expectedDeliveryDate: Optional[str] = None
    status: PurchaseOrderStatus
    subtotal: float = 0.0
    vatAmount: float = 0.0
    totalAmount: float
    notes: Optional[str] = None
    vehicleReg: Optional[str] = None
    purchaseForType: Optional[str] = None
    vehicleId: Optional[str] = None
    jobCardId: Optional[str] = None
    department: Optional[str] = None
    deliveryLocation: Optional[str] = None
    requisitionNumber: Optional[str] = None
    items: Optional[List[dict]] = None

class PurchaseOrderCreate(BaseModel):
    vehicleReg: Optional[str] = None
    purchaseForType: Optional[str] = None
    vehicleId: Optional[str] = None
    jobCardId: Optional[str] = None
    orderNumber: Optional[str] = None
    batchNumber: Optional[str] = None
    supplierId: str
    supplierName: str
    warehouseId: str
    orderDate: str
    expectedDeliveryDate: Optional[str] = None
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    notes: Optional[str] = None
    department: Optional[str] = None
    deliveryLocation: Optional[str] = None
    requisitionNumber: Optional[str] = None
    items: Optional[List[dict]] = None

class PurchaseOrderUpdate(BaseModel):
    orderNumber: Optional[str] = None
    batchNumber: Optional[str] = None
    supplierId: Optional[str] = None
    supplierName: Optional[str] = None
    warehouseId: Optional[str] = None
    orderDate: Optional[str] = None
    expectedDeliveryDate: Optional[str] = None
    status: Optional[PurchaseOrderStatus] = None
    subtotal: Optional[float] = None
    vatAmount: Optional[float] = None
    totalAmount: Optional[float] = None
    notes: Optional[str] = None
    vehicleReg: Optional[str] = None
    purchaseForType: Optional[str] = None
    vehicleId: Optional[str] = None
    jobCardId: Optional[str] = None
    department: Optional[str] = None
    deliveryLocation: Optional[str] = None
    requisitionNumber: Optional[str] = None

class PurchaseOrder(PurchaseOrderBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ReceivingItemBase(BaseModel):
    purchaseOrderId: str
    productId: str
    productName: str
    sku: str
    quantity: int
    unitCost: float
    totalCost: float
    receivedQuantity: int
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None
    notes: Optional[str] = None

class ReceivingItemCreate(ReceivingItemBase):
    pass

class ReceivingItemUpdate(BaseModel):
    purchaseOrderId: Optional[str] = None
    productId: Optional[str] = None
    productName: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    unitCost: Optional[float] = None
    totalCost: Optional[float] = None
    receivedQuantity: Optional[int] = None
    batchNumber: Optional[str] = None
    serialNumber: Optional[str] = None
    expiryDate: Optional[str] = None
    notes: Optional[str] = None

class ReceivingItem(ReceivingItemBase):
    id: str
    receivingId: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ReceivingBase(BaseModel):
    receivingNumber: str
    purchaseOrderId: str
    warehouseId: str
    status: ReceivingStatus
    receivedDate: str
    notes: Optional[str] = None
    items: List[ReceivingItemCreate]

class ReceivingCreate(BaseModel):
    receivingNumber: str
    purchaseOrderId: str
    warehouseId: str
    receivedDate: str
    notes: Optional[str] = None
    items: List[ReceivingItemCreate]

class ReceivingUpdate(BaseModel):
    receivingNumber: Optional[str] = None
    purchaseOrderId: Optional[str] = None
    warehouseId: Optional[str] = None
    status: Optional[ReceivingStatus] = None
    receivedDate: Optional[str] = None
    notes: Optional[str] = None

class Receiving(ReceivingBase):
    id: str
    tenant_id: str
    createdBy: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ProductsResponse(BaseModel):
    products: List[Product]
    pagination: Pagination

class ProductResponse(BaseModel):
    product: Product

class WarehouseResponse(BaseModel):
    warehouse: Warehouse

class WarehousesResponse(BaseModel):
    warehouses: List[Warehouse]
    total: int

class StorageLocationResponse(BaseModel):
    storageLocation: StorageLocation

class StorageLocationsResponse(BaseModel):
    storageLocations: List[StorageLocation]
    total: int

class StockMovementResponse(BaseModel):
    stockMovement: StockMovement

class StockMovementsResponse(BaseModel):
    stockMovements: List[StockMovement]
    total: int

class StockMovementsWithProductResponse(BaseModel):
    stockMovements: List[StockMovementWithProduct]
    total: int

class PurchaseOrderResponse(BaseModel):
    purchaseOrder: PurchaseOrder

class PurchaseOrdersResponse(BaseModel):
    purchaseOrders: List[PurchaseOrder]
    total: int

class ReceivingResponse(BaseModel):
    receiving: Receiving

class ReceivingsResponse(BaseModel):
    receivings: List[Receiving]
    total: int

class InventoryDashboardStats(BaseModel):
    totalProducts: int
    lowStockProducts: int
    outOfStockProducts: int
    totalWarehouses: int
    totalSuppliers: int
    pendingPurchaseOrders: int
    pendingReceivings: int
    totalStockValue: float
    lowStockAlerts: List[Dict[str, Any]]

class StockAlert(BaseModel):
    productId: str
    productName: str
    sku: str
    currentStock: int
    minStockLevel: int
    alertType: str
    message: str

class InventoryReport(BaseModel):
    reportType: str
    dateRange: str
    data: List[Dict[str, Any]]
    summary: Dict[str, Any]

