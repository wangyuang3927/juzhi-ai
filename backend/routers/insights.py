"""
FocusAI Insights API Router
Handles news card listing and detail endpoints.
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from collections import defaultdict
import time

from models import InsightCard, InsightListResponse
from storage import storage
from config import PROFESSIONS

router = APIRouter(prefix="/api/insights", tags=["Insights"])


# ============================================
# 缓存管理器 - 减少 API 调用，加快响应速度
# ============================================
class ContentCache:
    """
    工具/案例缓存管理器
    - 每次 API 调用获取 12 条，显示 6 条，缓存 6 条
    - 刷新时先从缓存取，缓存空了再调用 API
    - 缓存 30 分钟过期
    """
    DISPLAY_COUNT = 6      # 每次显示数量
    FETCH_COUNT = 18       # 每次获取数量（显示6条 + 缓存12条 = 支持到2次刷新）
    CACHE_TTL = 1800       # 缓存过期时间（30分钟）
    
    def __init__(self):
        # 缓存结构: {profession: {"items": [...], "timestamp": ..., "seed": ...}}
        self.tools_cache: Dict[str, dict] = {}
        self.cases_cache: Dict[str, dict] = {}
    
    def _is_expired(self, cache_entry: dict) -> bool:
        """检查缓存是否过期"""
        if not cache_entry:
            return True
        return time.time() - cache_entry.get("timestamp", 0) > self.CACHE_TTL
    
    def get_tools(self, profession: str) -> tuple[list, bool]:
        """
        获取工具缓存
        返回: (items, need_fetch) - 缓存项和是否需要调用 API
        """
        cache = self.tools_cache.get(profession)
        
        # 缓存不存在或过期
        if self._is_expired(cache):
            return [], True
        
        items = cache.get("items", [])
        
        # 缓存不足，需要重新获取
        if len(items) < self.DISPLAY_COUNT:
            return [], True
        
        # 取出前 6 条，剩余的保留在缓存
        result = items[:self.DISPLAY_COUNT]
        cache["items"] = items[self.DISPLAY_COUNT:]
        
        print(f"📦 [Tools] 缓存命中! 返回 {len(result)} 条，剩余缓存 {len(cache['items'])} 条")
        return result, False
    
    def set_tools(self, profession: str, items: list, seed: int):
        """设置工具缓存"""
        self.tools_cache[profession] = {
            "items": items,
            "timestamp": time.time(),
            "seed": seed
        }
        print(f"📥 [Tools] 缓存更新! 存入 {len(items)} 条")
    
    def get_cases(self, profession: str) -> tuple[list, bool]:
        """获取案例缓存"""
        cache = self.cases_cache.get(profession)
        
        if self._is_expired(cache):
            return [], True
        
        items = cache.get("items", [])
        
        if len(items) < self.DISPLAY_COUNT:
            return [], True
        
        result = items[:self.DISPLAY_COUNT]
        cache["items"] = items[self.DISPLAY_COUNT:]
        
        print(f"📦 [Cases] 缓存命中! 返回 {len(result)} 条，剩余缓存 {len(cache['items'])} 条")
        return result, False
    
    def set_cases(self, profession: str, items: list, seed: int):
        """设置案例缓存"""
        self.cases_cache[profession] = {
            "items": items,
            "timestamp": time.time(),
            "seed": seed
        }
        print(f"📥 [Cases] 缓存更新! 存入 {len(items)} 条")
    
    def get_next_seed(self, cache_type: str, profession: str) -> int:
        """获取下一个 seed 值"""
        cache = self.tools_cache if cache_type == "tools" else self.cases_cache
        entry = cache.get(profession, {})
        return entry.get("seed", -1) + 1


# 全局缓存实例
content_cache = ContentCache()

# 数据存储路径
from pathlib import Path
import json
DATA_DIR = Path(__file__).parent.parent / "data"


def _save_user_daily_content(user_id: str, content_type: str, date: str, items: list):
    """保存免费用户的每日内容（用于锁定）"""
    try:
        user_dir = DATA_DIR / "user_daily" / content_type
        user_dir.mkdir(parents=True, exist_ok=True)
        user_file = user_dir / f"{user_id}_{date}.json"
        
        with open(user_file, 'w', encoding='utf-8') as f:
            json.dump({
                "user_id": user_id,
                "date": date,
                "items": items,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }, f, ensure_ascii=False, indent=2)
        print(f"💾 [{content_type}] 保存免费用户 {user_id} 的今日内容")
    except Exception as e:
        print(f"保存用户每日内容失败: {e}")


@router.get("", response_model=InsightListResponse)
async def list_insights(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=50, description="Items per page"),
):
    """
    Get a list of AI insight cards.
    Returns cards from local storage, ordered by newest first.
    """
    offset = (page - 1) * page_size
    items = await storage.get_insights(limit=page_size, offset=offset)
    total = await storage.get_insights_count()
    
    # 转换为 InsightCard 对象
    cards = [InsightCard(**item) for item in items]
    
    return InsightListResponse(
        items=cards,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/mock", response_model=List[InsightCard])
async def get_mock_insights(
    profession: str = Query("other", description="User profession for mock data")
):
    """
    Get mock insight cards for development/demo.
    No database required.
    """
    profession_display = PROFESSIONS.get(profession, "职场人士")
    
    mock_data = [
        InsightCard(
            id="mock-1",
            title="DeepSeek V3 发布：性能超越 GPT-4",
            tags=["#DeepSeek", "#大模型", "#开源"],
            summary="深度求索发布 DeepSeek V3，在多项基准测试中超越 GPT-4，且完全开源免费。模型支持 128K 上下文，推理速度提升 3 倍。",
            impact=f"作为{profession_display}，你可以用 DeepSeek V3 来辅助日常工作。它的长上下文能力特别适合处理长文档、生成详细报告。建议你先在简单任务上试用，逐步替代部分重复性工作。",
            prompt="你是一个专业的助手。请帮我分析以下内容，并给出结构化的总结和可行的建议：\n\n[在此粘贴你的内容]",
            url="https://www.deepseek.com/",
            timestamp="2024-12-03"
        ),
        InsightCard(
            id="mock-2",
            title="Midjourney V6.1 重大更新：文字渲染能力突破",
            tags=["#Midjourney", "#AI绘画", "#设计"],
            summary="Midjourney 发布 V6.1 版本，首次实现高质量文字渲染，可以直接在图片中生成清晰可读的文字，同时图像生成速度提升 2 倍。",
            impact=f"对{profession_display}来说，这意味着你可以快速生成带有文字的海报、封面、宣传图，不再需要后期 PS 加字。非常适合制作教学材料、课件配图。",
            prompt="/imagine prompt: 教育主题插画，温馨明亮的教室场景，学生认真学习，黑板上写着\"知识改变命运\"，温暖的阳光透过窗户 --v 6.1 --ar 16:9",
            url="https://midjourney.com/",
            timestamp="2024-12-02"
        ),
        InsightCard(
            id="mock-3",
            title="Claude 3.5 Sonnet 新功能：Artifacts 实时预览",
            tags=["#Claude", "#Anthropic", "#编程"],
            summary="Anthropic 为 Claude 3.5 Sonnet 推出 Artifacts 功能，用户可以在对话中实时预览和运行代码、查看生成的文档和图表。",
            impact=f"作为{profession_display}，Artifacts 功能可以帮你快速验证想法。比如让 Claude 生成一个课程大纲，它会以结构化的方式呈现，你可以直接编辑和导出。",
            prompt="请帮我设计一个为期 4 周的课程大纲，主题是 [你的课程主题]。要求：\n1. 每周 2 节课，每节 1 小时\n2. 包含理论讲解和实践练习\n3. 设置课后作业和阶段性测验\n4. 使用 Markdown 格式输出",
            url="https://claude.ai/",
            timestamp="2024-12-01"
        ),
        InsightCard(
            id="mock-4",
            title="Sora 即将开放：AI 视频生成进入实用阶段",
            tags=["#Sora", "#OpenAI", "#视频生成"],
            summary="OpenAI 宣布 Sora 将于本月向 ChatGPT Plus 用户开放。Sora 可以根据文字描述生成最长 60 秒的高清视频，支持多种风格。",
            impact=f"视频内容将变得更容易制作。{profession_display}可以用它来制作教学演示视频、课程宣传片。虽然目前还不能完全替代专业制作，但足以应对日常需求。",
            prompt="Create a 15-second educational video: A friendly animated teacher explaining the concept of [你的主题] to students. Warm, inviting classroom setting with soft lighting. Professional yet approachable style.",
            url="https://openai.com/sora",
            timestamp="2024-11-30"
        ),
    ]
    
    return mock_data


@router.get("/tools")
async def get_ai_tools(
    profession: str = Query("职场人士", description="用户职业"),
    user_id: str = Query("anonymous", description="用户ID"),
    force_refresh: bool = Query(False, description="强制刷新，跳过缓存")
):
    """
    获取 AI 工具推荐
    - 免费用户：每天只生成一次，之后返回相同内容
    - 专业版用户：可以无限刷新
    """
    from services.ai_processor import ai_processor
    from services.supabase_db import get_premium_status
    from datetime import datetime
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 检查用户专业版状态（Supabase 可能未配置，优雅降级）
    is_premium = False
    try:
        premium_status = get_premium_status(user_id)
        is_premium = premium_status and premium_status.get("expires_at")
        if is_premium:
            from datetime import datetime as dt
            expires_at = dt.fromisoformat(premium_status["expires_at"].replace("Z", "+00:00"))
            is_premium = expires_at > dt.now(expires_at.tzinfo)
    except Exception as e:
        print(f"⚠️ [Tools] 获取专业版状态失败（Supabase可能未配置）: {e}")
        is_premium = False
    
    # 免费用户：检查今日是否已有内容
    if not is_premium and not force_refresh:
        user_tools_dir = DATA_DIR / "user_daily" / "tools"
        user_tools_file = user_tools_dir / f"{user_id}_{today}.json"
        
        if user_tools_file.exists():
            try:
                with open(user_tools_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f"📦 [Tools] 免费用户 {user_id} 返回今日已有内容")
                    return {
                        "items": data.get("items", []),
                        "profession": profession,
                        "source": "user_daily_cache",
                        "cached": True
                    }
            except Exception as e:
                print(f"读取用户工具缓存失败: {e}")
    
    # 专业版或首次访问：从缓存获取或生成新内容
    if not force_refresh:
        cached_items, need_fetch = content_cache.get_tools(profession)
        if not need_fetch:
            # 免费用户首次访问，保存今日内容
            if not is_premium:
                _save_user_daily_content(user_id, "tools", today, cached_items)
            return {
                "items": cached_items, 
                "profession": profession, 
                "source": "cache",
                "cached": True
            }
    
    # 缓存不足，调用 API
    try:
        seed = content_cache.get_next_seed("tools", profession)
        print(f"🔄 [Tools] 缓存不足，调用 API (seed={seed})")
        
        tools = await ai_processor.search_and_recommend_tools(
            profession, 
            refresh_seed=seed,
            result_count=ContentCache.FETCH_COUNT
        )
        
        display_items = tools[:ContentCache.DISPLAY_COUNT]
        cache_items = tools[ContentCache.DISPLAY_COUNT:]
        
        if cache_items:
            content_cache.set_tools(profession, cache_items, seed)
        
        # 免费用户首次访问，保存今日内容
        if not is_premium:
            _save_user_daily_content(user_id, "tools", today, display_items)
        
        return {
            "items": display_items, 
            "profession": profession, 
            "source": "web_search",
            "cached": False,
            "total_fetched": len(tools)
        }
    except Exception as e:
        print(f"Error searching tools: {e}")
        # 降级到静态数据
        import json
        from pathlib import Path
        tools_file = Path(__file__).parent.parent / "data" / "ai_tools.json"
        if tools_file.exists():
            with open(tools_file, 'r', encoding='utf-8') as f:
                return {"items": json.load(f)[:6], "source": "fallback"}
        return {"items": [], "error": str(e)}


@router.get("/cases")
async def get_ai_cases(
    profession: str = Query("职场人士", description="用户职业"),
    user_id: str = Query("anonymous", description="用户ID"),
    force_refresh: bool = Query(False, description="强制刷新，跳过缓存")
):
    """
    获取 AI 实战案例
    - 免费用户：每天只生成一次，之后返回相同内容
    - 专业版用户：可以无限刷新
    """
    from services.ai_processor import ai_processor
    from services.supabase_db import get_premium_status
    from datetime import datetime
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 检查用户专业版状态（Supabase 可能未配置，优雅降级）
    is_premium = False
    try:
        premium_status = get_premium_status(user_id)
        is_premium = premium_status and premium_status.get("expires_at")
        if is_premium:
            from datetime import datetime as dt
            expires_at = dt.fromisoformat(premium_status["expires_at"].replace("Z", "+00:00"))
            is_premium = expires_at > dt.now(expires_at.tzinfo)
    except Exception as e:
        print(f"⚠️ [Cases] 获取专业版状态失败（Supabase可能未配置）: {e}")
        is_premium = False
    
    # 免费用户：检查今日是否已有内容
    if not is_premium and not force_refresh:
        user_cases_dir = DATA_DIR / "user_daily" / "cases"
        user_cases_file = user_cases_dir / f"{user_id}_{today}.json"
        
        if user_cases_file.exists():
            try:
                with open(user_cases_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f"📦 [Cases] 免费用户 {user_id} 返回今日已有内容")
                    return {
                        "items": data.get("items", []),
                        "profession": profession,
                        "source": "user_daily_cache",
                        "cached": True
                    }
            except Exception as e:
                print(f"读取用户案例缓存失败: {e}")
    
    # 专业版或首次访问：从缓存获取或生成新内容
    if not force_refresh:
        cached_items, need_fetch = content_cache.get_cases(profession)
        if not need_fetch:
            # 免费用户首次访问，保存今日内容
            if not is_premium:
                _save_user_daily_content(user_id, "cases", today, cached_items)
            return {
                "items": cached_items, 
                "profession": profession, 
                "source": "cache",
                "cached": True
            }
    
    # 缓存不足，调用 API
    try:
        seed = content_cache.get_next_seed("cases", profession)
        print(f"🔄 [Cases] 缓存不足，调用 API (seed={seed})")
        
        cases = await ai_processor.search_and_recommend_cases(
            profession, 
            refresh_seed=seed,
            result_count=ContentCache.FETCH_COUNT
        )
        
        display_items = cases[:ContentCache.DISPLAY_COUNT]
        cache_items = cases[ContentCache.DISPLAY_COUNT:]
        
        if cache_items:
            content_cache.set_cases(profession, cache_items, seed)
        
        # 免费用户首次访问，保存今日内容
        if not is_premium:
            _save_user_daily_content(user_id, "cases", today, display_items)
        
        return {
            "items": display_items, 
            "profession": profession, 
            "source": "web_search",
            "cached": False,
            "total_fetched": len(cases)
        }
    except Exception as e:
        print(f"Error searching cases: {e}")
        # 降级到静态数据
        import json
        from pathlib import Path
        cases_file = Path(__file__).parent.parent / "data" / "ai_cases.json"
        if cases_file.exists():
            with open(cases_file, 'r', encoding='utf-8') as f:
                return {"items": json.load(f)[:6], "source": "fallback"}
        return {"items": [], "error": str(e)}


# ============================================
# 生成今日新闻 - 使用 Tavily 搜索最新 AI 资讯
# ============================================
@router.get("/generate")
async def generate_daily_news(
    profession: str = Query("职场人士", description="用户职业"),
    user_id: str = Query("anonymous", description="用户ID")
):
    """
    生成今日 AI 新闻 - 搜索最新资讯并用 AI 生成个性化解读
    """
    from services.ai_processor import ai_processor
    from services.content_safety import validate_profession, check_rate_limit, is_user_blocked
    import uuid
    import asyncio
    from tavily import TavilyClient
    from config import get_settings
    
    # 安全检测
    if is_user_blocked(user_id):
        raise HTTPException(status_code=403, detail="账号已被限制，请联系管理员")
    
    rate_ok, rate_msg = check_rate_limit(user_id)
    if not rate_ok:
        raise HTTPException(status_code=429, detail=rate_msg)
    
    valid, msg = validate_profession(profession, user_id)
    if not valid:
        raise HTTPException(status_code=400, detail=msg)
    
    print(f"🔄 [News] 开始生成今日新闻，职业: {profession}")
    
    try:
        # 获取 Tavily API Key
        keys = get_settings().get_tavily_keys()
        if not keys:
            raise Exception("未配置 Tavily API Key")
        
        api_key = keys[0]
        
        # 搜索最新 AI 新闻 - 使用更精确的时间关键词
        from datetime import datetime, timedelta
        today = datetime.now()
        date_str = today.strftime("%Y年%m月")  # 如 "2025年12月"
        yesterday = (today - timedelta(days=1)).strftime("%m月%d日")
        
        # 国内新闻搜索关键词
        cn_query_templates = [
            f"AI人工智能 最新新闻 {date_str}",
            f"AI大模型 发布 {date_str}",
            f"ChatGPT Claude Gemini 更新 {date_str}",
            f"AI Agent 智能体 最新 {date_str}",
            f"DeepSeek 字节豆包 百度文心 新闻",
        ]
        # 国际新闻搜索关键词
        en_query_templates = [
            "AI artificial intelligence news today",
            "OpenAI Anthropic Google AI latest",
            "ChatGPT Claude Gemini update",
            "AI breakthrough technology news",
            "machine learning deep learning news",
        ]
        
        import random
        cn_query = random.choice(cn_query_templates)
        en_query = random.choice(en_query_templates)
        print(f"   国内搜索: {cn_query}")
        print(f"   国际搜索: {en_query}")
        
        # 中文网站（不含知乎）
        cn_domains = [
            "36kr.com", "sspai.com", "juejin.cn",
            "mp.weixin.qq.com", "csdn.net", "jiqizhixin.com",
            "pingwest.com", "geekpark.net", "leiphone.com",
        ]
        # 国际科技媒体
        en_domains = [
            "theverge.com", "techcrunch.com", "wired.com",
            "arstechnica.com", "venturebeat.com", "zdnet.com",
            "cnet.com", "engadget.com", "thenextweb.com",
            "reuters.com", "bbc.com", "nature.com", "ieee.org",
            "openai.com", "anthropic.com", "huggingface.co",
            "towardsdatascience.com", "medium.com"
        ]
        
        client = TavilyClient(api_key=api_key)
        
        # 搜索国内新闻
        cn_response = await asyncio.to_thread(
            client.search,
            query=cn_query,
            search_depth="advanced",
            max_results=15,
            include_domains=cn_domains,
            days=3
        )
        cn_results = cn_response.get("results", [])
        
        # 搜索国际新闻
        en_response = await asyncio.to_thread(
            client.search,
            query=en_query,
            search_depth="advanced",
            max_results=15,
            include_domains=en_domains,
            days=3
        )
        en_results = en_response.get("results", [])
        
        # 合并结果
        results = cn_results + en_results
        
        if not results:
            raise Exception("未搜索到有效新闻")
        
        print(f"   搜索到 {len(results)} 条结果")
        
        # 格式化搜索结果供 AI 处理，包含发布日期
        search_context = ""
        for i, res in enumerate(results):
            pub_date = res.get('published_date', '') or res.get('publishedDate', '') or '未知'
            search_context += f"[{i+1}] 标题: {res.get('title', '')}\n链接: {res.get('url', '')}\n发布时间: {pub_date}\n摘要: {res.get('content', '')}\n\n"
        
        # AI 生成结构化新闻卡片
        today_str = today.strftime("%Y年%m月%d日")
        prompt = f"""你是一位专业的 AI 行业分析师。今天是 {today_str}。
