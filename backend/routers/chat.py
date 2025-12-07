"""
FocusAI Chat API Router
AI 聊天机器人 + 用户画像提炼
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from pathlib import Path

from openai import OpenAI
from config import get_settings

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# 初始化 DeepSeek 客户端
settings = get_settings()
client = OpenAI(
    api_key=settings.siliconflow_api_key,
    base_url=settings.siliconflow_base_url
)

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
CHAT_HISTORY_FILE = DATA_DIR / "chat_history.json"
USER_PROFILE_FILE = DATA_DIR / "user_profile.json"


# ============================================
# 数据模型
# ============================================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"


class ChatResponse(BaseModel):
    reply: str
    timestamp: str


class UserProfile(BaseModel):
    profession: str = ""
    interests: List[str] = []
    pain_points: List[str] = []
    skill_level: str = ""
    goals: List[str] = []
    updated_at: str = ""


# ============================================
# 辅助函数
# ============================================

def load_chat_history(user_id: str) -> List[dict]:
    """加载用户聊天历史"""
    if not CHAT_HISTORY_FILE.exists():
        return []
    
    try:
        with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
            all_history = json.load(f)
            return all_history.get(user_id, [])
    except:
        return []


def save_chat_history(user_id: str, messages: List[dict]):
    """保存用户聊天历史"""
    all_history = {}
    if CHAT_HISTORY_FILE.exists():
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                all_history = json.load(f)
        except:
            pass
    
    # 只保留最近 50 条消息
    all_history[user_id] = messages[-50:]
    
    with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_history, f, ensure_ascii=False, indent=2)


def load_user_profile(user_id: str) -> dict:
    """加载用户画像"""
    if not USER_PROFILE_FILE.exists():
        return {}
    
    try:
        with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
            all_profiles = json.load(f)
            return all_profiles.get(user_id, {})
    except:
        return {}


def save_user_profile(user_id: str, profile: dict):
    """保存用户画像"""
    all_profiles = {}
    if USER_PROFILE_FILE.exists():
        try:
            with open(USER_PROFILE_FILE, 'r', encoding='utf-8') as f:
                all_profiles = json.load(f)
        except:
            pass
    
    all_profiles[user_id] = profile
    
    with open(USER_PROFILE_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_profiles, f, ensure_ascii=False, indent=2)


# ============================================
# 自动画像分析
# ============================================

async def auto_analyze_profile(user_id: str, history: list):
    """
    自动分析用户画像（在对话后台触发）
    """
    if len(history) < 4:
        return
    
    # 构建分析提示词
    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in history[-20:]
    ])
    
    analysis_prompt = f"""分析以下用户对话，提取用户画像信息。

对话记录：
{conversation_text}

请以 JSON 格式输出用户画像，包含以下字段：
{{
  "profession": "用户的职业（如果提到）",
  "interests": ["用户感兴趣的 AI 领域/工具，最多5个"],
  "pain_points": ["用户提到的工作痛点/挑战，最多3个"],
  "skill_level": "AI 技能水平（初学者/有一定基础/熟练）",
  "goals": ["用户的学习或应用目标，最多3个"]
}}

