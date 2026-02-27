from sqlalchemy import Column, Integer, String, Float, Boolean, Text, JSON, DateTime, Enum, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship, backref
from datetime import datetime
import enum
from .base import Base

# Enums
class EmbeddingStatus(str, enum.Enum):
    PENDING = "pending"
    EMBEDDED = "embedded"
    FAILED = "failed"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"

class LogisticsStatus(str, enum.Enum):
    UNSHIPPED = "unshipped"
    SHIPPED = "shipped"
    DELIVERED = "delivered"

# Models


class Category(Base):
    __tablename__ = "ecommerce_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    parent_id = Column(Integer, ForeignKey("ecommerce_categories.id"), nullable=True)
    
    # Store dynamic structure or any extra properties
    meta_info = Column(JSON, nullable=True) 
    
    products = relationship("Product", back_populates="category")
    
    # Fixed self-referential relationship with correct backref
    children = relationship("Category", 
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan"
    )

class Product(Base):
    __tablename__ = "ecommerce_products"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True) # Added to match DB
    spu_code = Column(String, index=True)
    sku_code = Column(String, unique=True, index=True)
    name = Column(String)
    
    category_id = Column(Integer, ForeignKey("ecommerce_categories.id"), nullable=True)
    category = relationship("Category", back_populates="products")

    price = Column(DECIMAL(10, 2))
    stock_quantity = Column(Integer)
    description = Column(Text)
    attributes = Column(JSON) # e.g. {"color": "red", "size": "L"}
    images = Column(JSON) # List of image URLs
    
    # AI Metadata
    # embedding_status = Column(Enum(EmbeddingStatus), default=EmbeddingStatus.PENDING)
    embedding_status = Column(String, default="pending")
    # knowledge_ref_id = Column(String, nullable=True) # Removed as not in DB
    
    status = Column(String, default="draft") # Changed from is_active to status
    # is_active = Column(Boolean, default=True) # Removed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) # Added to match DB
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Customer(Base):
    __tablename__ = "ecommerce_customers"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True) # Added for login
    mobile_hash = Column(String, index=True, nullable=True) # Desensitized
    password_hash = Column(String, nullable=True) # If we handle auth

    # Profile Info
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    region = Column(String, nullable=True)
    address = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    
    membership_level = Column(Integer, default=0) # 0=Normal, 1=VIP, 2=SVIP
    tags = Column(JSON) # e.g. ["Ms. White Collar", "Price Insensitive"]
    preferences = Column(Text) # AI analyzed summaries
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    orders = relationship("Order", back_populates="customer")
    cart_items = relationship("Cart", back_populates="customer")

class Order(Base):
    __tablename__ = "ecommerce_orders"
    
    id = Column(String, primary_key=True) # Business ID e.g., ORD-2026...
    user_id = Column(Integer, ForeignKey("ecommerce_customers.id"))
    
    total_amount = Column(DECIMAL(10, 2))
    
    # Statuses
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)
    logistics_status = Column(Enum(LogisticsStatus), default=LogisticsStatus.UNSHIPPED)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    
    # Snapshots needed for immutable history
    items_snapshot = Column(JSON) # List of items with price at that moment
    shipping_address = Column(JSON)
    
    # AI Context
    agent_id = Column(Integer, nullable=True) # Who sold this?
    chat_session_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="orders")
    payments = relationship("Payment", back_populates="order")
    shipment = relationship("Shipment", back_populates="order", uselist=False)

class Cart(Base):
    __tablename__ = "ecommerce_cart"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("ecommerce_customers.id"))
    sku_code = Column(String, ForeignKey("ecommerce_products.sku_code"))
    quantity = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="cart_items")
    product = relationship("Product")

class Payment(Base):
    __tablename__ = "ecommerce_payments"
    
    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("ecommerce_orders.id"))
    amount = Column(DECIMAL(10, 2))
    channel = Column(String) # wechat, alipay
    transaction_id = Column(String, nullable=True) # 3rd party ID
    status = Column(String) # success, pending, fail
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="payments")

class Shipment(Base):
    __tablename__ = "ecommerce_shipments"
    
    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("ecommerce_orders.id"))
    tracking_number = Column(String, nullable=True)
    carrier_code = Column(String, nullable=True) # sf, yto
    log_trace = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="shipment")
