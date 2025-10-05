/**
 * 用户认证状态管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ApiResponse } from '../../shared/types.js';
import axios from 'axios';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string; verificationCode: string }) => Promise<boolean>;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3001/api';

// 配置axios默认设置
axios.defaults.baseURL = API_BASE_URL;

export const useAuthStore = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await axios.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
          email,
          password
        });
        
        if (response.data.success && response.data.data) {
          const { user, token } = response.data.data;
          
          // 设置axios默认header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null 
          });
          
          return true;
        } else {
          set({ 
            isLoading: false, 
            error: response.data.message || '登录失败' 
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '网络错误，请稍后重试';
        set({ 
          isLoading: false, 
          error: errorMessage 
        });
        return false;
      }
    },

    register: async (data: { username: string; email: string; password: string; verificationCode: string }) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await axios.post<ApiResponse<{ user: User; token: string }>>('/auth/register', {
          username: data.username,
          email: data.email,
          password: data.password,
          verificationCode: data.verificationCode
        });
        
        if (response.data.success && response.data.data) {
          const { user, token } = response.data.data;
          
          // 设置axios默认header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ 
            user, 
            token, 
            isLoading: false, 
            error: null 
          });
          
          return true;
        } else {
          set({ 
            isLoading: false, 
            error: response.data.message || '注册失败' 
          });
          return false;
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || '网络错误，请稍后重试';
        set({ 
          isLoading: false, 
          error: errorMessage 
        });
        return false;
      }
    },

    setUser: (user: User, token: string) => {
      // 设置axios默认header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      set({ 
        user, 
        token, 
        isLoading: false, 
        error: null 
      });
    },

    logout: () => {
      // 清除axios默认header
      delete axios.defaults.headers.common['Authorization'];
      
      set({ 
        user: null, 
        token: null, 
        error: null 
      });
    },

    checkAuth: async () => {
      const { token } = get();
      
      if (!token) {
        return;
      }
      
      try {
        // 设置axios默认header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await axios.get<ApiResponse<User>>('/auth/me');
        
        if (response.data.success && response.data.data) {
          set({ user: response.data.data });
        } else {
          // token无效，清除认证信息
          get().logout();
        }
      } catch (error) {
        // token无效，清除认证信息
        get().logout();
      }
    },

    clearError: () => {
      set({ error: null });
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ 
      user: state.user, 
      token: state.token 
    })
  }
));

// 初始化时检查认证状态
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
}