from typing import List, Optional, Dict, Any, ForwardRef
from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[int] = None
    meta_info: Optional[Dict[str, Any]] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None
    parent_id: Optional[int] = None
    meta_info: Optional[Dict[str, Any]] = None

CategoryRef = ForwardRef('Category')

class Category(CategoryBase):
    id: int
    children: List[CategoryRef] = []

    class Config:
        from_attributes = True

Category.model_rebuild()
