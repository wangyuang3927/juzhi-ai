import React from 'react';
import { LayoutGrid, Bookmark, Settings, Sparkles, Menu, X, LogOut, User, Compass } from 'lucide-react';
import { ViewState } from '../types';
import { auth } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user?: SupabaseUser | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, user }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    // 清除之前的定时器
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    // 连续点击 7 次进入管理页面
    if (newCount >= 7) {
      setClickCount(0);
      onNavigate(ViewState.ADMIN);
      return;
    }
    
    // 2秒内没有继续点击则重置计数
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
      onNavigate(ViewState.LANDING);
    }, 2000);
  };

  const handleLogout = async () => {
    await auth.signOut();
    onNavigate(ViewState.LANDING);
  };

  // Define which views are considered "App Dashboard" views
  const isAppView = [ViewState.HOME, ViewState.BOOKMARKS, ViewState.SETTINGS].includes(currentView);

  // 应用内导航项
  const appNavItems = [
    { id: ViewState.HOME, label: '探索', icon: Compass },
    { id: ViewState.BOOKMARKS, label: '收藏', icon: Bookmark },
    { id: ViewState.SETTINGS, label: '设置', icon: Settings },
  ];

  return (
    <>
      {/* 1. Global Marketing Navigation (Fixed Top) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030014]/80 backdrop-blur-md border-b border-white/5 h-16 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
          
          {/* Logo Area - 连续点击7次进入管理后台 */}
          <div 
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0" 
            onClick={handleLogoClick}
          >
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden group-hover:scale-110 transition-transform bg-[#0a0a12]">
              {/* 彩色光线 - 从边缘向中心汇聚（渐变从边缘亮到中心透明） */}
              
              {/* 12点方向 - 正上 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-gradient-to-b from-cyan-400 to-transparent"></div>
              {/* 1点方向 */}
              <div className="absolute top-[3px] right-[8px] w-[1.5px] h-[45%] bg-gradient-to-b from-blue-400 to-transparent origin-bottom -rotate-[30deg]"></div>
              {/* 2点方向 */}
              <div className="absolute top-[8px] right-[3px] w-[1.5px] h-[45%] bg-gradient-to-b from-indigo-400 to-transparent origin-bottom -rotate-[60deg]"></div>
              
              {/* 3点方向 - 正右 */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[2px] bg-gradient-to-l from-purple-500 to-transparent"></div>
              {/* 4点方向 */}
              <div className="absolute bottom-[8px] right-[3px] w-[1.5px] h-[45%] bg-gradient-to-t from-violet-400 to-transparent origin-top rotate-[60deg]"></div>
              {/* 5点方向 */}
              <div className="absolute bottom-[3px] right-[8px] w-[1.5px] h-[45%] bg-gradient-to-t from-fuchsia-400 to-transparent origin-top rotate-[30deg]"></div>
              
              {/* 6点方向 - 正下 */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-gradient-to-t from-pink-400 to-transparent"></div>
              {/* 7点方向 */}
              <div className="absolute bottom-[3px] left-[8px] w-[1.5px] h-[45%] bg-gradient-to-t from-red-400 to-transparent origin-top -rotate-[30deg]"></div>
              {/* 8点方向 */}
              <div className="absolute bottom-[8px] left-[3px] w-[1.5px] h-[45%] bg-gradient-to-t from-orange-400 to-transparent origin-top -rotate-[60deg]"></div>
              
              {/* 9点方向 - 正左 */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-[2px] bg-gradient-to-r from-amber-400 to-transparent"></div>
              {/* 10点方向 */}
              <div className="absolute top-[8px] left-[3px] w-[1.5px] h-[45%] bg-gradient-to-b from-yellow-400 to-transparent origin-bottom rotate-[60deg]"></div>
              {/* 11点方向 */}
              <div className="absolute top-[3px] left-[8px] w-[1.5px] h-[45%] bg-gradient-to-b from-lime-400 to-transparent origin-bottom rotate-[30deg]"></div>
              
              {/* 中心光点 */}
              <div className="relative w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,1),0_0_12px_rgba(147,51,234,0.8),0_0_20px_rgba(59,130,246,0.5)]"></div>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">聚智 AI</span>
          </div>

          {/* Desktop Nav Links - 根据视图显示不同导航 */}
          <div className="hidden md:flex items-center justify-center gap-1 text-sm font-medium flex-1">
            {isAppView ? (
              // App 内导航 - 探索/收藏/设置
              <>
                {appNavItems.map((item) => {
                  const isActive = currentView === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                        ${isActive 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </>
            ) : (
              // 营销页导航 - 首页/功能/价格/联系我们
              <div className="flex items-center gap-6 text-neutral-400">
                <button 
                  onClick={() => onNavigate(ViewState.LANDING)}
                  className={`hover:text-white transition-colors ${currentView === ViewState.LANDING ? 'text-white' : ''}`}
                >
                  首页
                </button>
                <button 
                  onClick={() => onNavigate(ViewState.ANNOUNCEMENTS)}
                  className={`hover:text-white transition-colors ${currentView === ViewState.ANNOUNCEMENTS ? 'text-white' : ''}`}
                >
                  动态
                </button>
                <button 
                  onClick={() => onNavigate(ViewState.PRICING)}
                  className={`hover:text-white transition-colors ${currentView === ViewState.PRICING ? 'text-white' : ''}`}
                >
                  价格
                </button>
                <button 
                  onClick={() => onNavigate(ViewState.CONTACT)}
                  className={`hover:text-white transition-colors ${currentView === ViewState.CONTACT ? 'text-white' : ''}`}
                >
                  联系我们
                </button>
                <button 
                  onClick={() => onNavigate(ViewState.HOME)}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                >
                  探索
                </button>
              </div>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <User size={16} />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-neutral-300 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <LogOut size={14} />
                  登出
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate(ViewState.LOGIN)}
                  className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  登录
                </button>
                <button 
                  onClick={() => onNavigate(ViewState.REGISTER)}
                  className="text-sm font-bold bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                  免费注册
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-neutral-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-[#030014] border-b border-white/10 p-4 md:hidden flex flex-col gap-2 animate-fade-in">
            {isAppView ? (
              // App 内导航
              <>
                {appNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {onNavigate(item.id); setMobileMenuOpen(false)}}
                      className={`flex items-center gap-3 p-3 rounded-lg ${currentView === item.id ? 'bg-blue-500/20 text-blue-400' : 'text-neutral-300'}`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </>
            ) : (
              // 营销页导航
              <>
                <button onClick={() => {onNavigate(ViewState.LANDING); setMobileMenuOpen(false)}} className="text-left text-neutral-300 p-3">首页</button>
                <button onClick={() => {onNavigate(ViewState.FEATURES); setMobileMenuOpen(false)}} className="text-left text-neutral-300 p-3">功能</button>
                <button onClick={() => {onNavigate(ViewState.PRICING); setMobileMenuOpen(false)}} className="text-left text-neutral-300 p-3">价格</button>
                <button onClick={() => {onNavigate(ViewState.LOGIN); setMobileMenuOpen(false)}} className="text-left text-neutral-300 p-3">登录</button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>
    </>
  );
};

export default Header;