我为你搜集了国内外最新的 AI 相关新闻，请仔细阅读并为"{profession}"生成 10 条高质量的 AI 行业洞察卡片。

搜索结果：
{search_context}

要求：
1. 【时效性优先】优先选择发布时间最近的新闻
2. 【国内外平衡】必须同时包含国内和国际新闻，大约各占一半
3. 每条洞察都必须基于真实的搜索结果，不要编造
4. 【重要】每条新闻必须使用不同的原文链接(url)，绝对不能重复！
5. url 字段必须直接复制搜索结果中的“链接”，不要修改
6. 为每条新闻生成：标题、标签、摘要、对该职业的具体影响、可直接使用的 Prompt
7. 摘要要简洁有信息量（50-100字），英文新闻请翻译成中文
8. 影响分析要针对 {profession} 这个职业具体化
9. Prompt 要实用，可以直接复制使用

请严格按照以下 JSON 格式返回：
[
  {{
    "id": "news-1",
    "title": "新闻标题（可以重新组织语言，但要忠于原意）",
    "tags": ["#标签1", "#标签2", "#标签3"],
    "summary": "新闻摘要，简洁有信息量，包含时间信息",
    "impact": "对{profession}的具体影响和建议",
    "prompt": "可直接使用的 Prompt 示例",
    "url": "直接复制搜索结果中的链接，不要修改"
  }}
]

