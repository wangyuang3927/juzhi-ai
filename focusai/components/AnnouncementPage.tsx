import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Gift, Wrench, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'feature' | 'event' | 'maintenance';
  link?: string;
  link_text?: string;
  pinned: boolean;
  created_at: string;
}

const typeConfig = {
  info: { icon: Bell, color: 'blue', label: '公告' },
  feature: { icon: Sparkles, color: 'purple', label: '新功能' },
  event: { icon: Gift, color: 'amber', label: '活动' },
  maintenance: { icon: Wrench, color: 'orange', label: '维护' },
};

const AnnouncementPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/announcements`);
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      } catch (error) {
        console.error('Failed to load announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-10 px-4">
        <div className="text-center py-20">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pt-10 px-4 animate-fade-in">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
          <Bell size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">产品动态</h1>
        <p className="text-neutral-400">了解 聚智 AI 的最新功能、活动和公告</p>
      </div>

      {/* 公告列表 */}
      {announcements.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <Bell size={48} className="mx-auto mb-4 text-neutral-600" />
          <p className="text-neutral-500">暂无公告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const config = typeConfig[item.type] || typeConfig.info;
            const Icon = config.icon;
            
            return (
              <div
                key={item.id}
                className={`
                  relative bg-[#0b0c15]/80 backdrop-blur-md border rounded-2xl p-6 
                  transition-all hover:border-${config.color}-500/30
                  ${item.pinned 
                    ? `border-${config.color}-500/30 shadow-lg shadow-${config.color}-500/5` 
                    : 'border-white/10'}
                `}
              >
                {/* 置顶标签 */}
                {item.pinned && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full shadow">
                    置顶
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div 
                    className={`
                      flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                      ${config.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                      ${config.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : ''}
                      ${config.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : ''}
                      ${config.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : ''}
                    `}
                  >
                    <Icon size={24} />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className={`
                          px-2 py-0.5 text-[10px] font-bold rounded uppercase
                          ${config.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                          ${config.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : ''}
                          ${config.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : ''}
                          ${config.color === 'orange' ? 'bg-orange-500/20 text-orange-400' : ''}
                        `}
                      >
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Calendar size={12} />
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>

                    {/* 链接 */}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          inline-flex items-center gap-1 mt-4 text-sm font-medium
                          ${config.color === 'blue' ? 'text-blue-400 hover:text-blue-300' : ''}
                          ${config.color === 'purple' ? 'text-purple-400 hover:text-purple-300' : ''}
                          ${config.color === 'amber' ? 'text-amber-400 hover:text-amber-300' : ''}
                          ${config.color === 'orange' ? 'text-orange-400 hover:text-orange-300' : ''}
                          transition-colors
                        `}
                      >
                        {item.link_text || '了解更多'}
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementPage;
