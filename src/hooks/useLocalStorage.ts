import { useState, useEffect } from 'react';

/**
 * 本地存储 Hook
 * @param key 存储键
 * @param initialValue 初始值
 * @returns [value, setValue] 存储值和设置函数
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // 从本地存储中获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 设置本地存储值的函数
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

