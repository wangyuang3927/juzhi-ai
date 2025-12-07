"""
聚智 AI - Supabase 数据库服务
替代 JSON 文件存储
"""
import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

# Supabase 配置（从环境变量读取）
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # 使用 service_role key

# 初始化客户端
supabase: Optional[Client] = None

def get_supabase() -> Client:
    """获取 Supabase 客户端"""
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise Exception("Supabase 配置缺失，请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY")
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase


# ============================================
# 用户画像
# ============================================
def get_user_profile(user_id: str) -> Optional[Dict]:
    """获取用户画像"""
    result = get_supabase().table("user_profiles").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None

def save_user_profile(user_id: str, profile: Dict) -> Dict:
    """保存用户画像（upsert）"""
    data = {
        "user_id": user_id,
        **profile,
        "updated_at": datetime.now().isoformat()
    }
    result = get_supabase().table("user_profiles").upsert(data, on_conflict="user_id").execute()
    return result.data[0] if result.data else {}


# ============================================
# 聊天记录
# ============================================
def get_chat_history(user_id: str, limit: int = 50) -> List[Dict]:
    """获取聊天历史"""
    result = get_supabase().table("chat_messages")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    return list(reversed(result.data)) if result.data else []

def save_chat_message(user_id: str, role: str, content: str) -> Dict:
    """保存聊天消息"""
    data = {
        "user_id": user_id,
        "role": role,
        "content": content
    }
    result = get_supabase().table("chat_messages").insert(data).execute()
    return result.data[0] if result.data else {}


# ============================================
# 联系留言
# ============================================
def get_contact_messages() -> List[Dict]:
    """获取所有留言"""
    result = get_supabase().table("contact_messages")\
        .select("*")\
        .order("created_at", desc=True)\
        .execute()
    return result.data or []

def save_contact_message(name: str, email: str, subject: str, message: str) -> Dict:
    """保存留言"""
    data = {
        "name": name,
        "email": email,
        "subject": subject,
        "message": message
    }
    result = get_supabase().table("contact_messages").insert(data).execute()
    return result.data[0] if result.data else {}

def mark_message_read(message_id: int) -> bool:
    """标记留言已读"""
    get_supabase().table("contact_messages").update({"is_read": True}).eq("id", message_id).execute()
    return True

def delete_contact_message(message_id: int) -> bool:
    """删除留言"""
    get_supabase().table("contact_messages").delete().eq("id", message_id).execute()
    return True


# ============================================
# 邀请码
# ============================================
def get_invite_code(user_id: str) -> Optional[str]:
    """获取用户的邀请码"""
    result = get_supabase().table("invite_codes").select("code").eq("user_id", user_id).execute()
    return result.data[0]["code"] if result.data else None

def create_invite_code(user_id: str, code: str) -> Dict:
    """创建邀请码"""
    data = {"user_id": user_id, "code": code}
    result = get_supabase().table("invite_codes").insert(data).execute()
    return result.data[0] if result.data else {}

def get_invite_by_code(code: str) -> Optional[Dict]:
    """通过邀请码查询"""
    result = get_supabase().table("invite_codes").select("*").eq("code", code).execute()
    return result.data[0] if result.data else None

def add_invited_user(code: str, new_user_id: str) -> bool:
    """添加被邀请用户"""
    invite = get_invite_by_code(code)
    if not invite:
        return False
    invited_users = invite.get("invited_users", []) or []
    invited_users.append(new_user_id)
    get_supabase().table("invite_codes").update({"invited_users": invited_users}).eq("code", code).execute()
    return True


# ============================================
# 专业版用户
# ============================================
def get_premium_status(user_id: str) -> Optional[Dict]:
    """获取专业版状态"""
    result = get_supabase().table("premium_users").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None

def set_premium_expires(user_id: str, expires_at: datetime, source: str = "invite") -> Dict:
    """设置专业版过期时间"""
    data = {
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "source": source
    }
    result = get_supabase().table("premium_users").upsert(data, on_conflict="user_id").execute()
    return result.data[0] if result.data else {}


