from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from api import schemas
from database.models import Customer
from core import auth
from database.engine import get_db

router = APIRouter()

@router.post("/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(Customer).filter((Customer.username == user.username) | (Customer.email == user.email)).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username or Email already registered"
        )
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = Customer(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        phone=user.phone,
        country=user.country,
        region=user.region,
        address=user.address,
        gender=user.gender,
        mobile_hash="TODO_HASH" # Placeholder or implement hashing if needed
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto login
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(user_login: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(Customer).filter(Customer.email == user_login.username).first()
    if not user:
        user = db.query(Customer).filter(Customer.username == user_login.username).first()
        
    if not user or not auth.verify_password(user_login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: Customer = Depends(auth.get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.User)
async def update_profile(profile: schemas.UserUpdate, current_user: Customer = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Update fields
    if profile.phone: current_user.phone = profile.phone
    if profile.country: current_user.country = profile.country
    if profile.region: current_user.region = profile.region
    if profile.address: current_user.address = profile.address
    if profile.gender: current_user.gender = profile.gender
    if profile.email: current_user.email = profile.email
    
    db.commit()
    db.refresh(current_user)
    return current_user
