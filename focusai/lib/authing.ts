/**
 * 聚智 AI - Authing 认证模块
 */

import { AUTHING_APP_ID, AUTHING_HOST } from './config';

interface AuthUser {
  id: string;
  email: string;
  username?: string;
  token: string;
}

interface AuthResponse {
  data?: AuthUser;
  error?: { message: string };
}

const TOKEN_KEY = 'authing_token';
const USER_KEY = 'authing_user';

const getStoredUser = (): AuthUser | null => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const storeUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, user.token);
};

const clearUser = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

const authingRequest = async (endpoint: string, body: object) => {
  const response = await fetch(AUTHING_HOST + '/api/v3/' + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-authing-app-id': AUTHING_APP_ID,
    },
    body: JSON.stringify(body),
  });
  return response.json();
};

export const auth = {
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const result = await authingRequest('signup', {
        connection: 'PASSWORD',
        passwordPayload: {
          email: email,
          password: password,
        },
      });
      if (result.statusCode === 200 && result.data) {
        const user: AuthUser = {
          id: result.data.userId || result.data.id,
          email: email,
          token: result.data.access_token || result.data.token || '',
        };
        storeUser(user);
        return { data: user };
      }
      return { error: { message: result.message || '注册失败' } };
    } catch (err: any) {
      return { error: { message: err.message || '网络错误' } };
    }
  },

  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const result = await authingRequest('signin', {
        connection: 'PASSWORD',
        passwordPayload: {
          account: email,
          password: password,
        },
      });
      if (result.statusCode === 200 && result.data) {
        const user: AuthUser = {
          id: result.data.user_id || result.data.sub || result.data.userId,
          email: email,
          token: result.data.access_token || result.data.token || '',
        };
        storeUser(user);
        return { data: user };
      }
      return { error: { message: result.message || '登录失败' } };
    } catch (err: any) {
      return { error: { message: err.message || '网络错误' } };
    }
  },

  signOut: async () => {
    clearUser();
    return {};
  },

  getUser: async () => getStoredUser(),

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const user = getStoredUser();
    if (user) callback('SIGNED_IN', { user });
    const handler = (e: StorageEvent) => {
      if (e.key === USER_KEY) {
        callback(e.newValue ? 'SIGNED_IN' : 'SIGNED_OUT', e.newValue ? { user: JSON.parse(e.newValue) } : null);
      }
    };
    window.addEventListener('storage', handler);
    return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handler) } } };
  },
};
