from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database.base import Base
from database.engine import engine
from fastapi.staticfiles import StaticFiles
import logging
import os

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

from api.routes import products, cart, orders, agent, categories, uploads, auth

# Initialize DB (Auto-create tables for MVP)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-Mall Core Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise e

# Static files
from core.config import settings
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")



app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(agent.router, prefix="/api/v1/agent", tags=["Agent"])
app.include_router(uploads.router, prefix="/api/v1/files", tags=["Uploads"])

@app.get("/")
def read_root():
    return {"message": "AI-Mall Core Service is Running", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # Make sure env is loaded
    from dotenv import load_dotenv
    load_dotenv()
    
    # Priority: "PORT", then "port", default to 8000
    host_port = int(os.getenv("PORT", os.getenv("port", 8000))) # Handle lowercase 'port' from .env
    logger.info(f"Attempting to start AI-Mall Core on port {host_port}")
    uvicorn.run("main:app", host="0.0.0.0", port=host_port, reload=True)