只返回 JSON 数组，不要其他内容。"""

        import json as json_module
        response = await asyncio.to_thread(
            ai_processor.client.chat.completions.create,
            model=ai_processor.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=6000  # 增加以支持10条新闻
        )
        
        content = response.choices[0].message.content.strip()
        
        # 提取 JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
        
        start = content.find('[')
        end = content.rfind(']')
        if start != -1 and end != -1:
            content = content[start:end+1]
        
        news_items = json_module.loads(content)
        original_count = len(news_items)
        
        # 去除重复 URL 的新闻
        seen_urls = set()
        unique_items = []
        for item in news_items:
            url = item.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_items.append(item)
        news_items = unique_items
        
        if len(news_items) < original_count:
            print(f"⚠️ [News] 去除了 {original_count - len(news_items)} 条重复 URL 的新闻")
        
        # 添加唯一 ID 和时间戳
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d")
        for item in news_items:
            item['id'] = f"news-{uuid.uuid4().hex[:8]}"
            item['timestamp'] = timestamp
        
        print(f"✅ [News] 成功生成 {len(news_items)} 条新闻")
        
        # 保存用户的新闻到文件（供分享使用）
        try:
            user_news_dir = DATA_DIR / "user_news"
            user_news_dir.mkdir(parents=True, exist_ok=True)
            user_news_file = user_news_dir / f"{user_id}_{timestamp}.json"
            with open(user_news_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "user_id": user_id,
                    "profession": profession,
                    "date": timestamp,
                    "items": news_items,
                    "created_at": datetime.now().isoformat()
                }, f, ensure_ascii=False, indent=2)
            print(f"   已保存用户新闻: {user_news_file}")
        except Exception as save_error:
            print(f"   保存用户新闻失败: {save_error}")
        
        return {
            "items": news_items,
            "profession": profession,
            "source": "tavily_ai",
            "count": len(news_items)
        }
        
    except Exception as e:
        print(f"❌ [News] 生成失败: {e}")
        # 降级到 mock 数据
        return {
            "items": [],
            "error": str(e),
            "source": "error"
        }


@router.get("/user-daily-news/{user_id}")
async def get_user_daily_news(user_id: str):
    """
    获取用户今日已生成的新闻
    - 用于页面刷新后恢复用户的内容
    - 免费用户每天只能看到固定的内容
    """
    from datetime import datetime
    
    today = datetime.now().strftime("%Y-%m-%d")
    user_news_dir = DATA_DIR / "user_news"
    user_news_file = user_news_dir / f"{user_id}_{today}.json"
    
    if user_news_file.exists():
        try:
            with open(user_news_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"📦 [News] 返回用户 {user_id} 的今日新闻")
                return {
                    "items": data.get("items", []),
                    "profession": data.get("profession", ""),
                    "date": data.get("date", today),
                    "source": "user_daily_cache"
                }
        except Exception as e:
            print(f"读取用户新闻失败: {e}")
    
    return {
        "items": [],
        "source": "not_found"
    }


# ============================================
# 生成通用AI新闻（不关联用户职业）
# ============================================
@router.get("/generate-general")
async def generate_general_news(
    user_id: str = Query("anonymous", description="用户ID")
):
    """
    生成通用 AI 新闻 - 不关联用户职业，适合所有人阅读
    """
    from services.ai_processor import ai_processor
    from services.content_safety import check_rate_limit, is_user_blocked
    import uuid
    import asyncio
    from tavily import TavilyClient
    from config import get_settings
    
    # 安全检测
    if is_user_blocked(user_id):
        raise HTTPException(status_code=403, detail="账号已被限制，请联系管理员")
    
    rate_ok, rate_msg = check_rate_limit(user_id)
    if not rate_ok:
        raise HTTPException(status_code=429, detail=rate_msg)
    
    print(f"🔄 [GeneralNews] 开始生成通用AI新闻")
    
    try:
        # 获取 Tavily API Key
        keys = get_settings().get_tavily_keys()
        if not keys:
            raise Exception("未配置 Tavily API Key")
        
        api_key = keys[0]
        
        # 搜索最新 AI 新闻 - 国内外分开搜索
        from datetime import datetime, timedelta
        today = datetime.now()
        date_str = today.strftime("%Y年%m月")
        
        # 国内新闻搜索关键词
        cn_query_templates = [
            f"AI人工智能 重大突破 {date_str}",
            f"AI大模型 重磅发布 {date_str}",
            f"DeepSeek 字节豆包 百度文心 阿里通义 新闻",
            f"AI Agent 智能体 最新突破 {date_str}",
        ]
        # 国际新闻搜索关键词
        en_query_templates = [
            "AI artificial intelligence breakthrough news",
            "OpenAI Anthropic Google AI major update",
            "ChatGPT Claude Gemini latest news",
            "AI technology innovation news today",
        ]
        
        import random
        cn_query = random.choice(cn_query_templates)
        en_query = random.choice(en_query_templates)
        print(f"   国内搜索: {cn_query}")
        print(f"   国际搜索: {en_query}")
        
        # 中文网站（不含知乎）
        cn_domains = [
            "36kr.com", "sspai.com", "juejin.cn",
            "mp.weixin.qq.com", "csdn.net", "jiqizhixin.com",
            "pingwest.com", "geekpark.net", "leiphone.com",
        ]
        # 国际科技媒体
        en_domains = [
            "theverge.com", "techcrunch.com", "wired.com",
            "arstechnica.com", "venturebeat.com", "zdnet.com",
            "cnet.com", "engadget.com", "thenextweb.com",
            "reuters.com", "bbc.com", "nature.com", "ieee.org",
            "openai.com", "anthropic.com", "huggingface.co",
            "towardsdatascience.com", "medium.com"
        ]
        
        client = TavilyClient(api_key=api_key)
        
        # 搜索国内新闻
        cn_response = await asyncio.to_thread(
            client.search,
            query=cn_query,
            search_depth="advanced",
            max_results=15,
            include_domains=cn_domains,
            days=3
        )
        cn_results = cn_response.get("results", [])
        
        # 搜索国际新闻
        en_response = await asyncio.to_thread(
            client.search,
            query=en_query,
            search_depth="advanced",
            max_results=15,
            include_domains=en_domains,
            days=3
        )
        en_results = en_response.get("results", [])
        
        # 合并结果
        results = cn_results + en_results
        
        if not results:
            raise Exception("未搜索到有效新闻")
        
        print(f"   搜索到 {len(results)} 条结果")
        
        # 格式化搜索结果供 AI 处理
        search_context = ""
        for i, res in enumerate(results):
            pub_date = res.get('published_date', '') or res.get('publishedDate', '') or '未知'
            search_context += f"[{i+1}] 标题: {res.get('title', '')}\n链接: {res.get('url', '')}\n发布时间: {pub_date}\n摘要: {res.get('content', '')}\n\n"
        
        # AI 生成结构化新闻卡片（通用版，不关联职业）
        today_str = today.strftime("%Y年%m月%d日")
        prompt = f"""你是一位专业的 AI 行业分析师。今天是 {today_str}。
