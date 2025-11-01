/**
 * 阅读设置管理Hook
 */
import { useState, useEffect } from 'react';

export interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia' | 'night';
  fontFamily: 'system' | 'serif' | 'mono';
  textAlign: 'left' | 'center' | 'justify';
  readingMode: 'normal' | 'focus' | 'immersive';
  autoScroll: boolean;
  scrollSpeed: number;
  showProgress: boolean;
  enableSpeech: boolean;
  pageWidth: 'narrow' | 'normal' | 'wide';
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  enableNightMode: boolean;
  autoNightMode: boolean;
  nightModeStart: string;
  nightModeEnd: string;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  fontSize: 16,
  lineHeight: 1.8,
  theme: 'light',
  fontFamily: 'system',
  textAlign: 'justify',
  readingMode: 'normal',
  autoScroll: false,
  scrollSpeed: 50,
  showProgress: true,
  enableSpeech: false,
  pageWidth: 'normal',
  showLineNumbers: false,
  highlightCurrentLine: false,
  enableNightMode: false,
  autoNightMode: false,
  nightModeStart: '22:00',
  nightModeEnd: '06:00',
};

const STORAGE_KEY = 'reading-settings';

export const useReadingSettings = () => {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_SETTINGS);

  // 从localStorage加载设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load reading settings:', error);
    }
  }, []);

  // 保存设置到localStorage
  const saveSettings = (newSettings: Partial<ReadingSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save reading settings:', error);
    }
  };

  // 重置设置
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset reading settings:', error);
    }
  };

  // 获取主题样式类
  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          contentBg: 'bg-gray-800',
          text: 'text-gray-100',
          headerBg: 'bg-gray-800/95 backdrop-blur-sm border-gray-700',
          buttonBg: 'bg-gray-700 hover:bg-gray-600',
          borderColor: 'border-gray-700',
          accent: 'text-blue-400',
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          contentBg: 'bg-amber-25',
          text: 'text-amber-900',
          headerBg: 'bg-amber-100/95 backdrop-blur-sm border-amber-200',
          buttonBg: 'bg-amber-200 hover:bg-amber-300',
          borderColor: 'border-amber-200',
          accent: 'text-amber-700',
        };
      case 'night':
        return {
          bg: 'bg-black',
          contentBg: 'bg-gray-950',
          text: 'text-green-400',
          headerBg: 'bg-gray-950/95 backdrop-blur-sm border-gray-800',
          buttonBg: 'bg-gray-800 hover:bg-gray-700',
          borderColor: 'border-gray-800',
          accent: 'text-green-300',
        };
      default:
        return {
          bg: 'bg-gray-50',
          contentBg: 'bg-white',
          text: 'text-gray-800',
          headerBg: 'bg-white/95 backdrop-blur-sm border-gray-200',
          buttonBg: 'bg-gray-100 hover:bg-gray-200',
          borderColor: 'border-gray-200',
          accent: 'text-blue-600',
        };
    }
  };

  // 获取字体族样式类
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  // 获取文本对齐样式类
  const getTextAlignClass = () => {
    switch (settings.textAlign) {
      case 'center':
        return 'text-center';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  // 获取页面宽度样式类
  const getPageWidthClass = () => {
    switch (settings.pageWidth) {
      case 'narrow':
        return 'max-w-2xl';
      case 'wide':
        return 'max-w-6xl';
      default:
        return 'max-w-4xl';
    }
  };

  // 检查是否应该启用夜间模式
  const shouldEnableNightMode = () => {
    if (!settings.autoNightMode) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.nightModeStart.split(':').map(Number);
    const [endHour, endMin] = settings.nightModeEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // 自动切换夜间模式
  useEffect(() => {
    if (settings.autoNightMode) {
      const shouldBeNight = shouldEnableNightMode();
      const currentTheme = shouldBeNight ? 'night' : 'light';

      if (settings.theme !== currentTheme) {
        saveSettings({ theme: currentTheme });
      }
    }
  }, [settings.autoNightMode, settings.nightModeStart, settings.nightModeEnd]);

  return {
    settings,
    saveSettings,
    resetSettings,
    getThemeClasses,
    getFontFamilyClass,
    getTextAlignClass,
    getPageWidthClass,
    shouldEnableNightMode,
  };
};
