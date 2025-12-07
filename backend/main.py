"""
FocusAI Backend - Main Application
职场 AI 之窗 API 服务
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from routers import insights, chat, admin, share, contact, analytics, invite, announcement


# ============================================
# Application Lifespan
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print("🚀 FocusAI Backend Starting...")
    print(f"   Debug Mode: {get_settings().debug}")
    print(f"   DeepSeek Model: {get_settings().deepseek_model}")
    
    yield
    
    # Shutdown
    print("👋 FocusAI Backend Shutting down...")


# ============================================
# Create Application
# ============================================

app = FastAPI(
    title="FocusAI API",
    description="职场 AI 之窗 - 私人定制的 AI 资讯平台",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================
# CORS Middleware
# ============================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React dev server
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",       # Vercel deployments
        "https://*.netlify.app",      # Netlify deployments
        "*",                          # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Include Routers
# ============================================

app.include_router(insights.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(share.router)
app.include_router(contact.router)
app.include_router(analytics.router)
app.include_router(invite.router)
app.include_router(announcement.router)


# ============================================
# Root Endpoints
# ============================================

@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "FocusAI API",
        "version": "1.0.0",
        "description": "职场 AI 之窗 - 私人定制的 AI 资讯平台",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.api_port,
        reload=settings.debug
    )
