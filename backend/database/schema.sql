-- ============================================
-- 聚智 AI - Supabase 数据库设计
-- ============================================

-- 1. 用户画像表
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,  -- 关联 Supabase Auth 用户
    email TEXT,
    profession TEXT,               -- 职业
    interests TEXT[],              -- 兴趣标签数组
    pain_points TEXT[],            -- 痛点
    skill_level TEXT,              -- 技能水平
    goals TEXT[],                  -- 目标
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 聊天记录表
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：按用户查询聊天记录
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- 3. 联系留言表
CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,  -- 邀请码所属用户
    code TEXT UNIQUE NOT NULL,     -- 6位邀请码
    invited_users TEXT[] DEFAULT '{}',  -- 被邀请的用户列表
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：按邀请码查询
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- 5. 专业版用户表
CREATE TABLE IF NOT EXISTS premium_users (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,  -- 过期时间
    source TEXT DEFAULT 'invite',     -- 来源：invite/payment
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'feature', 'event', 'maintenance')),
    link TEXT,
    link_text TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 埋点事件表
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,      -- click, view, action, error
    event_name TEXT NOT NULL,
    page TEXT,
    extra JSONB DEFAULT '{}',      -- 额外数据
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：按时间和类型查询
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);

-- 8. 违规记录表
CREATE TABLE IF NOT EXISTS violations (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    violation_type TEXT NOT NULL,  -- profession_blacklist, chat_blacklist, etc.
    content TEXT,                  -- 违规内容
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 用户封禁表
CREATE TABLE IF NOT EXISTS blocked_users (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    reason TEXT,
    blocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. 收藏表
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,         -- 新闻/工具/案例 ID
    item_type TEXT DEFAULT 'news', -- news, tool, case
    item_data JSONB NOT NULL,      -- 完整的条目数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 索引：按用户查询收藏
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- 11. 支付记录表（未来用）
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    payment_method TEXT,           -- alipay, wechat
    transaction_id TEXT,           -- 第三方交易号
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own chat" ON chat_messages
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR ALL USING (auth.uid()::text = user_id);

-- 公告对所有人可见
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are public" ON announcements
    FOR SELECT USING (active = true);

-- ============================================
-- 函数：更新 updated_at 时间戳
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 触发器
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_users_updated_at
    BEFORE UPDATE ON premium_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
