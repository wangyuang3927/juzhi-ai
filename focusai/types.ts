export enum ViewState {
  LANDING = 'LANDING',
  HOME = 'HOME',
  BOOKMARKS = 'BOOKMARKS',
  SETTINGS = 'SETTINGS',
  FEATURES = 'FEATURES',
  PRICING = 'PRICING',
  CONTACT = 'CONTACT',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ADMIN = 'ADMIN',
  SHARE = 'SHARE',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
}

export enum Profession {
  PRODUCT_MANAGER = '产品经理',
  FRONTEND_DEV = '前端工程师',
  BACKEND_DEV = '后端工程师',
  FULLSTACK_DEV = '全栈工程师',
  UI_UX_DESIGNER = 'UI/UX 设计师',
  GRAPHIC_DESIGNER = '平面设计师',
  OPERATIONS = '运营',
  MARKETING = '市场营销',
  DATA_ANALYST = '数据分析师',
  ONLINE_TEACHER = '线上老师',
  CONTENT_CREATOR = '内容创作者',
  STUDENT = '学生',
  ENTREPRENEUR = '创业者',
  OTHER = '其他',
}

export interface NewsItem {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  impact: string; // Ideally this is dynamic based on profession, static for mock
  prompt: string;
  url: string;
  timestamp: string;
  type?: 'news' | 'tool' | 'case';  // 内容类型
  source_name?: string;  // 来源名称（工具/案例用）
}

export interface UserSettings {
  profession: string; // 支持用户自定义职业
}