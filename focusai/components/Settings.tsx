import React, { useState, useEffect } from 'react';
import { User, Save, Briefcase, CheckCircle2, Gift, Copy, Check, Crown, Users } from 'lucide-react';
import { UserSettings } from '../types';
import { API_BASE_URL } from '../lib/config';

// 预设职业建议
const SUGGESTED_PROFESSIONS = [
  '产品经理', '前端工程师', '后端工程师', '全栈工程师',
  'UI/UX 设计师', '数据分析师', '线上老师', '内容创作者',
  '运营', '市场营销', '创业者', '学生'
];

interface SettingsProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [customProfession, setCustomProfession] = useState<string>(settings.profession);
  const [isSaved, setIsSaved] = useState(false);
  
  // 邀请码相关状态
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteStatus, setInviteStatus] = useState<any>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // 获取用户 ID（从 localStorage）
  const getUserId = () => {
    let userId = localStorage.getItem('focusai_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('focusai_user_id', userId);
    }
    return userId;
  };

  // 加载邀请码信息
  useEffect(() => {
    const loadInviteInfo = async () => {
      const userId = getUserId();
      try {
        // 获取邀请码
        const codeRes = await fetch(`${API_BASE_URL}/api/invite/code/${userId}`);
        const codeData = await codeRes.json();
        setInviteCode(codeData.code || '');

        // 获取邀请状态
        const statusRes = await fetch(`${API_BASE_URL}/api/invite/status/${userId}`);
        const statusData = await statusRes.json();
        setInviteStatus(statusData);
      } catch (error) {
        console.error('Failed to load invite info:', error);
      }
    };

    loadInviteInfo();
  }, []);

  // 复制邀请码
  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSave = () => {
    if (!customProfession.trim()) {
      return; // 不允许空职业
    }
    onSave({ profession: customProfession.trim() as any });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSuggestionClick = (profession: string) => {
    setCustomProfession(profession);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-4 animate-slide-up">
      <div className="bg-[#0b0c15]/80 backdrop-blur-md rounded-2xl border border-white/5 p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">个人偏好设置</h2>
            <p className="text-neutral-400 text-sm mt-1">定制你的 AI 情报流</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-medium">
              <Briefcase size={18} className="text-blue-400" />
              <label htmlFor="profession">你的职业角色</label>
            </div>
            
            <p className="text-sm text-neutral-400 leading-relaxed">
              FocusAI 会根据你的职业身份，重新解读每条 AI 新闻，为你提取最核心的价值和潜在影响。
            </p>

            {/* 自定义输入框 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
              <input
                id="profession"
                type="text"
                value={customProfession}
                onChange={(e) => setCustomProfession(e.target.value)}
                placeholder="输入你的职业，如：线上英语老师"
                className="relative w-full bg-[#050508] border border-white/10 text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-4 transition-all outline-none hover:bg-white/5"
              />
            </div>

            {/* 快速选择建议 */}
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">快速选择：</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROFESSIONS.map((prof) => (
                  <button
                    key={prof}
                    onClick={() => handleSuggestionClick(prof)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                      customProfession === prof
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {prof}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`
                w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base transition-all duration-300
                ${isSaved 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default' 
                  : 'bg-white text-black hover:bg-blue-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.01]'}
              `}
            >
              {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
              {isSaved ? '设置已更新' : '保存更改'}
            </button>
          </div>
        </div>
      </div>

      {/* 邀请好友卡片 */}
      <div className="bg-[#0b0c15]/80 backdrop-blur-md rounded-2xl border border-white/5 p-8 shadow-2xl mt-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Gift size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">邀请好友</h2>
            <p className="text-neutral-400 text-sm mt-1">每邀请 1 位好友，获得 7 天专业版体验</p>
          </div>
        </div>

        {/* 专业版状态 */}
        {inviteStatus?.is_premium && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
              <Crown size={18} />
              专业版用户
            </div>
            <p className="text-sm text-neutral-300">
              剩余 <span className="text-amber-400 font-bold">{inviteStatus.remaining_days}</span> 天
              {inviteStatus.premium_expires && (
                <span className="text-neutral-500 ml-2">
                  （到期时间：{new Date(inviteStatus.premium_expires).toLocaleDateString('zh-CN')}）
                </span>
              )}
            </p>
          </div>
        )}

        {/* 邀请码 */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-neutral-400 mb-2">你的专属邀请码</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#050508] border border-white/10 rounded-xl px-4 py-3 font-mono text-xl text-white tracking-widest">
                {inviteCode || '加载中...'}
              </div>
              <button
                onClick={copyInviteCode}
                disabled={!inviteCode}
                className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                {codeCopied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* 邀请统计 */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                <Users size={16} />
              </div>
              <p className="text-2xl font-bold text-white">{inviteStatus?.invited_count || 0}</p>
              <p className="text-xs text-neutral-500">已邀请</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Gift size={16} />
              </div>
              <p className="text-2xl font-bold text-white">{inviteStatus?.total_reward_days || 0}</p>
              <p className="text-xs text-neutral-500">已获得天数</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                <Crown size={16} />
              </div>
              <p className="text-2xl font-bold text-white">{inviteStatus?.max_reward_days || 365}</p>
              <p className="text-xs text-neutral-500">最多可得</p>
            </div>
          </div>

          <p className="text-xs text-neutral-500 text-center pt-2">
            分享邀请码给好友，好友注册后你将自动获得奖励
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;