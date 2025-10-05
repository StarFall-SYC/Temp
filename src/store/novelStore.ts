/**
 * 小说数据状态管理
 */
import { create } from 'zustand';
import type { Novel, Chapter, ApiResponse } from '../../shared/types.js';
import axios from 'axios';

interface NovelState {
  novels: Novel[];
  currentNovel: Novel | null;
  userNovels: Novel[];
  isLoading: boolean;
  loading: boolean; // 兼容性别名
  error: string | null;
  
  // Actions
  fetchNovels: () => Promise<void>;
  fetchUserNovels: (username: string) => Promise<void>;
  fetchNovelDetail: (username: string, title: string) => Promise<Novel | null>;
  createNovel: (novelData: { title: string; description: string; tags?: string[]; status?: 'ongoing' | 'completed' | 'paused' }) => Promise<Novel | null>;
  updateNovel: (username: string, title: string, updates: Partial<Novel>) => Promise<Novel | null>;
  deleteNovel: (username: string, title: string) => Promise<boolean>;
  addChapter: (username: string, title: string, chapter: { title: string; content: string }) => Promise<Chapter | null>;
  uploadCover: (username: string, title: string, file: File) => Promise<string | null>;
  setCurrentNovel: (novel: Novel | null) => void;
  clearError: () => void;
  
  // WebSocket相关
  updateNovelFromWebSocket: (novel: Novel) => void;
  removeNovelFromWebSocket: (username: string, title: string) => void;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const useNovelStore = create<NovelState>((set, get) => ({
  novels: [],
  currentNovel: null,
  userNovels: [],
  isLoading: false,
  loading: false,
  error: null,

  fetchNovels: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get<ApiResponse<Novel[]>>(`${API_BASE_URL}/novels`);
      
      if (response.data.success && response.data.data) {
        set({ 
          novels: response.data.data, 
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '获取小说列表失败' 
        });
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
    }
  },

  fetchUserNovels: async (username: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get<ApiResponse<Novel[]>>(`${API_BASE_URL}/novels/user/${username}`);
      
      if (response.data.success && response.data.data) {
        set({ 
          userNovels: response.data.data, 
          isLoading: false 
        });
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '获取用户小说列表失败' 
        });
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
    }
  },

