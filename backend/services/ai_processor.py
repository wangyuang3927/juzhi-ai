"""
FocusAI AI Processor
Uses DeepSeek via SiliconFlow to generate insight cards from raw news.
"""
import json
import uuid
from typing import Optional
from datetime import datetime
from openai import OpenAI

from config import get_settings, PROFESSIONS
from models import InsightCard, RawNews, Profession


class TavilyKeyRotator:
    """
    Tavily API Key 轮询器
    自动在多个 key 之间轮询，实现免费额度叠加
    """
    def __init__(self, keys: list):
        self.keys = keys
        self.current_index = 0
        self._lock = None  # 延迟初始化
    
    def get_next_key(self) -> str:
        """获取下一个可用的 API Key"""
        if not self.keys:
            return ""
        key = self.keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.keys)
        return key
    
    def has_keys(self) -> bool:
        return len(self.keys) > 0
    
    def key_count(self) -> int:
        return len(self.keys)


class AIProcessor:
    """
    AI processor that transforms raw news into insight cards.
    Uses DeepSeek model via SiliconFlow API (OpenAI-compatible).
    """
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(
            api_key=settings.siliconflow_api_key,
            base_url=settings.siliconflow_base_url
        )
        self.model = settings.deepseek_model
        
        # 初始化 Tavily Key 轮询器
        tavily_keys = settings.get_tavily_keys()
        self.tavily_rotator = TavilyKeyRotator(tavily_keys)
        if tavily_keys:
            print(f"✅ Tavily 已配置 {len(tavily_keys)} 个 API Key（轮询模式）")
        else:
            print("⚠️ 未配置 Tavily API Key，搜索功能将使用降级数据")
    
    def _get_profession_display(self, profession: Profession) -> str:
        """Get Chinese display name for profession."""
        return PROFESSIONS.get(profession.value, "职场人士")
    
    async def generate_insight(
        self, 
        news: RawNews, 
        profession: Profession
    ) -> Optional[InsightCard]:
        """
        Generate an insight card from raw news for a specific profession.
        
        Args:
            news: Raw news item
            profession: Target user profession
            
        Returns:
            InsightCard or None if generation fails
        """
        profession_name = self._get_profession_display(profession)
        
        system_prompt = """你是 FocusAI 的 AI 助手，专门为职场人士解读 AI 行业动态。
你的任务是将一条 AI 新闻转化为对特定职业有价值的洞察卡片。

输出要求：
1. summary (新闻摘要): 2-3 句话概括新闻核心事实，简洁客观
2. impact (职业影响): 针对用户职业，分析这条新闻对他/她的工作意味着什么，提供可操作的建议，语气亲切实用
3. prompt (可复制资源): 提供一个用户可以直接复制使用的 Prompt 或指令，与新闻内容相关
4. tags (标签): 3-5 个相关标签，格式为 #标签名

请用 JSON 格式输出，包含以下字段：
{
    "summary": "新闻摘要",
    "impact": "对该职业的影响和建议",
    "prompt": "可复制的 Prompt 或指令",
    "tags": ["#标签1", "#标签2", "#标签3"]
}

注意：
- impact 要针对用户职业定制，不要泛泛而谈
- prompt 要实用，用户复制后可以直接使用
- 语言简洁有力，不要啰嗦"""

        user_prompt = f"""请为【{profession_name}】解读以下 AI 新闻：

标题：{news.title}

内容：
{news.content[:2000]}  # 限制内容长度避免超出 token 限制

来源：{news.source_name}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            # Parse the published date
            timestamp = news.published_at.strftime("%Y-%m-%d") if news.published_at else datetime.now().strftime("%Y-%m-%d")
            
            return InsightCard(
                id=str(uuid.uuid4()),
                title=news.title,
                tags=result.get("tags", ["#AI"]),
                summary=result.get("summary", ""),
                impact=result.get("impact", ""),
                prompt=result.get("prompt", ""),
                url=news.source_url,
                timestamp=timestamp
            )
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Raw response: {result_text}")
            return None
        except Exception as e:
            print(f"AI processing error: {e}")
            return None
    
    async def generate_general_insight(self, news: RawNews) -> Optional[InsightCard]:
        """
        Generate a general insight card (not profession-specific).
        Useful for initial processing before user selects profession.
        """
        system_prompt = """你是 FocusAI 的 AI 助手，专门解读 AI 行业动态。
你的任务是将一条 AI 新闻转化为通用的洞察卡片。

