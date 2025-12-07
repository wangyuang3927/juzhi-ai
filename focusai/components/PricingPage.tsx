import React, { useState } from 'react';
import { Check, X, QrCode, MessageCircle, Mail } from 'lucide-react';
import { ViewState } from '../types';
import type { User } from '@supabase/supabase-js';

interface PricingPageProps {
  onNavigate?: (view: ViewState) => void;
  user?: User | null;
}

const plans = [
  {
    name: '基础版',
    price: '免费',
    period: '',
    desc: '适合刚开始探索 AI 的个人用户',
    features: [
      '每日精选 10 条今日 AI 简报',
      '每日 5 条专属工具推荐',
      '每日 5 条行业实战案例'
    ],
    cta: '免费开始',
    primary: false,
  },
  {
    name: '专业版',
    price: '4.9',
    period: '/ 月',
    desc: '为追求效率的职场精英打造',
    features: [
      '无限量今日 AI 简报',
      '无限量专属工具推荐',
      '无限量行业实战案例',
      '微信服务号推送每日简报（开发中）'
    ],
    cta: '升级专业版',
    primary: true,
  },
  {
    name: '团队/企业版',
    price: '定制',
    period: '',
    desc: '寻求合作、解决方案咨询',
    features: [
      '包含所有专业版功能',
      '定制化 AI 资讯服务',
      '专属客户经理',
      '企业级解决方案'
    ],
    cta: '联系我们',
    primary: false,
  }
];

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, user }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 处理按钮点击
  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.cta === '联系我们') {
      // 团队版 - 跳转联系页面
      onNavigate?.(ViewState.CONTACT);
    } else if (plan.cta === '免费开始') {
      // 基础版 - 跳转注册
      if (!user) {
        onNavigate?.(ViewState.REGISTER);
      } else {
        onNavigate?.(ViewState.HOME);
      }
    } else if (plan.cta === '升级专业版') {
      // 专业版 - 检查登录状态
      if (!user) {
        // 未登录，跳转注册
        onNavigate?.(ViewState.REGISTER);
      } else {
        // 已登录，显示付款弹窗
        setShowPaymentModal(true);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pt-10 px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          投资你的未来
        </h2>
        <p className="text-lg text-neutral-400">
          选择最适合你的成长计划，随时取消。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {plans.map((plan, idx) => (
          <div 
            key={idx}
            className={`
              relative p-8 rounded-3xl backdrop-blur-md border transition-all duration-300
              ${plan.primary 
                ? 'bg-[#0F0F16]/80 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.15)] scale-105 z-10' 
                : 'bg-[#0b0c15]/40 border-white/5 hover:border-white/10 hover:bg-[#0b0c15]/60'}
            `}
          >
            {plan.primary && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
            )}

            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-sm text-neutral-400 mb-6 min-h-[40px]">{plan.desc}</p>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {plan.price === '免费' || plan.price === '定制' ? plan.price : `¥${plan.price}`}
                </span>
                <span className="text-neutral-500">{plan.period}</span>
              </div>
              {plan.primary && (
                <span className="inline-block mt-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                  🎉 产品推广优惠价
                </span>
              )}
            </div>

            <button 
              onClick={() => handlePlanClick(plan)}
              className={`
                w-full py-3 rounded-xl font-bold text-sm mb-8 transition-all
                ${plan.primary 
                  ? 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                  : 'bg-white/10 text-white hover:bg-white/20'}
              `}
            >
              {plan.cta}
            </button>

            <ul className="space-y-4">
              {plan.features.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start gap-3 text-sm text-neutral-300">
                  <Check size={16} className={`mt-0.5 ${plan.primary ? 'text-blue-400' : 'text-neutral-500'}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 付款弹窗 */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-[#0b0c15] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>

            {/* 标题 */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">升级专业版</h3>
              <p className="text-neutral-400 text-sm">
                ¥4.9/月 · 解锁全部功能
              </p>
            </div>

            {/* 付款方式 */}
            <div className="space-y-4">
              {/* 支付宝收款码 */}
              <div className="p-6 bg-[#1677FF]/5 border border-[#1677FF]/20 rounded-xl text-center">
                <div className="w-40 h-40 bg-white rounded-xl mx-auto mb-4 p-2 overflow-hidden">
                  {/* 支付宝二维码图片 - 请替换为您的收款码 */}
                  <img 
                    src="/alipay-qrcode.png" 
                    alt="支付宝收款码"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // 图片加载失败时显示占位符
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                    请添加收款码图片
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-[#1677FF] font-medium">
                  <svg className="w-5 h-5" viewBox="0 0 1024 1024" fill="currentColor">
                    <path d="M1024 629.76c0-40.96-14.08-78.08-40.96-107.52L629.76 168.96c-29.44-29.44-66.56-43.52-107.52-43.52H117.76C52.48 125.44 0 177.92 0 243.2v537.6c0 65.28 52.48 117.76 117.76 117.76h404.48c40.96 0 78.08-14.08 107.52-40.96l353.28-353.28c26.88-29.44 40.96-66.56 40.96-107.52v232.96z"/>
                  </svg>
                  <span>支付宝扫码支付</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  扫码支付 ¥4.9，备注您的邮箱
                </p>
              </div>

              {/* 付款说明 */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm font-medium mb-2">
                  📝 付款说明
                </p>
                <ol className="text-neutral-300 text-sm space-y-1 list-decimal list-inside">
                  <li>扫码支付 ¥4.9</li>
                  <li>备注填写您的注册邮箱</li>
                  <li>支付后 24 小时内开通</li>
                </ol>
              </div>

              {/* 联系客服 */}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  onNavigate?.(ViewState.CONTACT);
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                支付遇到问题？联系我们
              </button>
            </div>

            {/* 底部说明 */}
            <p className="text-[10px] text-neutral-600 text-center mt-6">
              付款后请提供您的注册邮箱：{user?.email}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;