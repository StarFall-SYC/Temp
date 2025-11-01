import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import type { User } from '../../shared/types.js';
import { getUserById } from './userStorage.js';

// JWT密钥（在生产环境中应该从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-long-and-random-secret-key-for-development-only-change-me-in-production-1234567890';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

// 生成JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET as string, { expiresIn: '7d' });
}

// 验证JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// 密码验证
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// 认证中间件
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: '访问令牌缺失',
    });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({
      success: false,
      message: '无效的访问令牌',
    });
    return;
  }

  try {
    const user = await getUserById(decoded.userId);
    if (!user) {
      res.status(403).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 从用户对象中移除密码字段
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
}

// 可选的认证中间件（不强制要求登录）
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      try {
        const user = await getUserById(decoded.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          req.user = userWithoutPassword;
        }
      } catch (error) {
        // 忽略错误，继续处理请求
      }
    }
  }

  next();
}

// 生成随机用户ID
export function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
