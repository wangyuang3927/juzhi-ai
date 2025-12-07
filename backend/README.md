# FocusAI Backend

职场 AI 之窗 - 后端 API 服务

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填入你的 API Key
```

需要配置的关键变量：

| 变量 | 说明 | 获取地址 |
|------|------|----------|
| `SILICONFLOW_API_KEY` | 硅基流动 API Key | https://cloud.siliconflow.cn/ |
| `SUPABASE_URL` | Supabase 项目 URL | https://supabase.com/dashboard |
| `SUPABASE_KEY` | Supabase anon key | 同上 |

### 3. 初始化数据库

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 进入 SQL Editor
4. 复制 `init_database.sql` 内容并执行

### 4. 启动服务

```bash
# 开发模式 (自动重载)
python main.py

# 或使用 uvicorn
uvicorn main:app --reload --port 8000
```

服务启动后访问：
- API 文档: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 接口

### 新闻洞察 (Insights)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/insights` | 获取洞察卡片列表 |
| GET | `/api/insights/mock` | 获取 Mock 数据 (开发用) |
| GET | `/api/insights/{id}` | 获取单个卡片详情 |

### 用户 (Users)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/profile` | 获取用户信息 |
| PUT | `/api/user/profile` | 更新用户信息 |
| GET | `/api/user/professions` | 获取职业列表 |

### 交互 (Interactions)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/interactions` | 记录用户交互 |
| GET | `/api/bookmarks` | 获取收藏列表 |

## 爬虫运行

```bash
# 运行一次爬虫
python run_crawler.py

# 定时运行 (每 6 小时)
python run_crawler.py --schedule

# 测试 AI 处理器
python run_crawler.py --test
```

## 项目结构

```
backend/
├── main.py              # FastAPI 主程序
├── config.py            # 配置管理
├── models.py            # 数据模型
├── database.py          # 数据库操作
├── routers/             # API 路由
│   ├── insights.py      # 洞察卡片 API
│   ├── users.py         # 用户 API
│   └── interactions.py  # 交互 API
├── services/            # 业务服务
│   ├── ai_processor.py  # AI 处理 (DeepSeek)
│   └── news_crawler.py  # 新闻爬虫
├── run_crawler.py       # 爬虫运行脚本
├── init_database.sql    # 数据库初始化
├── requirements.txt     # Python 依赖
└── .env.example         # 环境变量示例
```

## 技术栈

- **Web 框架**: FastAPI
- **AI 模型**: DeepSeek (via SiliconFlow)
- **数据库**: PostgreSQL (Supabase)
- **爬虫**: httpx + BeautifulSoup + feedparser

## 注意事项

1. **API Key 安全**: 不要将 `.env` 文件提交到 Git
2. **爬虫频率**: 默认每 6 小时爬取一次，避免过于频繁
3. **Token 消耗**: AI 处理每条新闻约消耗 1000-2000 tokens

## 下一步

- [ ] 添加用户认证 (Supabase Auth)
- [ ] 实现基于反馈的推荐算法
- [ ] 添加更多新闻源
- [ ] 部署到云服务器
