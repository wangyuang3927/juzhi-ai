"""
FocusAI Share API Router
分享功能 + 邀请码系统
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import uuid
import hashlib
from pathlib import Path

from storage import storage

router = APIRouter(prefix="/api/share", tags=["Share"])

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
INVITE_CODES_FILE = DATA_DIR / "invite_codes.json"
SHARE_STATS_FILE = DATA_DIR / "share_stats.json"


# ============================================
# 数据模型
# ============================================

class InviteCode(BaseModel):
    code: str
    creator_id: str
    created_at: str
    used_count: int = 0
    max_uses: int = 10


class SharePageData(BaseModel):
    date: str
    items: List[dict]
    invite_code: Optional[str] = None


# ============================================
# 辅助函数
# ============================================

def load_invite_codes() -> dict:
    """加载邀请码数据"""
    if not INVITE_CODES_FILE.exists():
        return {}
    try:
        with open(INVITE_CODES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}


def save_invite_codes(codes: dict):
    """保存邀请码数据"""
    with open(INVITE_CODES_FILE, 'w', encoding='utf-8') as f:
        json.dump(codes, f, ensure_ascii=False, indent=2)


def load_share_stats() -> dict:
    """加载分享统计"""
    if not SHARE_STATS_FILE.exists():
        return {"total_shares": 0, "total_views": 0, "by_date": {}}
    try:
        with open(SHARE_STATS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"total_shares": 0, "total_views": 0, "by_date": {}}


def save_share_stats(stats: dict):
    """保存分享统计"""
    with open(SHARE_STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)


def generate_invite_code(user_id: str) -> str:
    """生成邀请码 - 6位字母数字组合"""
    hash_input = f"{user_id}{datetime.now().isoformat()}{uuid.uuid4()}"
    hash_result = hashlib.md5(hash_input.encode()).hexdigest()
    return hash_result[:6].upper()


# ============================================
# API 端点
# ============================================

@router.get("/daily/{date}")
async def get_daily_share(date: str, invite_code: Optional[str] = None):
    """
    获取某日的分享内容（公开访问）
    """
    # 记录查看统计
    stats = load_share_stats()
    stats["total_views"] = stats.get("total_views", 0) + 1
    if date not in stats.get("by_date", {}):
        stats["by_date"] = stats.get("by_date", {})
        stats["by_date"][date] = {"views": 0, "shares": 0}
    stats["by_date"][date]["views"] = stats["by_date"][date].get("views", 0) + 1
    save_share_stats(stats)
    
    # 记录邀请码使用
    if invite_code:
        codes = load_invite_codes()
        if invite_code in codes:
            codes[invite_code]["used_count"] = codes[invite_code].get("used_count", 0) + 1
            save_invite_codes(codes)
    
    # 获取当日新闻
    all_insights = await storage.get_insights(limit=100, offset=0)
    daily_items = [item for item in all_insights if item.get("timestamp", "").startswith(date)]
    
    # 简化数据，只返回必要字段
    public_items = []
    for item in daily_items[:10]:  # 最多10条
        public_items.append({
            "id": item.get("id"),
            "title": item.get("title"),
            "summary": item.get("summary"),
            "tags": item.get("tags", []),
            "timestamp": item.get("timestamp"),
        })
    
    return {
        "date": date,
        "items": public_items,
        "item_count": len(public_items),
        "cta": {
            "title": "想要更个性化的 AI 资讯？",
            "description": "注册 FocusAI，获取为你定制的 AI 行业洞察",
            "button_text": "免费注册",
            "invite_code": invite_code
        }
    }


@router.post("/create-link")
async def create_share_link(date: str, user_id: str = "default"):
    """
    创建分享链接
    """
    # 生成或获取用户的邀请码
    codes = load_invite_codes()
    
    # 查找用户已有的邀请码
    user_code = None
    for code, data in codes.items():
        if data.get("creator_id") == user_id:
            user_code = code
            break
    
    # 如果没有，创建新的
    if not user_code:
        user_code = generate_invite_code(user_id)
        codes[user_code] = {
            "code": user_code,
            "creator_id": user_id,
            "created_at": datetime.now().isoformat(),
            "used_count": 0,
            "max_uses": 100
        }
        save_invite_codes(codes)
    
    # 记录分享统计
    stats = load_share_stats()
    stats["total_shares"] = stats.get("total_shares", 0) + 1
    save_share_stats(stats)
    
    return {
        "share_url": f"/share?date={date}&code={user_code}",
        "invite_code": user_code,
        "message": "分享链接已创建"
    }


@router.get("/invite-code/{user_id}")
async def get_user_invite_code(user_id: str):
    """
    获取用户的邀请码
    """
    codes = load_invite_codes()
    
    for code, data in codes.items():
        if data.get("creator_id") == user_id:
            return {
                "code": code,
                "used_count": data.get("used_count", 0),
                "created_at": data.get("created_at")
            }
    
    # 创建新邀请码
    new_code = generate_invite_code(user_id)
    codes[new_code] = {
        "code": new_code,
        "creator_id": user_id,
        "created_at": datetime.now().isoformat(),
        "used_count": 0,
        "max_uses": 100
    }
    save_invite_codes(codes)
    
    return {
        "code": new_code,
        "used_count": 0,
        "created_at": codes[new_code]["created_at"]
    }


@router.get("/stats")
async def get_share_stats():
    """
    获取分享统计（管理员）
    """
    stats = load_share_stats()
    codes = load_invite_codes()
    
    return {
        "total_shares": stats.get("total_shares", 0),
        "total_views": stats.get("total_views", 0),
        "total_invite_codes": len(codes),
        "top_inviters": sorted(
            [{"code": k, **v} for k, v in codes.items()],
            key=lambda x: x.get("used_count", 0),
            reverse=True
        )[:10]
    }
