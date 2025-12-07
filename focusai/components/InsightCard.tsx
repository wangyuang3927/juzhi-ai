import React, { useState } from 'react';
import { Copy, Check, X, Star, Zap, ArrowRight, Terminal, Sparkles, Loader2 } from 'lucide-react';
import { NewsItem } from '../types';
import { trackClick } from '../lib/analytics';
import { API_BASE_URL } from '../lib/config';

interface InsightCardProps {
  item: NewsItem;
  isBookmarked: boolean;
  userProfession: string;
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;
}

const InsightCard: React.FC<InsightCardProps> = ({
  item,
  isBookmarked,
  userProfession,
  onToggleBookmark,
  onDelete,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [personalizedImpact, setPersonalizedImpact] = useState<string | null>(null);
  const [personalizedPrompt, setPersonalizedPrompt] = useState<string | null>(null);

  const handleCopy = async () => {
    trackClick('复制提示词', 'news', { item_id: item.id });
    const textToCopy = personalizedPrompt || item.prompt;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePersonalize = async () => {
    trackClick('个性化解读', 'news', { item_id: item.id });
    setIsPersonalizing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/insights/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession: userProfession,
          news: {
            id: item.id,
            title: item.title,
            summary: item.summary,
            url: item.url,
            tags: item.tags
          }
        })
      });
      const data = await res.json();
      
      if (data.success && data.insight) {
        setPersonalizedImpact(data.insight.impact);
        setPersonalizedPrompt(data.insight.prompt);
      } else {
        alert(data.detail || '请先与 AI 助手对话，建立你的个人画像');
      }
    } catch (error) {
      alert('个性化解读失败，请稍后重试');
    } finally {
      setIsPersonalizing(false);
    }
  };

  return (
    <div className="group relative w-full mb-8 perspective-1000">
      {/* Glow effect behind card */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-lg group-hover:blur-xl"></div>
      
      <div className="relative bg-[#0b0c15]/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-black/50 hover:border-white/10">
        
        {/* Top Actions Layer (Absolute) */}
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
              title="不感兴趣 / 隐藏"
            >
              <X size={16} />
            </button>
        </div>

        {/* Card Header & Content */}
        <div className="p-6 sm:p-8">
          
          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 mb-4 pr-8">
            {item.tags.map((tag, i) => (
              <span
                key={tag}
                className={`
                  px-2.5 py-1 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase rounded-md border
                  ${i === 0 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                    : 'bg-white/5 text-neutral-500 border-white/5'}
                `}
              >
                {tag}
              </span>
            ))}
             <span className="px-2 py-1 text-[10px] text-neutral-600 font-mono self-center ml-auto hidden sm:inline-block border border-transparent">
                {item.timestamp}
            </span>
          </div>

          {/* Title & Summary */}
          <div className="mb-8">
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug hover:text-blue-400 transition-colors cursor-pointer">
                {item.title}
              </h3>
            </a>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed font-light">
              {item.summary}
            </p>
          </div>

          {/* Impact Insight Box */}
          <div className={`mb-6 relative overflow-hidden rounded-xl border p-5 transition-all ${
            personalizedImpact 
              ? 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30' 
              : 'bg-gradient-to-br from-[#13141f] to-[#1a1b26] border-white/5'
          }`}>
             <div className={`absolute top-0 left-0 w-1 h-full ${personalizedImpact ? 'bg-purple-500' : 'bg-indigo-500/50'}`}></div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {personalizedImpact ? (
                  <>
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-purple-400">为你定制的解读</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="fill-current" />
                    <span>对 {userProfession} 的影响</span>
                  </>
                )}
              </div>
              {!personalizedImpact && (
                <button
                  onClick={handlePersonalize}
                  disabled={isPersonalizing}
                  className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full transition-all disabled:opacity-50"
                >
                  {isPersonalizing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  <span>{isPersonalizing ? '生成中' : '个性化'}</span>
                </button>
              )}
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {personalizedImpact || item.impact}
            </p>
          </div>

          {/* Prompt Terminal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-600 text-[10px] font-medium tracking-wide">
                <Terminal size={12} />
                <span>推荐提示词</span>
              </div>
            </div>
            
            <div className="relative group/code">
              <pre className={`relative w-full border rounded-lg p-4 pr-14 text-xs sm:text-sm font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap shadow-inner selection:bg-blue-500/30 ${
                personalizedPrompt ? 'bg-purple-900/10 border-purple-500/20' : 'bg-[#050508] border-white/10'
              }`}>
                <code className="bg-transparent">{personalizedPrompt || item.prompt}</code>
              </pre>
              
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 rounded-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all border border-white/5 hover:border-white/20 backdrop-blur-sm"
              >
                {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions - Optimized Layout */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors group/link px-2 py-1 rounded-md hover:bg-white/5"
          >
            <span className="font-medium">阅读原文</span>
            <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform opacity-70" />
          </a>

          <button
            onClick={() => {
              trackClick(isBookmarked ? '取消收藏新闻' : '收藏新闻', 'news', { item_id: item.id });
              onToggleBookmark(item.id);
            }}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
              ${isBookmarked 
                ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105' 
                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/20'}
            `}
          >
            <Star size={12} className={isBookmarked ? 'fill-black' : ''} />
            <span>{isBookmarked ? '已收藏' : '收藏'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;