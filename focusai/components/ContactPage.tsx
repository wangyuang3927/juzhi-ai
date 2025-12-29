import React, { useState } from 'react';
import { Mail, MapPin, Loader2, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('请填写姓名、邮箱和留言内容');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        alert('提交失败，请稍后重试');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pt-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#0b0c15]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
        
        {/* Left Info Column */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">联系我们</h2>
            <p className="text-neutral-400 leading-relaxed">
              有任何建议或合作意向？欢迎随时联系。我们通常在 24 小时内回复。
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-neutral-300 group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                <Mail size={18} />
              </div>
              <span>505755216@qq.com</span>
            </div>

            <div className="flex items-center gap-4 text-neutral-300 group">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                <MapPin size={18} />
              </div>
              <span>中国 · 郑州</span>
            </div>
          </div>

          {/* WeChat Official Account QR Code */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4 text-white">
              <MessageCircle size={20} className="text-green-400" />
              <span className="font-bold">关注公众号</span>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 w-fit">
              <div className="bg-white p-2 rounded-xl">
                <img 
                  src="/qrcode_for_gh_fdd5427defa4_258.jpg" 
                  alt="微信公众号二维码" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <p className="mt-3 text-xs text-neutral-500 text-center">
                扫码关注“聚智 AI”<br />获取每日精华推送
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">感谢您的留言！</h3>
            <p className="text-neutral-400">我们会尽快回复您。</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              继续留言
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500">姓名 *</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#050508] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                placeholder="请输入您的姓名" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500">邮箱 *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                  placeholder="your@email.com" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500">手机号（选填）</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#050508] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                  placeholder="138xxxxxxxx" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500">留言内容 *</label>
              <textarea 
                rows={4} 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-[#050508] border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" 
                placeholder="请描述您的需求或建议..."
              ></textarea>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  提交中...
                </>
              ) : (
                '发送消息'
              )}
            </button>
            
            <p className="text-xs text-neutral-500 text-center">
              提交即表示您同意我们的隐私政策
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default ContactPage;