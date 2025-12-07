"""
FocusAI Users API Router
Handles user profile and settings.
"""
from fastapi import APIRouter, Header, HTTPException
from typing import List

from models import (
    UserProfile, UserProfileUpdate, Profession,
    SuccessResponse
)
from database import db
from config import PROFESSIONS

router = APIRouter(prefix="/api/user", tags=["User"])


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    """
    Get current user's profile.
    Creates a new profile if user doesn't exist.
    """
    user = await db.get_or_create_user(x_user_id)
    return user


@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    update: UserProfileUpdate,
    x_user_id: str = Header(default="anonymous", alias="X-User-Id")
):
    """
    Update user's profile (profession, etc.).
    """
    user = await db.update_user_profession(x_user_id, update.profession)
    return user


@router.get("/professions", response_model=List[dict])
async def list_professions():
    """
    Get list of available professions.
    Returns both the key (for API) and display name (for UI).
    """
    return [
        {"key": key, "display": display}
        for key, display in PROFESSIONS.items()
    ]
