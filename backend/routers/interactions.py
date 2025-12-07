"""
FocusAI Interactions API Router
Handles user feedback (trash, bookmark, rate).
"""
from fastapi import APIRouter, Header, HTTPException
from typing import List

from models import (
    InsightCard, InteractionCreate, InteractionType,
    SuccessResponse
)
from database import db

router = APIRouter(prefix="/api", tags=["Interactions"])


@router.post("/interactions", response_model=SuccessResponse)
async def create_interaction(
    interaction: InteractionCreate,
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    """
    Record a user interaction with an insight card.
    
    Action types:
    - trash: Mark as not interested (hides from feed)
    - bookmark: Save to bookmarks
    - unbookmark: Remove from bookmarks
    - rate_good: Rate positively (future)
    - rate_bad: Rate negatively (future)
    """
    success = await db.record_interaction(
        user_id=x_user_id,
        insight_id=interaction.insight_id,
        action_type=interaction.action_type
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to record interaction")
    
    action_messages = {
        InteractionType.TRASH: "已标记为不感兴趣",
        InteractionType.BOOKMARK: "已添加到收藏",
        InteractionType.UNBOOKMARK: "已从收藏移除",
        InteractionType.RATE_GOOD: "感谢你的反馈",
        InteractionType.RATE_BAD: "感谢你的反馈，我们会改进",
    }
    
    return SuccessResponse(
        success=True,
        message=action_messages.get(interaction.action_type, "操作成功")
    )


@router.get("/bookmarks", response_model=List[InsightCard])
async def get_bookmarks(
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    """
    Get all bookmarked insights for the current user.
    """
    bookmarks = await db.get_user_bookmarks(x_user_id)
    return bookmarks


@router.get("/bookmarks/mock", response_model=List[InsightCard])
async def get_mock_bookmarks():
    """
    Get mock bookmarks for development/demo.
    """
    # Return empty list for mock - user needs to bookmark first
    return []
