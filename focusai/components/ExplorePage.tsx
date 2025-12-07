import React, { useState, useEffect } from 'react';
import { Newspaper, Wrench, Lightbulb, RefreshCw, ChevronLeft, ChevronRight, Share2, Loader2, ExternalLink, Star } from 'lucide-react';
import InsightCard from './InsightCard';
import { NewsItem } from '../types';
import { trackClick } from '../lib/analytics';
import { API_BASE_URL } from '../lib/config';

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source_name: string;
  tags: string[];
  timestamp: string;
}

interface ExplorePageProps {
  items: NewsItem[];
  bookmarks: Set<string>;
  userProfession: string;
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  onRefreshNews?: () => Promise<boolean> | void;  // 支持异步生成
  onBookmarkItem?: (item: NewsItem) => void;  // 新增：收藏工具/案例
}

type TabType = 'news' | 'tools' | 'cases';

const ExplorePage: React.FC<ExplorePageProps> = ({
  items,
  bookmarks,
  userProfession,
  onToggleBookmark,
  onDelete,
  onRefreshNews,
  onBookmarkItem,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tools, setTools] = useState<ContentItem[]>([]);
  const [cases, setCases] = useState<ContentItem[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  // 加载工具推荐
  useEffect(() => {
    if (activeTab === 'tools' && tools.length === 0) {
      loadTools();
    }
  }, [activeTab]);

  // 加载实战案例
  useEffect(() => {
    if (activeTab === 'cases' && cases.length === 0) {
      loadCases();
    }
  }, [activeTab]);

  const loadTools = async () => {
    trackClick('刷新工具推荐', 'tools');
    setLoadingTools(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/insights/tools?profession=${encodeURIComponent(userProfession)}`);
      const data = await res.json();
      setTools(data.items || []);
      // 显示缓存状态
      if (data.cached) {
        console.log('📦 从缓存加载工具推荐');
      } else {
        console.log(`🔄 从 API 加载工具推荐，共获取 ${data.total_fetched || 0} 条`);
      }
    } catch (error) {
      console.error('Failed to load tools:', error);
    } finally {
      setLoadingTools(false);
    }
  };

  const loadCases = async () => {
    trackClick('刷新实战案例', 'cases');
    setLoadingCases(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/insights/cases?profession=${encodeURIComponent(userProfession)}`);
      const data = await res.json();
      setCases(data.items || []);
      // 显示缓存状态
      if (data.cached) {
        console.log('📦 从缓存加载实战案例');
      } else {
        console.log(`🔄 从 API 加载实战案例，共获取 ${data.total_fetched || 0} 条`);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  // 收藏工具/案例
  const handleBookmarkTool = (tool: ContentItem) => {
    trackClick('收藏工具', 'tools', { tool_id: tool.id });
    if (onBookmarkItem) {
      const newsItem: NewsItem = {
        id: tool.id,
        title: tool.title,
        tags: tool.tags || [],
        summary: tool.summary,
        impact: '',
        prompt: '',
        url: tool.url,
        timestamp: new Date().toISOString().split('T')[0],
        type: 'tool',
        source_name: tool.source_name,
      };
      onBookmarkItem(newsItem);
    }
  };

  const handleBookmarkCase = (caseItem: ContentItem) => {
    trackClick('收藏案例', 'cases', { case_id: caseItem.id });
    if (onBookmarkItem) {
      const newsItem: NewsItem = {
        id: caseItem.id,
        title: caseItem.title,
        tags: caseItem.tags || [],
        summary: caseItem.summary,
        impact: '',
        prompt: '',
        url: caseItem.url,
        timestamp: new Date().toISOString().split('T')[0],
        type: 'case',
        source_name: caseItem.source_name,
      };
      onBookmarkItem(newsItem);
    }
  };

  // Tab 配置
  const tabs = [
    { id: 'news' as TabType, label: '今日AI简报', icon: Newspaper, color: 'blue' },
    { id: 'tools' as TabType, label: '专属工具推荐', icon: Wrench, color: 'green' },
    { id: 'cases' as TabType, label: '行业实战案例', icon: Lightbulb, color: 'purple' },
  ];

  // 日期快捷选择
  const dateOptions = [
    { label: '今天', days: 0 },
    { label: '昨天', days: 1 },
    { label: '前天', days: 2 },
    { label: '本周', days: 7 },
  ];

  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  // 根据日期筛选内容
  const filteredItems = items.filter(item => {
    if (selectedDate === getDateString(7)) {
      // 本周：最近7天
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(item.timestamp) >= weekAgo;
    }
    return item.timestamp === selectedDate;
  });

  // 生成分享链接
  const handleShareDaily = async () => {
    // 使用查询参数格式，避免 SPA 路由问题
    const shareUrl = `${window.location.origin}?date=${selectedDate}&share=1`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('分享链接已复制到剪贴板！');
    } catch {
      prompt('复制分享链接:', shareUrl);
    }
  };

  return (
    <div className="w-full">
      {/* Tab 切换 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  trackClick(`切换Tab-${tab.label}`, 'explore');
                  setActiveTab(tab.id);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/30` 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                `}
                style={isActive ? {
                  backgroundColor: tab.color === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                                   tab.color === 'green' ? 'rgba(34, 197, 94, 0.2)' :
                                   'rgba(168, 85, 247, 0.2)',
                  color: tab.color === 'blue' ? 'rgb(96, 165, 250)' :
                         tab.color === 'green' ? 'rgb(74, 222, 128)' :
                         'rgb(192, 132, 252)',
                  borderColor: tab.color === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
                               tab.color === 'green' ? 'rgba(34, 197, 94, 0.3)' :
                               'rgba(168, 85, 247, 0.3)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                } : {}}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 日期选择 + 分享按钮 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            {dateOptions.map((option) => {
              const dateStr = getDateString(option.days);
              const isActive = selectedDate === dateStr;
              return (
                <button
                  key={option.label}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-neutral-500 hover:text-white'}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={handleShareDaily}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Share2 size={14} />
            <span>分享今日</span>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <RefreshCw size={48} className="mx-auto mb-4 text-blue-400/50" />
              <p className="text-neutral-400 mb-4">暂无今日 AI 简报</p>
              <button
                onClick={async () => {
                  trackClick('获取AI资讯', 'news');
                  if (onRefreshNews) {
                    setLoadingNews(true);
                    try {
                      await onRefreshNews();
                    } finally {
                      setLoadingNews(false);
                    }
                  }
                }}
                disabled={loadingNews}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <RefreshCw size={18} className={loadingNews ? 'animate-spin' : ''} />
                {loadingNews ? '正在获取中，请耐心等待...' : '获取专属于您的 AI 资讯'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <InsightCard
                    key={item.id}
                    item={item}
                    isBookmarked={bookmarks.has(item.id)}
                    userProfession={userProfession}
                    onToggleBookmark={onToggleBookmark}
                    onDelete={onDelete}
                  />
                ))}
              </div>
              {/* 底部刷新按钮 - 仅今日显示 */}
              {selectedDate === getDateString(0) && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={async () => {
                      trackClick('获取更多资讯', 'news');
                      if (onRefreshNews) {
                        setLoadingNews(true);
                        try {
                          await onRefreshNews();
                        } finally {
                          setLoadingNews(false);
                        }
                      }
                    }}
                    disabled={loadingNews}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl text-blue-400 font-medium hover:from-blue-600/30 hover:to-purple-600/30 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={loadingNews ? 'animate-spin' : ''} />
                    {loadingNews ? '正在获取中...' : '获取更多资讯'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-4">
          {/* 刷新按钮 */}
          <div className="flex justify-end">
            <button
              onClick={loadTools}
              disabled={loadingTools}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm hover:bg-green-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingTools ? 'animate-spin' : ''} />
              {loadingTools ? '刷新中...' : '换一批'}
            </button>
          </div>

          {loadingTools ? (
            <div className="text-center py-16">
              <Loader2 className="mx-auto mb-4 text-green-400 animate-spin" size={40} />
              <p className="text-neutral-500">正在为您获取专属于您的资讯，请您耐心等待</p>
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-16">
              <RefreshCw size={48} className="mx-auto mb-4 text-green-400/50" />
              <h3 className="text-lg font-bold text-white mb-2">暂无专属工具推荐</h3>
              <p className="text-neutral-500 text-sm mb-4">点击刷新获取适合 {userProfession} 的 AI 工具</p>
              <button
                onClick={loadTools}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCw size={18} />
                获取专属工具推荐
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-green-500/30 hover:bg-green-500/5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className="text-green-400" />
                      <span className="text-xs text-green-400 font-medium">{tool.source_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBookmarkTool(tool)}
                        className={`p-1.5 rounded-lg transition-all ${
                          bookmarks.has(tool.id)
                            ? 'text-yellow-400 bg-yellow-500/20'
                            : 'text-neutral-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                        title={bookmarks.has(tool.id) ? '取消收藏' : '收藏'}
                      >
                        <Star size={14} fill={bookmarks.has(tool.id) ? 'currentColor' : 'none'} />
                      </button>
                      <a href={tool.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-neutral-500 hover:text-green-400 hover:bg-green-500/10 transition-all">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    <h3 className="font-bold text-white mb-2 hover:text-green-400 transition-colors line-clamp-2 cursor-pointer">{tool.title}</h3>
                  </a>
                  <p className="text-sm text-neutral-400 line-clamp-2">{tool.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {tool.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'cases' && (
        <div className="space-y-4">
          {/* 刷新按钮 */}
          <div className="flex justify-end">
            <button
              onClick={loadCases}
              disabled={loadingCases}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 text-sm hover:bg-purple-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingCases ? 'animate-spin' : ''} />
              {loadingCases ? '刷新中...' : '换一批'}
            </button>
          </div>

          {loadingCases ? (
            <div className="text-center py-16">
              <Loader2 className="mx-auto mb-4 text-purple-400 animate-spin" size={40} />
              <p className="text-neutral-500">正在为您获取专属于您的资讯，请您耐心等待</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-16">
              <RefreshCw size={48} className="mx-auto mb-4 text-purple-400/50" />
              <h3 className="text-lg font-bold text-white mb-2">暂无行业实战案例</h3>
              <p className="text-neutral-500 text-sm mb-4">点击刷新获取适合 {userProfession} 的 AI 应用案例</p>
              <button
                onClick={loadCases}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCw size={18} />
                获取行业实战案例
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} className="text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">{caseItem.source_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBookmarkCase(caseItem)}
                        className={`p-1.5 rounded-lg transition-all ${
                          bookmarks.has(caseItem.id)
                            ? 'text-yellow-400 bg-yellow-500/20'
                            : 'text-neutral-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                        title={bookmarks.has(caseItem.id) ? '取消收藏' : '收藏'}
                      >
                        <Star size={14} fill={bookmarks.has(caseItem.id) ? 'currentColor' : 'none'} />
                      </button>
                      <a href={caseItem.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                  <a href={caseItem.url} target="_blank" rel="noopener noreferrer">
                    <h3 className="font-bold text-white mb-2 hover:text-purple-400 transition-colors line-clamp-2 cursor-pointer">{caseItem.title}</h3>
                  </a>
                  <p className="text-sm text-neutral-400 line-clamp-2">{caseItem.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {caseItem.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px]">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
