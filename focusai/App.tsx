import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InsightCard from './components/InsightCard';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import FeaturesPage from './components/FeaturesPage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import AuthPage from './components/AuthPage';
import ChatBot from './components/ChatBot';
import AdminPage from './components/AdminPage';
import ExplorePage from './components/ExplorePage';
import SharePage from './components/SharePage';
import AnnouncementPage from './components/AnnouncementPage';
import AnnouncementBanner from './components/AnnouncementBanner';
import { ViewState, NewsItem, UserSettings } from './types';
import { MOCK_NEWS } from './constants';
import { Bookmark, Inbox, Loader2, Newspaper, Wrench, Lightbulb, ExternalLink, Star, Trash2 } from 'lucide-react';

import { auth } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { trackPageView, trackClick, trackAction, getUserId } from './lib/analytics';
import { API_BASE_URL } from './lib/config';

const App: React.FC = () => {
  // 检查是否是分享页面
  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // 有 share=1 参数时进入分享页面
      if (params.get('share') === '1' && params.get('date')) {
        return ViewState.SHARE;
      }
    }
    return ViewState.LANDING;
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView());
  const [items, setItems] = useState<NewsItem[]>([]);  // 专属简报（个性化）
  const [generalItems, setGeneralItems] = useState<NewsItem[]>([]);  // 通用简报
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<NewsItem[]>([]);  // 存储完整的收藏对象
  const [bookmarkTab, setBookmarkTab] = useState<'all' | 'news' | 'tool' | 'case'>('all');  // 收藏页分类
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    // 从 localStorage 读取保存的设置
    const saved = localStorage.getItem('focusai_user_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { profession: '职场人士' };
      }
    }
    return { profession: '职场人士' };
  });
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // 监听登录状态
  useEffect(() => {
    // 获取当前用户
    auth.getUser().then(setUser);
    
    // 监听状态变化
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 检查专业版状态
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const userId = getUserId();
        const res = await fetch(`${API_BASE_URL}/api/invite/status/${userId}`);
        const data = await res.json();
        setIsPremium(data.is_premium || false);
      } catch (error) {
        console.error('Failed to check premium status:', error);
        setIsPremium(false);
      }
    };
    checkPremiumStatus();
  }, [user]);

  // 从后端加载已有数据
  const fetchInsights = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      
      // 1. 加载用户今日已生成的专属新闻
      const userNewsRes = await fetch(`${API_BASE_URL}/api/insights/user-daily-news/${encodeURIComponent(userId)}`);
      const userNewsData = await userNewsRes.json();
      
      if (userNewsData.items && userNewsData.items.length > 0) {
        console.log('📦 加载用户今日已有专属新闻');
        setItems(userNewsData.items);
      }
      
      // 2. 加载用户今日已生成的通用新闻
      const generalNewsRes = await fetch(`${API_BASE_URL}/api/insights/user-daily-general-news/${encodeURIComponent(userId)}`);
      const generalNewsData = await generalNewsRes.json();
      
      if (generalNewsData.items && generalNewsData.items.length > 0) {
        console.log('📦 加载用户今日已有通用新闻');
        setGeneralItems(generalNewsData.items);
      }
      
    } catch (error) {
      console.error('Failed to fetch from API:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成专属 AI 新闻（关联用户职业）
  const generateNews = async (): Promise<boolean> => {
    try {
      console.log('🔄 开始生成专属 AI 新闻...');
      const userId = getUserId();
      const response = await fetch(
        `${API_BASE_URL}/api/insights/generate?profession=${encodeURIComponent(userSettings.profession)}&user_id=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 错误:', errorData.detail);
        alert(errorData.detail || '请求失败，请稍后重试');
        return false;
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = data.items.filter((item: NewsItem) => !existingIds.has(item.id));
          console.log(`✅ 生成了 ${newItems.length} 条专属新闻`);
          return [...newItems, ...prev];
        });
        return true;
      } else if (data.error) {
        console.error('生成失败:', data.error);
        return false;
      }
      return false;
    } catch (error) {
      console.error('生成专属新闻失败:', error);
      return false;
    }
  };

  // 生成通用 AI 新闻（不关联职业）
  const generateGeneralNews = async (): Promise<boolean> => {
    try {
      console.log('🔄 开始生成通用 AI 新闻...');
      const userId = getUserId();
      const response = await fetch(
        `${API_BASE_URL}/api/insights/generate-general?user_id=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 错误:', errorData.detail);
        alert(errorData.detail || '请求失败，请稍后重试');
        return false;
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        setGeneralItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = data.items.filter((item: NewsItem) => !existingIds.has(item.id));
          console.log(`✅ 生成了 ${newItems.length} 条通用新闻`);
          return [...newItems, ...prev];
        });
        return true;
      } else if (data.error) {
        console.error('生成失败:', data.error);
        return false;
      }
      return false;
    } catch (error) {
      console.error('生成通用新闻失败:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // 页面访问埋点
  useEffect(() => {
    trackPageView(currentView);
  }, [currentView]);

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(id)) {
        newBookmarks.delete(id);
        // 同时从 bookmarkedItems 中移除
        setBookmarkedItems((prevItems) => prevItems.filter((item) => item.id !== id));
      } else {
        newBookmarks.add(id);
        // 如果是新闻项，添加到 bookmarkedItems
        const item = items.find((i) => i.id === id);
        if (item) {
          setBookmarkedItems((prevItems) => [...prevItems, { ...item, type: 'news' }]);
        }
      }
      return newBookmarks;
    });
  };

  // 收藏工具/案例（从 ExplorePage 调用）
  const bookmarkItem = (item: NewsItem) => {
    if (bookmarks.has(item.id)) {
      // 已收藏，取消
      setBookmarks((prev) => {
        const newBookmarks = new Set(prev);
        newBookmarks.delete(item.id);
        return newBookmarks;
      });
      setBookmarkedItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
    } else {
      // 未收藏，添加
      setBookmarks((prev) => new Set([...prev, item.id]));
      setBookmarkedItems((prevItems) => [...prevItems, item]);
    }
  };

  const deleteItem = (id: string) => {
    if (bookmarks.has(id)) {
        toggleBookmark(id);
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    // 保存到 localStorage
    localStorage.setItem('focusai_user_settings', JSON.stringify(newSettings));
  };

  // Helper component for Empty States
  const EmptyState = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="flex flex-col items-center justify-center mt-12 text-neutral-500 animate-fade-in py-12">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
        <div className="relative w-20 h-20 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl">
          <Icon size={32} className="opacity-60 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 max-w-xs text-center leading-relaxed">
        {desc}
      </p>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case ViewState.FEATURES:
        return <FeaturesPage />;
      case ViewState.PRICING:
        return <PricingPage onNavigate={setCurrentView} user={user} />;
      case ViewState.CONTACT:
        return <ContactPage />;
      case ViewState.ANNOUNCEMENTS:
        return <AnnouncementPage />;
      case ViewState.LOGIN:
      case ViewState.REGISTER:
        return (
          <AuthPage 
            type={currentView} 
            onNavigate={setCurrentView}
            onLogin={() => setCurrentView(ViewState.HOME)}
            onUpdateProfession={(profession) => {
              const newSettings = { ...userSettings, profession };
              setUserSettings(newSettings);
              localStorage.setItem('focusai_user_settings', JSON.stringify(newSettings));
            }}
          />
        );
      case ViewState.SETTINGS:
        return (
          <Settings 
              settings={userSettings} 
              onSave={handleSaveSettings} 
          />
        );
      case ViewState.HOME:
      case ViewState.BOOKMARKS:
        // Loading state
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center mt-20 animate-fade-in">
              <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
              <p className="text-neutral-400">加载中...</p>
            </div>
          );
        }

        // HOME 视图使用新的探索页
        if (currentView === ViewState.HOME) {
          return (
            <div className="pb-20">
              <ExplorePage
                items={items}
                generalItems={generalItems}
                bookmarks={bookmarks}
                userProfession={userSettings.profession}
                onToggleBookmark={toggleBookmark}
                onDelete={deleteItem}
                onRefreshNews={generateNews}
                onRefreshGeneralNews={generateGeneralNews}
                onBookmarkItem={bookmarkItem}
                isPremium={isPremium}
                onNavigate={setCurrentView}
              />
            </div>
          );
        }

        // BOOKMARKS 视图 - 支持分类
        if (bookmarkedItems.length === 0) {
          return <EmptyState icon={Bookmark} title="暂无收藏" desc="点击卡片右下角的星星图标，将有价值的 AI 洞察保存到这里。" />;
        }

        // 根据 Tab 筛选
        const filteredBookmarks = bookmarkTab === 'all' 
          ? bookmarkedItems 
          : bookmarkedItems.filter((item) => item.type === bookmarkTab);

        const bookmarkTabs = [
          { id: 'all' as const, label: '全部', count: bookmarkedItems.length },
          { id: 'news' as const, label: '今日热点', icon: Newspaper, count: bookmarkedItems.filter(i => i.type === 'news' || !i.type).length },
          { id: 'tool' as const, label: '工具推荐', icon: Wrench, count: bookmarkedItems.filter(i => i.type === 'tool').length },
          { id: 'case' as const, label: '实战案例', icon: Lightbulb, count: bookmarkedItems.filter(i => i.type === 'case').length },
        ];

        return (
          <div className="space-y-6 pb-20">
            {/* 分类 Tab */}
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
              {bookmarkTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = bookmarkTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setBookmarkTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {Icon && <Icon size={14} />}
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-blue-500/30' : 'bg-white/10'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 收藏列表 */}
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <p>该分类下暂无收藏</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredBookmarks.map((item) => (
                  item.type === 'tool' || item.type === 'case' ? (
                    // 工具/案例卡片
                    <div
                      key={item.id}
                      className={`bg-white/5 border border-white/10 rounded-xl p-5 hover:border-${item.type === 'tool' ? 'green' : 'purple'}-500/30 transition-all group`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {item.type === 'tool' ? (
                            <Wrench size={16} className="text-green-400" />
                          ) : (
                            <Lightbulb size={16} className="text-purple-400" />
                          )}
                          <span className={`text-xs font-medium ${item.type === 'tool' ? 'text-green-400' : 'text-purple-400'}`}>
                            {item.source_name || (item.type === 'tool' ? '工具' : '案例')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => bookmarkItem(item)}
                            className="p-1.5 rounded-lg text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30 transition-all"
                            title="取消收藏"
                          >
                            <Star size={14} fill="currentColor" />
                          </button>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-lg text-neutral-500 hover:text-${item.type === 'tool' ? 'green' : 'purple'}-400 transition-all`}>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                      <h3 className="font-bold text-white mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-neutral-400 line-clamp-2">{item.summary}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className={`px-2 py-0.5 rounded text-[10px] ${item.type === 'tool' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // 新闻卡片
                    <div key={item.id} className="md:col-span-2">
                      <InsightCard
                        item={item}
                        isBookmarked={bookmarks.has(item.id)}
                        userProfession={userSettings.profession}
                        onToggleBookmark={toggleBookmark}
                        onDelete={deleteItem}
                      />
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        );
      case ViewState.ADMIN:
        return <AdminPage />;
      case ViewState.SHARE:
        return <SharePage onNavigate={setCurrentView} />;
      default:
        return null;
    }
  };

  // Special case for Landing Page to be full screen without standard header wrapper (though LandingPage now handles its own layout, we might want to keep Header for consistency if user navigates FROM landing to others, but typically Landing is standalone.
  // HOWEVER, the new LandingPage design was full screen scroll snap.
  // Let's render LandingPage separately to avoid double headers if Landing has one, or to allow Landing to be immersive.
  // 分享页面独立渲染（无 Header）
  if (currentView === ViewState.SHARE) {
    return <SharePage onNavigate={setCurrentView} />;
  }

  if (currentView === ViewState.LANDING) {
    return (
        <>
            <Header currentView={currentView} onNavigate={setCurrentView} user={user} />
            <LandingPage onEnterApp={() => setCurrentView(ViewState.HOME)} onNavigate={setCurrentView} />
            <ChatBot />
        </>
    );
  }

  return (
    <div className="min-h-screen text-neutral-200 selection:bg-blue-500/30 selection:text-blue-100 flex flex-col">
      {/* 公告横幅 */}
      <AnnouncementBanner onNavigate={setCurrentView} />
      
      <Header currentView={currentView} onNavigate={setCurrentView} user={user} />
      
      <main className="flex-1 px-4 w-full max-w-7xl mx-auto z-10">
        {/* We use a key to force re-animation when switching views */}
        <div key={currentView} className="animate-slide-up w-full">
            {renderContent()}
        </div>
      </main>


      {/* AI 聊天机器人 */}
      <ChatBot />
    </div>
  );
};

export default App;