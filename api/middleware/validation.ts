import { Request, Response, NextFunction } from 'express';
import { sanitizeText, sanitizePath } from '../utils/sanitizer.js';

/**
 * 验证中间件
 * 对请求数据进行验证和清理
 */

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): boolean {
  // 密码长度至少 6 位
  return password.length >= 6;
}

/**
 * 验证用户名格式
 */
export function validateUsername(username: string): boolean {
  // 用户名长度 3-20，只包含字母、数字、下划线、中文
  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * 验证小说标题
 */
export function validateNovelTitle(title: string): boolean {
  // 标题长度 1-100
  return title.length > 0 && title.length <= 100;
}

/**
 * 验证小说描述
 */
export function validateNovelDescription(description: string): boolean {
  // 描述长度 0-1000
  return description.length <= 1000;
}

/**
 * 验证章节内容
 */
export function validateChapterContent(content: string): boolean {
  // 内容长度 1-100000
  return content.length > 0 && content.length <= 100000;
}

/**
 * 验证和清理请求体中间件
 */
export function validateAndSanitizeBody(req: Request, res: Response, next: NextFunction): void {
  try {
    // 清理所有字符串字段
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeText(req.body[key]);
        }
      });
    }
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: '请求数据无效' });
  }
}

/**
 * 验证和清理 URL 参数中间件
 */
export function validateAndSanitizeParams(req: Request, res: Response, next: NextFunction): void {
  try {
    // 清理所有 URL 参数
    if (req.params) {
      Object.keys(req.params).forEach((key) => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizePath(req.params[key]);
        }
      });
    }
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: '请求参数无效' });
  }
}

/**
 * 验证和清理查询参数中间件
 */
export function validateAndSanitizeQuery(req: Request, res: Response, next: NextFunction): void {
  try {
    // 清理所有查询参数
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeText(req.query[key]);
        }
      });
    }
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: '查询参数无效' });
  }
}

