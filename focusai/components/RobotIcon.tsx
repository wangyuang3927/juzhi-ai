import React, { useState, useEffect } from 'react';

interface RobotIconProps {
  size?: number;
  isActive?: boolean;
}

type Expression = 'neutral' | 'blink' | 'happy' | 'curious' | 'thinking' | 'surprised' | 'wink';

const RobotIcon: React.FC<RobotIconProps> = ({ size = 48, isActive = false }) => {
  const [expression, setExpression] = useState<Expression>('neutral');
  const [lookDirection, setLookDirection] = useState({ x: 0, y: 0 });

  // 眨眼动画
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (expression === 'neutral' && Math.random() > 0.6) {
        setExpression('blink');
        setTimeout(() => setExpression('neutral'), 120);
      }
    }, 2500);
    return () => clearInterval(blinkInterval);
  }, [expression]);

  // 随机表情变化
  useEffect(() => {
    const expressionInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const expressions: Expression[] = ['curious', 'happy', 'thinking', 'wink', 'surprised'];
        const randomExp = expressions[Math.floor(Math.random() * expressions.length)];
        setExpression(randomExp);
        setTimeout(() => setExpression('neutral'), 2000);
      }
    }, 4000);
    return () => clearInterval(expressionInterval);
  }, []);

  // 眼睛随机看向不同方向
  useEffect(() => {
    const lookInterval = setInterval(() => {
      if (expression === 'neutral' && Math.random() > 0.5) {
        setLookDirection({
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 2,
        });
        setTimeout(() => setLookDirection({ x: 0, y: 0 }), 1500);
      }
    }, 3000);
    return () => clearInterval(lookInterval);
  }, [expression]);

  // 对话时开心表情
  useEffect(() => {
    if (isActive) {
      setExpression('happy');
    }
  }, [isActive]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        style={{ animation: 'float 3s ease-in-out infinite' }}
      >
        <defs>
          {/* 主体渐变 */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          
          {/* 面部渐变 */}
          <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          {/* 发光效果 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* 眼睛发光 */}
          <filter id="eyeGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 外层光晕 */}
        <circle 
          cx="24" cy="24" r="22" 
          fill="none" 
          stroke="url(#bodyGrad)" 
          strokeWidth="1"
          opacity="0.3"
          style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
        />

        {/* 主体圆形 */}
        <circle 
          cx="24" cy="24" r="18" 
          fill="url(#bodyGrad)"
          filter="url(#glow)"
        />

        {/* 面部区域 */}
        <circle 
          cx="24" cy="24" r="14" 
          fill="url(#faceGrad)"
        />

        {/* 眼睛 */}
        <g filter="url(#eyeGlow)" transform={`translate(${lookDirection.x}, ${lookDirection.y})`}>
          {expression === 'blink' && (
            // 眨眼
            <>
              <path d="M14 22 Q17 20 20 22" stroke="#A5B4FC" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M28 22 Q31 20 34 22" stroke="#A5B4FC" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          )}
          {expression === 'happy' && (
            // 开心眯眼
            <>
              <path d="M14 23 Q17 18 20 23" stroke="#A5B4FC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M28 23 Q31 18 34 23" stroke="#A5B4FC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {expression === 'surprised' && (
            // 惊讶大眼
            <>
              <ellipse cx="17" cy="21" rx="4.5" ry="5" fill="#A5B4FC" />
              <ellipse cx="31" cy="21" rx="4.5" ry="5" fill="#A5B4FC" />
              <circle cx="17" cy="21" r="2" fill="#312E81" />
              <circle cx="31" cy="21" r="2" fill="#312E81" />
              <circle cx="18" cy="19" r="1.5" fill="white" opacity="0.9" />
              <circle cx="32" cy="19" r="1.5" fill="white" opacity="0.9" />
            </>
          )}
          {expression === 'curious' && (
            // 好奇 - 一大一小
            <>
              <ellipse cx="17" cy="21" rx="3" ry="3.5" fill="#A5B4FC" />
              <ellipse cx="31" cy="20" rx="4" ry="4.5" fill="#A5B4FC" />
              <circle cx="17" cy="21.5" r="1.2" fill="#312E81" />
              <circle cx="31" cy="21" r="1.8" fill="#312E81" />
              <circle cx="18" cy="19.5" r="1" fill="white" opacity="0.8" />
              <circle cx="32.5" cy="18.5" r="1.3" fill="white" opacity="0.8" />
            </>
          )}
          {expression === 'thinking' && (
            // 思考 - 眼睛往上看
            <>
              <ellipse cx="17" cy="19" rx="3.5" ry="4" fill="#A5B4FC" />
              <ellipse cx="31" cy="19" rx="3.5" ry="4" fill="#A5B4FC" />
              <circle cx="17" cy="18" r="1.5" fill="#312E81" />
              <circle cx="31" cy="18" r="1.5" fill="#312E81" />
              <circle cx="18" cy="16.5" r="1.2" fill="white" opacity="0.8" />
              <circle cx="32" cy="16.5" r="1.2" fill="white" opacity="0.8" />
            </>
          )}
          {expression === 'wink' && (
            // 眨单眼
            <>
              <ellipse cx="17" cy="21" rx="3.5" ry="4" fill="#A5B4FC" />
              <circle cx="17" cy="22" r="1.5" fill="#312E81" />
              <circle cx="18.5" cy="19.5" r="1.2" fill="white" opacity="0.8" />
              <path d="M28 22 Q31 19 34 22" stroke="#A5B4FC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}
          {expression === 'neutral' && (
            // 正常眼睛
            <>
              <ellipse cx="17" cy="21" rx="3.5" ry="4" fill="#A5B4FC" />
              <ellipse cx="31" cy="21" rx="3.5" ry="4" fill="#A5B4FC" />
              <circle cx="18.5" cy="19.5" r="1.2" fill="white" opacity="0.8" />
              <circle cx="32.5" cy="19.5" r="1.2" fill="white" opacity="0.8" />
              <circle cx="17" cy="22" r="1.5" fill="#312E81" />
              <circle cx="31" cy="22" r="1.5" fill="#312E81" />
            </>
          )}
        </g>

        {/* 嘴巴 - 根据表情变化 */}
        {expression === 'happy' && (
          // 开心大笑
          <path d="M18 29 Q24 36 30 29" stroke="#A5B4FC" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {expression === 'surprised' && (
          // 惊讶 O 嘴
          <ellipse cx="24" cy="31" rx="3" ry="4" fill="#A5B4FC" opacity="0.8" />
        )}
        {expression === 'curious' && (
          // 好奇歪嘴
          <path d="M20 30 Q25 31 28 29" stroke="#A5B4FC" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        {expression === 'thinking' && (
          // 思考嘟嘴
          <ellipse cx="24" cy="31" rx="2.5" ry="2" fill="#A5B4FC" opacity="0.7" />
        )}
        {expression === 'wink' && (
          // 眨眼俏皮笑
          <path d="M19 30 Q24 33 29 29" stroke="#A5B4FC" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
        {(expression === 'neutral' || expression === 'blink') && (
          // 正常微笑
          <path d="M20 30 Q24 33 28 30" stroke="#A5B4FC" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
        )}

        {/* 腮红 */}
        <circle cx="10" cy="26" r="2.5" fill="#F472B6" opacity="0.3" />
        <circle cx="38" cy="26" r="2.5" fill="#F472B6" opacity="0.3" />

        {/* 头顶装饰光点 */}
        <circle 
          cx="24" cy="6" r="2" 
          fill="#A5B4FC"
          style={{ animation: 'sparkle 1.5s ease-in-out infinite' }}
        />
        <circle 
          cx="20" cy="8" r="1" 
          fill="#C4B5FD"
          style={{ animation: 'sparkle 1.5s ease-in-out infinite 0.3s' }}
        />
        <circle 
          cx="28" cy="8" r="1" 
          fill="#C4B5FD"
          style={{ animation: 'sparkle 1.5s ease-in-out infinite 0.6s' }}
        />

        {/* 耳朵/侧边装饰 */}
        <rect x="3" y="20" width="3" height="8" rx="1.5" fill="url(#bodyGrad)" opacity="0.8" />
        <rect x="42" y="20" width="3" height="8" rx="1.5" fill="url(#bodyGrad)" opacity="0.8" />
      </svg>
    </div>
  );
};

export default RobotIcon;
