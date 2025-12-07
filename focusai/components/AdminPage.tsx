import React, { useState, useEffect } from 'react';
import { 
  Users, MessageCircle, UserCheck, TrendingUp, 
  Eye, Trash2, Lock, Unlock, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Mail, BarChart3, MousePointer, 
  FileText, Clock, CheckCircle, Bell, Plus, Edit, Pin
} from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

type AdminTab = 'overview' | 'users' | 'messages' | 'analytics' | 'announcements';

interface Stats {
  total_users: number;
  total_messages: number;
  users_with_profile: number;
  avg_messages_per_user: number;
}

interface UserOverview {
  user_id: string;
  profession: string;
  interests: string[];
  message_count: number;
  last_active: string | null;
}

interface UserDetail {
  user_id: string;
  profile: {
    profession?: string;
    interests?: string[];
    pain_points?: string[];
    goals?: string[];
    skill_level?: string;
    updated_at?: string;
  };
  messages: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  message_count: number;
}

const AdminPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  // 新增状态
  const [messages, setMessages] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', content: '', type: 'info', link: '', link_text: '', pinned: false
  });

  // 登录验证
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats?password=${password}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setIsAuthenticated(true);
        loadUsers();
        loadMessages();
        loadAnnouncements();
        loadAnalytics();
      } else {
        setError('密码错误');
      }
    } catch (err) {
      setError('连接失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users?password=${password}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // 加载联系留言
  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact?password=${password}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // 加载统计数据
  const loadAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/stats?password=${password}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  // 加载公告
  const loadAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements?active_only=false`);
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  // 创建或更新公告
  const saveAnnouncement = async () => {
    try {
      const url = editingAnnouncement 
        ? `${API_BASE_URL}/api/announcements/${editingAnnouncement.id}?password=${password}`
        : `${API_BASE_URL}/api/announcements?password=${password}`;
      
      await fetch(url, {
        method: editingAnnouncement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      });
      
      loadAnnouncements();
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '', type: 'info', link: '', link_text: '', pinned: false });
    } catch (err) {
      console.error('Failed to save announcement:', err);
    }
  };

  // 切换公告状态
  const toggleAnnouncement = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/announcements/${id}/toggle?password=${password}`, { method: 'PUT' });
      loadAnnouncements();
    } catch (err) {
      console.error('Failed to toggle announcement:', err);
    }
  };

  // 删除公告
  const deleteAnnouncement = async (id: number) => {
    if (!confirm('确定删除这条公告吗？')) return;
    try {
      await fetch(`${API_BASE_URL}/api/announcements/${id}?password=${password}`, { method: 'DELETE' });
      loadAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  // 编辑公告
  const editAnnouncement = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      link: announcement.link || '',
      link_text: announcement.link_text || '',
      pinned: announcement.pinned
    });
    setShowAnnouncementForm(true);
  };

  // 标记留言已读
  const markMessageRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/contact/${id}/read?password=${password}`, { method: 'PUT' });
      loadMessages();
    } catch (err) {
      console.error('Failed to mark message:', err);
    }
  };

  // 删除留言
  const deleteMessage = async (id: number) => {
    if (!confirm('确定删除这条留言吗？')) return;
    try {
      await fetch(`${API_BASE_URL}/api/contact/${id}?password=${password}`, { method: 'DELETE' });
      loadMessages();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // 加载用户详情
  const loadUserDetail = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setSelectedUser(null);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/user/${userId}?password=${password}`);
      const data = await res.json();
      setSelectedUser(data);
      setExpandedUser(userId);
    } catch (err) {
      console.error('Failed to load user detail:', err);
    }
  };

  // 删除用户数据
  const deleteUser = async (userId: string) => {
    if (!confirm(`确定要删除用户 ${userId} 的所有数据吗？`)) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/admin/user/${userId}?password=${password}`, {
        method: 'DELETE'
      });
      loadUsers();
      setExpandedUser(null);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // 登录界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">管理后台</h2>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <input
            type="password"
            placeholder="输入管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Unlock size={18} />}
            {loading ? '验证中...' : '进入管理后台'}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as AdminTab, label: '概览', icon: BarChart3 },
    { id: 'users' as AdminTab, label: '用户', icon: Users },
    { id: 'messages' as AdminTab, label: '留言', icon: Mail },
    { id: 'announcements' as AdminTab, label: '公告', icon: Bell },
    { id: 'analytics' as AdminTab, label: '行为分析', icon: MousePointer },
  ];

  const unreadMessages = messages.filter(m => !m.read).length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="text-blue-400" />
          管理后台
        </h1>
        
        {/* Tab 导航 */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === 'messages' && unreadMessages > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 概览 Tab */}
      {activeTab === 'overview' && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users size={20} />} label="总用户数" value={stats?.total_users || 0} color="blue" />
            <StatCard icon={<MessageCircle size={20} />} label="总对话数" value={stats?.total_messages || 0} color="purple" />
            <StatCard icon={<Mail size={20} />} label="用户留言" value={messages.length} color="green" />
            <StatCard icon={<MousePointer size={20} />} label="今日事件" value={analytics?.overview?.today_events || 0} color="yellow" />
          </div>

          {/* 行为统计 */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 按钮点击排行 */}
              <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MousePointer size={18} className="text-blue-400" />
                  热门按钮（总点击）
                </h3>
                <div className="space-y-2">
                  {Object.entries(analytics.button_clicks || {}).slice(0, 8).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">{name}</span>
                      <span className="text-white font-mono">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 每日趋势 */}
              <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  每日活跃趋势
                </h3>
                <div className="space-y-2">
                  {(analytics.daily_trend || []).map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400">{day.date}</span>
                      <div className="flex gap-4">
                        <span className="text-blue-400">{day.events} 事件</span>
                        <span className="text-green-400">{day.pageviews} PV</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 最近留言预览 */}
          <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Mail size={18} className="text-purple-400" />
              最新留言
            </h3>
            {messages.slice(0, 3).map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg mb-2 ${msg.read ? 'bg-white/5' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{msg.name}</span>
                  <span className="text-xs text-neutral-500">{new Date(msg.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <p className="text-sm text-neutral-400 line-clamp-1">{msg.message}</p>
              </div>
            ))}
            {messages.length === 0 && <p className="text-neutral-500 text-center py-4">暂无留言</p>}
          </div>
        </>
      )}

      {/* 用户 Tab */}
      {activeTab === 'users' && (
        <div className="bg-[#0b0c15] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-bold text-white">用户列表 ({users.length})</h2>
          </div>
          
          {users.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">暂无用户数据</div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((user) => (
                <div key={user.user_id} className="transition-colors hover:bg-white/[0.02]">
                  <div className="px-6 py-4 flex items-center justify-between cursor-pointer" onClick={() => loadUserDetail(user.user_id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-neutral-400">{user.user_id}</span>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">{user.profession}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                        <span>{user.message_count} 条对话</span>
                        {user.interests.length > 0 && <span>关注: {user.interests.slice(0, 2).join(', ')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); deleteUser(user.user_id); }} className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                      {expandedUser === user.user_id ? <ChevronUp size={18} className="text-neutral-500" /> : <ChevronDown size={18} className="text-neutral-500" />}
                    </div>
                  </div>
                  
                  {expandedUser === user.user_id && selectedUser && (
                    <div className="px-6 pb-6 bg-white/[0.02] border-t border-white/5">
                      {selectedUser.profile && Object.keys(selectedUser.profile).length > 0 && (
                        <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                          <h4 className="text-sm font-bold text-purple-400 mb-3">用户画像</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {selectedUser.profile.profession && <div><span className="text-neutral-500">职业：</span><span className="text-white">{selectedUser.profile.profession}</span></div>}
                            {selectedUser.profile.skill_level && <div><span className="text-neutral-500">技能水平：</span><span className="text-white">{selectedUser.profile.skill_level}</span></div>}
                            {selectedUser.profile.interests && selectedUser.profile.interests.length > 0 && <div className="col-span-2"><span className="text-neutral-500">兴趣：</span><span className="text-white">{selectedUser.profile.interests.join(', ')}</span></div>}
                          </div>
                        </div>
                      )}
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-neutral-400 mb-3">对话记录 ({selectedUser.messages.length} 条)</h4>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                          {selectedUser.messages.map((msg, idx) => (
                            <div key={idx} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500/10 border border-blue-500/20 ml-8' : 'bg-white/5 border border-white/10 mr-8'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-bold ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>{msg.role === 'user' ? '用户' : 'AI'}</span>
                                {msg.timestamp && <span className="text-[10px] text-neutral-600">{new Date(msg.timestamp).toLocaleString('zh-CN')}</span>}
                              </div>
                              <p className="text-neutral-300 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 留言 Tab */}
      {activeTab === 'messages' && (
        <div className="bg-[#0b0c15] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-white">用户留言 ({messages.length})</h2>
            <span className="text-sm text-neutral-500">{unreadMessages} 条未读</span>
          </div>
          
          {messages.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">暂无留言</div>
          ) : (
            <div className="divide-y divide-white/5">
              {messages.map((msg) => (
                <div key={msg.id} className={`p-6 ${!msg.read ? 'bg-blue-500/5' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{msg.name}</span>
                        {!msg.read && <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded">新</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                        <span>{msg.email}</span>
                        {msg.phone && <span>{msg.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">{new Date(msg.created_at).toLocaleString('zh-CN')}</span>
                      {!msg.read && (
                        <button onClick={() => markMessageRead(msg.id)} className="p-2 text-neutral-500 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="标记已读">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => deleteMessage(msg.id)} className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-neutral-300 whitespace-pre-wrap bg-white/5 rounded-lg p-4">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 行为分析 Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* 概览统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<MousePointer size={20} />} label="总事件数" value={analytics.overview?.total_events || 0} color="blue" />
            <StatCard icon={<Users size={20} />} label="独立用户" value={analytics.overview?.total_users || 0} color="purple" />
            <StatCard icon={<Clock size={20} />} label="今日事件" value={analytics.overview?.today_events || 0} color="green" />
            <StatCard icon={<UserCheck size={20} />} label="今日用户" value={analytics.overview?.today_users || 0} color="yellow" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 按钮点击统计 */}
            <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">按钮点击排行</h3>
              <div className="space-y-3">
                {Object.entries(analytics.button_clicks || {}).map(([name, count], idx) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center">{idx + 1}</span>
                    <span className="flex-1 text-neutral-300">{name}</span>
                    <span className="font-mono text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 页面访问统计 */}
            <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">页面访问量</h3>
              <div className="space-y-3">
                {Object.entries(analytics.page_views || {}).map(([page, count], idx) => (
                  <div key={page} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center">{idx + 1}</span>
                    <span className="flex-1 text-neutral-300">{page}</span>
                    <span className="font-mono text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 最近事件 */}
          <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">最近事件</h3>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {(analytics.recent_events || []).map((event: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      event.event_type === 'click' ? 'bg-blue-500/20 text-blue-400' :
                      event.event_type === 'view' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>{event.event_type}</span>
                    <span className="text-neutral-300">{event.event_name}</span>
                    <span className="text-neutral-500 text-xs">{event.page}</span>
                  </div>
                  <span className="text-neutral-500 text-xs">{new Date(event.timestamp).toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 公告管理 Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {/* 新建按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setAnnouncementForm({ title: '', content: '', type: 'info', link: '', link_text: '', pinned: false });
                setShowAnnouncementForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
            >
              <Plus size={18} />
              发布公告
            </button>
          </div>

          {/* 新建/编辑表单 */}
          {showAnnouncementForm && (
            <div className="bg-[#0b0c15] border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">{editingAnnouncement ? '编辑公告' : '发布新公告'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">标题</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    placeholder="公告标题"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">内容</label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white min-h-[100px]"
                    placeholder="公告内容"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">类型</label>
                    <select
                      value={announcementForm.type}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="info">公告</option>
                      <option value="feature">新功能</option>
                      <option value="event">活动</option>
                      <option value="maintenance">维护</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={announcementForm.pinned}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="pinned" className="text-sm text-neutral-400">置顶显示</label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">链接（可选）</label>
                    <input
                      type="text"
                      value={announcementForm.link}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, link: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-1">链接文字</label>
                    <input
                      type="text"
                      value={announcementForm.link_text}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, link_text: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="了解更多"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveAnnouncement}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium"
                  >
                    {editingAnnouncement ? '保存' : '发布'}
                  </button>
                  <button
                    onClick={() => setShowAnnouncementForm(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 公告列表 */}
          <div className="bg-[#0b0c15] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-bold text-white">公告列表 ({announcements.length})</h2>
            </div>
            
            {announcements.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">暂无公告</div>
            ) : (
              <div className="divide-y divide-white/5">
                {announcements.map((item) => (
                  <div key={item.id} className={`p-4 ${!item.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.pinned && <Pin size={14} className="text-amber-400" />}
                          <span className={`px-2 py-0.5 text-[10px] rounded ${
                            item.type === 'feature' ? 'bg-purple-500/20 text-purple-400' :
                            item.type === 'event' ? 'bg-amber-500/20 text-amber-400' :
                            item.type === 'maintenance' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.type === 'feature' ? '新功能' : item.type === 'event' ? '活动' : item.type === 'maintenance' ? '维护' : '公告'}
                          </span>
                          <span className="font-medium text-white">{item.title}</span>
                          {!item.active && <span className="text-xs text-neutral-500">(已禁用)</span>}
                        </div>
                        <p className="text-sm text-neutral-400 line-clamp-2">{item.content}</p>
                        <p className="text-xs text-neutral-600 mt-1">{new Date(item.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => editAnnouncement(item)} className="p-2 text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => toggleAnnouncement(item.id)} className={`p-2 rounded-lg ${item.active ? 'text-green-400 hover:bg-green-500/10' : 'text-neutral-500 hover:bg-white/10'}`}>
                          <Eye size={16} />
                        </button>
                        <button onClick={() => deleteAnnouncement(item.id)} className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 统计卡片组件
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green' | 'yellow';
}> = ({ icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-neutral-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

export default AdminPage;
