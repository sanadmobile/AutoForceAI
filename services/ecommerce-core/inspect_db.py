from sqlalchemy import create_engine, inspect
from core.config import settings

def inspect_db():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    # Get table names
    print("Tables:", inspector.get_table_names())
    
    # Get columns for 'ecommerce_products'
    if 'ecommerce_products' in inspector.get_table_names():
        columns = inspector.get_columns('ecommerce_products')
        print("\nColumns in 'ecommerce_products':")
        for column in columns:
            print(f"- {column['name']} ({column['type']})")
    else:
        print("\nTable 'ecommerce_products' not found!")

if __name__ == "__main__":
    inspect_db()
