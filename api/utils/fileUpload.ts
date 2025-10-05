import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';
import { getCoverPath, ensureNovelDirectory } from './novelStorage.js';

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
    
    // 获取封面文件路径
    const coverPath = getCoverPath(username, novelTitle);
    
    // 保存文件
    await fs.writeFile(coverPath, fileBuffer);
    
    // 返回相对路径用于前端访问
    return `/api/novels/${username}/${novelTitle}/cover`;
  } catch (error) {
    throw new Error('保存封面图片失败');
  }
}

// 获取封面图片
export async function getCoverImage(
  username: string,
  novelTitle: string
): Promise<Buffer | null> {
  try {
    const coverPath = getCoverPath(username, novelTitle);
    const imageBuffer = await fs.readFile(coverPath);
    return imageBuffer;
  } catch (error) {
    return null;
  }
}

// 删除封面图片
export async function deleteCoverImage(
  username: string,
  novelTitle: string
): Promise<boolean> {
  try {
    const coverPath = getCoverPath(username, novelTitle);
    await fs.unlink(coverPath);
    return true;
  } catch (error) {
    return false;
  }
}

// 检查封面图片是否存在
export async function coverImageExists(
  username: string,
  novelTitle: string
): Promise<boolean> {
  try {
    const coverPath = getCoverPath(username, novelTitle);
    await fs.access(coverPath);
    return true;
  } catch (error) {
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