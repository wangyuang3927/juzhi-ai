import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ArrowRight, Loader2, Gift } from 'lucide-react';
import { ViewState } from '../types';
import { API_BASE_URL } from '../lib/config';

interface ShareItem {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  timestamp: string;
}

interface SharePageProps {
  onNavigate: (view: ViewState) => void;
}

const SharePage: React.FC<SharePageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShareItem[]>([]);
  const [date, setDate] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    // 从 URL 获取参数
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date') || new Date().toISOString().split('T')[0];
    const codeParam = params.get('code');
    
    setDate(dateParam);
    setInviteCode(codeParam);
    
    loadShareData(dateParam, codeParam);
  }, []);

  const loadShareData = async (date: string, code: string | null) => {
    try {
      const url = `${API_BASE_URL}/api/share/daily/${date}${code ? `?invite_code=${code}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white">
      {/* 顶部广告横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift size={20} />
            <span className="text-sm font-medium">
              {inviteCode 
                ? `好友邀请你体验 聚智 AI，使用邀请码 ${inviteCode} 注册获得额外福利！`
                : '注册 聚智 AI，获取专属于你的 AI 资讯！'
              }
            </span>
          </div>
          <button
            onClick={() => onNavigate(ViewState.REGISTER)}
            className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-neutral-100 transition-colors"
          >
            免费注册
          </button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 头部 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="text-blue-400" size={32} />
            <span className="text-2xl font-bold">聚智 AI</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-4">
            <Calendar size={16} />
            <span>{formatDate(date)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            今日 AI 热点精选
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto">
            为职场人士精选的 AI 行业动态，助你把握趋势、提升效率
          </p>
        </div>

        {/* 内容列表 */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <p>该日期暂无内容</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div 
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-3">{item.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-white/5 rounded text-xs text-neutral-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部 CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">想要更个性化的 AI 资讯？</h2>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              注册 FocusAI，告诉我们你的职业，获取专门为你定制的 AI 行业洞察和工具推荐
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => onNavigate(ViewState.REGISTER)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <span>免费注册</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => onNavigate(ViewState.LANDING)}
                className="px-6 py-3 text-neutral-400 hover:text-white transition-colors"
              >
                了解更多
              </button>
            </div>
            {inviteCode && (
              <p className="mt-4 text-sm text-neutral-500">
                使用邀请码 <span className="text-blue-400 font-mono">{inviteCode}</span> 注册
              </p>
            )}
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-16 text-center text-xs text-neutral-600">
          <p>FocusAI © 2024 / 职场人士的 AI 信息伙伴</p>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
