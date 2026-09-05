import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True)
    description = Column(Text)
    category = Column(String)
    brand = Column(String)
    productType = Column(String)
    packSize = Column(Integer, default=1)
    supplierId = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    costPerUnitPrice = Column(Float, nullable=False)
    salePrice = Column(Float, nullable=False)
    stockQuantity = Column(Integer, default=0)
    minStockLevel = Column(Integer, default=0)
    maxStockLevel = Column(Integer)
    unit = Column(String, default="piece")  
    weight = Column(Float)
    dimensions = Column(String)
    barcode = Column(String)
    expiryDate = Column(Date)
    batchNumber = Column(String)
    serialNumber = Column(String)
    mfgDate = Column(Date)
    dateOfPurchase = Column(Date)
    modelNo = Column(String)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="products")

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    createdBy = Column(String, nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True)
    description = Column(Text)
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    postalCode = Column(String)
    phone = Column(String)
    email = Column(String)
    managerId = Column(String)
    isActive = Column(Boolean, default=True)
    capacity = Column(Float)
    usedCapacity = Column(Float)
    temperatureZone = Column(String)
    securityLevel = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="warehouses")
    storage_locations = relationship("StorageLocation", back_populates="warehouse")
    stock_movements = relationship("StockMovement", back_populates="warehouse")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    createdBy = Column(String, nullable=False)
    poNumber = Column(String, unique=True, index=True)
    batchNumber = Column(String, nullable=True)
    supplierId = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    warehouseId = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    orderDate = Column(Date, nullable=False)
    expectedDeliveryDate = Column(Date)
    status = Column(String, default="draft")  # draft, submitted, approved, ordered, received, cancelled
    subtotal = Column(Float, default=0.0)  # Subtotal before VAT
    vatAmount = Column(Float, default=0.0)  # VAT amount
    totalAmount = Column(Float, default=0.0)  # Total amount including VAT
    notes = Column(Text)
    vehicleReg = Column(String, nullable=True)
    purchaseForType = Column(String, nullable=True)
    vehicleId = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    jobCardId = Column(UUID(as_uuid=True), ForeignKey("job_cards.id"), nullable=True)
    department = Column(String, nullable=True)
    deliveryLocation = Column("delivery_location", String, nullable=True)
    requisitionNumber = Column("requisition_number", String, nullable=True)
    items = Column(JSON, default=list)
    approvedBy = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approvedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="purchase_orders")
    supplier = relationship("Supplier")
    warehouse = relationship("Warehouse")
    approver = relationship("User")

class Receiving(Base):
    __tablename__ = "receivings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    receivingNumber = Column(String, unique=True, index=True)
    purchaseOrderId = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False)
    warehouseId = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    receivedDate = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled
    receivedBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notes = Column(Text)
    items = Column(JSON, default=[])  # Store receiving items as JSON
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="receiving")
    purchaseOrder = relationship("PurchaseOrder")
    warehouse = relationship("Warehouse")
    receiver = relationship("User")

class StorageLocation(Base):
    __tablename__ = "storage_locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    warehouseId = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    locationType = Column(String, nullable=False)  # shelf, rack, bin, area, etc.
    parentLocationId = Column(UUID(as_uuid=True), ForeignKey("storage_locations.id"), nullable=True)
    capacity = Column(Float, nullable=True)
    usedCapacity = Column(Float, nullable=True)
    isActive = Column(Boolean, default=True)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="storage_locations")
    warehouse = relationship("Warehouse", back_populates="storage_locations")
    parentLocation = relationship("StorageLocation", remote_side=[id], back_populates="childLocations")
    childLocations = relationship("StorageLocation", back_populates="parentLocation")
    creator = relationship("User", back_populates="created_storage_locations")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    productId = Column(String, nullable=False)
    warehouseId = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    locationId = Column(String, nullable=True)
    movementType = Column(String, nullable=False)  # inbound, outbound, transfer, adjustment, return, damage, expiry, cycle_count, instock
    quantity = Column(Integer, nullable=False)
    unitCost = Column(Float, nullable=False)
    referenceNumber = Column(String, nullable=True)
    referenceType = Column(String, nullable=True)  # PO, SO, Transfer, etc.
    notes = Column(Text, nullable=True)
    batchNumber = Column(String, nullable=True)
    serialNumber = Column(String, nullable=True)
    expiryDate = Column(DateTime, nullable=True)
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled, failed
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="stock_movements")
    warehouse = relationship("Warehouse", back_populates="stock_movements")
    creator = relationship("User", back_populates="created_stock_movements")
