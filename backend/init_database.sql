-- ============================================
-- FocusAI Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Raw News Table (原始新闻)
-- ============================================
CREATE TABLE IF NOT EXISTS raw_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_url TEXT UNIQUE NOT NULL,
    source_name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_raw_news_created_at ON raw_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_news_source ON raw_news(source_name);

-- ============================================
-- 2. Users Table (用户)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Can be anonymous ID or auth user ID
    profession TEXT DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Insights Table (AI 加工后的洞察卡片)
-- ============================================
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id UUID REFERENCES raw_news(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    summary TEXT,
    impact TEXT,
    prompt TEXT,
    url TEXT,
    timestamp TEXT,  -- Display date string (YYYY-MM-DD)
    target_profession TEXT DEFAULT 'general',  -- Which profession this insight is for
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_profession ON insights(target_profession);
CREATE INDEX IF NOT EXISTS idx_insights_news_id ON insights(news_id);

-- ============================================
-- 4. User Interactions Table (用户交互记录)
-- ============================================
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,  -- 'trash', 'bookmark', 'rate_good', 'rate_bad'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate interactions of the same type
    UNIQUE(user_id, insight_id, action_type)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_insight ON user_interactions(insight_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON user_interactions(action_type);

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE raw_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous read for news and insights
CREATE POLICY "Allow anonymous read raw_news" ON raw_news
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read insights" ON insights
    FOR SELECT USING (true);

-- Policy: Allow all operations for service role (backend)
CREATE POLICY "Service role full access raw_news" ON raw_news
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access insights" ON insights
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access interactions" ON user_interactions
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Users can manage their own data
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own interactions" ON user_interactions
    FOR ALL USING (true);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Done!
-- ============================================
-- After running this script:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Copy the URL and anon key to your .env file
-- 3. Start the backend server
