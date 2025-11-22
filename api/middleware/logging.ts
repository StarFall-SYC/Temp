import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';

/**
 * 访问日志中间件
 * 记录所有 HTTP 请求
 */

const logsDir = path.join(process.cwd(), 'logs');

/**
 * 确保日志目录存在
 */
async function ensureLogsDir(): Promise<void> {
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.error('创建日志目录失败:', error);
  }
}

/**
 * 获取日志文件路径
 */
function getLogFilePath(): string {
  const today = new Date().toISOString().split('T')[0];
  return path.join(logsDir, `access-${today}.log`);
}

/**
 * 格式化日志消息
 */
function formatLogMessage(req: Request, res: Response, duration: number): string {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const statusCode = res.statusCode;
  const userAgent = req.get('user-agent') || 'Unknown';
  const ip = req.ip || 'Unknown';

  return `[${timestamp}] ${method} ${url} ${statusCode} ${duration}ms - IP: ${ip} - UA: ${userAgent}\n`;
}

/**
 * 访问日志中间件
 */
export function accessLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // 在响应完成时记录日志
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const logMessage = formatLogMessage(req, res, duration);

    try {
      await ensureLogsDir();
      const logFilePath = getLogFilePath();
      await fs.appendFile(logFilePath, logMessage, 'utf-8');
    } catch (error) {
      console.error('写入日志失败:', error);
    }
  });

  next();
}

/**
 * 错误日志中间件
 */
export function errorLoggingMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const message = err.message;
  const stack = err.stack;

  const errorLog = `[${timestamp}] ERROR ${method} ${url}\nMessage: ${message}\nStack: ${stack}\n\n`;

  // 记录错误日志
  (async () => {
    try {
      await ensureLogsDir();
      const errorLogPath = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(errorLogPath, errorLog, 'utf-8');
    } catch (error) {
      console.error('写入错误日志失败:', error);
    }
  })();

  // 继续传递错误
  next(err);
}

/**
 * 清理旧日志文件（7 天以上）
 */
export async function cleanupOldLogs(): Promise<void> {
  try {
    await ensureLogsDir();
    const files = await fs.readdir(logsDir);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > sevenDaysMs) {
        await fs.unlink(filePath);
        console.log(`删除旧日志文件: ${file}`);
      }
    }
  } catch (error) {
    console.error('清理旧日志文件失败:', error);
  }
}

// 每天清理一次旧日志（在应用启动时）
export function scheduleLogCleanup(): void {
  // 立即执行一次
  cleanupOldLogs();

  // 每 24 小时执行一次
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
}

