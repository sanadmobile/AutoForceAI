from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List
import os
import shutil
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/templates",
    tags=["templates"]
)

# Define storage path (Absolute to avoid CWD confusion)
# Assuming E:\DigitalEmployee is root
TEMPLATE_DIR = r"E:\DigitalEmployee\storage\ppt_templates"

class TemplateInfo(BaseModel):
    id: str
    name: str
    filename: str

def get_template_path(filename: str) -> str:
    return os.path.join(TEMPLATE_DIR, filename)

@router.get("/", response_model=List[TemplateInfo])
async def list_templates():
    if not os.path.exists(TEMPLATE_DIR):
        os.makedirs(TEMPLATE_DIR)
        
    templates = []
    for filename in os.listdir(TEMPLATE_DIR):
        if filename.endswith(".pptx"):
            templates.append(TemplateInfo(
                id=filename, # Use filename as ID for simplicity
                name=filename.replace(".pptx", ""),
                filename=filename
            ))
    return templates

@router.post("/upload")
async def upload_template(file: UploadFile = File(...)):
    if not os.path.exists(TEMPLATE_DIR):
        os.makedirs(TEMPLATE_DIR)
        
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Only .pptx files are allowed")
    
    file_path = os.path.join(TEMPLATE_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Template uploaded successfully", "filename": file.filename}

@router.delete("/{filename}")
async def delete_template(filename: str):
    file_path = os.path.join(TEMPLATE_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "Template deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Template not found")
