import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "AI E-commerce Core"
    VERSION = "1.0.0"
    API_PREFIX = "/api/v1"
    
    # Database
    # Priority 1: Construct from component env vars (DB_USER, DB_PASSWORD, etc.)
    # Priority 2: Use DATABASE_URL env var directly
    # Priority 3: Default to local SQLite
    
    _db_user = os.getenv("DB_USER")
    _db_password = os.getenv("DB_PASSWORD")
    _db_host = os.getenv("DB_HOST")
    _db_port = os.getenv("DB_PORT")
    _db_name = os.getenv("DB_NAME")

    if _db_user and _db_password and _db_host and _db_port and _db_name:
        _encoded_password = urllib.parse.quote_plus(_db_password)
        DATABASE_URL = f"postgresql://{_db_user}:{_encoded_password}@{_db_host}:{_db_port}/{_db_name}"
    else:
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # File Storage
    # Calculate project root from this file's location: .../services/ecommerce-core/core/config.py
    # Up 3 levels to reach project root e.g. /data/wwwroot/digital-employee/
    _core_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _services_dir = os.path.dirname(_core_dir)
    _project_root = os.path.dirname(_services_dir)
    
    # Allow override via env var, ensuring absolute path
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(_project_root, "storage", "uploads"))
    
settings = Settings()
