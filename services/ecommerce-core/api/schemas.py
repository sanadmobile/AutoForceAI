from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from enum import Enum

# --- Enums ---
class EmbeddingStatus(str, Enum):
    PENDING = "pending"
    EMBEDDED = "embedded"
    FAILED = "failed"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# --- Products ---

class ProductBase(BaseModel):
    spu_code: Optional[str] = None
    sku_code: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None # Added category_id
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = 0
    description: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    status: str = "draft" # Added

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    embedding_status: EmbeddingStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Users ---
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    gender: Optional[str] = None

class UserCreate(UserBase):
    password: str
    username: str
    email: str # Make email required for registration

class UserLogin(BaseModel):
    username: str # Can be username or email
    password: str

class UserUpdate(BaseModel):
    phone: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    email: Optional[str] = None

class User(UserBase):
    id: int
    membership_level: int = 0
    # tags: Optional[List[str]] = None # JSON in DB, might need specific handling or just Dict
    tags: Optional[Any] = None
    preferences: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User # Return user info with token for convenience

class CartItemAdd(BaseModel):
    sku_code: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItem(BaseModel):
    id: int
    sku_code: str
    quantity: int
    product: Optional[Product] = None

    class Config:
        from_attributes = True

# --- Orders ---
class OrderItem(BaseModel):
    sku_code: str
    quantity: int
    price: Decimal

class OrderCreate(BaseModel):
    user_id: int # In real app, from token
    items: List[CartItemAdd]
    shipping_address: Dict[str, Any]

class Order(BaseModel):
    id: str
    user_id: int
    total_amount: Decimal
    status: OrderStatus
    items_snapshot: List[Dict[str, Any]]
    shipping_address: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