输出要求：
1. summary (新闻摘要): 2-3 句话概括新闻核心事实
2. impact (通用影响): 分析这条新闻对职场人士的普遍意义
3. prompt (可复制资源): 提供一个相关的实用 Prompt
4. tags (标签): 3-5 个相关标签

请用 JSON 格式输出：
{
    "summary": "新闻摘要",
    "impact": "通用影响分析",
    "prompt": "可复制的 Prompt",
    "tags": ["#标签1", "#标签2", "#标签3"]
}"""

        user_prompt = f"""请解读以下 AI 新闻：

标题：{news.title}

内容：
{news.content[:2000]}

来源：{news.source_name}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            timestamp = news.published_at.strftime("%Y-%m-%d") if news.published_at else datetime.now().strftime("%Y-%m-%d")
            
            return InsightCard(
                id=str(uuid.uuid4()),
                title=news.title,
                tags=result.get("tags", ["#AI"]),
                summary=result.get("summary", ""),
                impact=result.get("impact", ""),
                prompt=result.get("prompt", ""),
                url=news.source_url,
                timestamp=timestamp
            )
            
        except Exception as e:
            print(f"AI processing error: {e}")
            return None

    async def generate_personalized_insight(
        self, 
        news: RawNews, 
        user_profile: dict
    ) -> Optional[InsightCard]:
        """
        Generate a personalized insight card based on user profile.
        Uses user's profession, interests, pain points, and goals.
        
        Args:
            news: Raw news item
            user_profile: User profile dict with interests, pain_points, goals, etc.
            
        Returns:
            InsightCard or None if generation fails
        """
        profession = user_profile.get("profession", "职场人士")
        interests = user_profile.get("interests", [])
        pain_points = user_profile.get("pain_points", [])
        goals = user_profile.get("goals", [])
        skill_level = user_profile.get("skill_level", "")
        
        # 构建用户画像描述
        profile_desc = f"职业：{profession}"
        if interests:
            profile_desc += f"\n关注领域：{', '.join(interests)}"
        if pain_points:
            profile_desc += f"\n工作痛点：{', '.join(pain_points)}"
        if goals:
            profile_desc += f"\n目标：{', '.join(goals)}"
        if skill_level:
            profile_desc += f"\nAI 技能水平：{skill_level}"
        
        system_prompt = f"""你是 FocusAI 的 AI 助手，专门为用户提供个性化的 AI 资讯解读。

用户画像：
{profile_desc}

你的任务是将一条 AI 新闻转化为对这位用户最有价值的洞察卡片。

输出要求：
1. summary (新闻摘要): 2-3 句话概括新闻核心事实
2. impact (个性化影响): 
   - 结合用户的职业背景分析这条新闻对他/她的意义
   - 针对用户的痛点，说明这条新闻如何帮助解决问题
   - 结合用户的目标，给出可操作的行动建议
   - 根据用户的技能水平，调整建议的复杂度
3. prompt (可复制资源): 提供一个用户可以直接使用的 Prompt，最好能解决用户的某个痛点
4. tags (标签): 3-5 个相关标签

请用 JSON 格式输出：
{{
    "summary": "新闻摘要",
    "impact": "个性化影响分析和建议",
    "prompt": "针对用户定制的可复制 Prompt",
    "tags": ["#标签1", "#标签2", "#标签3"]
}}

注意：
- impact 必须紧密结合用户画像，体现个性化
- prompt 要针对用户的具体场景设计
- 语气亲切专业，像一位懂你的 AI 顾问"""

        user_prompt = f"""请为这位用户解读以下 AI 新闻：

标题：{news.title}

内容：
{news.content[:2000]}

来源：{news.source_name}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1200,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            result = json.loads(result_text)
            
            timestamp = news.published_at.strftime("%Y-%m-%d") if news.published_at else datetime.now().strftime("%Y-%m-%d")
            
            return InsightCard(
                id=str(uuid.uuid4()),
                title=news.title,
                tags=result.get("tags", ["#AI"]),
                summary=result.get("summary", ""),
                impact=result.get("impact", ""),
                prompt=result.get("prompt", ""),
                url=news.source_url,
                timestamp=timestamp
            )
            
        except Exception as e:
            print(f"AI personalized processing error: {e}")
            return None

    async def search_and_recommend_tools(self, profession: str, refresh_seed: int = 0, result_count: int = 6) -> list:
        """
        使用 Tavily 搜索真实 AI 工具资讯，并进行个性化推荐
        支持多 API Key 轮询
        refresh_seed: 用于生成不同搜索查询，避免结果重复
        """
        import uuid
        import asyncio
        import random
        from tavily import TavilyClient

        if not self.tavily_rotator.has_keys():
            raise Exception("未配置 Tavily API Key")
        
        # 获取下一个可用的 API Key
        api_key = self.tavily_rotator.get_next_key()
        print(f"🔍 [Tools] 使用 Tavily Key: {api_key[:12]}...")
        
        # 多样化搜索关键词（优先中文）
        query_templates = [
            f"{profession} AI工具推荐 提高效率 2024",
            f"适合{profession}的AI工具 必备神器",
            f"{profession} 如何用AI工具提升工作效率",
            f"AI工具推荐 {profession} 实用",
            f"{profession} AI办公工具 最新",
            f"国内好用的AI工具 {profession}",
            f"{profession} AI提效工具整理",
        ]
        
        # 中文网站域名白名单
        cn_domains = [
            "zhihu.com", "36kr.com", "sspai.com", "juejin.cn",
            "weixin.qq.com", "mp.weixin.qq.com", "bilibili.com",
            "csdn.net", "jianshu.com", "woshipm.com", "pmcaff.com",
            "toolify.ai", "aihub.cn", "aigc.cn"
        ]
        
        # 根据 seed 选择不同的查询
        query = query_templates[refresh_seed % len(query_templates)]
        print(f"   搜索查询: {query}")
        
        try:
            client = TavilyClient(api_key=api_key)
            
            response = await asyncio.to_thread(
                client.search,
                query=query,
                search_depth="basic",
                max_results=20,  # 最大搜索结果数
                include_domains=cn_domains  # 限制中文网站
            )
            
            # 格式化搜索结果供 AI 阅读
            search_context = ""
            for i, res in enumerate(response.get("results", [])):
                search_context += f"[{i+1}] 标题: {res.get('title', '')}\n链接: {res.get('url', '')}\n摘要: {res.get('content', '')}\n\n"
            
            if not search_context:
                raise Exception("未搜索到有效结果")

            # 3. AI 分析与提取
            prompt = f"""你是一位专业的 AI 工具分析师。我为你搜集了一些关于"{profession}"的 AI 工具搜索结果。
