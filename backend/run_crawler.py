"""
FocusAI News Crawler Runner
Standalone script to crawl news and generate insights.

Usage:
    python run_crawler.py              # Crawl once
    python run_crawler.py --schedule   # Run with scheduler
"""
import asyncio
import argparse
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import get_settings
from storage import storage
from services.news_crawler import news_crawler
from services.ai_processor import ai_processor
from models import Profession, RawNews


async def crawl_and_process():
    """
    Main crawl and process pipeline:
    1. Crawl news from all sources
    2. Store raw news in database
    3. Generate insights using AI
    4. Store insights in database
    """
    print(f"\n{'='*50}")
    print(f"🕐 Starting crawl at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")
    
    # Step 1: Crawl news
    print("📡 Step 1: Crawling news sources...")
    raw_news_list = await news_crawler.crawl_all()
    print(f"   Found {len(raw_news_list)} news items\n")
    
    # Step 2: Store raw news
    print("💾 Step 2: Storing raw news...")
    new_count = 0
    for news in raw_news_list:
        success = await storage.save_news(news)
        if success:
            new_count += 1
    print(f"   Stored {new_count} new items (skipped {len(raw_news_list) - new_count} duplicates)\n")
    
    # Step 3: Process unprocessed news with AI
    print("🤖 Step 3: Generating insights with AI...")
    unprocessed = await storage.get_unprocessed_news(limit=5)
    print(f"   Found {len(unprocessed)} unprocessed news items")
    
    for news_dict in unprocessed:
        title = news_dict.get('title', '')[:40]
        print(f"   Processing: {title}...")
        
        # Convert dict to RawNews object
        news = RawNews(
            id=news_dict.get('id'),
            source_url=news_dict.get('source_url'),
            source_name=news_dict.get('source_name'),
            title=news_dict.get('title'),
            content=news_dict.get('content'),
            published_at=news_dict.get('published_at'),
            created_at=news_dict.get('created_at')
        )
        
        # Generate general insight
        insight = await ai_processor.generate_general_insight(news)
        
        if insight:
            await storage.save_insight(insight)
            await storage.mark_news_processed(news.id)
            print(f"   ✓ Generated insight")
        else:
            print(f"   ✗ Failed to generate insight")
    
    print(f"\n{'='*50}")
    print(f"✅ Crawl completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")


async def run_scheduler():
    """Run crawler on a schedule."""
    settings = get_settings()
    
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        crawl_and_process,
        'interval',
        hours=settings.crawl_interval_hours,
        id='news_crawler'
    )
    
    print(f"📅 Scheduler started. Crawling every {settings.crawl_interval_hours} hours.")
    print("   Press Ctrl+C to stop.\n")
    
    # Run once immediately
    await crawl_and_process()
    
    scheduler.start()
    
    # Keep running
    try:
        while True:
            await asyncio.sleep(3600)
    except KeyboardInterrupt:
        print("\n👋 Scheduler stopped.")
        scheduler.shutdown()


async def test_ai_processor():
    """Test the AI processor with a sample news item."""
    from models import RawNews
    import uuid
    
    print("🧪 Testing AI Processor...\n")
    
    # Create a sample news item
    sample_news = RawNews(
        id=str(uuid.uuid4()),
        source_url="https://example.com/test",
        source_name="Test Source",
        title="DeepSeek V3 发布：开源大模型新标杆",
        content="""
        深度求索（DeepSeek）今日发布 DeepSeek V3 模型，这是目前最强大的开源大语言模型之一。
        
        主要特点：
        - 在多项基准测试中超越 GPT-4
        - 支持 128K 超长上下文
        - 完全开源，可本地部署
        - 推理速度提升 3 倍
        
        DeepSeek V3 采用了全新的 MoE（混合专家）架构，在保持高性能的同时大幅降低了计算成本。
        模型已在 HuggingFace 上开源，开发者可以免费下载使用。
        """,
        published_at=datetime.now(),
        created_at=datetime.now()
    )
    
    # Test with different professions
    test_professions = [
        Profession.ONLINE_TEACHER,
        Profession.PRODUCT_MANAGER,
        Profession.FULLSTACK_ENGINEER,
    ]
    
    for profession in test_professions:
        print(f"\n--- Testing for: {profession.value} ---")
        insight = await ai_processor.generate_insight(sample_news, profession)
        
        if insight:
            print(f"Title: {insight.title}")
            print(f"Tags: {insight.tags}")
            print(f"Summary: {insight.summary[:100]}...")
            print(f"Impact: {insight.impact[:100]}...")
            print(f"Prompt: {insight.prompt[:80]}...")
        else:
            print("Failed to generate insight")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FocusAI News Crawler")
    parser.add_argument("--schedule", action="store_true", help="Run with scheduler")
    parser.add_argument("--test", action="store_true", help="Test AI processor")
    args = parser.parse_args()
    
    if args.test:
        asyncio.run(test_ai_processor())
    elif args.schedule:
        asyncio.run(run_scheduler())
    else:
        asyncio.run(crawl_and_process())
