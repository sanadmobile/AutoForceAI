from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database.engine import get_db
from database.models import Product
import random

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    text: str
    recommended_products: List[dict] = []

@router.post("/chat", response_model=ChatResponse)
def chat_agent(req: ChatRequest, db: Session = Depends(get_db)):
    msg = req.message.lower()
    
    # 1. Intent Detection (Mock)
    intent = "chitchat"
    keywords = []
    
    if any(w in msg for w in ["裙", "礼服", "dress", "gown"]):
        intent = "search_product"
        keywords = ["裙", "礼服"]
    elif any(w in msg for w in ["外套", "风衣", "大衣", "coat"]):
        intent = "search_product"
        keywords = ["外套", "风衣", "大衣"]
    elif any(w in msg for w in ["真丝", "丝绸", "silk"]):
        intent = "search_product"
        keywords = ["真丝", "桑蚕丝"]
    
    # 2. Tool Execution / RAG (Simple Keyword Search)
    products = []
    if intent == "search_product":
        # Search in DB
        query = db.query(Product)
        conditions = []
        for k in keywords:
            if k in msg: # Keep original simplistic logic, ideally use vector search
                 conditions.append(Product.name.contains(k, autoescape=True))
                 conditions.append(Product.description.contains(k, autoescape=True))
        
        # Fallback: If keywords found in message but logic above is simple string match
        if not conditions:
             for k in keywords:
                 conditions.append(Product.name.contains(k, autoescape=True))
        
        # Simple OR Logic
        from sqlalchemy import or_
        if conditions:
            products = query.filter(or_(*conditions)).limit(3).all()
        else:
            # Fallback random
             products = query.limit(3).all()

    # 3. Response Generation (Template based for MVP)
    response_text = ""
    recs = []
    
    if intent == "chitchat":
        response_text = "我是 Sophie，您的私人时尚顾问。我可以为您推荐晚礼服、职场穿搭或当季风衣。今天想看点什么特别的吗？"
    elif intent == "search_product":
        if products:
            response_text = f"为您精选了 {len(products)} 款符合您独特品味的单品，请过目。"
            for p in products:
                recs.append({
                    "id": p.id,
                    "name": p.name,
                    "price": float(p.price),
                    "image": p.images[0] if p.images else ""
                })
        else:
            response_text = "抱歉，暂时没找到完全匹配的单品，但我们的高定系列或许能给您惊喜。"

    return ChatResponse(
        text=response_text,
        recommended_products=recs
    )
