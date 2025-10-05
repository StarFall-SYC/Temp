/**
 * WebSocket连接管理hook
 */
import { useEffect, useRef, useCallback } from 'react';
import type { WebSocketMessage } from '../../shared/types';
import { useNovelStore } from '../store/novelStore';

interface UseWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = `ws://localhost:8081`,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectedRef = useRef(false);

  const { updateNovelFromWebSocket, removeNovelFromWebSocket, fetchNovels } = useNovelStore();

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:3001/api/health');
      return res.ok;
    } catch {
      return false;
    }
  };

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // 后端不可用时跳过连接，延迟重试，避免报错导致页面抖动
      const healthy = await checkBackendHealth();
      if (!healthy) {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * 2);
        }
        return;
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket连接已建立');
        isConnectedRef.current = true;
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket连接已关闭');
        isConnectedRef.current = false;
        onDisconnect?.();
        
        // 尝试重连
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`尝试重连 (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(reconnectInterval * (1 + reconnectAttemptsRef.current), 15000));
        } else {
          console.log('达到最大重连次数，停止重连');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket错误:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectedRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket未连接，无法发送消息');
    return false;
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('收到WebSocket消息:', message);

    switch (message.type) {
      case 'connection':
        console.log('WebSocket连接确认:', message.data);
        break;

      case 'novel_created':
      case 'novel_updated':
        if (message.data && typeof message.data === 'object' && 'id' in message.data) {
          updateNovelFromWebSocket(message.data as any);
        }
        break;

      case 'novel_deleted':
        if (message.data && typeof message.data === 'object' && 'username' in message.data && 'title' in message.data) {
          const { username, title } = message.data as { username: string; title: string };
          removeNovelFromWebSocket(username, title);
        }
        break;

      case 'cover_updated':
        // 封面更新时，重新获取小说列表以更新封面URL
        fetchNovels();
        break;

      case 'full_sync':
        // 全量数据同步
        if (Array.isArray(message.data)) {
          // 这里可以直接更新整个小说列表
          fetchNovels();
        }
        break;

      default:
        console.log('未处理的消息类型:', message.type);
    }
  }, [updateNovelFromWebSocket, removeNovelFromWebSocket, fetchNovels]);

  const getConnectionStatus = useCallback(() => {
    return {
      isConnected: isConnectedRef.current,
      readyState: wsRef.current?.readyState,
      reconnectAttempts: reconnectAttemptsRef.current
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    getConnectionStatus,
    isConnected: isConnectedRef.current
  };
};

export default useWebSocket;