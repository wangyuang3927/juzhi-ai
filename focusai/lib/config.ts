/**
 * 聚智 AI - 前端配置
 * 
 * 本地开发：使用 .env.local 或默认值
 * 生产部署：Vercel 会自动注入环境变量
 */

// API 后端地址
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Supabase 配置
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://eyqnsyxhkbhlloqmvncc.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cW5zeXhoa2JobGxvcW12bmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MjA5MDMsImV4cCI6MjA4MDM5NjkwM30.7hAE_l73MeV_O1bdqGrV2muMtACnmoehN1PmHUX32Hg';

// 应用信息
export const APP_NAME = '聚智 AI';
export const APP_VERSION = '1.0.0';