请仔细阅读以下搜索结果，生成 10 条高质量的 AI 行业新闻简报。

搜索结果：
{search_context}

要求：
1. 【时效性优先】优先选择发布时间最近的新闻
2. 【国内外平衡】必须同时包含国内和国际新闻，大约各占一半
3. 每条新闻都必须基于真实的搜索结果，不要编造
4. 【重要】每条新闻必须使用不同的原文链接(url)，绝对不能重复！
5. url 字段必须直接复制搜索结果中的"链接"，不要修改
6. 摘要要简洁有信息量（80-120字），英文新闻请翻译成中文
7. 重要性分析要说明这条新闻为什么值得关注
8. 推荐行动要给出具体可操作的建议

请严格按照以下 JSON 格式返回：
[
  {{
    "id": "news-1",
    "title": "新闻标题（简洁有力）",
    "tags": ["#标签1", "#标签2", "#标签3"],
    "summary": "新闻摘要，简洁有信息量，包含时间信息",
    "impact": "这条新闻为什么重要，对普通人有什么影响",
    "prompt": "一个通用的AI使用建议或可复制的Prompt",
    "url": "直接复制搜索结果中的链接"
  }}
]

只返回 JSON 数组，不要其他内容。"""

        import json as json_module
        response = await asyncio.to_thread(
            ai_processor.client.chat.completions.create,
            model=ai_processor.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=6000  # 增加以支持10条新闻
        )
        
        content = response.choices[0].message.content.strip()
        
        # 提取 JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()
        
        start = content.find('[')
        end = content.rfind(']')
        if start != -1 and end != -1:
            content = content[start:end+1]
        
        news_items = json_module.loads(content)
        original_count = len(news_items)
        
        # 去除重复 URL 的新闻
        seen_urls = set()
        unique_items = []
        for item in news_items:
            url = item.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_items.append(item)
        news_items = unique_items
        
        if len(news_items) < original_count:
            print(f"⚠️ [GeneralNews] 去除了 {original_count - len(news_items)} 条重复 URL 的新闻")
        
        # 添加唯一 ID 和时间戳
        timestamp = today.strftime("%Y-%m-%d")
        for item in news_items:
            item['id'] = f"general-{uuid.uuid4().hex[:8]}"
            item['timestamp'] = timestamp
        
        print(f"✅ [GeneralNews] 成功生成 {len(news_items)} 条通用新闻")
        
        # 保存通用新闻到文件
        try:
            general_news_dir = DATA_DIR / "general_news"
            general_news_dir.mkdir(parents=True, exist_ok=True)
            general_news_file = general_news_dir / f"{user_id}_{timestamp}.json"
            with open(general_news_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "user_id": user_id,
                    "date": timestamp,
                    "items": news_items,
                    "created_at": datetime.now().isoformat()
                }, f, ensure_ascii=False, indent=2)
            print(f"   已保存通用新闻: {general_news_file}")
        except Exception as save_error:
            print(f"   保存通用新闻失败: {save_error}")
        
        return {
            "items": news_items,
            "source": "tavily_ai_general",
            "count": len(news_items)
        }
        
    except Exception as e:
        print(f"❌ [GeneralNews] 生成失败: {e}")
        return {
            "items": [],
            "error": str(e),
            "source": "error"
        }


@router.get("/user-daily-general-news/{user_id}")
async def get_user_daily_general_news(user_id: str):
    """
    获取用户今日已生成的通用新闻
    """
    from datetime import datetime
    
    today = datetime.now().strftime("%Y-%m-%d")
    general_news_dir = DATA_DIR / "general_news"
    general_news_file = general_news_dir / f"{user_id}_{today}.json"
    
    if general_news_file.exists():
        try:
            with open(general_news_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"📦 [GeneralNews] 返回用户 {user_id} 的今日通用新闻")
                return {
                    "items": data.get("items", []),
                    "date": data.get("date", today),
                    "source": "user_daily_cache"
                }
        except Exception as e:
            print(f"读取通用新闻失败: {e}")
    
    return {
        "items": [],
        "source": "not_found"
    }


@router.get("/{insight_id}", response_model=InsightCard)
async def get_insight_detail(insight_id: str):
    """Get a single insight card by ID."""
    insight = await storage.get_insight_by_id(insight_id)
    
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    return InsightCard(**insight)


class PersonalizeRequest(BaseModel):
    profession: str = "职场人士"  # 用户设置的职业
    news: dict  # 包含 id, title, summary, url, tags


@router.post("/personalize")
async def get_personalized_insight(request: PersonalizeRequest):
    """
    为指定新闻生成个性化解读（基于用户职业）
    """
    from services.ai_processor import ai_processor
    from models import RawNews
    
    profession = request.profession
    news_data = request.news
    
    # 构建 RawNews 对象
    from datetime import datetime
    news = RawNews(
        id=news_data.get('id', ''),
        source_url=news_data.get('url', ''),
        source_name="FocusAI",
        title=news_data.get('title', ''),
        content=news_data.get('summary', ''),
        published_at=datetime.now(),
        created_at=datetime.now()
    )
    
    # 构建简单的用户画像（只包含职业）
    simple_profile = {"profession": profession}
    
    # 生成个性化解读
    personalized = await ai_processor.generate_personalized_insight(news, simple_profile)
    
    if personalized:
        return {
            "success": True,
            "insight": personalized.model_dump(),
            "profession": profession
        }
    else:
        raise HTTPException(status_code=500, detail="生成个性化解读失败")
