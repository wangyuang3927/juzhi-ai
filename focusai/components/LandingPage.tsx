import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Zap, Target, Brain, ChevronDown } from 'lucide-react';
import { ViewState } from '../types';

interface LandingPageProps {
  onEnterApp: () => void;
  onNavigate?: (view: ViewState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Particle System Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 60; // Number of floating nodes
    
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 150, 255, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="snap-container text-white relative bg-[#030014]">
      {/* Dynamic Background */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 pointer-events-none opacity-60"
      />
      
      {/* Global Gradient Overlays */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#030014]/50 to-[#030014] pointer-events-none"></div>

      {/* --- Screen 1: The Hook --- */}
      <section className="snap-section z-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
           {/* Big Glow Orb */}
           <div className="w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.4] md:leading-[1.5] animate-slide-up">
            <span className="text-white block mb-2 md:mb-4">网罗全球 AI 动态</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-glow block mb-2 md:mb-4">
              定制特定行业 AI 资讯
            </span>
            <span className="text-white block">揭秘同行 AI 实战用法</span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-slide-up" style={{ animationDelay: '0.2s' }}>
            告别海量资讯的焦虑，获取精准的 AI 情报。
          </p>

          <button 
            onClick={() => onNavigate?.(ViewState.REGISTER)}
            className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden transition-transform hover:scale-105 animate-slide-up shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            style={{ animationDelay: '0.4s' }}
          >
            <span className="relative z-10 flex items-center gap-2">
              开始免费使用 <ArrowRight size={20} />
            </span>
            <div className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shine"></div>
          </button>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-neutral-500">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* --- Screen 2: Value Proposition --- */}
      <section className="snap-section z-10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          {/* Vertical Line Decoration */}
          <div className="absolute -top-40 left-1/2 w-px h-32 bg-gradient-to-b from-transparent to-indigo-500/50"></div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-12 text-white">
            我们不做新闻的搬运工。
          </h2>

          <div className="relative p-10 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-2xl blur opacity-30"></div>
            <p className="relative text-lg md:text-2xl leading-relaxed font-serif text-neutral-200">
              我们是你专属的 <span className="text-amber-400 font-bold">“AI 资讯炼金师”</span>。<br /><br />
              从泥沙俱下的信息洪流中，<br />
              为你提炼出纯金的职业洞察与生产力工具。<br />
            </p>
            <div className="mt-8 text-sm text-neutral-500 font-mono tracking-widest uppercase">
              —— 让每一则新闻，都成为你向上攀登的阶梯。
            </div>
          </div>
        </div>
      </section>

      {/* --- Screen 3: Features --- */}
      <section className="snap-section z-10">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
            你的专属 AI 情报简报
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature Card 1 */}
            <div className="group p-8 rounded-2xl bg-[#0F0F16] border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
               <Target className="w-10 h-10 text-blue-400 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">精准定向</h3>
               <p className="text-neutral-400">只给你看，与你职业相关的AI前沿。告别无关噪音。</p>
            </div>

            {/* Feature Card 2 */}
            <div className="group p-8 rounded-2xl bg-[#0F0F16] border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
               <Brain className="w-10 h-10 text-purple-400 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">深度洞见</h3>
               <p className="text-neutral-400">不止于“发生了什么”，更深度解析“这对你意味着什么”。</p>
            </div>

            {/* Feature Card 3 */}
            <div className="group p-8 rounded-2xl bg-[#0F0F16] border border-white/10 hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
               <Zap className="w-10 h-10 text-emerald-400 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">即战力转化</h3>
               <p className="text-neutral-400">附赠可立即上手的Prompt、指令与工具，一键复制，立即使用。</p>
            </div>

            {/* Feature Card 4 */}
            <div className="group p-8 rounded-2xl bg-[#0F0F16] border border-white/10 hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
               <Sparkles className="w-10 h-10 text-amber-400 mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">越用越懂你</h3>
               <p className="text-neutral-400">每一次“收藏”或“忽略”，都在训练更懂你的私人职业助理。</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- Screen 4: CTA --- */}
      <section className="snap-section z-10 relative overflow-hidden">
         {/* Background Horizon Effect */}
         <div className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-blue-900/20 to-transparent"></div>
         <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_30px_rgba(59,130,246,0.8)]"></div>

         <div className="text-center relative z-20 px-6">
            <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">
              READY?
            </h2>
            <p className="text-2xl text-blue-200 mb-12 font-light">
              开启你的 AI 进化之路
            </p>
            
            <button 
              onClick={() => onNavigate?.(ViewState.REGISTER)}
              className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xl shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_80px_rgba(37,99,235,0.7)]"
            >
              免费开始使用
            </button>
         </div>
      </section>

    </div>
  );
};

export default LandingPage;