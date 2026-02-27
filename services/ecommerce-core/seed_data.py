import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.engine import SessionLocal, engine
from database.base import Base
from database.models import Product, EmbeddingStatus, Customer, Category
from decimal import Decimal
import json

def seed_data():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Clear existing data (Force for Demo)
    try:
        db.query(Product).delete()
        # db.query(Category).delete() # Be careful with cascade
        db.commit()
    except Exception as e:
        db.rollback()
        # If table doesn't exist etc, ignore
        pass

    print("Seeding Sportswear Data (English)...")

    # 1.1 Create Categories if not exist
    categories_data = [
        {"id": 1, "name": "Running"},
        {"id": 2, "name": "Yoga"},
        {"id": 3, "name": "Outdoor"},
        {"id": 4, "name": "Training"},
        {"id": 5, "name": "Tennis"},
        {"id": 99, "name": "Other"}  # Add common fallback
    ]
    
    for cat_data in categories_data:
        if not db.query(Category).filter(Category.id == cat_data["id"]).first():
            cat = Category(id=cat_data["id"], name=cat_data["name"])
            db.add(cat)
    db.commit()

    # 2. Create Products
    products = [
        Product(
            spu_code="SPU001", sku_code="SKU001-BLK-M",
            name="Pro-Fit Velocity Running Jacket",
            category_id=1,
            price=Decimal("499.00"),
            stock_quantity=100,
            description="Featuring Dri-FIT breathable fabric with 4-way stretch, designed for long-distance runners. Reflective details ensure safety during night runs.",
            attributes={"color": "Midnight Black", "material": "Polyester", "size": "M", "gender": "Men", "activity": "Running"},
            # Use placeholder images for demo purposes
            images=["https://placehold.co/600x400?text=Run+Jacket"],
            embedding_status=EmbeddingStatus.EMBEDDED
        ),
        Product(
            spu_code="SPU002", sku_code="SKU002-PNK-S",
            name="Flex-Flow High-Waist Yoga Leggings",
            category_id=2,
            price=Decimal("359.00"),
            stock_quantity=200,
            description="Experience a second-skin feel with our high-waisted design for core support. Moisture-wicking technology keeps you dry and comfortable.",
            attributes={"color": "Lotus Pink", "material": "Nylon/Spandex", "size": "S", "gender": "Women", "activity": "Yoga"},
            images=["https://placehold.co/600x400?text=Yoga+Leggings"],
            embedding_status=EmbeddingStatus.EMBEDDED
        ),
        Product(
            spu_code="SPU003", sku_code="SKU003-BLU-L",
            name="Mountain-X Summit Hardshell Jacket",
            category_id=3,
            price=Decimal("1299.00"),
            stock_quantity=50,
            description="Equipped with Gore-Tex waterproof membrane and fully taped seams for ultimate protection. Detachable liner adapts to all-season outdoor conditions.",
            attributes={"color": "Deep Navy", "material": "Gore-Tex", "size": "L", "gender": "Unisex", "activity": "Outdoor"},
            images=["https://placehold.co/600x400?text=Outdoor+Jacket"],
            embedding_status=EmbeddingStatus.PENDING
        ),
        Product(
            spu_code="SPU004", sku_code="SKU004-GRY-XL",
            name="Elite-Training Quick-Dry Tee",
            category_id=4,
            price=Decimal("199.00"),
            stock_quantity=300,
            description="Powered by CoolMax technology with a honeycomb structure for rapid sweat evaporation. Seamless 3D cutting reduces friction during intense workouts.",
            attributes={"color": "Heather Grey", "material": "CoolMax", "size": "XL", "gender": "Men", "activity": "Training"},
            images=["https://placehold.co/600x400?text=Training+Tee"],
            embedding_status=EmbeddingStatus.PENDING
        ),
        Product(
            spu_code="SPU005", sku_code="SKU005-WHT-S",
            name="Aero-Light Court Tennis Skirt",
            category_id=5,
            price=Decimal("289.00"),
            stock_quantity=150,
            description="Lightweight pleated design with built-in safety shorts. Features side ball pockets, combining elegance with practicality for the court.",
            attributes={"color": "Optic White", "material": "Polyester", "size": "S", "gender": "Women", "activity": "Tennis"},
            images=["https://placehold.co/600x400?text=Tennis+Skirt"],
            embedding_status=EmbeddingStatus.EMBEDDED
        )
    ]


    db.add_all(products)
    
    # 3. Create Default User
    if not db.query(Customer).filter(Customer.id == 1).first():
        user = Customer(
            id=1,
            username="demo_vip",
            mobile_hash="138****0000",
            membership_level=1,
            tags=["High Spender", "Minimalist Fan"],
            preferences="Prefers solid colors, dislikes lace. Often buys silk products."
        )
        db.add(user)

    db.commit()
    print("Seeding Complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
