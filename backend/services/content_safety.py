"""
FocusAI Content Safety Service
内容安全检测：防止滥用 API
"""
import re
from datetime import datetime, timedelta
from typing import Optional, Tuple
from collections import defaultdict
import json
from pathlib import Path

# 数据存储
DATA_DIR = Path(__file__).parent.parent / "data"
VIOLATIONS_FILE = DATA_DIR / "violations.json"

# 请求频率限制存储（内存）
request_counts = defaultdict(list)  # user_id -> [timestamps]

# ============== 配置 ==============
MAX_PROFESSION_LENGTH = 50  # 职业最大长度
MAX_REQUESTS_PER_MINUTE = 10  # 每分钟最大请求数
MAX_REQUESTS_PER_HOUR = 60  # 每小时最大请求数

# 职业黑名单关键词（不允许包含的词）
PROFESSION_BLACKLIST = [
    # 敏感词
    '黑客', '破解', '攻击', '入侵', '病毒', '木马', '钓鱼',
    # 违规内容
    '色情', '赌博', '诈骗', '传销', '毒品',
    # 系统相关（防止注入）
    'system', 'admin', 'root', 'delete', 'drop', 'select', 'insert',
    '```', '<script', 'javascript:', 'eval(', 'exec(',
]

# 合理职业关键词（白名单参考，用于评分）
PROFESSION_WHITELIST = [
    '工程师', '设计师', '经理', '总监', '分析师', '运营', '销售',
    '老师', '教师', '讲师', '学生', '研究员', '科学家', '医生',
    '律师', '会计', '财务', '人事', '行政', '市场', '产品',
    '创业者', '自由职业', '咨询', '顾问', '助理', '专员',
    '前端', '后端', '全栈', '测试', '运维', '数据', 'AI', '算法',
    '内容', '编辑', '记者', '作家', '摄影', '视频', '直播',
]

# 聊天内容黑名单
CHAT_BLACKLIST = [
    # 尝试突破限制
    'ignore previous', 'ignore above', 'disregard', 'forget',
    '忽略上面', '忽略之前', '无视指令', '跳过限制',
    # 敏感请求
    '生成恶意', '写病毒', '攻击代码', '入侵方法',
    # 注入尝试
    '```system', 'SYSTEM:', '[SYSTEM]',
]


def load_violations() -> dict:
    """加载违规记录"""
    if not VIOLATIONS_FILE.exists():
        return {"users": {}}
    try:
        with open(VIOLATIONS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"users": {}}


def save_violations(data: dict):
    """保存违规记录"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(VIOLATIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def record_violation(user_id: str, violation_type: str, content: str):
    """记录违规行为"""
    data = load_violations()
    
    if user_id not in data["users"]:
        data["users"][user_id] = {"violations": [], "blocked": False}
    
    data["users"][user_id]["violations"].append({
        "type": violation_type,
        "content": content[:200],  # 只保存前200字符
        "timestamp": datetime.now().isoformat()
    })
    
    # 违规超过5次自动封禁
    if len(data["users"][user_id]["violations"]) >= 5:
        data["users"][user_id]["blocked"] = True
    
    save_violations(data)


def is_user_blocked(user_id: str) -> bool:
    """检查用户是否被封禁"""
    data = load_violations()
    return data.get("users", {}).get(user_id, {}).get("blocked", False)


def check_rate_limit(user_id: str) -> Tuple[bool, str]:
    """
    检查请求频率限制
    返回: (是否通过, 错误信息)
    """
    now = datetime.now()
    
    # 清理过期记录
    request_counts[user_id] = [
        t for t in request_counts[user_id] 
        if now - t < timedelta(hours=1)
    ]
    
    timestamps = request_counts[user_id]
    
    # 检查每分钟限制
    recent_minute = [t for t in timestamps if now - t < timedelta(minutes=1)]
    if len(recent_minute) >= MAX_REQUESTS_PER_MINUTE:
        return False, "请求过于频繁，请稍后再试"
    
    # 检查每小时限制
    if len(timestamps) >= MAX_REQUESTS_PER_HOUR:
        return False, "已达到每小时请求上限，请稍后再试"
    
    # 记录本次请求
    request_counts[user_id].append(now)
    
    return True, ""


def validate_profession(profession: str, user_id: str = "") -> Tuple[bool, str]:
    """
    验证职业是否合法
    返回: (是否合法, 错误/警告信息)
    """
    if not profession or not profession.strip():
        return False, "职业不能为空"
    
    profession = profession.strip()
    
    # 长度检查
    if len(profession) > MAX_PROFESSION_LENGTH:
        if user_id:
            record_violation(user_id, "profession_too_long", profession)
        return False, f"职业描述过长，请限制在{MAX_PROFESSION_LENGTH}字以内"
    
    # 黑名单检查
    profession_lower = profession.lower()
    for keyword in PROFESSION_BLACKLIST:
        if keyword.lower() in profession_lower:
            if user_id:
                record_violation(user_id, "profession_blacklist", profession)
            return False, "职业描述包含不允许的内容"
    
    # 特殊字符检查（防止注入）
    if re.search(r'[<>{}|\[\]\\;`]', profession):
        if user_id:
            record_violation(user_id, "profession_injection", profession)
        return False, "职业描述包含非法字符"
    
    # 纯数字/符号检查
    if re.match(r'^[\d\s\W]+$', profession):
        if user_id:
            record_violation(user_id, "profession_invalid", profession)
        return False, "请输入有效的职业描述"
    
    # 白名单评分（可选，用于提示）
    has_valid_keyword = any(kw in profession for kw in PROFESSION_WHITELIST)
    
    return True, "" if has_valid_keyword else "提示：请输入具体的职业，如'产品经理'、'前端工程师'等"


def validate_chat_content(content: str, user_id: str = "") -> Tuple[bool, str]:
    """
    验证聊天内容是否合法
    返回: (是否合法, 错误信息)
    """
    if not content or not content.strip():
        return True, ""
    
    content_lower = content.lower()
    
    # 黑名单检查
    for keyword in CHAT_BLACKLIST:
        if keyword.lower() in content_lower:
            if user_id:
                record_violation(user_id, "chat_blacklist", content)
            return False, "您的消息包含不允许的内容"
    
    # 超长内容检查（防止 token 滥用）
    if len(content) > 2000:
        return False, "消息过长，请限制在2000字符以内"
    
    return True, ""


def get_user_violations(user_id: str) -> dict:
    """获取用户违规记录（管理员用）"""
    data = load_violations()
    return data.get("users", {}).get(user_id, {"violations": [], "blocked": False})


def unblock_user(user_id: str) -> bool:
    """解封用户（管理员用）"""
    data = load_violations()
    if user_id in data.get("users", {}):
        data["users"][user_id]["blocked"] = False
        save_violations(data)
        return True
    return False


def get_all_violations() -> dict:
    """获取所有违规记录（管理员用）"""
    return load_violations()
