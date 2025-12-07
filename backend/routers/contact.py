"""
FocusAI Contact API Router
处理联系表单提交
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import json
from pathlib import Path

router = APIRouter(prefix="/api/contact", tags=["Contact"])

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
CONTACT_FILE = DATA_DIR / "contact_messages.json"


class ContactMessage(BaseModel):
    name: str
    email: str
    phone: str = ""
    message: str


def load_messages() -> list:
    """加载所有留言"""
    if not CONTACT_FILE.exists():
        return []
    try:
        with open(CONTACT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []


def save_messages(messages: list):
    """保存留言"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONTACT_FILE, 'w', encoding='utf-8') as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)


@router.post("")
async def submit_contact(contact: ContactMessage):
    """提交联系表单"""
    messages = load_messages()
    
    new_message = {
        "id": len(messages) + 1,
        "name": contact.name,
        "email": contact.email,
        "phone": contact.phone,
        "message": contact.message,
        "created_at": datetime.now().isoformat(),
        "read": False  # 是否已读
    }
    
    messages.append(new_message)
    save_messages(messages)
    
    print(f"📩 收到新留言: {contact.name} <{contact.email}>")
    
    return {"success": True, "message": "留言已提交"}


@router.get("")
async def get_messages(password: str):
    """获取所有留言（管理员）"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    messages = load_messages()
    # 按时间倒序
    messages.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return {"messages": messages, "total": len(messages)}


@router.put("/{message_id}/read")
async def mark_as_read(message_id: int, password: str):
    """标记留言已读"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    messages = load_messages()
    for msg in messages:
        if msg.get('id') == message_id:
            msg['read'] = True
            save_messages(messages)
            return {"success": True}
    
    raise HTTPException(status_code=404, detail="留言不存在")


@router.delete("/{message_id}")
async def delete_message(message_id: int, password: str):
    """删除留言"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    messages = load_messages()
    messages = [m for m in messages if m.get('id') != message_id]
    save_messages(messages)
    
    return {"success": True}
