"""
FocusAI Invite Code API Router
邀请码功能：邀请新用户注册获得专业版体验
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import json
import uuid
import string
import random
from pathlib import Path

router = APIRouter(prefix="/api/invite", tags=["Invite"])

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
INVITE_FILE = DATA_DIR / "invites.json"
USERS_FILE = DATA_DIR / "users_premium.json"

# 配置
REWARD_DAYS = 7  # 每次邀请奖励天数
MAX_REWARD_DAYS = 365  # 最多累计奖励天数（1年）


class InviteCode(BaseModel):
    code: str
    owner_id: str
    created_at: str
    used_count: int = 0
    used_by: list = []


class UseInviteRequest(BaseModel):
    invite_code: str
    new_user_id: str


class UserPremium(BaseModel):
    user_id: str
    premium_expires: str  # ISO 格式日期
    invited_count: int = 0
    total_reward_days: int = 0


def load_invites() -> dict:
    """加载邀请码数据"""
    if not INVITE_FILE.exists():
        return {}
    try:
        with open(INVITE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}


def save_invites(data: dict):
    """保存邀请码数据"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(INVITE_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_users_premium() -> dict:
    """加载用户专业版数据"""
    if not USERS_FILE.exists():
        return {}
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}


def save_users_premium(data: dict):
    """保存用户专业版数据"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def generate_invite_code() -> str:
    """生成6位邀请码"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=6))


@router.get("/code/{user_id}")
async def get_or_create_invite_code(user_id: str):
    """获取或创建用户的邀请码"""
    invites = load_invites()
    
    # 查找用户现有的邀请码
    for code, data in invites.items():
        if data.get('owner_id') == user_id:
            return {
                "code": code,
                "used_count": data.get('used_count', 0),
                "used_by": data.get('used_by', [])
            }
    
    # 创建新邀请码
    new_code = generate_invite_code()
    while new_code in invites:  # 确保唯一
        new_code = generate_invite_code()
    
    invites[new_code] = {
        "owner_id": user_id,
        "created_at": datetime.now().isoformat(),
        "used_count": 0,
        "used_by": []
    }
    
    save_invites(invites)
    
    return {
        "code": new_code,
        "used_count": 0,
        "used_by": []
    }


@router.post("/use")
async def use_invite_code(request: UseInviteRequest):
    """
    使用邀请码
    - 新用户注册时调用
    - 邀请者获得7天专业版奖励
    """
    invites = load_invites()
    users = load_users_premium()
    
    # 验证邀请码
    if request.invite_code not in invites:
        raise HTTPException(status_code=400, detail="邀请码无效")
    
    invite_data = invites[request.invite_code]
    owner_id = invite_data['owner_id']
    
    # 不能使用自己的邀请码
    if owner_id == request.new_user_id:
        raise HTTPException(status_code=400, detail="不能使用自己的邀请码")
    
    # 检查新用户是否已被邀请过
    for code, data in invites.items():
        if request.new_user_id in data.get('used_by', []):
            raise HTTPException(status_code=400, detail="该用户已使用过邀请码")
    
    # 更新邀请码使用记录
    invite_data['used_count'] = invite_data.get('used_count', 0) + 1
    invite_data['used_by'] = invite_data.get('used_by', []) + [request.new_user_id]
    invites[request.invite_code] = invite_data
    
    # 更新邀请者的专业版时长
    owner_premium = users.get(owner_id, {
        "user_id": owner_id,
        "premium_expires": datetime.now().isoformat(),
        "invited_count": 0,
        "total_reward_days": 0
    })
    
    # 检查是否达到最大奖励天数
    current_reward_days = owner_premium.get('total_reward_days', 0)
    if current_reward_days >= MAX_REWARD_DAYS:
        raise HTTPException(status_code=400, detail=f"已达到最大奖励天数（{MAX_REWARD_DAYS}天）")
    
    # 计算新的过期时间
    current_expires = datetime.fromisoformat(owner_premium.get('premium_expires', datetime.now().isoformat()))
    if current_expires < datetime.now():
        current_expires = datetime.now()
    
    # 限制最大奖励
    actual_reward = min(REWARD_DAYS, MAX_REWARD_DAYS - current_reward_days)
    new_expires = current_expires + timedelta(days=actual_reward)
    
    owner_premium['premium_expires'] = new_expires.isoformat()
    owner_premium['invited_count'] = owner_premium.get('invited_count', 0) + 1
    owner_premium['total_reward_days'] = current_reward_days + actual_reward
    
    users[owner_id] = owner_premium
    
    save_invites(invites)
    save_users_premium(users)
    
    return {
        "success": True,
        "message": f"邀请码使用成功！邀请者获得 {actual_reward} 天专业版体验",
        "inviter_new_expires": new_expires.isoformat()
    }


@router.get("/status/{user_id}")
async def get_invite_status(user_id: str):
    """获取用户的邀请统计和专业版状态"""
    invites = load_invites()
    users = load_users_premium()
    
    # 获取邀请码信息
    invite_code = None
    invited_count = 0
    for code, data in invites.items():
        if data.get('owner_id') == user_id:
            invite_code = code
            invited_count = data.get('used_count', 0)
            break
    
    # 获取专业版状态
    user_premium = users.get(user_id, {})
    premium_expires = user_premium.get('premium_expires')
    total_reward_days = user_premium.get('total_reward_days', 0)
    
    # 判断是否是专业版用户
    is_premium = False
    remaining_days = 0
    if premium_expires:
        expires_date = datetime.fromisoformat(premium_expires)
        if expires_date > datetime.now():
            is_premium = True
            remaining_days = (expires_date - datetime.now()).days
    
    return {
        "invite_code": invite_code,
        "invited_count": invited_count,
        "is_premium": is_premium,
        "premium_expires": premium_expires,
        "remaining_days": remaining_days,
        "total_reward_days": total_reward_days,
        "max_reward_days": MAX_REWARD_DAYS,
        "reward_per_invite": REWARD_DAYS
    }


@router.get("/validate/{code}")
async def validate_invite_code(code: str):
    """验证邀请码是否有效"""
    invites = load_invites()
    
    if code not in invites:
        return {"valid": False, "message": "邀请码无效"}
    
    owner_id = invites[code].get('owner_id', '')
    
    return {
        "valid": True,
        "message": "邀请码有效"
    }
