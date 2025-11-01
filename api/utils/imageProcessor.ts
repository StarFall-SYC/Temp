/**
 * 服务器端图片处理工具
 * 支持图片压缩、裁剪和WebP转换
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * 处理上传的图片：压缩、转换为WebP
 */
export async function processUploadedImage(
  inputPath: string,
  outputPath: string,
  options: ImageProcessingOptions = {}
): Promise<{ success: boolean; size: number; error?: string }> {
  try {
    const {
      width = 1920,
      height = 1920,
      quality = 80,
      format = 'webp',
      fit = 'inside',
    } = options;

    let pipeline = sharp(inputPath);

    // 调整大小
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true,
      });
    }

    // 转换格式并设置质量
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }

    // 保存文件
    await pipeline.toFile(outputPath);

    // 获取文件大小
    const stats = await fs.stat(outputPath);

    return {
      success: true,
      size: stats.size,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '图片处理失败';
    console.error('图片处理错误:', message);
    return {
      success: false,
      size: 0,
      error: message,
    };
  }
}

/**
 * 生成图片缩略图
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  width: number = 300,
  height: number = 300
): Promise<{ success: boolean; error?: string }> {
  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成缩略图失败';
    console.error('缩略图生成错误:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 批量处理图片（生成多个尺寸）
 */
export async function generateResponsiveImages(
  inputPath: string,
  outputDir: string,
  baseName: string
): Promise<{ success: boolean; files: string[]; error?: string }> {
  try {
    const files: string[] = [];

    // 定义不同尺寸
    const sizes = [
      { width: 300, height: 450, name: 'sm' },
      { width: 400, height: 600, name: 'md' },
      { width: 600, height: 900, name: 'lg' },
    ];

    for (const size of sizes) {
      const outputPath = path.join(
        outputDir,
        `${baseName}-${size.name}.webp`
      );

      const result = await processUploadedImage(inputPath, outputPath, {
        width: size.width,
        height: size.height,
        quality: 85,
        format: 'webp',
        fit: 'cover',
      });

      if (result.success) {
        files.push(outputPath);
      }
    }

    return {
      success: files.length > 0,
      files,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成响应式图片失败';
    console.error('响应式图片生成错误:', message);
    return {
      success: false,
      files: [],
      error: message,
    };
  }
}

/**
 * 获取图片元数据
 */
export async function getImageMetadata(
  imagePath: string
): Promise<{ width: number; height: number; format: string; size: number } | null> {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
    };
  } catch (error) {
    console.error('获取图片元数据错误:', error);
    return null;
  }
}

/**
 * 裁剪图片为正方形（用于头像）
 */
export async function cropToSquare(
  inputPath: string,
  outputPath: string,
  size: number = 256
): Promise<{ success: boolean; error?: string }> {
  try {
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const squareSize = Math.min(width, height);
    const left = Math.floor((width - squareSize) / 2);
    const top = Math.floor((height - squareSize) / 2);

    await sharp(inputPath)
      .extract({
        left,
        top,
        width: squareSize,
        height: squareSize,
      })
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(outputPath);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '裁剪图片失败';
    console.error('图片裁剪错误:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 转换图片格式
 */
export async function convertImageFormat(
  inputPath: string,
  outputPath: string,
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): Promise<{ success: boolean; error?: string }> {
  try {
    let pipeline = sharp(inputPath);

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: 85 });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: 85, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }

    await pipeline.toFile(outputPath);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '格式转换失败';
    console.error('图片格式转换错误:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * 删除图片文件
 */
export async function deleteImage(imagePath: string): Promise<boolean> {
  try {
    await fs.unlink(imagePath);
    return true;
  } catch (error) {
    console.error('删除图片错误:', error);
    return false;
  }
}

/**
 * 计算图片压缩比
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

