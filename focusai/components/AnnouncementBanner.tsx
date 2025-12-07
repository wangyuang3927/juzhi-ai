import React, { useState, useEffect } from 'react';
import { X, Bell, Sparkles, Gift, Wrench, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';
import { API_BASE_URL } from '../lib/config';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'feature' | 'event' | 'maintenance';
  link?: string;
  link_text?: string;
}

interface AnnouncementBannerProps {
  onNavigate?: (view: ViewState) => void;
}

const typeConfig = {
  info: { icon: Bell, gradient: 'from-blue-600 to-indigo-600' },
  feature: { icon: Sparkles, gradient: 'from-purple-600 to-pink-600' },
  event: { icon: Gift, gradient: 'from-amber-500 to-orange-500' },
  maintenance: { icon: Wrench, gradient: 'from-orange-500 to-red-500' },
};

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const loadLatest = async () => {
      // 检查是否已关闭过这条公告
      const dismissedId = localStorage.getItem('dismissed_announcement_id');
      
      try {
        const res = await fetch(`${API_BASE_URL}/api/announcements/latest`);
        const data = await res.json();
        
        if (data.announcement) {
          // 如果是已关闭过的公告，不再显示
          if (dismissedId === String(data.announcement.id)) {
            return;
          }
          setAnnouncement(data.announcement);
        }
      } catch (error) {
        console.error('Failed to load announcement:', error);
      }
    };

    loadLatest();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('dismissed_announcement_id', String(announcement.id));
    }
    setDismissed(true);
  };

  const handleClick = () => {
    if (announcement?.link) {
      window.open(announcement.link, '_blank');
    } else if (onNavigate) {
      onNavigate(ViewState.ANNOUNCEMENTS);
    }
  };

  if (!announcement || dismissed) {
    return null;
  }

  const config = typeConfig[announcement.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={`relative bg-gradient-to-r ${config.gradient} text-white overflow-hidden`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>

      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧内容 */}
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer group"
            onClick={handleClick}
          >
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <span className="font-bold">{announcement.title}</span>
                <span className="mx-2 opacity-50">|</span>
                <span className="opacity-90">{announcement.content.slice(0, 50)}{announcement.content.length > 50 ? '...' : ''}</span>
              </p>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-all group-hover:gap-2">
              {announcement.link_text || '查看详情'}
              <ArrowRight size={14} />
            </button>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
