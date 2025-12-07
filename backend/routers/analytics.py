"""
FocusAI Analytics API Router
用户行为埋点统计
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import json
from pathlib import Path
from collections import defaultdict

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
EVENTS_FILE = DATA_DIR / "analytics_events.json"
PV_FILE = DATA_DIR / "page_views.json"


class TrackEvent(BaseModel):
    event_type: str  # click, view, action
    event_name: str  # 按钮名称或页面名称
    page: str = ""   # 所在页面
    user_id: str = "anonymous"
    extra: dict = {}  # 额外信息


def load_events() -> list:
    """加载所有事件"""
    if not EVENTS_FILE.exists():
        return []
    try:
        with open(EVENTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []


def save_events(events: list):
    """保存事件"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # 只保留最近 30 天的数据
    cutoff = (datetime.now() - timedelta(days=30)).isoformat()
    events = [e for e in events if e.get('timestamp', '') >= cutoff]
    
    with open(EVENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)


def load_pv() -> dict:
    """加载页面访问统计"""
    if not PV_FILE.exists():
        return {}
    try:
        with open(PV_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}


def save_pv(pv: dict):
    """保存页面访问统计"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(PV_FILE, 'w', encoding='utf-8') as f:
        json.dump(pv, f, ensure_ascii=False, indent=2)


@router.post("/track")
async def track_event(event: TrackEvent):
    """记录用户行为事件"""
    events = load_events()
    
    new_event = {
        "event_type": event.event_type,
        "event_name": event.event_name,
        "page": event.page,
        "user_id": event.user_id,
        "extra": event.extra,
        "timestamp": datetime.now().isoformat()
    }
    
    events.append(new_event)
    save_events(events)
    
    return {"success": True}


@router.post("/pageview")
async def track_pageview(page: str, user_id: str = "anonymous"):
    """记录页面访问"""
    pv = load_pv()
    today = datetime.now().strftime("%Y-%m-%d")
    
    if today not in pv:
        pv[today] = {}
    if page not in pv[today]:
        pv[today][page] = 0
    
    pv[today][page] += 1
    save_pv(pv)
    
    return {"success": True}


@router.get("/stats")
async def get_stats(password: str):
    """获取统计数据（管理员）"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    events = load_events()
    pv = load_pv()
    
    # 计算统计数据
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # 按钮点击统计
    button_clicks = defaultdict(int)
    for e in events:
        if e.get('event_type') == 'click':
            button_clicks[e.get('event_name', 'unknown')] += 1
    
    # 今日点击
    today_clicks = defaultdict(int)
    for e in events:
        if e.get('timestamp', '').startswith(today) and e.get('event_type') == 'click':
            today_clicks[e.get('event_name', 'unknown')] += 1
    
    # 页面访问统计
    page_views_total = defaultdict(int)
    page_views_today = defaultdict(int)
    
    for date, pages in pv.items():
        for page, count in pages.items():
            page_views_total[page] += count
            if date == today:
                page_views_today[page] = count
    
    # 每日活跃趋势（最近7天）
    daily_trend = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=6-i)).strftime("%Y-%m-%d")
        day_events = len([e for e in events if e.get('timestamp', '').startswith(date)])
        day_pv = sum(pv.get(date, {}).values())
        daily_trend.append({
            "date": date,
            "events": day_events,
            "pageviews": day_pv
        })
    
    # 独立用户数
    unique_users = set()
    for e in events:
        user_id = e.get('user_id', 'anonymous')
        if user_id != 'anonymous':
            unique_users.add(user_id)
    
    # 今日独立用户
    today_users = set()
    for e in events:
        if e.get('timestamp', '').startswith(today):
            user_id = e.get('user_id', 'anonymous')
            if user_id != 'anonymous':
                today_users.add(user_id)
    
    return {
        "overview": {
            "total_events": len(events),
            "total_users": len(unique_users),
            "today_events": len([e for e in events if e.get('timestamp', '').startswith(today)]),
            "today_users": len(today_users)
        },
        "button_clicks": dict(sorted(button_clicks.items(), key=lambda x: x[1], reverse=True)),
        "today_clicks": dict(today_clicks),
        "page_views": dict(sorted(page_views_total.items(), key=lambda x: x[1], reverse=True)),
        "page_views_today": dict(page_views_today),
        "daily_trend": daily_trend,
        "recent_events": events[-50:][::-1]  # 最近50条事件
    }


@router.get("/errors")
async def get_errors(password: str):
    """获取错误日志"""
    from routers.admin import verify_admin
    verify_admin(password)
    
    events = load_events()
    errors = [e for e in events if e.get('event_type') == 'error']
    
    return {"errors": errors[-100:][::-1]}
