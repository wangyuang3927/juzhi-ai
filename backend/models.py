"""
FocusAI Data Models (Pydantic)
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================
# Enums
# ============================================

class Profession(str, Enum):
    """User profession types."""
    PRODUCT_MANAGER = "product_manager"
    FRONTEND_ENGINEER = "frontend_engineer"
    BACKEND_ENGINEER = "backend_engineer"
    FULLSTACK_ENGINEER = "fullstack_engineer"
    UI_UX_DESIGNER = "ui_ux_designer"
    GRAPHIC_DESIGNER = "graphic_designer"
    OPERATIONS = "operations"
    MARKETING = "marketing"
    DATA_ANALYST = "data_analyst"
    ONLINE_TEACHER = "online_teacher"
    CONTENT_CREATOR = "content_creator"
    STUDENT = "student"
    ENTREPRENEUR = "entrepreneur"
    OTHER = "other"


class InteractionType(str, Enum):
    """User interaction types with news cards."""
    TRASH = "trash"          # User marked as not interested
    BOOKMARK = "bookmark"    # User bookmarked
    UNBOOKMARK = "unbookmark"  # User removed bookmark
    RATE_GOOD = "rate_good"  # User rated positively (future)
    RATE_BAD = "rate_bad"    # User rated negatively (future)


# ============================================
# Request Models
# ============================================

class UserProfileUpdate(BaseModel):
    """Request model for updating user profile."""
    profession: Profession


class InteractionCreate(BaseModel):
    """Request model for creating an interaction."""
    insight_id: str
    action_type: InteractionType


class GenerateInsightRequest(BaseModel):
    """Request model for generating insight from raw news."""
    news_id: str
    profession: Profession


# ============================================
# Response Models
# ============================================

class RawNews(BaseModel):
    """Raw news item from crawler."""
    id: str
    source_url: str
    source_name: str
    title: str
    content: str
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)


class InsightCard(BaseModel):
    """
    The core data structure: AI-processed news card.
    This is what the frontend receives.
    """
    id: str
    title: str
    tags: List[str]
    summary: str           # A面: 新闻摘要
    impact: str            # B面: 对用户职业的影响/建议
    prompt: str            # 可复制资源: 提取的 Prompt
    url: str               # 原文链接
    timestamp: str         # 发布时间 (格式: YYYY-MM-DD)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-1234",
                "title": "Midjourney V6.1 Released",
                "tags": ["#Midjourney", "#图像生成", "#设计"],
                "summary": "Midjourney 发布 V6.1 版本，支持更精准的文字渲染和 2 倍速度提升。",
                "impact": "作为线上老师，你可以用它快速生成课件配图、教学海报，省去找图和设计的时间。",
                "prompt": "/imagine prompt: 教育场景插画，学生在线学习，温馨明亮的色调 --v 6.1",
                "url": "https://midjourney.com",
                "timestamp": "2024-12-03"
            }
        }


class UserProfile(BaseModel):
    """User profile data."""
    id: str
    profession: Profession
    profession_display: str  # Chinese display name
    created_at: datetime
    updated_at: datetime


class UserInteraction(BaseModel):
    """User interaction record."""
    id: str
    user_id: str
    insight_id: str
    action_type: InteractionType
    created_at: datetime


# ============================================
# API Response Wrappers
# ============================================

class InsightListResponse(BaseModel):
    """Response for listing insights."""
    items: List[InsightCard]
    total: int
    page: int
    page_size: int


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: str = "操作成功"


class ErrorResponse(BaseModel):
    """Generic error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
