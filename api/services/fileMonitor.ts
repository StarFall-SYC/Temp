/**
 * 文件监控服务
 * 使用Chokidar监控文件变化，通过WebSocket实时通知前端
 */
import * as chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs/promises';
import type { WebSocketMessage, Novel, Chapter } from '../../shared/types.js';
import { getNovel, getAllNovels } from '../utils/novelStorage.js';

class FileMonitorService {
  private watcher: chokidar.FSWatcher | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private usersPath: string;

  constructor() {
    this.usersPath = path.resolve(process.cwd(), 'users');
  }

  /**
   * 初始化WebSocket服务器
   */
  initWebSocket(port: number = 8081): void {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket客户端连接');
      this.clients.add(ws);

      // 发送连接确认消息
      this.sendToClient(ws, {
        type: 'connection',
        data: { message: '连接成功' },
      });

      ws.on('close', () => {
        console.log('WebSocket客户端断开连接');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        this.clients.delete(ws);
      });
    });

    console.log(`WebSocket服务器启动在端口 ${port}`);
  }

  /**
   * 启动文件监控
   */
  startMonitoring(): void {
    // 确保users目录存在
    this.ensureUsersDirectory();

    // 监控users目录下的所有文件
    this.watcher = chokidar.watch(this.usersPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true, // 忽略初始扫描
      depth: 10, // 监控深度
    });

    // 监听文件变化事件
    this.watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('addDir', (dirPath) => this.handleDirectoryChange('addDir', dirPath))
      .on('unlinkDir', (dirPath) => this.handleDirectoryChange('unlinkDir', dirPath))
      .on('error', (error) => console.error('文件监控错误:', error));

    console.log('文件监控服务已启动，监控目录:', this.usersPath);
  }

  /**
   * 停止文件监控
   */
  stopMonitoring(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('文件监控服务已停止');
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.log('WebSocket服务器已关闭');
    }
  }

  /**
   * 处理文件变化
   */
  private async handleFileChange(event: string, filePath: string): Promise<void> {
    try {
      const relativePath = path.relative(this.usersPath, filePath);
      const pathParts = relativePath.split(path.sep);

      // 检查是否是小说相关文件
      if (pathParts.length >= 4 && pathParts[1] === 'articles') {
        const username = pathParts[0];
        const novelTitle = pathParts[2];
        const fileName = pathParts[pathParts.length - 1];

        console.log(`文件${event}: ${relativePath}`);

        if (fileName === 'chapter.json') {
          await this.handleNovelChange(event, username, novelTitle);
        } else if (fileName === 'cover.png') {
          await this.handleCoverChange(event, username, novelTitle);
        }
      }
    } catch (error) {
      console.error('处理文件变化失败:', error);
    }
  }

  /**
   * 处理目录变化
   */
  private async handleDirectoryChange(event: string, dirPath: string): Promise<void> {
    try {
      const relativePath = path.relative(this.usersPath, dirPath);
      const pathParts = relativePath.split(path.sep);

      // 检查是否是小说目录
      if (pathParts.length === 3 && pathParts[1] === 'articles') {
        const username = pathParts[0];
        const novelTitle = pathParts[2];

        console.log(`目录${event}: ${relativePath}`);

        if (event === 'addDir') {
          // 新建小说目录
          await this.handleNovelCreated(username, novelTitle);
        } else if (event === 'unlinkDir') {
          // 删除小说目录
          await this.handleNovelDeleted(username, novelTitle);
        }
      }
    } catch (error) {
      console.error('处理目录变化失败:', error);
    }
  }

  /**
   * 处理小说内容变化
   */
  private async handleNovelChange(
    event: string,
    username: string,
    novelTitle: string
  ): Promise<void> {
    try {
      if (event === 'unlink') {
        // 小说被删除
        this.broadcastMessage({
          type: 'novel_deleted',
          data: { username, title: novelTitle },
        });
      } else {
        // 小说被创建或更新
        const novel = await getNovel(username, novelTitle);
        if (novel) {
          this.broadcastMessage({
            type: event === 'add' ? 'novel_created' : 'novel_updated',
            data: novel,
          });
        }
      }
    } catch (error) {
      console.error('处理小说变化失败:', error);
    }
  }

  /**
   * 处理封面变化
   */
  private async handleCoverChange(
    event: string,
    username: string,
    novelTitle: string
  ): Promise<void> {
    try {
      this.broadcastMessage({
        type: 'cover_updated',
        data: {
          username,
          title: novelTitle,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('处理封面变化失败:', error);
    }
  }

  /**
   * 处理小说创建
   */
  private async handleNovelCreated(username: string, novelTitle: string): Promise<void> {
    // 等待一小段时间，确保文件写入完成
    setTimeout(async () => {
      try {
        const novel = await getNovel(username, novelTitle);
        if (novel) {
          this.broadcastMessage({
            type: 'novel_created',
            data: novel,
          });
        }
      } catch (error) {
        console.error('处理小说创建失败:', error);
      }
    }, 500);
  }

  /**
   * 处理小说删除
   */
  private async handleNovelDeleted(username: string, novelTitle: string): Promise<void> {
    this.broadcastMessage({
      type: 'novel_deleted',
      data: { username, title: novelTitle },
    });
  }

  /**
   * 广播消息给所有客户端
   */
  private broadcastMessage(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      } else {
        // 移除已断开的客户端
        this.clients.delete(client);
      }
    });

    console.log(`广播消息: ${message.type}`, message.data);
  }

  /**
   * 发送消息给特定客户端
   */
  private sendToClient(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * 确保users目录存在
   */
  private async ensureUsersDirectory(): Promise<void> {
    try {
      await fs.access(this.usersPath);
    } catch {
      await fs.mkdir(this.usersPath, { recursive: true });
      console.log('创建users目录:', this.usersPath);
    }
  }

  /**
   * 获取连接的客户端数量
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 手动触发全量数据同步
   */
  async syncAllData(): Promise<void> {
    try {
      const novels = await getAllNovels();
      this.broadcastMessage({
        type: 'full_sync',
        data: novels,
      });
    } catch (error) {
      console.error('全量数据同步失败:', error);
    }
  }
}

// 导出单例实例
export const fileMonitorService = new FileMonitorService();
export default FileMonitorService;
