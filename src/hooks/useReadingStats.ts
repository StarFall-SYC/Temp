/**
 * 阅读统计管理Hook
 */
import { useState, useEffect, useRef } from 'react';

export interface ReadingStats {
  totalReadingTime: number; // 总阅读时间（秒）
  currentSessionTime: number; // 当前会话时间（秒）
  wordsRead: number; // 已读字数
  chaptersRead: number; // 已读章节数
  averageReadingSpeed: number; // 平均阅读速度（字/分钟）
  readingStreak: number; // 连续阅读天数
  lastReadDate: string; // 最后阅读日期
  dailyGoal: number; // 每日阅读目标（分钟）
  weeklyStats: { date: string; minutes: number }[]; // 一周阅读统计
}

const DEFAULT_STATS: ReadingStats = {
  totalReadingTime: 0,
  currentSessionTime: 0,
  wordsRead: 0,
  chaptersRead: 0,
  averageReadingSpeed: 300, // 默认300字/分钟
  readingStreak: 0,
  lastReadDate: '',
  dailyGoal: 30, // 默认30分钟
  weeklyStats: [],
};

const STORAGE_KEY = 'reading-stats';

export const useReadingStats = () => {
  const [stats, setStats] = useState<ReadingStats>(DEFAULT_STATS);
  const [isReading, setIsReading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 从localStorage加载统计数据
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedStats = JSON.parse(saved);
        setStats({ ...DEFAULT_STATS, ...parsedStats });
      }
    } catch (error) {
      console.error('Failed to load reading stats:', error);
    }
  }, []);

  // 保存统计数据到localStorage
  const saveStats = (newStats: Partial<ReadingStats>) => {
    const updatedStats = { ...stats, ...newStats };
    setStats(updatedStats);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Failed to save reading stats:', error);
    }
  };

  // 开始阅读计时
  const startReading = () => {
    if (!isReading) {
      setIsReading(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setStats((prev) => ({
          ...prev,
          currentSessionTime: prev.currentSessionTime + 1,
        }));
      }, 1000);
    }
  };

  // 停止阅读计时
  const stopReading = () => {
    if (isReading && timerRef.current) {
      setIsReading(false);
      clearInterval(timerRef.current);

      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const today = new Date().toISOString().split('T')[0];

      // 更新统计数据
      const updatedStats = {
        ...stats,
        totalReadingTime: stats.totalReadingTime + sessionTime,
        lastReadDate: today,
      };

      // 更新连续阅读天数
      if (stats.lastReadDate !== today) {
        const lastDate = new Date(stats.lastReadDate);
        const currentDate = new Date(today);
        const daysDiff = Math.floor(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          updatedStats.readingStreak = stats.readingStreak + 1;
        } else if (daysDiff > 1) {
          updatedStats.readingStreak = 1;
        }
      }

      // 更新一周统计
      const weeklyStats = [...stats.weeklyStats];
      const todayIndex = weeklyStats.findIndex((item) => item.date === today);
      const sessionMinutes = Math.floor(sessionTime / 60);

      if (todayIndex >= 0) {
        weeklyStats[todayIndex].minutes += sessionMinutes;
      } else {
        weeklyStats.push({ date: today, minutes: sessionMinutes });
        // 只保留最近7天的数据
        if (weeklyStats.length > 7) {
          weeklyStats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          weeklyStats.splice(7);
        }
      }

      updatedStats.weeklyStats = weeklyStats;
      saveStats(updatedStats);
    }
  };

  // 记录阅读进度
  const recordProgress = (wordsRead: number, chapterCompleted: boolean = false) => {
    const newWordsRead = stats.wordsRead + wordsRead;
    const newChaptersRead = chapterCompleted ? stats.chaptersRead + 1 : stats.chaptersRead;

    // 计算平均阅读速度
    const totalMinutes = stats.totalReadingTime / 60;
    const averageSpeed =
      totalMinutes > 0 ? Math.round(newWordsRead / totalMinutes) : stats.averageReadingSpeed;

    saveStats({
      wordsRead: newWordsRead,
      chaptersRead: newChaptersRead,
      averageReadingSpeed: averageSpeed,
    });
  };

  // 设置每日目标
  const setDailyGoal = (minutes: number) => {
    saveStats({ dailyGoal: minutes });
  };

  // 获取今日阅读时间
  const getTodayReadingTime = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats.weeklyStats.find((item) => item.date === today);
    return todayStats ? todayStats.minutes : 0;
  };

  // 获取今日目标完成度
  const getTodayProgress = () => {
    const todayMinutes = getTodayReadingTime();
    return Math.min((todayMinutes / stats.dailyGoal) * 100, 100);
  };

  // 获取一周总阅读时间
  const getWeeklyTotal = () => {
    return stats.weeklyStats.reduce((total, day) => total + day.minutes, 0);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // 格式化分钟
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    } else {
      return `${mins}分钟`;
    }
  };

  // 重置统计数据
  const resetStats = () => {
    setStats(DEFAULT_STATS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset reading stats:', error);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    stats,
    isReading,
    startReading,
    stopReading,
    recordProgress,
    setDailyGoal,
    getTodayReadingTime,
    getTodayProgress,
    getWeeklyTotal,
    formatTime,
    formatMinutes,
    resetStats,
  };
};
