import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import RobotIcon from './RobotIcon';
import { API_BASE_URL } from '../lib/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载历史记录
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/history?user_id=default`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, user_id: 'default' })
      });

      const data = await res.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          timestamp: data.timestamp 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，连接出错了，请稍后再试。' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/chat/history?user_id=default`, {
        method: 'DELETE'
      });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* 悬浮按钮 - 机器人图标 */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <button
            onClick={() => setIsOpen(false)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 transition-all duration-300"
          >
            <X size={24} className="text-white" />
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-[#0a0a15]/80 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-500/30"
          >
            <RobotIcon size={48} isActive={loading} />
          </button>
        )}
      </div>

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] bg-[#0a0a12] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          
          {/* 头部 */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RobotIcon size={28} isActive={loading} />
              <span className="font-bold text-white">FocusAI 助手</span>
            </div>
            <button 
              onClick={clearHistory}
              className="text-neutral-400 hover:text-red-400 transition-colors"
              title="清空聊天"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-blue-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <div className="mx-auto mb-3 w-fit">
                  <RobotIcon size={48} />
                </div>
                <p className="text-sm text-white">你好！我是 FocusAI 助手</p>
                <p className="text-xs mt-1">告诉我你的职业和需求，我来帮你筛选最有价值的 AI 资讯</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white/10 text-neutral-200 rounded-bl-md'
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="p-3 border-t border-white/5 bg-[#0a0a12]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