  fetchNovelDetail: async (username: string, title: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get<ApiResponse<Novel>>(`${API_BASE_URL}/novels/${username}/${encodeURIComponent(title)}`);
      
      if (response.data.success && response.data.data) {
        const novel = response.data.data;
        set(state => ({
          currentNovel: novel,
          novels: state.novels.some(n => n.id === novel.id) 
            ? state.novels.map(n => n.id === novel.id ? novel : n)
            : [...state.novels, novel],
          isLoading: false
        }));
        return novel;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '获取小说详情失败' 
        });
        return null;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
      return null;
    }
  },

  createNovel: async (novelData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post<ApiResponse<Novel>>(`${API_BASE_URL}/novels`, novelData);
      
      if (response.data.success && response.data.data) {
        const newNovel = response.data.data;
        
        // 更新用户小说列表
        set(state => ({ 
          userNovels: [newNovel, ...state.userNovels],
          novels: [newNovel, ...state.novels],
          isLoading: false 
        }));
        
        return newNovel;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '创建小说失败' 
        });
        return null;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
      return null;
    }
  },

  updateNovel: async (username: string, title: string, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.put<ApiResponse<Novel>>(`${API_BASE_URL}/novels/${username}/${encodeURIComponent(title)}`, updates);
      
      if (response.data.success && response.data.data) {
        const updatedNovel = response.data.data;
        
        // 更新状态中的小说
        set(state => ({
          novels: state.novels.map(novel => 
            novel.id === updatedNovel.id ? updatedNovel : novel
          ),
          userNovels: state.userNovels.map(novel => 
            novel.id === updatedNovel.id ? updatedNovel : novel
          ),
          currentNovel: state.currentNovel?.id === updatedNovel.id ? updatedNovel : state.currentNovel,
          isLoading: false
        }));
        
        return updatedNovel;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '更新小说失败' 
        });
        return null;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
      return null;
    }
  },

  deleteNovel: async (username: string, title: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.delete<ApiResponse>(`/novels/${username}/${encodeURIComponent(title)}`);
      
      if (response.data.success) {
        // 从状态中移除小说
        set(state => ({
          novels: state.novels.filter(novel => 
            !(novel.author === username && novel.title === title)
          ),
          userNovels: state.userNovels.filter(novel => 
            !(novel.author === username && novel.title === title)
          ),
          currentNovel: state.currentNovel?.author === username && state.currentNovel?.title === title 
            ? null : state.currentNovel,
          isLoading: false
        }));
        
        return true;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '删除小说失败' 
        });
        return false;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
      return false;
    }
  },

  addChapter: async (username: string, title: string, chapter) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post<ApiResponse<Chapter>>(`${API_BASE_URL}/novels/${username}/${encodeURIComponent(title)}/chapters`, chapter);
      
      if (response.data.success && response.data.data) {
        const newChapter = response.data.data;
        
        // 更新当前小说的章节列表
        set(state => {
          if (state.currentNovel && state.currentNovel.author === username && state.currentNovel.title === title) {
            const updatedNovel = {
              ...state.currentNovel,
              chapters: [...state.currentNovel.chapters, newChapter],
              chapterCount: (state.currentNovel.chapters?.length || 0) + 1,
              updatedAt: new Date().toISOString()
            };
            return {
              currentNovel: updatedNovel,
              novels: state.novels.map(n => n.id === updatedNovel.id ? updatedNovel : n),
              userNovels: state.userNovels.map(n => n.id === updatedNovel.id ? updatedNovel : n),
              isLoading: false
            };
          }
          return { isLoading: false };
        });
        
        return newChapter;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '添加章节失败' 
        });
        return null;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
      return null;
    }
  },

  uploadCover: async (username: string, title: string, file: File) => {
    set({ isLoading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('cover', file);
      
      const response = await axios.post<ApiResponse<{ coverUrl: string }>>(
        `${API_BASE_URL}/novels/${username}/${encodeURIComponent(title)}/cover`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success && response.data.data) {
        const { coverUrl } = response.data.data;
        
        // 更新小说封面URL
        set(state => ({
          novels: state.novels.map(novel => 
            novel.author === username && novel.title === title 
              ? { ...novel, coverUrl } : novel
          ),
          userNovels: state.userNovels.map(novel => 
            novel.author === username && novel.title === title 
              ? { ...novel, coverUrl } : novel
          ),
          currentNovel: state.currentNovel?.author === username && state.currentNovel?.title === title 
            ? { ...state.currentNovel, coverUrl } : state.currentNovel,
          isLoading: false
        }));
        
        return coverUrl;
      } else {
        set({ 
          isLoading: false, 
          error: response.data.message || '上传封面失败' 
        });
        return null;
      }
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || '网络错误，请稍后重试' 
      });
      return null;
    }
  },

  setCurrentNovel: (novel: Novel | null) => {
    set({ currentNovel: novel });
  },

  clearError: () => {
    set({ error: null });
  },

  // WebSocket相关方法
  updateNovelFromWebSocket: (novel: Novel) => {
    set(state => ({
      novels: state.novels.map(n => n.id === novel.id ? novel : n),
      userNovels: state.userNovels.map(n => n.id === novel.id ? novel : n),
      currentNovel: state.currentNovel?.id === novel.id ? novel : state.currentNovel
    }));
  },

  removeNovelFromWebSocket: (username: string, title: string) => {
    set(state => ({
      novels: state.novels.filter(novel => 
        !(novel.author === username && novel.title === title)
      ),
      userNovels: state.userNovels.filter(novel => 
        !(novel.author === username && novel.title === title)
      ),
      currentNovel: state.currentNovel?.author === username && state.currentNovel?.title === title 
        ? null : state.currentNovel
    }));
  }
}));