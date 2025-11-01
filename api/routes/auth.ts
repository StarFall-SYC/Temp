/**
 * 用户认证API路由
 * 处理用户注册、登录、token管理等
 */
import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { UserRegistration, UserLogin, AuthResponse } from '../../shared/types.js';
import { createUser, getUserByEmail, getUserByUsername } from '../utils/userStorage.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateUserId,
  authenticateToken,
} from '../utils/auth.js';
import { sendVerificationCode, verifyCode } from '../services/emailService.js';
import { upload, saveAvatarImage, getAvatarImage } from '../utils/fileUpload.js';
import { updateUser } from '../utils/userStorage.js';

const router = Router();

// 认证相关路由的速率限制：每 15 分钟最多 100 次请求
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: '请求过多，请在 15 分钟后重试',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 登录和注册的更严格速率限制：每 5 分钟最多 5 次请求
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: '登录或注册尝试过多，请在 5 分钟后重试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 发送邮箱验证码
 * POST /api/auth/send-verification-code
 */
router.post('/send-verification-code', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: '邮箱地址是必填项',
      });
      return;
    }

    // 检查邮箱是否已被注册
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: '该邮箱已被注册',
      });
      return;
    }

    // 发送验证码
    const result = await sendVerificationCode(email);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 验证邮箱验证码
 * POST /api/auth/verify-code
 */
router.post('/verify-code', authLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: '邮箱和验证码都是必填项',
      });
      return;
    }

    // 验证验证码
    const result = verifyCode(email, code);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('验证验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      verificationCode,
    }: UserRegistration & { verificationCode: string } = req.body;

    // 验证输入
    if (!username || !email || !password || !verificationCode) {
      res.status(400).json({
        success: false,
        message: '用户名、邮箱、密码和验证码都是必填项',
      } as AuthResponse);
      return;
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        message: '用户名长度必须在3-20个字符之间',
      } as AuthResponse);
      return;
    }

    // 验证密码强度
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: '密码长度至少6个字符',
      } as AuthResponse);
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
      } as AuthResponse);
      return;
    }

    // 验证邮箱验证码
    const codeVerification = verifyCode(email, verificationCode);
    if (!codeVerification.success) {
      res.status(400).json({
        success: false,
        message: codeVerification.message,
      } as AuthResponse);
      return;
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      res.status(409).json({
        success: false,
        message: '用户名已存在',
      } as AuthResponse);
      return;
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      res.status(409).json({
        success: false,
        message: '邮箱已被注册',
      } as AuthResponse);
      return;
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const userId = generateUserId();
    const newUser = await createUser({
      id: userId,
      username,
      email,
      password,
      hashedPassword,
    });

    // 生成token
    const token = generateToken(userId);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    } as AuthResponse);
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: UserLogin = req.body;

    // 验证输入
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: '邮箱和密码都是必填项',
      } as AuthResponse);
      return;
    }

    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      } as AuthResponse);
      return;
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password!);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      } as AuthResponse);
      return;
    }

    // 生成token
    const token = generateToken(user.id);

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    } as AuthResponse);
  }
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // 由于使用JWT，登出主要在客户端处理（删除token）
  // 这里只是返回成功响应
  res.status(200).json({
    success: true,
    message: '登出成功',
  } as AuthResponse);
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: '获取用户信息成功',
    data: req.user,
  });
});

/**
 * 验证token有效性
 * POST /api/auth/verify
 */
router.post('/verify', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Token有效',
    data: req.user,
  });
});

/**
 * 上传用户头像
 * POST /api/auth/avatar
 */
router.post(
  '/avatar',
  authenticateToken,
  upload.single('avatar'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件',
        } as AuthResponse);
        return;
      }

      const userId = req.user!.id;
      const username = req.user!.username;
      const avatarUrl = await saveAvatarImage(username, req.file.buffer);

      // 更新用户头像URL
      const updatedUser = await updateUser(userId, { avatarUrl });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: '用户不存在或更新失败',
        } as AuthResponse);
        return;
      }

      const { password: _, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        success: true,
        message: '头像上传成功',
        data: { user: userWithoutPassword, token: generateToken(userId) },
      } as AuthResponse);
    } catch (error) {
      console.error('上传头像失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '服务器内部错误',
      } as AuthResponse);
    }
  }
);

/**
 * 获取用户头像
 * GET /api/auth/avatar/:username
 */
router.get('/avatar/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const imageBuffer = await getAvatarImage(username);

    if (!imageBuffer) {
      res.status(404).json({
        success: false,
        message: '头像图片不存在',
      } as AuthResponse);
      return;
    }

    res.setHeader('Content-Type', 'image/png'); // 假设头像都是png格式
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存1天
    res.send(imageBuffer);
  } catch (error) {
    console.error('获取头像失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    } as AuthResponse);
  }
});

export default router;
/**
 * 邮箱验证码登录
 * POST /api/auth/login-with-code
 */
router.post('/login-with-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      res.status(400).json({
        success: false,
        message: '邮箱和验证码都是必填项',
      });
      return;
    }

    // 验证验证码
    const verificationResult = verifyCode(email, verificationCode);
    if (!verificationResult.success) {
      res.status(400).json({
        success: false,
        message: verificationResult.message,
      });
      return;
    }

    // 检查用户是否存在
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在，请先注册',
      });
      return;
    }

    // 生成JWT token
    const token = generateToken(user.id);

    // 返回用户信息和token
    const response: AuthResponse = {
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('邮箱验证码登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});