# ============================================
# 公告
# ============================================
def get_announcements(active_only: bool = True) -> List[Dict]:
    """获取公告列表"""
    query = get_supabase().table("announcements").select("*")
    if active_only:
        query = query.eq("active", True)
    result = query.order("pinned", desc=True).order("created_at", desc=True).execute()
    return result.data or []

def get_latest_announcement() -> Optional[Dict]:
    """获取最新公告"""
    result = get_supabase().table("announcements")\
        .select("*")\
        .eq("active", True)\
        .order("pinned", desc=True)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    return result.data[0] if result.data else None

def create_announcement(data: Dict) -> Dict:
    """创建公告"""
    result = get_supabase().table("announcements").insert(data).execute()
    return result.data[0] if result.data else {}

def update_announcement(announcement_id: int, data: Dict) -> Dict:
    """更新公告"""
    result = get_supabase().table("announcements").update(data).eq("id", announcement_id).execute()
    return result.data[0] if result.data else {}

def delete_announcement(announcement_id: int) -> bool:
    """删除公告"""
    get_supabase().table("announcements").delete().eq("id", announcement_id).execute()
    return True


# ============================================
# 埋点分析
# ============================================
def track_event(user_id: str, event_type: str, event_name: str, page: str = "", extra: Dict = None) -> Dict:
    """记录埋点事件"""
    data = {
        "user_id": user_id,
        "event_type": event_type,
        "event_name": event_name,
        "page": page,
        "extra": extra or {}
    }
    result = get_supabase().table("analytics_events").insert(data).execute()
    return result.data[0] if result.data else {}

def get_analytics_stats() -> Dict:
    """获取统计数据"""
    # 总事件数
    total = get_supabase().table("analytics_events").select("id", count="exact").execute()
    
    # 今日事件数
    today = datetime.now().date().isoformat()
    today_events = get_supabase().table("analytics_events")\
        .select("id", count="exact")\
        .gte("created_at", today)\
        .execute()
    
    return {
        "total_events": total.count or 0,
        "today_events": today_events.count or 0
    }


# ============================================
# 违规记录
# ============================================
def record_violation(user_id: str, violation_type: str, content: str) -> Dict:
    """记录违规"""
    data = {
        "user_id": user_id,
        "violation_type": violation_type,
        "content": content[:500]
    }
    result = get_supabase().table("violations").insert(data).execute()
    
    # 检查违规次数，超过5次自动封禁
    count_result = get_supabase().table("violations").select("id", count="exact").eq("user_id", user_id).execute()
    if count_result.count and count_result.count >= 5:
        block_user(user_id, "违规次数过多")
    
    return result.data[0] if result.data else {}

def is_user_blocked(user_id: str) -> bool:
    """检查用户是否被封禁"""
    result = get_supabase().table("blocked_users").select("id").eq("user_id", user_id).execute()
    return len(result.data) > 0 if result.data else False

def block_user(user_id: str, reason: str = "") -> Dict:
    """封禁用户"""
    data = {"user_id": user_id, "reason": reason}
    result = get_supabase().table("blocked_users").upsert(data, on_conflict="user_id").execute()
    return result.data[0] if result.data else {}

def unblock_user(user_id: str) -> bool:
    """解封用户"""
    get_supabase().table("blocked_users").delete().eq("user_id", user_id).execute()
    return True


# ============================================
# 收藏
# ============================================
def get_bookmarks(user_id: str) -> List[Dict]:
    """获取用户收藏"""
    result = get_supabase().table("bookmarks")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    return result.data or []

def add_bookmark(user_id: str, item_id: str, item_type: str, item_data: Dict) -> Dict:
    """添加收藏"""
    data = {
        "user_id": user_id,
        "item_id": item_id,
        "item_type": item_type,
        "item_data": item_data
    }
    result = get_supabase().table("bookmarks").upsert(data, on_conflict="user_id,item_id").execute()
    return result.data[0] if result.data else {}

def remove_bookmark(user_id: str, item_id: str) -> bool:
    """删除收藏"""
    get_supabase().table("bookmarks").delete().eq("user_id", user_id).eq("item_id", item_id).execute()
    return True
