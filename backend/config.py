"""
FocusAI Backend Configuration
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # SiliconFlow / DeepSeek API
    siliconflow_api_key: str = ""
    siliconflow_base_url: str = "https://api.siliconflow.cn/v1"
    deepseek_model: str = "deepseek-ai/DeepSeek-V3"
    
    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    
    # Tavily Search API (支持多个 key 轮询，用逗号分隔)
    tavily_api_keys: str = ""  # 例: "tvly-xxx,tvly-yyy,tvly-zzz"
    
    # Application
    crawl_interval_hours: int = 6
    api_port: int = 8000
    debug: bool = True
    
    def get_tavily_keys(self) -> list:
        """获取 Tavily API Keys 列表"""
        if not self.tavily_api_keys:
            return []
        return [k.strip() for k in self.tavily_api_keys.split(",") if k.strip()]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Profession mapping (English key -> Chinese display)
PROFESSIONS = {
    "product_manager": "产品经理",
    "frontend_engineer": "前端工程师",
    "backend_engineer": "后端工程师",
    "fullstack_engineer": "全栈工程师",
    "ui_ux_designer": "UI/UX 设计师",
    "graphic_designer": "平面设计师",
    "operations": "运营",
    "marketing": "市场营销",
    "data_analyst": "数据分析师",
    "online_teacher": "线上老师",
    "content_creator": "内容创作者",
    "student": "学生",
    "entrepreneur": "创业者",
    "other": "其他",
}

# News sources configuration
NEWS_SOURCES = [
    {
        "name": "机器之心",
        "type": "rss",
        "url": "https://www.jiqizhixin.com/rss",
        "language": "zh",
    },
    {
        "name": "量子位",
        "type": "web",
        "url": "https://www.qbitai.com/",
        "language": "zh",
    },
    {
        "name": "OpenAI Blog",
        "type": "rss",
        "url": "https://openai.com/blog/rss.xml",
        "language": "en",
    },
    {
        "name": "Google AI Blog",
        "type": "rss", 
        "url": "https://blog.google/technology/ai/rss/",
        "language": "en",
    },
    {
        "name": "Hacker News AI",
        "type": "api",
        "url": "https://hn.algolia.com/api/v1/search?query=AI&tags=story",
        "language": "en",
    },
]
