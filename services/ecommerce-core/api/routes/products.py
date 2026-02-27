from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.engine import get_db
from database.models import Product, EmbeddingStatus
from api.schemas import Product as ProductSchema, ProductCreate

router = APIRouter()

@router.get("/config/metadata")
def get_metadata(db: Session = Depends(get_db)):
    # Try fetching real categories
    from database.models import Category
    categories = db.query(Category).all()
    
    if categories:
        category_list = [{"id": c.id, "name": c.name, "slug": c.name.lower(), "parent_id": c.parent_id} for c in categories]
    else:
        # Fallback to Mock Data if DB is empty
        category_list = [
            {"id": 1, "name": "Running", "slug": "running"},
            {"id": 2, "name": "Yoga", "slug": "yoga"},
            {"id": 3, "name": "Outdoor", "slug": "outdoor"},
            {"id": 4, "name": "Training", "slug": "training"},
            {"id": 5, "name": "Tennis", "slug": "tennis"}
        ]
        
    return {
        "categories": category_list,
        "attributes": [
            {"key": "activity", "label": "Activity", "options": ["Running", "Yoga", "Outdoor", "Training", "Tennis"]},
            {"key": "gender", "label": "Gender", "options": ["Men", "Women", "Unisex"]},
            {"key": "size", "label": "Size", "options": ["S", "M", "L", "XL"]}
        ]
    }

@router.get("/", response_model=List[ProductSchema])
def list_products(
    skip: int = 0, 
    limit: int = 20, 
    status: Optional[str] = None, # changed from category_id
    category_id: Optional[int] = None, # Added category_id filter
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if status:
        query = query.filter(Product.status == status)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    # Returning all products for management view. 
    # Previously filtered by is_active=True, but management needs to see drafts too.
    
    return query.offset(skip).limit(limit).all()

@router.get("/{id_or_code}", response_model=ProductSchema)
def get_product(id_or_code: str, db: Session = Depends(get_db)):
    # Try by ID first if numeric
    if id_or_code.isdigit():
        product = db.query(Product).filter(Product.id == int(id_or_code)).first()
        if product:
            return product
            
    # Fallback to SKU code
    product = db.query(Product).filter(Product.sku_code == id_or_code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    if not db_product.status:
        db_product.status = "draft"
        
    # Check if category exists if provided
    if product.category_id:
        from database.models import Category
        if not db.query(Category).filter(Category.id == product.category_id).first():
             # If not found, maybe ignore or raise error? For now, we allow it to be NULL
             # But here we pass it. If FK constraint exists, it will fail commit.
             # Let's ensure validity if we can, but let DB constrain handle it generally.
             pass

    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
         raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"ok": True}

@router.get("/search/", response_model=List[ProductSchema])
def search_products(q: str, db: Session = Depends(get_db)):
    # Basic SQL LIKE search, should be replaced by Vector Search in production
    return db.query(Product).filter(
        Product.name.contains(q) | Product.description.contains(q)
    ).limit(10).all()