请仔细阅读以下搜索摘要，并从中提取整理出 {result_count} 个最适合该职业的真实 AI 工具。

搜索结果数据：
{search_context}

要求：
1. **必须**基于上述搜索结果推荐，不要瞎编。
2. 如果搜索结果中没有足够信息，可以补充你已知的确实存在的知名工具（如 ChatGPT, Claude, Midjourney 等），但必须适合该职业。
3. 重点关注能提升该职业工作效率的工具。
4. 确保提供真实的官网链接（如果搜索结果中有，就用搜索结果的；如果没有，请根据你的知识库补全准确的官网链接）。

请严格按照 JSON 格式返回：
[
  {{
    "id": "tool-1",
    "title": "工具名称",
    "summary": "简要介绍该工具对{profession}的具体价值和用法（50字以内）",
    "url": "工具官网链接",
    "source_name": "来源（如：官方网站、ProductHunt、知乎等）",
    "tags": ["#标签1", "#标签2"]
  }}
]

只返回 JSON 数组。"""

            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            # 尝试提取 JSON 部分
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].strip()
            
            # 有时候 AI 会返回 [json] 之外的文字，尝试找到第一个 [ 和最后一个 ]
            start = content.find('[')
            end = content.rfind(']')
            if start != -1 and end != -1:
                content = content[start:end+1]

            tools = json.loads(content)
            # 添加唯一 ID
            for tool in tools:
                tool['id'] = f"tool-{uuid.uuid4().hex[:8]}"
            
            return tools

        except ImportError as e:
            print(f"❌ [Tools] 缺少依赖包: {e}")
            print("   请运行: pip install tavily-python")
            raise e
        except Exception as e:
            error_msg = str(e).lower()
            if "api key" in error_msg or "unauthorized" in error_msg or "401" in error_msg:
                print(f"🔑 [Tools] API Key 无效或已用尽: {e}")
            elif "rate" in error_msg or "limit" in error_msg:
                print(f"⏱️ [Tools] 达到速率限制: {e}")
            else:
                print(f"⚠️ [Tools] 搜索出错: {e}")
            raise e

    async def search_and_recommend_cases(self, profession: str, refresh_seed: int = 0, result_count: int = 6) -> list:
        """
        使用 Tavily 搜索真实 AI 实战案例
        支持多 API Key 轮询
        refresh_seed: 用于生成不同搜索查询，避免结果重复
        """
        import uuid
        import asyncio
        import random
        from tavily import TavilyClient

        if not self.tavily_rotator.has_keys():
            raise Exception("未配置 Tavily API Key")
        
        # 获取下一个可用的 API Key
        api_key = self.tavily_rotator.get_next_key()
        print(f"🔍 [Cases] 使用 Tavily Key: {api_key[:12]}...")
        
        # 多样化搜索关键词（优先中文）
        query_templates = [
            f"{profession} AI应用实战案例 2024",
            f"{profession} 如何用AI提高效率 案例分享",
            f"AI在{profession}领域的应用 成功案例",
            f"{profession} AI实践经验 工作流",
            f"{profession} 用AI做了什么 效果",
            f"AI助力{profession} 实际案例",
            f"{profession} AI自动化 实战分享",
        ]
        
        # 中文网站域名白名单
        cn_domains = [
            "zhihu.com", "36kr.com", "sspai.com", "juejin.cn",
            "weixin.qq.com", "mp.weixin.qq.com", "bilibili.com",
            "csdn.net", "jianshu.com", "woshipm.com", "pmcaff.com",
            "toolify.ai", "aihub.cn", "aigc.cn"
        ]
        
        # 根据 seed 选择不同的查询
        query = query_templates[refresh_seed % len(query_templates)]
        print(f"   搜索查询: {query}")
        
        try:
            client = TavilyClient(api_key=api_key)
            
            response = await asyncio.to_thread(
                client.search,
                query=query,
                search_depth="basic",
                max_results=20,  # 最大搜索结果数
                include_domains=cn_domains  # 限制中文网站
            )
            
            search_context = ""
            for i, res in enumerate(response.get("results", [])):
                search_context += f"[{i+1}] 标题: {res.get('title', '')}\n链接: {res.get('url', '')}\n摘要: {res.get('content', '')}\n\n"
            
            if not search_context:
                raise Exception("未搜索到有效结果")

            # 3. AI 分析与提取
            prompt = f"""你是一位 AI 应用专家。我为你搜集了一些"{profession}"使用 AI 的相关搜索结果。
