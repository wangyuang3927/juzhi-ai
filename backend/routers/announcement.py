"""
FocusAI Announcement API Router
公告系统：发布通知、产品更新、活动信息
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import json
from pathlib import Path

router = APIRouter(prefix="/api/announcements", tags=["Announcements"])

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
ANNOUNCEMENTS_FILE = DATA_DIR / "announcements.json"


class Announcement(BaseModel):
    id: Optional[int] = None
    title: str
    content: str
    type: str = "info"  # info, feature, event, maintenance
    link: Optional[str] = None
    link_text: Optional[str] = None
    pinned: bool = False  # 是否置顶（用于横幅展示）
    active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CreateAnnouncementRequest(BaseModel):
    title: str
    content: str
    type: str = "info"
    link: Optional[str] = None
    link_text: Optional[str] = None
    pinned: bool = False


def load_announcements() -> List[dict]:
    """加载公告数据"""
    if not ANNOUNCEMENTS_FILE.exists():
        return []
    try:
        with open(ANNOUNCEMENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []


def save_announcements(announcements: List[dict]):
    """保存公告数据"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(ANNOUNCEMENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(announcements, f, ensure_ascii=False, indent=2)


@router.get("")
async def get_announcements(active_only: bool = True):
    """获取所有公告（公开接口）"""
    announcements = load_announcements()
    
    if active_only:
        announcements = [a for a in announcements if a.get('active', True)]
    
    # 按置顶和时间排序
    announcements.sort(key=lambda x: (
        -x.get('pinned', False),  # 置顶优先
        -datetime.fromisoformat(x.get('created_at', '2000-01-01')).timestamp()
    ))
    
    return {"announcements": announcements}


@router.get("/latest")
async def get_latest_announcement():
    """获取最新的置顶公告（用于横幅展示）"""
    announcements = load_announcements()
    
    # 筛选激活且置顶的公告
    pinned = [a for a in announcements if a.get('active', True) and a.get('pinned', False)]
    
    if pinned:
        # 返回最新的置顶公告
        pinned.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return {"announcement": pinned[0]}
    
    # 如果没有置顶公告，返回最新的普通公告
    active = [a for a in announcements if a.get('active', True)]
    if active:
        active.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return {"announcement": active[0]}
    
    return {"announcement": None}


@router.get("/{announcement_id}")
async def get_announcement(announcement_id: int):
    """获取单个公告详情"""
    announcements = load_announcements()
    
    for a in announcements:
        if a.get('id') == announcement_id:
            return {"announcement": a}
    
    raise HTTPException(status_code=404, detail="公告不存在")


# ============== 管理员接口 ==============

@router.post("")
async def create_announcement(request: CreateAnnouncementRequest, password: str):
    """创建公告（管理员）"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    announcements = load_announcements()
    
    # 生成新 ID
    new_id = max([a.get('id', 0) for a in announcements], default=0) + 1
    
    new_announcement = {
        "id": new_id,
        "title": request.title,
        "content": request.content,
        "type": request.type,
        "link": request.link,
        "link_text": request.link_text,
        "pinned": request.pinned,
        "active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    announcements.append(new_announcement)
    save_announcements(announcements)
    
    return {"success": True, "announcement": new_announcement}


@router.put("/{announcement_id}")
async def update_announcement(announcement_id: int, request: CreateAnnouncementRequest, password: str):
    """更新公告（管理员）"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    announcements = load_announcements()
    
    for i, a in enumerate(announcements):
        if a.get('id') == announcement_id:
            announcements[i].update({
                "title": request.title,
                "content": request.content,
                "type": request.type,
                "link": request.link,
                "link_text": request.link_text,
                "pinned": request.pinned,
                "updated_at": datetime.now().isoformat()
            })
            save_announcements(announcements)
            return {"success": True, "announcement": announcements[i]}
    
    raise HTTPException(status_code=404, detail="公告不存在")


@router.put("/{announcement_id}/toggle")
async def toggle_announcement(announcement_id: int, password: str):
    """切换公告激活状态（管理员）"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    announcements = load_announcements()
    
    for i, a in enumerate(announcements):
        if a.get('id') == announcement_id:
            announcements[i]['active'] = not announcements[i].get('active', True)
            announcements[i]['updated_at'] = datetime.now().isoformat()
            save_announcements(announcements)
            return {"success": True, "active": announcements[i]['active']}
    
    raise HTTPException(status_code=404, detail="公告不存在")


@router.delete("/{announcement_id}")
async def delete_announcement(announcement_id: int, password: str):
    """删除公告（管理员）"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    announcements = load_announcements()
    
    for i, a in enumerate(announcements):
        if a.get('id') == announcement_id:
            del announcements[i]
            save_announcements(announcements)
            return {"success": True}
    
    raise HTTPException(status_code=404, detail="公告不存在")
