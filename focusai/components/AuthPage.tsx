import React, { useState } from 'react';
import { ViewState } from '../types';
import { ArrowRight, Loader2, AlertCircle, CheckCircle, Briefcase, Gift } from 'lucide-react';
import { auth } from '../lib/supabase';
import { API_BASE_URL } from '../lib/config';

interface AuthPageProps {
  type: ViewState.LOGIN | ViewState.REGISTER;
  onNavigate: (view: ViewState) => void;
  onLogin: () => void;
  onUpdateProfession?: (profession: string) => void;
}

// 职业快捷选项
const PROFESSION_SUGGESTIONS = [
  '产品经理', '前端工程师', '后端工程师', '全栈工程师',
  'UI/UX 设计师', '运营', '内容创作者', '线上老师',
  '创业者', '学生', '自由职业者', '其他'
];

const AuthPage: React.FC<AuthPageProps> = ({ type, onNavigate, onLogin, onUpdateProfession }) => {
  const isLogin = type === ViewState.LOGIN;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profession, setProfession] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 获取或创建用户 ID
  const getUserId = () => {
    let userId = localStorage.getItem('focusai_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('focusai_user_id', userId);
    }
    return userId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // 登录
        const { error } = await auth.signIn(email, password);
        if (error) {
          setError(error.message === 'Invalid login credentials' 
            ? '邮箱或密码错误' 
            : error.message);
        } else {
          onLogin();
        }
      } else {
        // 注册 - 验证职业
        if (!profession.trim()) {
          setError('请告诉我们你的职业，以便为你定制 AI 资讯');
          setLoading(false);
          return;
        }
        
        const { error } = await auth.signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          // 保存职业设置
          if (onUpdateProfession) {
            onUpdateProfession(profession.trim());
          }
          
          // 如果有邀请码，使用邀请码
          if (inviteCode.trim()) {
            try {
              const userId = getUserId();
              const res = await fetch(`${API_BASE_URL}/api/invite/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  invite_code: inviteCode.trim().toUpperCase(),
                  new_user_id: userId
                })
              });
              const data = await res.json();
              if (res.ok) {
                setSuccess('注册成功！邀请码已生效，正在进入...');
              } else {
                // 邀请码无效但注册成功
                setSuccess('注册成功！正在进入...');
              }
            } catch (err) {
              // 邀请码验证失败但注册成功
              setSuccess('注册成功！正在进入...');
            }
          } else {
            setSuccess('注册成功！正在进入...');
          }
          
          // 注册成功后直接进入应用
          setTimeout(() => {
            onLogin();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || '发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto pt-12 animate-slide-up">
      <div className="bg-[#0b0c15]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? '欢迎回来' : '开启 AI 进化之旅'}
          </h2>
          <p className="text-neutral-400 text-sm">
            {isLogin ? '登录以继续你的探索' : '创建一个新账户，免费开始'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 ml-1">邮箱</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 ml-1">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少 6 位字符"
              className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
            />
          </div>

          {/* 职业字段 - 仅注册时显示 */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 ml-1 flex items-center gap-1">
                <Briefcase size={12} />
                你的职业
              </label>
              <input 
                type="text" 
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="例如：产品经理、前端工程师..."
                className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {PROFESSION_SUGGESTIONS.slice(0, 6).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProfession(p)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      profession === p 
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                我们将根据你的职业推送定制化 AI 资讯
              </p>
            </div>
          )}

          {/* 邀请码 - 仅注册时显示 */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 ml-1 flex items-center gap-1">
                <Gift size={12} />
                邀请码（选填）
              </label>
              <input 
                type="text" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="输入好友的邀请码"
                maxLength={6}
                className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-3 text-white font-mono tracking-widest uppercase focus:ring-2 focus:ring-amber-500/50 outline-none transition-all" 
              />
              <p className="text-xs text-neutral-500 mt-1">
                填写邀请码，让邀请你的好友获得专业版体验奖励
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? '登录' : '注册'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-400">
          {isLogin ? '还没有账号? ' : '已有账号? '}
          <button 
            onClick={() => onNavigate(isLogin ? ViewState.REGISTER : ViewState.LOGIN)}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {isLogin ? '立即注册' : '直接登录'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;