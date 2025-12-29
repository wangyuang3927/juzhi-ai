"""
FocusAI Admin API Router
管理后台接口
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from pathlib import Path

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# 管理员密码 - 从环境变量读取
import os
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
CHAT_HISTORY_FILE = DATA_DIR / "chat_history.json"
USER_PROFILE_FILE = DATA_DIR / "user_profile.json"


# ============================================
# 验证函数
# ============================================

def verify_admin(password: str):
    """验证管理员密码"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="管理员密码错误")


# ============================================
# 数据模型
# ============================================

class UserOverview(BaseModel):
    user_id: str
    profession: str
    interests: List[str]
    message_count: int
    last_active: Optional[str]


class AdminStats(BaseModel):
    total_users: int
    total_messages: int
    users_with_profile: int
    avg_messages_per_user: float


# ============================================
# API 端点
# ============================================

@router.get("/stats")
async def get_stats(password: str):
    """获取统计数据"""
    verify_admin(password)
    
    # 读取聊天记录
    all_chats = {}
    if CHAT_HISTORY_FILE.exists():
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_chats = json.load(f)
        except:
            pass
    
    # 读取用户画像
    all_profiles = {}
    if USER_PROFILE_FILE.exists():
        try:
            with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
                all_profiles = json.load(f)
        except:
            pass
    
    # 计算统计数据
    total_users = len(set(list(all_chats.keys()) + list(all_profiles.keys())))
    total_messages = sum(len(msgs) for msgs in all_chats.values())
    users_with_profile = len(all_profiles)
    avg_messages = total_messages / max(len(all_chats), 1)
    
    return AdminStats(
        total_users=total_users,
        total_messages=total_messages,
        users_with_profile=users_with_profile,
        avg_messages_per_user=round(avg_messages, 1)
    )


@router.get("/users")
async def get_all_users(password: str):
    """获取所有用户列表"""
    verify_admin(password)
    
    # 读取聊天记录
    all_chats = {}
    if CHAT_HISTORY_FILE.exists():
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_chats = json.load(f)
        except:
            pass
    
    # 读取用户画像
    all_profiles = {}
    if USER_PROFILE_FILE.exists():
        try:
            with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
                all_profiles = json.load(f)
        except:
            pass
    
    # 合并用户数据
    all_user_ids = set(list(all_chats.keys()) + list(all_profiles.keys()))
    
    users = []
    for user_id in all_user_ids:
        profile = all_profiles.get(user_id, {})
        messages = all_chats.get(user_id, [])
        
        # 获取最后活跃时间
        last_active = None
        if messages:
            last_msg = messages[-1]
            last_active = last_msg.get('timestamp', None)
        
        users.append(UserOverview(
            user_id=user_id,
            profession=profile.get('profession', '未设置'),
            interests=profile.get('interests', []),
            message_count=len(messages),
            last_active=last_active
        ))
    
    # 按消息数排序
    users.sort(key=lambda x: x.message_count, reverse=True)
    
    return {"users": [u.model_dump() for u in users]}


@router.get("/user/{user_id}")
async def get_user_detail(user_id: str, password: str):
    """获取单个用户详情"""
    verify_admin(password)
    
    # 读取聊天记录
    messages = []
    if CHAT_HISTORY_FILE.exists():
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_chats = json.load(f)
                messages = all_chats.get(user_id, [])
        except:
            pass
    
    # 读取用户画像
    profile = {}
    if USER_PROFILE_FILE.exists():
        try:
            with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
                all_profiles = json.load(f)
                profile = all_profiles.get(user_id, {})
        except:
            pass
    
    return {
        "user_id": user_id,
        "profile": profile,
        "messages": messages,
        "message_count": len(messages)
    }


