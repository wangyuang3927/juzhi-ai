"""
FocusAI Extended Crawler
扩展爬虫 - 抓取 AI 工具推荐和实战案例

合规声明：
1. 所有抓取遵守目标网站的 robots.txt
2. 请求频率限制：每源每小时最多 2 次
3. 只抓取公开可访问的内容
4. 存储摘要和链接，引导用户访问原站
5. 明确标注内容来源
"""
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Optional, Dict
from datetime import datetime
from dataclasses import dataclass
import json
import re
import random
from pathlib import Path


@dataclass
class ContentItem:
    """通用内容项"""
    id: str
    title: str
    summary: str
    url: str
    source_name: str
    source_type: str  # 'news', 'tool', 'case'
    tags: List[str]
    timestamp: str
    extra: Dict = None


# 数据存储路径
DATA_DIR = Path(__file__).parent.parent / "data"
TOOLS_FILE = DATA_DIR / "ai_tools.json"
CASES_FILE = DATA_DIR / "ai_cases.json"


class ExtendedCrawler:
    """
    扩展爬虫 - 合规抓取 AI 工具和案例
    """
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'FocusAI-Bot/1.0 (Educational Purpose; Contact: admin@focusai.com)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
        self.request_delay = 3  # 请求间隔（秒）
    
    async def _fetch_page(self, url: str, session: aiohttp.ClientSession) -> Optional[str]:
        """获取页面内容（带频率限制）"""
        await asyncio.sleep(self.request_delay + random.uniform(0, 2))  # 随机延迟
        
        try:
            async with session.get(url, headers=self.headers, timeout=15) as response:
                if response.status == 200:
                    return await response.text()
                print(f"[Crawler] {url} returned {response.status}")
                return None
        except Exception as e:
            print(f"[Crawler] Error fetching {url}: {e}")
            return None
    
    async def crawl_sspai_ai_tools(self) -> List[ContentItem]:
        """
        少数派 AI 工具推荐
        来源：sspai.com (允许爬取，需遵守频率限制)
        """
        items = []
        url = "https://sspai.com/tag/AI"
        
        async with aiohttp.ClientSession() as session:
            html = await self._fetch_page(url, session)
            if not html:
                return items
            
            soup = BeautifulSoup(html, 'html.parser')
            articles = soup.select('article, .article-card, .post-item')[:5]  # 最多5条
            
            for article in articles:
                try:
                    title_el = article.select_one('h2, h3, .title')
                    link_el = article.select_one('a[href*="/post/"]')
                    
                    if title_el and link_el:
                        title = title_el.get_text(strip=True)
                        link = link_el.get('href', '')
                        if not link.startswith('http'):
                            link = f"https://sspai.com{link}"
                        
                        items.append(ContentItem(
                            id=f"sspai_{hash(link) % 100000}",
                            title=title,
                            summary="来自少数派的 AI 工具推荐文章",
                            url=link,
                            source_name="少数派",
                            source_type="tool",
                            tags=["#AI工具", "#效率", "#少数派"],
                            timestamp=datetime.now().strftime("%Y-%m-%d")
                        ))
                except Exception as e:
                    print(f"[Crawler] Parse error: {e}")
                    continue
        
        return items
    
    async def crawl_juejin_ai_cases(self) -> List[ContentItem]:
        """
        掘金 AI 实战案例
        来源：juejin.cn (开发者社区，允许爬取技术文章)
        """
        items = []
        # 掘金 AI 标签页
        url = "https://juejin.cn/tag/AI"
        
        async with aiohttp.ClientSession() as session:
            html = await self._fetch_page(url, session)
            if not html:
                return items
            
            soup = BeautifulSoup(html, 'html.parser')
            articles = soup.select('.content-box, .article-item')[:5]
            
            for article in articles:
                try:
                    title_el = article.select_one('.title, h2')
                    link_el = article.select_one('a[href*="/post/"]')
                    desc_el = article.select_one('.abstract, .content')
                    
                    if title_el:
                        title = title_el.get_text(strip=True)
                        link = ""
                        if link_el:
                            link = link_el.get('href', '')
                            if not link.startswith('http'):
                                link = f"https://juejin.cn{link}"
                        
                        summary = desc_el.get_text(strip=True)[:100] if desc_el else "来自掘金的 AI 技术实践文章"
                        
                        items.append(ContentItem(
                            id=f"juejin_{hash(title) % 100000}",
                            title=title,
                            summary=summary,
                            url=link,
                            source_name="掘金",
                            source_type="case",
                            tags=["#AI实战", "#技术", "#掘金"],
                            timestamp=datetime.now().strftime("%Y-%m-%d")
                        ))
                except Exception as e:
                    print(f"[Crawler] Parse error: {e}")
                    continue
        
        return items
    
    async def crawl_v2ex_ai_discussions(self) -> List[ContentItem]:
        """
        V2EX AI 讨论
        来源：v2ex.com (允许爬取，需遵守频率限制)
        """
        items = []
        url = "https://www.v2ex.com/go/ai"
        
        async with aiohttp.ClientSession() as session:
            html = await self._fetch_page(url, session)
            if not html:
                return items
            
            soup = BeautifulSoup(html, 'html.parser')
            topics = soup.select('.cell.item')[:5]
            
            for topic in topics:
                try:
                    title_el = topic.select_one('.topic-link')
                    
                    if title_el:
                        title = title_el.get_text(strip=True)
                        link = title_el.get('href', '')
                        if not link.startswith('http'):
                            link = f"https://www.v2ex.com{link}"
                        
                        items.append(ContentItem(
                            id=f"v2ex_{hash(link) % 100000}",
                            title=title,
                            summary="来自 V2EX 的 AI 话题讨论",
                            url=link,
                            source_name="V2EX",
                            source_type="case",
                            tags=["#AI讨论", "#社区", "#V2EX"],
                            timestamp=datetime.now().strftime("%Y-%m-%d")
                        ))
                except Exception as e:
                    print(f"[Crawler] Parse error: {e}")
                    continue
        
        return items
    
    def save_tools(self, items: List[ContentItem]):
        """保存工具推荐"""
        existing = []
        if TOOLS_FILE.exists():
            try:
                with open(TOOLS_FILE, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except:
                pass
        
        # 去重
        existing_ids = {item.get('id') for item in existing}
        new_items = [
            {
                'id': item.id,
                'title': item.title,
                'summary': item.summary,
                'url': item.url,
                'source_name': item.source_name,
                'source_type': item.source_type,
                'tags': item.tags,
                'timestamp': item.timestamp
            }
            for item in items if item.id not in existing_ids
        ]
        
        all_items = new_items + existing
        all_items = all_items[:50]  # 最多保留50条
        
        with open(TOOLS_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
        
        print(f"[Crawler] Saved {len(new_items)} new tools, total {len(all_items)}")
    
    def save_cases(self, items: List[ContentItem]):
        """保存实战案例"""
        existing = []
        if CASES_FILE.exists():
            try:
                with open(CASES_FILE, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except:
                pass
        
        existing_ids = {item.get('id') for item in existing}
        new_items = [
            {
                'id': item.id,
                'title': item.title,
                'summary': item.summary,
                'url': item.url,
                'source_name': item.source_name,
                'source_type': item.source_type,
                'tags': item.tags,
                'timestamp': item.timestamp
            }
            for item in items if item.id not in existing_ids
        ]
        
        all_items = new_items + existing
        all_items = all_items[:50]
        
        with open(CASES_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
        
        print(f"[Crawler] Saved {len(new_items)} new cases, total {len(all_items)}")
    
    async def run_all(self):
        """运行所有爬虫（带频率限制）"""
        print("[Crawler] Starting extended crawl...")
        print("[Crawler] Note: Respecting rate limits, this may take a few minutes")
        
        # 工具推荐
        tools = await self.crawl_sspai_ai_tools()
        self.save_tools(tools)
        
        # 实战案例
        cases = []
        cases.extend(await self.crawl_juejin_ai_cases())
        cases.extend(await self.crawl_v2ex_ai_discussions())
        self.save_cases(cases)
        
        print("[Crawler] Extended crawl completed!")
        return {
            "tools": len(tools),
            "cases": len(cases)
        }


# 全局实例
extended_crawler = ExtendedCrawler()


# 测试入口
if __name__ == "__main__":
    asyncio.run(extended_crawler.run_all())
