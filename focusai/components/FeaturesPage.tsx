import React from 'react';
import { Cpu, Globe, Shield, Zap, Layers, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'AI 语义提炼引擎',
    desc: '基于 Gemini 2.5 的深度语义分析，不只是总结摘要，更是提炼核心逻辑与商业价值。',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    icon: Globe,
    title: '全球资讯实时同步',
    desc: '24小时监控 TechCrunch, HackerNews, ProductHunt 等 500+ 全球顶级科技信源。',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10'
  },
  {
    icon: Shield,
    title: '信息噪音过滤',
    desc: '自动识别并过滤营销软文、重复报道和低价值水文，还你清爽的阅读体验。',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    icon: Zap,
    title: '职业专属洞察',
    desc: '根据你的职业身份（如产品经理、设计师），定制化解读同一则新闻的不同影响。',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10'
  },
  {
    icon: Layers,
    title: 'Prompt 逆向工程',
    desc: '看到生成的酷炫 AI 图片或视频？我们直接为你提供背后的 Prompt 参数。',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10'
  },
  {
    icon: Sparkles,
    title: '自动化工作流整合',
    desc: '支持 Webhook 和 API，将高价值情报直接推送到你的 Notion 或 Slack 工作区。',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  }
];

const FeaturesPage: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pt-10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          不仅仅是阅读器，<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            更是你的 AI 外脑
          </span>
        </h2>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          全方位赋能你的信息获取与处理流程，让知识转化为即战力。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {features.map((feature, idx) => (
          <div 
            key={idx}
            className="group relative p-8 rounded-2xl bg-[#0b0c15]/50 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-${feature.color.split('-')[1]}-900/10 pointer-events-none`}></div>
            
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
              <feature.icon size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-neutral-400 leading-relaxed text-sm">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesPage;