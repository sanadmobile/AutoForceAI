import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base as TenantBase
from database.shared_models import SharedBase
from core.config import settings

# 主数据库 (Shared DB)
SHARED_DB_URL = settings.database.url
connect_args = {"check_same_thread": False} if "sqlite" in SHARED_DB_URL else {}

SHARED_ENGINE = create_engine(
    SHARED_DB_URL, 
    connect_args=connect_args,
    pool_pre_ping=True, 
    pool_recycle=3600
)
SharedSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=SHARED_ENGINE)

# 初始化主数据库 (Merging Tenant Schemas into Shared DB)
def init_shared_db():
    print("[DB] Initializing Shared Database Schema...")
    SharedBase.metadata.create_all(bind=SHARED_ENGINE)
    # Also create Tenant tables in the Shared DB (Single DB Mode)
    TenantBase.metadata.create_all(bind=SHARED_ENGINE)
    print("[DB] Schema Sync Complete.")

# 租户数据库引擎缓存
_tenant_engines = {}

def get_tenant_db_path(user_id: int):
    # Deprecated in Single DB Mode, but kept for legacy reference
    # 确保租户目录存在
    os.makedirs("./tenants_data", exist_ok=True)
    return f"sqlite:///./tenants_data/user_{user_id}.db"

def get_tenant_engine(user_id: int):
    # Unified Architecture: All tenants use Shared Engine
    return SHARED_ENGINE

def get_tenant_session(user_id: int):
    # Unified Architecture: Return Shared Session
    return SharedSessionLocal()

def get_shared_db():
    db = SharedSessionLocal()
    try:
        yield db
    finally:
        db.close()
