/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import novelRoutes from './routes/novels.js';
import { fileMonitorService } from './services/fileMonitor.js';
import { accessLoggingMiddleware, errorLoggingMiddleware, scheduleLogCleanup } from './middleware/logging.js';
import { validateAndSanitizeBody, validateAndSanitizeParams, validateAndSanitizeQuery } from './middleware/validation.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

const app: express.Application = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 添加访问日志中间件
app.use(accessLoggingMiddleware);

// 添加验证和清理中间件
app.use(validateAndSanitizeBody);
app.use(validateAndSanitizeParams);
app.use(validateAndSanitizeQuery);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  });
});

/**
 * error handler middleware
 */
app.use(errorLoggingMiddleware);
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

// 启动文件监控服务
fileMonitorService.initWebSocket(8081);
fileMonitorService.startMonitoring();

// 启动日志清理任务
scheduleLogCleanup();

// 优雅关闭
// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务...');
  fileMonitorService.stopMonitoring();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务...');
  fileMonitorService.stopMonitoring();
  process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

export default app;
