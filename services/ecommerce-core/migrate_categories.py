from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey
from database.base import Base
from core.config import settings
from database.models import Category  # Ensure models are imported so Base knows about them

def migrate():
    print("Starting migration...")
    engine = create_engine(settings.DATABASE_URL)
    connection = engine.connect()
    
    # Create categories table if it doesn't exist
    if not engine.dialect.has_table(connection, "ecommerce_categories"):
        print("Creating table 'ecommerce_categories'...")
        Category.__table__.create(engine)
    else:
        print("Table 'ecommerce_categories' already exists.")

    # Add category_id column if it doesn't exist in products
    # This is a bit manual since we're not using Alembic here
    from sqlalchemy import inspect
    inspector = inspect(engine)
    if 'ecommerce_products' not in inspector.get_table_names():
         print("Table 'ecommerce_products' not found. Skipping column check.")
         return

    columns = [c['name'] for c in inspector.get_columns('ecommerce_products')]
    
    if 'category_id' not in columns:
        print("Adding column 'category_id' to 'ecommerce_products' table...")
        from sqlalchemy import text
        # Raw SQL based on dialect
        try:
            if engine.dialect.name == 'postgresql':
                 connection.execute(text("ALTER TABLE ecommerce_products ADD COLUMN category_id INTEGER REFERENCES ecommerce_categories(id)"))
            else:
                 # Sqlite or others
                 connection.execute(text("ALTER TABLE ecommerce_products ADD COLUMN category_id INTEGER REFERENCES ecommerce_categories(id)"))
            connection.commit() # Important for some drivers
        except Exception as e:
            print(f"Error executing migration: {e}")
    else:
        print("Column 'category_id' already exists in 'ecommerce_products'.")
        
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
