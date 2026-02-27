import os
import shutil
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
import uuid

from core.dependencies import get_current_user_id
from core.db_manager import get_shared_db
from sqlalchemy.orm import Session
from database.shared_models import User

router = APIRouter(prefix="/api/v1/storage", tags=["Storage"])

UPLOAD_DIR = "storage/uploads"

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_shared_db)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Update user avatar in DB
        # Construct public URL (Assuming served under /uploads path or similar)
        # Use relative path for now, frontend knows where to fetch or Nginx config handles it
        # Or better: return full URL based on environment
        
        # In a real SaaS, you'd upload to S3 here.
        
        # Build URL - Assuming FastAPI mounts /storage/uploads as static
        # We will mount this in server.py
        avatar_url = f"/uploads/{filename}"
        
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.avatar = avatar_url
            db.commit()
            
        return {"url": avatar_url, "filename": filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
