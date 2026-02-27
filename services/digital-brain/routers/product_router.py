from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from core.db_manager import get_shared_db
from database.models import Product

router = APIRouter(prefix="/api/v1/products", tags=["E-commerce Products"])

class ProductCreate(BaseModel):
    name: str
    sku_code: str
    price: float
    stock_quantity: int
    description: Optional[str] = None
    attributes: Optional[dict] = {}
    images: Optional[List[str]] = []
    status: Optional[str] = "draft"
    embedding_status: Optional[str] = "pending"

class ProductResponse(ProductCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

@router.get("", response_model=List[ProductResponse])
async def get_products(
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_shared_db)
):
    products = db.query(Product).order_by(Product.created_at.desc()).offset(offset).limit(limit).all()
    return products

@router.post("", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_shared_db)):
    # Check SKU uniqueness
    existing = db.query(Product).filter(Product.sku_code == product.sku_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_shared_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_update: ProductCreate, db: Session = Depends(get_shared_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update fields
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product
