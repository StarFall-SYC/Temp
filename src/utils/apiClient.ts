/**
 * API客户端配置
 * 集成错误处理和请求拦截
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { handleApiError, ApiError } from './errorHandler';
import { useAuthStore } from '../store/authStore';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器 - 添加认证token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

/**
 * 响应拦截器 - 处理错误和token过期
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 处理401错误（token过期）
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // 可以在这里重定向到登录页面
      window.location.href = '/login';
    }

    return Promise.reject(handleApiError(error));
  }
);

export default apiClient;

/**
 * 通用API请求包装函数
 */
export async function apiRequest<T = any>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: any,
  config?: any
): Promise<{ success: boolean; data?: T; error?: ApiError }> {
  try {
    const response = await apiClient[method]<any>(url, data, config);
    return {
      success: response.data.success,
      data: response.data.data,
    };
  } catch (error) {
    const apiError =
      error instanceof Error && 'type' in error ? (error as ApiError) : handleApiError(error);
    return {
      success: false,
      error: apiError,
    };
  }
}

/**
 * GET请求
 */
export function apiGet<T = any>(url: string, config?: any) {
  return apiRequest<T>('get', url, undefined, config);
}

/**
 * POST请求
 */
export function apiPost<T = any>(url: string, data?: any, config?: any) {
  return apiRequest<T>('post', url, data, config);
}

/**
 * PUT请求
 */
export function apiPut<T = any>(url: string, data?: any, config?: any) {
  return apiRequest<T>('put', url, data, config);
}

/**
 * DELETE请求
 */
export function apiDelete<T = any>(url: string, config?: any) {
  return apiRequest<T>('delete', url, undefined, config);
}

/**
 * PATCH请求
 */
export function apiPatch<T = any>(url: string, data?: any, config?: any) {
  return apiRequest<T>('patch', url, data, config);
}