@router.delete("/user/{user_id}")
async def delete_user_data(user_id: str, password: str):
    """删除用户数据"""
    verify_admin(password)
    
    # 删除聊天记录
    if CHAT_HISTORY_FILE.exists():
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_chats = json.load(f)
            if user_id in all_chats:
                del all_chats[user_id]
                with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
                    json.dump(all_chats, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    # 删除用户画像
    if USER_PROFILE_FILE.exists():
        try:
            with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
                all_profiles = json.load(f)
            if user_id in all_profiles:
                del all_profiles[user_id]
                with open(USER_PROFILE_FILE, 'w', encoding='utf-8') as f:
                    json.dump(all_profiles, f, ensure_ascii=False, indent=2)
        except:
            pass
    
    return {"success": True, "message": f"已删除用户 {user_id} 的数据"}


# ============================================
# 违规记录管理
# ============================================

@router.get("/violations")
async def get_violations(password: str):
    """获取所有违规记录"""
    verify_admin(password)
    from services.content_safety import get_all_violations
    return get_all_violations()


@router.post("/violations/unblock/{user_id}")
async def unblock_user(user_id: str, password: str):
    """解封用户"""
    verify_admin(password)
    from services.content_safety import unblock_user as do_unblock
    success = do_unblock(user_id)
    if success:
        return {"success": True, "message": f"已解封用户 {user_id}"}
    return {"success": False, "message": "用户不存在或未被封禁"}


# ============================================
# 专业版用户管理
# ============================================

PREMIUM_FILE = DATA_DIR / "users_premium.json"

def load_premium_users() -> dict:
    """加载专业版用户数据"""
    if not PREMIUM_FILE.exists():
        return {}
    try:
        with open(PREMIUM_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_premium_users(data: dict):
    """保存专业版用户数据"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(PREMIUM_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class GrantPremiumRequest(BaseModel):
    email: str
    days: int = 30
    source: str = "admin"


@router.get("/premium/list")
async def list_premium_users(password: str):
    """获取所有专业版用户列表"""
    verify_admin(password)
    users = load_premium_users()
    
    result = []
    for user_id, data in users.items():
        expires = data.get('premium_expires')
        is_active = False
        remaining_days = 0
        
        if expires:
            from datetime import datetime
            expires_date = datetime.fromisoformat(expires)
            if expires_date > datetime.now():
                is_active = True
                remaining_days = (expires_date - datetime.now()).days
        
        result.append({
            "user_id": user_id,
            "email": data.get("email", ""),
            "expires": expires,
            "is_active": is_active,
            "remaining_days": remaining_days,
            "source": data.get("source", "invite"),
            "total_reward_days": data.get("total_reward_days", 0)
        })
    
    # 按剩余天数排序
    result.sort(key=lambda x: x['remaining_days'], reverse=True)
    return result


@router.post("/premium/grant")
async def grant_premium(request: GrantPremiumRequest, password: str):
    """
    手动开通专业版
    - email: 用户邮箱（用于查找用户）
    - days: 开通天数
    - source: 来源（admin/payment）
    """
    verify_admin(password)
    
    from datetime import datetime, timedelta
    
    users = load_premium_users()
    
    # 通过邮箱查找用户 ID（遍历所有用户画像）
    user_id = None
    try:
        if USER_PROFILE_FILE.exists():
            with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
                profiles = json.load(f)
                for uid, profile in profiles.items():
                    if profile.get('email', '').lower() == request.email.lower():
                        user_id = uid
                        break
    except:
        pass
    
    # 如果找不到用户，使用邮箱作为用户 ID（支持预开通）
    if not user_id:
        user_id = f"email:{request.email}"
    
    # 获取现有专业版数据
    user_data = users.get(user_id, {
        "user_id": user_id,
        "email": request.email,
        "premium_expires": datetime.now().isoformat(),
        "total_reward_days": 0
    })
    
    # 计算新的过期时间
    current_expires = datetime.fromisoformat(user_data.get('premium_expires', datetime.now().isoformat()))
    if current_expires < datetime.now():
        current_expires = datetime.now()
    
    new_expires = current_expires + timedelta(days=request.days)
    
    user_data['premium_expires'] = new_expires.isoformat()
    user_data['email'] = request.email
    user_data['source'] = request.source
    user_data['total_reward_days'] = user_data.get('total_reward_days', 0) + request.days
    user_data['granted_at'] = datetime.now().isoformat()
    user_data['granted_by'] = "admin"
    
    users[user_id] = user_data
    save_premium_users(users)
    
    return {
        "success": True,
        "message": f"已为 {request.email} 开通 {request.days} 天专业版",
        "user_id": user_id,
        "expires": new_expires.isoformat(),
        "remaining_days": request.days
    }


@router.delete("/premium/{user_id}")
async def revoke_premium(user_id: str, password: str):
    """撤销用户专业版"""
    verify_admin(password)
    
    users = load_premium_users()
    
    if user_id not in users:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    del users[user_id]
    save_premium_users(users)
    
    return {"success": True, "message": f"已撤销用户 {user_id} 的专业版"}
