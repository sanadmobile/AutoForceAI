from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi import Request
from sqlalchemy.orm import Session
from typing import Generator
# Assuming decode_token is in core.auth
# Assuming get_tenant_session is in core.db_manager

from core.auth import decode_token 
from core.db_manager import get_tenant_session, get_shared_db
from database.shared_models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/wechat/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Validates token and returns full user payload (id, org_id, role).
    """
    try:
        payload = decode_token(token)
    except Exception:
        payload = None
        
    if payload is None:
        print(f"[AUTH ERROR] Could not decode token: {token[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Ensure payload has 'id'
    if not payload.get("id"):
         # Priority 1: Check 'user_id' (Explicit integer ID)
         if payload.get("user_id"):
             payload["id"] = int(payload["user_id"])
         
         # Priority 2: Check 'sub' (Standard claim)
         elif payload.get("sub"):
             # Use safe conversion
             try:
                 payload["id"] = int(payload["sub"])
             except ValueError:
                 # 'sub' is a string username (e.g. u_e7934...)
                 # If user_id is missing, we must resolve user ID from DB using the username
                 # Since we cannot inject DB session easily into this auth dependency without circular imports or complexity,
                 # we will instantiate a temporary session just for this lookup.
                 from core.db_manager import SharedSessionLocal
                 db = SharedSessionLocal()
                 try:
                     user = db.query(User).filter(User.username == payload["sub"]).first()
                     if user:
                         payload["id"] = user.id
                         # Also backfill role/org if missing
                         if not payload.get("org_id"): payload["org_id"] = user.organization_id
                         if not payload.get("organization_id"): payload["organization_id"] = user.organization_id
                         
                         if not payload.get("role"): payload["role"] = user.role.value if hasattr(user.role, 'value') else user.role
                 except Exception as e:
                     print(f"[AUTH ERROR] Failed to resolve user from username {payload['sub']}: {e}")
                 finally:
                     db.close()
         
    if not payload.get("id"):
         print(f"[AUTH ERROR] Token missing valid user identifier (id or user_id). Payload keys: {list(payload.keys())}")
         print(f"[AUTH ERROR] Payload content: {payload}")
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing valid user identifier (id or user_id)",
        )
            
    return payload

def get_current_user_id(user: dict = Depends(get_current_user)) -> int:
    """
    Dependency extracting just the user ID for legacy compatibility.
    """
    return user["id"]

def get_db(user_id: int = Depends(get_current_user_id)) -> Generator[Session, None, None]:
    """
    Dependency to get the *Tenant-Specific* Database Session.
    """
    # Force tenant session for all operations
    # In Single DB mode, this effectively returns a session to the Shared DB but context-aware.
    db = get_tenant_session(user_id) # core/db_manager.py definition
    try:
        yield db
    finally:
        db.close()
