"""
FocusAI Database Layer (Supabase)
"""
from supabase import create_client, Client
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from config import get_settings, PROFESSIONS
from models import (
    RawNews, InsightCard, UserProfile, UserInteraction,
    Profession, InteractionType
)


class Database:
    """Supabase database operations."""
    
    def __init__(self):
        settings = get_settings()
        self.client = None
        
        if settings.supabase_url and settings.supabase_key:
            try:
                self.client: Client = create_client(
                    settings.supabase_url,
                    settings.supabase_key
                )
                print("✅ Supabase connected successfully.")
            except Exception as e:
                print(f"⚠️  Supabase connection failed: {e}")
                print("   Running in mock mode.")
                self.client = None
        else:
            print("⚠️  Supabase not configured. Running in mock mode.")
    
    # ============================================
    # Raw News Operations
    # ============================================
    
    async def insert_raw_news(self, news: RawNews) -> bool:
        """Insert a raw news item. Returns False if already exists."""
        if not self.client:
            return True
        
        try:
            self.client.table("raw_news").insert({
                "id": news.id,
                "source_url": news.source_url,
                "source_name": news.source_name,
                "title": news.title,
                "content": news.content,
                "published_at": news.published_at.isoformat() if news.published_at else None,
                "created_at": datetime.now().isoformat()
            }).execute()
            return True
        except Exception as e:
            if "duplicate" in str(e).lower():
                return False
            raise e
    
    async def get_raw_news_by_id(self, news_id: str) -> Optional[RawNews]:
        """Get a single raw news item by ID."""
        if not self.client:
            return None
        
        result = self.client.table("raw_news").select("*").eq("id", news_id).execute()
        if result.data:
            return RawNews(**result.data[0])
        return None
    
    async def get_unprocessed_news(self, limit: int = 10) -> List[RawNews]:
        """Get raw news that hasn't been processed into insights yet."""
        if not self.client:
            return []
        
        # Get news IDs that already have insights
        processed = self.client.table("insights").select("news_id").execute()
        processed_ids = {item["news_id"] for item in processed.data} if processed.data else set()
        
        # Get unprocessed news
        result = self.client.table("raw_news").select("*").order("created_at", desc=True).limit(limit).execute()
        
        return [
            RawNews(**item) for item in result.data 
            if item["id"] not in processed_ids
        ]
    
    # ============================================
    # Insights Operations
    # ============================================
    
    async def insert_insight(self, insight: InsightCard, news_id: str, target_profession: str) -> bool:
        """Insert a processed insight card."""
        if not self.client:
            return True
        
        try:
            self.client.table("insights").insert({
                "id": insight.id,
                "news_id": news_id,
                "title": insight.title,
                "tags": insight.tags,
                "summary": insight.summary,
                "impact": insight.impact,
                "prompt": insight.prompt,
                "url": insight.url,
                "timestamp": insight.timestamp,
                "target_profession": target_profession,
                "created_at": datetime.now().isoformat()
            }).execute()
            return True
        except Exception as e:
            print(f"Error inserting insight: {e}")
            return False
    
    async def get_insights(
        self, 
        user_id: str,
        profession: str,
        page: int = 1, 
        page_size: int = 20,
        exclude_trashed: bool = True
    ) -> tuple[List[InsightCard], int]:
        """
        Get insights for a user, filtered by profession and excluding trashed items.
        Returns (items, total_count).
        """
        if not self.client:
            return [], 0
        
        # Get user's trashed insight IDs
        trashed_ids = set()
        if exclude_trashed:
            trashed = self.client.table("user_interactions")\
                .select("insight_id")\
                .eq("user_id", user_id)\
                .eq("action_type", InteractionType.TRASH.value)\
                .execute()
            trashed_ids = {item["insight_id"] for item in trashed.data} if trashed.data else set()
        
        # Query insights
        query = self.client.table("insights")\
            .select("*", count="exact")\
            .or_(f"target_profession.eq.{profession},target_profession.eq.general")\
            .order("created_at", desc=True)
        
        result = query.execute()
        
        # Filter out trashed and paginate
        all_items = [
            InsightCard(**item) for item in result.data 
            if item["id"] not in trashed_ids
        ]
        
        total = len(all_items)
        start = (page - 1) * page_size
        end = start + page_size
        
        return all_items[start:end], total
    
    async def get_insight_by_id(self, insight_id: str) -> Optional[InsightCard]:
        """Get a single insight by ID."""
        if not self.client:
            return None
        
        result = self.client.table("insights").select("*").eq("id", insight_id).execute()
        if result.data:
            return InsightCard(**result.data[0])
        return None
    
    # ============================================
    # User Operations
    # ============================================
    
    async def get_or_create_user(self, user_id: str) -> UserProfile:
        """Get user profile or create a new one with default settings."""
        if not self.client:
            # Mock user for development
            return UserProfile(
                id=user_id,
                profession=Profession.OTHER,
                profession_display=PROFESSIONS["other"],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        
        result = self.client.table("users").select("*").eq("id", user_id).execute()
        
        if result.data:
            data = result.data[0]
            return UserProfile(
                id=data["id"],
                profession=Profession(data["profession"]),
                profession_display=PROFESSIONS.get(data["profession"], "其他"),
                created_at=datetime.fromisoformat(data["created_at"]),
                updated_at=datetime.fromisoformat(data["updated_at"])
            )
        
        # Create new user
        now = datetime.now()
        new_user = {
            "id": user_id,
            "profession": Profession.OTHER.value,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        self.client.table("users").insert(new_user).execute()
        
        return UserProfile(
            id=user_id,
            profession=Profession.OTHER,
            profession_display=PROFESSIONS["other"],
            created_at=now,
            updated_at=now
        )
    
    async def update_user_profession(self, user_id: str, profession: Profession) -> UserProfile:
        """Update user's profession."""
        if not self.client:
            return UserProfile(
                id=user_id,
                profession=profession,
                profession_display=PROFESSIONS.get(profession.value, "其他"),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        
        now = datetime.now()
        self.client.table("users").update({
            "profession": profession.value,
            "updated_at": now.isoformat()
        }).eq("id", user_id).execute()
        
        return await self.get_or_create_user(user_id)
    
    # ============================================
    # Interactions Operations
    # ============================================
    
    async def record_interaction(
        self, 
        user_id: str, 
        insight_id: str, 
        action_type: InteractionType
    ) -> bool:
        """Record a user interaction (trash, bookmark, etc.)."""
        if not self.client:
            return True
        
        try:
            # For bookmark/unbookmark, toggle the state
            if action_type == InteractionType.UNBOOKMARK:
                self.client.table("user_interactions")\
                    .delete()\
                    .eq("user_id", user_id)\
                    .eq("insight_id", insight_id)\
                    .eq("action_type", InteractionType.BOOKMARK.value)\
                    .execute()
                return True
            
            self.client.table("user_interactions").insert({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "insight_id": insight_id,
                "action_type": action_type.value,
                "created_at": datetime.now().isoformat()
            }).execute()
            return True
        except Exception as e:
            print(f"Error recording interaction: {e}")
            return False
    
    async def get_user_bookmarks(self, user_id: str) -> List[InsightCard]:
        """Get all bookmarked insights for a user."""
        if not self.client:
            return []
        
        # Get bookmarked insight IDs
        bookmarks = self.client.table("user_interactions")\
            .select("insight_id")\
            .eq("user_id", user_id)\
            .eq("action_type", InteractionType.BOOKMARK.value)\
            .execute()
        
        if not bookmarks.data:
            return []
        
        bookmark_ids = [item["insight_id"] for item in bookmarks.data]
        
        # Get the actual insights
        result = self.client.table("insights")\
            .select("*")\
            .in_("id", bookmark_ids)\
            .execute()
        
        return [InsightCard(**item) for item in result.data]
    
    async def is_bookmarked(self, user_id: str, insight_id: str) -> bool:
        """Check if an insight is bookmarked by user."""
        if not self.client:
            return False
        
        result = self.client.table("user_interactions")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("insight_id", insight_id)\
            .eq("action_type", InteractionType.BOOKMARK.value)\
            .execute()
        
        return len(result.data) > 0 if result.data else False


# Global database instance
db = Database()
