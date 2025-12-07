"""
FocusAI News Crawler
Fetches AI news from various sources (RSS, Web, API).
"""
import uuid
import asyncio
from datetime import datetime
from typing import List, Optional
import httpx
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

from config import NEWS_SOURCES
from models import RawNews


class NewsCrawler:
    """
    Multi-source news crawler for AI-related content.
    Supports RSS feeds, web scraping, and API endpoints.
    """
    
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        }
        self.timeout = httpx.Timeout(30.0)
    
    async def crawl_all(self) -> List[RawNews]:
        """Crawl all configured news sources."""
        all_news = []
        
        for source in NEWS_SOURCES:
            try:
                print(f"📡 Crawling: {source['name']}...")
                
                if source["type"] == "rss":
                    news = await self._crawl_rss(source)
                elif source["type"] == "web":
                    news = await self._crawl_web(source)
                elif source["type"] == "api":
                    news = await self._crawl_api(source)
                else:
                    continue
                
                all_news.extend(news)
                print(f"   ✓ Found {len(news)} items from {source['name']}")
                
            except Exception as e:
                print(f"   ✗ Error crawling {source['name']}: {e}")
                continue
        
        return all_news
    
    async def _crawl_rss(self, source: dict) -> List[RawNews]:
        """Parse RSS feed."""
        news_list = []
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(source["url"], headers=self.headers)
            response.raise_for_status()
        
        feed = feedparser.parse(response.text)
        
        for entry in feed.entries[:20]:  # Limit to 20 items per source
            try:
                # Parse published date
                published_at = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    published_at = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                    published_at = datetime(*entry.updated_parsed[:6])
                
                # Get content
                content = ""
                if hasattr(entry, "content") and entry.content:
                    content = entry.content[0].get("value", "")
                elif hasattr(entry, "summary"):
                    content = entry.summary
                elif hasattr(entry, "description"):
                    content = entry.description
                
                # Clean HTML tags
                if content:
                    soup = BeautifulSoup(content, "lxml")
                    content = soup.get_text(separator="\n", strip=True)
                
                news = RawNews(
                    id=str(uuid.uuid4()),
                    source_url=entry.get("link", ""),
                    source_name=source["name"],
                    title=entry.get("title", "Untitled"),
                    content=content[:5000],  # Limit content length
                    published_at=published_at,
                    created_at=datetime.now()
                )
                news_list.append(news)
                
            except Exception as e:
                print(f"     Error parsing entry: {e}")
                continue
        
        return news_list
    
    async def _crawl_web(self, source: dict) -> List[RawNews]:
        """Scrape news from web pages."""
        news_list = []
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(source["url"], headers=self.headers)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "lxml")
        
        # Generic article extraction (customize per source if needed)
        if "qbitai" in source["url"]:
            # 量子位 specific parsing
            articles = soup.select("article, .post-item, .article-item")[:20]
            
            for article in articles:
                try:
                    title_elem = article.select_one("h2, h3, .title, .post-title")
                    link_elem = article.select_one("a[href]")
                    summary_elem = article.select_one("p, .summary, .excerpt")
                    
                    if not title_elem or not link_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    url = link_elem.get("href", "")
                    if url and not url.startswith("http"):
                        url = source["url"].rstrip("/") + "/" + url.lstrip("/")
                    
                    content = summary_elem.get_text(strip=True) if summary_elem else ""
                    
                    news = RawNews(
                        id=str(uuid.uuid4()),
                        source_url=url,
                        source_name=source["name"],
                        title=title,
                        content=content,
                        published_at=None,
                        created_at=datetime.now()
                    )
                    news_list.append(news)
                    
                except Exception as e:
                    continue
        else:
            # Generic extraction for other sites
            articles = soup.select("article, .post, .news-item, .entry")[:20]
            
            for article in articles:
                try:
                    title_elem = article.select_one("h1, h2, h3, .title")
                    link_elem = article.select_one("a[href]")
                    
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    url = link_elem.get("href", source["url"]) if link_elem else source["url"]
                    content = article.get_text(strip=True)[:1000]
                    
                    news = RawNews(
                        id=str(uuid.uuid4()),
                        source_url=url,
                        source_name=source["name"],
                        title=title,
                        content=content,
                        published_at=None,
                        created_at=datetime.now()
                    )
                    news_list.append(news)
                    
                except Exception:
                    continue
        
        return news_list
    
    async def _crawl_api(self, source: dict) -> List[RawNews]:
        """Fetch news from API endpoints."""
        news_list = []
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(source["url"], headers=self.headers)
            response.raise_for_status()
        
        data = response.json()
        
        # Hacker News Algolia API
        if "hn.algolia" in source["url"]:
            hits = data.get("hits", [])[:20]
            
            for item in hits:
                try:
                    # Parse date
                    published_at = None
                    if item.get("created_at"):
                        published_at = date_parser.parse(item["created_at"])
                    
                    news = RawNews(
                        id=str(uuid.uuid4()),
                        source_url=item.get("url") or f"https://news.ycombinator.com/item?id={item.get('objectID')}",
                        source_name=source["name"],
                        title=item.get("title", "Untitled"),
                        content=item.get("story_text", "") or item.get("title", ""),
                        published_at=published_at,
                        created_at=datetime.now()
                    )
                    news_list.append(news)
                    
                except Exception:
                    continue
        
        return news_list
    
    async def crawl_single_url(self, url: str, source_name: str = "Manual") -> Optional[RawNews]:
        """Crawl a single URL (for manual input)."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "lxml")
            
            # Extract title
            title = ""
            title_elem = soup.select_one("h1, title, .post-title, .article-title")
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            # Extract main content
            content = ""
            content_elem = soup.select_one("article, .post-content, .article-content, main")
            if content_elem:
                content = content_elem.get_text(separator="\n", strip=True)
            else:
                # Fallback: get all paragraphs
                paragraphs = soup.select("p")
                content = "\n".join(p.get_text(strip=True) for p in paragraphs[:20])
            
            return RawNews(
                id=str(uuid.uuid4()),
                source_url=url,
                source_name=source_name,
                title=title or "Untitled",
                content=content[:5000],
                published_at=None,
                created_at=datetime.now()
            )
            
        except Exception as e:
            print(f"Error crawling {url}: {e}")
            return None


# Global crawler instance
news_crawler = NewsCrawler()


# CLI test
if __name__ == "__main__":
    async def test():
        crawler = NewsCrawler()
        news = await crawler.crawl_all()
        print(f"\n📊 Total news collected: {len(news)}")
        for n in news[:5]:
            print(f"  - {n.title[:50]}... ({n.source_name})")
    
    asyncio.run(test())
