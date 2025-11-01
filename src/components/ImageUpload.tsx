/**
 * 图片上传组件
 * 支持图片压缩、预览和验证
 */

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  compressImage,
  cropImageToSquare,
  generatePreviewUrl,
  validateImageFile,
  formatFileSize,
  calculateCompressionRatio,
} from '../utils/imageCompression';
import LoadingButton from './LoadingButton';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImagePreview?: (url: string) => void;
  maxSize?: number;
  aspectRatio?: 'square' | 'free';
  compress?: boolean;
  cropToSquare?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImagePreview,
  maxSize = 5 * 1024 * 1024,
  aspectRatio = 'free',
  compress = true,
  cropToSquare: shouldCropToSquare = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // 验证文件
      const validation = validateImageFile(file, maxSize);
      if (!validation.valid) {
        setError(validation.error);
        setLoading(false);
        return;
      }

      setOriginalSize(file.size);

      // 生成预览
      const previewUrl = await generatePreviewUrl(file);
      setPreview(previewUrl);
      onImagePreview?.(previewUrl);

      let processedFile = file;

      // 裁剪为正方形
      if (shouldCropToSquare) {
        processedFile = await cropImageToSquare(processedFile);
      }

      // 压缩图片
      if (compress) {
        processedFile = await compressImage(processedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.85,
        });
        setCompressedSize(processedFile.size);
      }

      onImageSelect(processedFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : '处理图片失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    setOriginalSize(0);
    setCompressedSize(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const compressionRatio = originalSize > 0 ? calculateCompressionRatio(originalSize, compressedSize || originalSize) : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />

        {!preview ? (
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-700 font-medium mb-1">点击或拖拽上传图片</p>
            <p className="text-gray-500 text-sm">支持 JPEG, PNG, GIF, WebP 格式</p>
            <p className="text-gray-500 text-sm">最大文件大小: {formatFileSize(maxSize)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg object-cover"
            />
            <div className="text-sm text-gray-600">
              {originalSize > 0 && (
                <p>原始大小: {formatFileSize(originalSize)}</p>
              )}
              {compressedSize > 0 && (
                <>
                  <p>压缩后: {formatFileSize(compressedSize)}</p>
                  <p className="text-cyan-600 font-medium">
                    压缩率: {compressionRatio}%
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <div className="text-red-600 mt-0.5">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-red-800 font-medium">上传失败</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      {preview && (
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            清除
          </button>
          <LoadingButton
            onClick={() => fileInputRef.current?.click()}
            loading={loading}
            variant="primary"
            className="flex-1"
          >
            重新上传
          </LoadingButton>
        </div>
      )}

      {!preview && (
        <LoadingButton
          onClick={() => fileInputRef.current?.click()}
          loading={loading}
          variant="primary"
          fullWidth
        >
          选择图片
        </LoadingButton>
      )}
    </div>
  );
};

export default ImageUpload;