只输出 JSON，不要其他内容。"""

    response = client.chat.completions.create(
        model=settings.deepseek_model,
        messages=[{"role": "user", "content": analysis_prompt}],
        max_tokens=500,
        temperature=0.3
    )
    
    result = response.choices[0].message.content
    
    # 提取 JSON 部分
    if "```json" in result:
        result = result.split("```json")[1].split("```")[0]
    elif "```" in result:
        result = result.split("```")[1].split("```")[0]
    
    profile = json.loads(result.strip())
    profile["updated_at"] = datetime.now().isoformat()
    
    # 保存用户画像
    save_user_profile(user_id, profile)


# ============================================
# API 端点
# ============================================

@router.post("/send", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    发送消息给 AI 助手
    """
    from services.content_safety import validate_chat_content, check_rate_limit, is_user_blocked
    
    user_id = request.user_id
    user_message = request.message
    
    # 安全检测
    if is_user_blocked(user_id):
        raise HTTPException(status_code=403, detail="账号已被限制，请联系管理员")
    
    rate_ok, rate_msg = check_rate_limit(user_id)
    if not rate_ok:
        raise HTTPException(status_code=429, detail=rate_msg)
    
    content_ok, content_msg = validate_chat_content(user_message, user_id)
    if not content_ok:
        raise HTTPException(status_code=400, detail=content_msg)
    
    # 加载历史记录和用户画像
    history = load_chat_history(user_id)
    profile = load_user_profile(user_id)
    
    # 构建系统提示词
    system_prompt = f"""你是 聚智 AI 的智能助手，专注于帮助用户了解和应用 AI 技术。

你的职责：
1. 回答用户关于 AI 技术、工具、应用的问题
2. 了解用户的职业背景和需求，提供个性化建议
3. 帮助用户找到适合自己的 AI 工具和学习路径
4. 用简洁、专业、友好的语气交流

用户当前画像：
{json.dumps(profile, ensure_ascii=False) if profile else "暂无，请在对话中了解用户"}

注意事项：
- 回答要简洁实用，避免空泛
- 多询问用户的具体需求和痛点
- 推荐具体的工具和方法
- 回复控制在 200 字以内"""

    # 构建消息列表
    messages = [{"role": "system", "content": system_prompt}]
    
    # 添加最近 10 条历史记录
    for msg in history[-10:]:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # 添加当前消息
    messages.append({"role": "user", "content": user_message})
    
    try:
        # 调用 DeepSeek API
        response = client.chat.completions.create(
            model=settings.deepseek_model,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        assistant_reply = response.choices[0].message.content
        timestamp = datetime.now().isoformat()
        
        # 保存对话历史
        history.append({
            "role": "user",
            "content": user_message,
            "timestamp": timestamp
        })
        history.append({
            "role": "assistant",
            "content": assistant_reply,
            "timestamp": timestamp
        })
        save_chat_history(user_id, history)
        
        # 自动分析用户画像（对话达到 4 条以上且画像不存在时触发）
        if len(history) >= 4 and not profile:
            try:
                await auto_analyze_profile(user_id, history)
                print(f"✅ 自动生成用户画像: {user_id}")
            except Exception as e:
                print(f"⚠️ 自动分析画像失败: {e}")
        
        return ChatResponse(reply=assistant_reply, timestamp=timestamp)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 服务错误: {str(e)}")


@router.get("/history")
async def get_chat_history(user_id: str = "default"):
    """获取聊天历史"""
    history = load_chat_history(user_id)
    return {"messages": history}


@router.delete("/history")
async def clear_chat_history(user_id: str = "default"):
    """清空聊天历史"""
    save_chat_history(user_id, [])
    return {"success": True}


@router.post("/analyze-profile")
async def analyze_user_profile(user_id: str = "default"):
    """
    分析聊天历史，提炼用户画像
    """
    history = load_chat_history(user_id)
    
    if len(history) < 4:
        return {"error": "对话记录太少，至少需要 2 轮对话"}
    
    # 构建分析提示词
    conversation_text = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in history[-20:]  # 最近 20 条
    ])
    
    analysis_prompt = f"""分析以下用户对话，提取用户画像信息。

对话记录：
{conversation_text}

请以 JSON 格式输出用户画像，包含以下字段：
{{
  "profession": "用户的职业（如果提到）",
  "interests": ["用户感兴趣的 AI 领域/工具，最多5个"],
  "pain_points": ["用户提到的工作痛点/挑战，最多3个"],
  "skill_level": "AI 技能水平（初学者/有一定基础/熟练）",
  "goals": ["用户的学习或应用目标，最多3个"]
}}

只输出 JSON，不要其他内容。"""

    try:
        response = client.chat.completions.create(
            model=settings.deepseek_model,
            messages=[{"role": "user", "content": analysis_prompt}],
            max_tokens=500,
            temperature=0.3
        )
        
        result = response.choices[0].message.content
        
        # 解析 JSON
        try:
            # 提取 JSON 部分
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0]
            elif "```" in result:
                result = result.split("```")[1].split("```")[0]
            
            profile = json.loads(result.strip())
            profile["updated_at"] = datetime.now().isoformat()
            
            # 保存用户画像
            save_user_profile(user_id, profile)
            
            return {"profile": profile, "success": True}
            
        except json.JSONDecodeError:
            return {"error": "解析用户画像失败", "raw": result}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.get("/profile")
async def get_user_profile(user_id: str = "default"):
    """获取用户画像"""
    profile = load_user_profile(user_id)
    return {"profile": profile}
