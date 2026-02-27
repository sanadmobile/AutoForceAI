from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.engine import get_db
from database.models import Order, Product, Cart, Payment, Shipment, OrderStatus, Customer
from api.schemas import Order as OrderSchema, OrderCreate
from core import auth
import uuid
from decimal import Decimal

router = APIRouter()

@router.post("/checkout", response_model=OrderSchema)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user: Customer = Depends(auth.get_current_user)):
    # Calculate Total & Validate Stock
    total_amount = Decimal("0.00")
    snapshot = []
    
    # Use authenticated user ID instead of hardcoded
    user_id = current_user.id
    
    for item in order_in.items:
        product = db.query(Product).filter(Product.sku_code == item.sku_code).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.sku_code} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Product {product.name} out of stock")
        
        line_price = product.price * item.quantity
        total_amount += line_price
        
        snapshot.append({
            "sku_code": product.sku_code,
            "name": product.name,
            "price": float(product.price),
            "quantity": item.quantity,
            "attributes": product.attributes
        })
        
        # Deduct stock
        product.stock_quantity -= item.quantity

    # Create Order
    val_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    new_order = Order(
        id=val_id,
        user_id=current_user.id,
        total_amount=total_amount,
        status=OrderStatus.PENDING,
        items_snapshot=snapshot,
        shipping_address=order_in.shipping_address
    )
    db.add(new_order)
    
    # Clear Cart
    db.query(Cart).filter(Cart.user_id == current_user.id).delete()
    
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/", response_model=List[OrderSchema])
def list_orders(db: Session = Depends(get_db), current_user: Customer = Depends(auth.get_current_user)):
    return db.query(Order).filter(Order.user_id == current_user.id).all()

@router.get("/{order_id}", response_model=OrderSchema)
def get_order(order_id: str, db: Session = Depends(get_db), current_user: Customer = Depends(auth.get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return order
