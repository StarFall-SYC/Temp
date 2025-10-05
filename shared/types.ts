// 共享类型定义

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // 在返回给前端时会被删除
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, 'password'>;
    token: string;
  } | Omit<User, 'password'>;
}

// 小说相关类型
export interface Novel {
  id: string;
  title: string;
  author: string;
  authorId: string;
  description: string;
  coverUrl?: string;
  tags?: string[];
  status: 'ongoing' | 'completed' | 'paused';
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  views: number; // 兼容性别名
  chapterCount: number;
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  chapterNumber: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NovelMetadata {
  title: string;
  author: string;
  authorId: string;
  description: string;
  tags: string[];
  status: 'ongoing' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  chapters: ChapterMetadata[];
}

export interface ChapterMetadata {
  id: string;
  title: string;
  chapterNumber: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// WebSocket消息类型
export interface WebSocketMessage {
  type:
    | 'connection'
    | 'novel_created'
    | 'novel_updated'
    | 'novel_deleted'
    | 'cover_updated'
    | 'full_sync'
    | 'chapter_added'
    | 'chapter_updated';
  data: any;
}