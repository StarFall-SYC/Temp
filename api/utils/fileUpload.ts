import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { Request } from 'express';
import { getCoverPath, ensureNovelDirectory } from './novelStorage.js';
import { getUserDir, getAvatarPath } from './userStorage.js';
import {
  processUploadedImage,
  cropToSquare,
  generateThumbnail,
} from './imageProcessor.js';

// 配置multer使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'));
  }
};

// 创建multer实例
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
});

// 保存封面图片
export async function saveCoverImage(
  username: string,
  novelTitle: string,
  fileBuffer: Buffer
): Promise<string> {
  try {
    // 确保小说目录存在
    await ensureNovelDirectory(username, novelTitle);

    // 获取临时文件路径
    const tempPath = path.join(
      process.cwd(),
      'temp',
      `cover-${Date.now()}.tmp`
    );
    await fs.writeFile(tempPath, fileBuffer);

    // 获取封面文件路径
    const coverPath = getCoverPath(username, novelTitle);

    // 处理图片：压缩并转换为WebP
    const result = await processUploadedImage(tempPath, coverPath, {
      width: 600,
      height: 900,
      quality: 85,
      format: 'webp',
      fit: 'cover',
    });

    // 删除临时文件
    await fs.unlink(tempPath).catch(() => {});

    if (!result.success) {
      throw new Error(result.error || '处理图片失败');
    }

    // 返回相对路径用于前端访问
    return `/api/novels/${username}/${novelTitle}/cover`;
  } catch (_error) {
    throw new Error('保存封面图片失败');
  }
}

// 获取封面图片
export async function getCoverImage(username: string, novelTitle: string): Promise<Buffer | null> {
  try {
    const coverPath = getCoverPath(username, novelTitle);
    const imageBuffer = await fs.readFile(coverPath);
    return imageBuffer;
  } catch (_error) {
    return null;
  }
}

// 删除封面图片
export async function deleteCoverImage(username: string, novelTitle: string): Promise<boolean> {
  try {
    const coverPath = getCoverPath(username, novelTitle);
    await fs.unlink(coverPath);
    return true;
  } catch (_error) {
    return false;
  }
}

// 检查封面图片是否存在
export async function coverImageExists(username: string, novelTitle: string): Promise<boolean> {
  try {
    const coverPath = getCoverPath(username, novelTitle);
    await fs.access(coverPath);
    return true;
  } catch (_error) {
    return false;
  }
}

// 验证图片文件类型
export function isValidImageType(mimetype: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(mimetype);
}

// 生成安全的文件名
export function sanitizeFileName(filename: string): string {
  // 移除特殊字符，只保留字母、数字、中文字符、点和连字符
  return filename.replace(/[^\w\u4e00-\u9fa5.-]/g, '_');
}

/**
 * 保存用户头像图片
 * @param username 用户名
 * @param fileBuffer 图片Buffer
 * @returns 头像URL
 */
export async function saveAvatarImage(username: string, fileBuffer: Buffer): Promise<string> {
  try {
    // 确保用户目录存在
    await fs.mkdir(getUserDir(username), { recursive: true });

    // 获取临时文件路径
    const tempPath = path.join(
      process.cwd(),
      'temp',
      `avatar-${Date.now()}.tmp`
    );
    await fs.writeFile(tempPath, fileBuffer);

    // 获取头像文件路径
    const avatarPath = getAvatarPath(username);

    // 处理图片：裁剪为正方形并压缩
    const result = await cropToSquare(tempPath, avatarPath, 256);

    // 删除临时文件
    await fs.unlink(tempPath).catch(() => {});

    if (!result.success) {
      throw new Error(result.error || '处理图片失败');
    }

    // 返回相对路径用于前端访问
    return `/api/auth/avatar/${username}`;
  } catch (_error) {
    throw new Error('保存头像图片失败');
  }
}

/**
 * 获取用户头像图片
 * @param username 用户名
 * @returns 图片Buffer或null
 */
export async function getAvatarImage(username: string): Promise<Buffer | null> {
  try {
    const avatarPath = getAvatarPath(username);
    const imageBuffer = await fs.readFile(avatarPath);
    return imageBuffer;
  } catch (_error) {
    return null;
  }
}
