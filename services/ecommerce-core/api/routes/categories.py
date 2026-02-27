from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.engine import get_db
from database.models import Category
from api.schemas_category import Category as CategorySchema, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.put("/{category_id}", response_model=CategorySchema)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check parent loop
    if category.parent_id == category_id:
        raise HTTPException(status_code=400, detail="Cannot set category as its own parent")
        
    for var, value in vars(category).items():
        if value is not None:
             setattr(db_category, var, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.post("/", response_model=CategorySchema)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[CategorySchema])
def list_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Simple list, hierarchical structure could be built here if needed
    categories = db.query(Category).offset(skip).limit(limit).all()
    return categories

@router.get("/tree", response_model=List[CategorySchema])
def get_category_tree(db: Session = Depends(get_db)):
    # Get only root categories (parent_id is None)
    # The 'children' relationship will automatically populate nested categories due to eager loading or lazy loading
    roots = db.query(Category).filter(Category.parent_id == None).all()
    return roots

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check for children
    if db.query(Category).filter(Category.parent_id == category_id).count() > 0:
         raise HTTPException(status_code=400, detail="Cannot delete category with children")
         
    db.delete(db_category)
    db.commit()
    return {"ok": True}
