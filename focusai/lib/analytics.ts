/**
 * 聚智 AI 用户行为埋点
 */

import { API_BASE_URL } from './config';

// 获取或生成用户ID
export const getUserId = (): string => {
  let userId = localStorage.getItem('focusai_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('focusai_user_id', userId);
  }
  return userId;
};

// 埋点事件类型
export type EventType = 'click' | 'view' | 'action' | 'error';

// 埋点函数
export const track = async (
  eventType: EventType,
  eventName: string,
  page: string = '',
  extra: Record<string, any> = {}
) => {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        event_name: eventName,
        page: page || window.location.pathname,
        user_id: getUserId(),
        extra
      })
    });
  } catch (error) {
    // 静默失败，不影响用户体验
    console.debug('Analytics track failed:', error);
  }
};

// 页面访问统计
export const trackPageView = async (page: string) => {
  try {
    await fetch(`${API_BASE_URL}/api/analytics/pageview?page=${encodeURIComponent(page)}&user_id=${getUserId()}`, {
      method: 'POST'
    });
  } catch (error) {
    console.debug('Analytics pageview failed:', error);
  }
};

// 便捷方法
export const trackClick = (buttonName: string, page?: string, extra?: Record<string, any>) => 
  track('click', buttonName, page, extra);

export const trackAction = (actionName: string, page?: string, extra?: Record<string, any>) => 
  track('action', actionName, page, extra);

export const trackError = (errorName: string, page?: string, extra?: Record<string, any>) => 
  track('error', errorName, page, extra);

export const trackView = (viewName: string, page?: string, extra?: Record<string, any>) => 
  track('view', viewName, page, extra);
