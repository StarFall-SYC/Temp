/**
 * useAsync Hook
 * 用于处理异步操作，提供加载、错误和数据状态
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '../utils/errorHandler';

interface UseAsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  immediate?: boolean;
}

export function useAsync<T = any>(asyncFunction: () => Promise<T>, options: UseAsyncOptions = {}) {
  const { onSuccess, onError, immediate = false } = options;
  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
    loading: false,
  });

  // 执行异步函数
  const execute = useCallback(async () => {
    setState({
      status: 'pending',
      data: null,
      error: null,
      loading: true,
    });

    try {
      const response = await asyncFunction();
      setState({
        status: 'success',
        data: response,
        error: null,
        loading: false,
      });
      onSuccess?.(response);
      return response;
    } catch (err) {
      const error = err as ApiError;
      setState({
        status: 'error',
        data: null,
        error,
        loading: false,
      });
      onError?.(error);
      throw error;
    }
  }, [asyncFunction, onSuccess, onError]);

  // 重置状态
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      data: null,
      error: null,
      loading: false,
    });
  }, []);

  // 如果immediate为true，组件挂载时自动执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * 简化版useAsync Hook，用于简单的异步操作
 */
export function useAsyncFn<T = any>(fn: () => Promise<T>, deps: any[] = []) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, deps);

  return { execute, loading, error, data };
}
