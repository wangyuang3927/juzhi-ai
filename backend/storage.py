"""
FocusAI Local Storage
使用 JSON 文件存储数据（MVP 阶段）
"""
import json
import os
from datetime import datetime
from typing import List, Optional
from pathlib import Path

from models import RawNews, InsightCard


# 数据目录
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# 文件路径
NEWS_FILE = DATA_DIR / "news.json"
INSIGHTS_FILE = DATA_DIR / "insights.json"


class LocalStorage:
    """本地 JSON 文件存储"""
    
    def __init__(self):
        # 确保文件存在
        if not NEWS_FILE.exists():
            self._save_json(NEWS_FILE, [])
        if not INSIGHTS_FILE.exists():
            self._save_json(INSIGHTS_FILE, [])
        print("✅ Local storage initialized (data/ folder)")
    
    def _load_json(self, filepath: Path) -> list:
        """读取 JSON 文件"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_json(self, filepath: Path, data: list):
        """保存 JSON 文件"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    
    # ============================================
    # News Operations
    # ============================================
    
    async def save_news(self, news: RawNews) -> bool:
        """保存原始新闻"""
        data = self._load_json(NEWS_FILE)
        
        # 检查是否已存在
        for item in data:
            if item.get('source_url') == news.source_url:
                return False
        
        data.append({
            'id': news.id,
            'source_url': news.source_url,
            'source_name': news.source_name,
            'title': news.title,
            'content': news.content,
            'published_at': str(news.published_at) if news.published_at else None,
            'created_at': str(news.created_at),
            'processed': False
        })
        self._save_json(NEWS_FILE, data)
        return True
    
    async def get_unprocessed_news(self, limit: int = 10) -> List[dict]:
        """获取未处理的新闻"""
        data = self._load_json(NEWS_FILE)
        unprocessed = [n for n in data if not n.get('processed', False)]
        return unprocessed[:limit]
    
    async def mark_news_processed(self, news_id: str):
        """标记新闻为已处理"""
        data = self._load_json(NEWS_FILE)
        for item in data:
            if item.get('id') == news_id:
                item['processed'] = True
                break
        self._save_json(NEWS_FILE, data)
    
    # ============================================
    # Insights Operations
    # ============================================
    
    async def save_insight(self, insight: InsightCard) -> bool:
        """保存洞察卡片"""
        data = self._load_json(INSIGHTS_FILE)
        
        data.append({
            'id': insight.id,
            'title': insight.title,
            'tags': insight.tags,
            'summary': insight.summary,
            'impact': insight.impact,
            'prompt': insight.prompt,
            'url': insight.url,
            'timestamp': insight.timestamp,
            'created_at': datetime.now().isoformat()
        })
        self._save_json(INSIGHTS_FILE, data)
        return True
    
    async def get_insights(self, limit: int = 20, offset: int = 0) -> List[dict]:
        """获取洞察卡片列表"""
        data = self._load_json(INSIGHTS_FILE)
        # 按时间倒序
        data.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return data[offset:offset + limit]
    
    async def get_insight_by_id(self, insight_id: str) -> Optional[dict]:
        """根据 ID 获取单个洞察"""
        data = self._load_json(INSIGHTS_FILE)
        for item in data:
            if item.get('id') == insight_id:
                return item
        return None
    
    async def get_insights_count(self) -> int:
        """获取卡片总数"""
        data = self._load_json(INSIGHTS_FILE)
        return len(data)


# 全局实例
storage = LocalStorage()
