from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database.engine import get_db
from database.models import Cart, Product, Customer
from api.schemas import CartItem as CartSchema, CartItemAdd, CartItemUpdate
from core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CartSchema])
def get_cart(
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    return db.query(Cart).filter(Cart.user_id == current_user.id).options(joinedload(Cart.product)).all()

@router.post("/", response_model=CartSchema)
def add_to_cart(
    item: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    # Check product
    product = db.query(Product).filter(Product.sku_code == item.sku_code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if item existing
    cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id, 
        Cart.sku_code == item.sku_code
    ).first()

    if cart_item:
        cart_item.quantity += item.quantity
    else:
        cart_item = Cart(
            user_id=current_user.id,
            sku_code=item.sku_code,
            quantity=item.quantity
        )
        db.add(cart_item)
    
    db.commit()
    db.refresh(cart_item)
    return cart_item

@router.put("/{sku_code}", response_model=CartSchema)
def update_item_quantity(
    sku_code: str,
    item: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id, 
        Cart.sku_code == sku_code
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    if item.quantity <= 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = item.quantity

    db.commit()
    return cart_item

@router.delete("/{sku_code}")
def remove_from_cart(
    sku_code: str,
    db: Session = Depends(get_db),
    current_user: Customer = Depends(get_current_user)
):
    db.query(Cart).filter(
        Cart.user_id == current_user.id, 
        Cart.sku_code == sku_code
    ).delete()
    db.commit()
    return {"status": "ok"}
