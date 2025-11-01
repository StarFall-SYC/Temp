/**
 * useForm Hook
 * 用于管理表单状态、验证和提交
 */

import { useState, useCallback, ChangeEvent } from 'react';
import { validateForm, ValidationRule } from '../utils/errorHandler';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Record<string, string>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  loading: boolean;
  isDirty: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  reset: () => void;
  resetField: (field: keyof T) => void;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, onSubmit, validate } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [initialValuesRef] = useState(initialValues);

  // 检查是否有修改
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValuesRef);

  // 处理输入变化
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // 清除该字段的错误
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: '',
        }));
      }
    },
    [errors]
  );

  // 处理失焦事件
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // 验证单个字段
      if (validate) {
        const fieldErrors = validate(values);
        if (fieldErrors[name]) {
          setErrors((prev) => ({
            ...prev,
            [name]: fieldErrors[name],
          }));
        }
      }
    },
    [validate, values]
  );

  // 设置字段值
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // 设置字段错误
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  // 重置表单
  const reset = useCallback(() => {
    setValues(initialValuesRef);
    setErrors({});
    setTouched({});
  }, [initialValuesRef]);

  // 重置单个字段
  const resetField = useCallback(
    (field: keyof T) => {
      setValues((prev) => ({
        ...prev,
        [field]: initialValuesRef[field],
      }));
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
      setTouched((prev) => ({
        ...prev,
        [field]: false,
      }));
    },
    [initialValuesRef]
  );

  // 提交表单
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 验证表单
      if (validate) {
        const newErrors = validate(values);
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
        }
      }

      setLoading(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setLoading(false);
      }
    },
    [values, validate, onSubmit]
  );

  return {
    values,
    errors,
    touched,
    loading,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
    resetField,
  };
}