请从这些结果中提炼出 {result_count} 个具体的实战案例或应用场景。

搜索结果数据：
{search_context}

要求：
1. 案例必须真实、具体，最好有具体的应用场景描述。
2. 如果搜索结果主要是工具介绍，请你根据该工具推导出适合该职业的典型应用场景（标注为"应用建议"）。
3. 重点展示 AI 如何降本增效。
4. 链接请使用搜索结果中的原始链接。

请严格按照 JSON 格式返回：
[
  {{
    "id": "case-1",
    "title": "案例标题（如：用 ChatGPT 自动生成周报）",
    "summary": "案例简介：解决了什么问题，用了什么方法，达到了什么效果（80字以内）",
    "url": "相关文章或来源链接",
    "source_name": "来源（如：Medium、知乎、行业博客等）",
    "tags": ["#标签1", "#标签2"]
  }}
]

只返回 JSON 数组。"""

            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            # 尝试提取 JSON 部分
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].strip()
            
            # 有时候 AI 会返回 [json] 之外的文字，尝试找到第一个 [ 和最后一个 ]
            start = content.find('[')
            end = content.rfind(']')
            if start != -1 and end != -1:
                content = content[start:end+1]
            
            cases = json.loads(content)
            for case in cases:
                case['id'] = f"case-{uuid.uuid4().hex[:8]}"
            
            return cases

        except ImportError as e:
            print(f"❌ [Cases] 缺少依赖包: {e}")
            print("   请运行: pip install tavily-python")
            raise e
        except Exception as e:
            error_msg = str(e).lower()
            if "api key" in error_msg or "unauthorized" in error_msg or "401" in error_msg:
                print(f"🔑 [Cases] API Key 无效或已用尽: {e}")
            elif "rate" in error_msg or "limit" in error_msg:
                print(f"⏱️ [Cases] 达到速率限制: {e}")
            else:
                print(f"⚠️ [Cases] 搜索出错: {e}")
            raise e

    async def _search_web(self, query: str) -> str:
        """保留此辅助方法但暂时不用"""
        return ""


# Global processor instance
ai_processor = AIProcessor()
