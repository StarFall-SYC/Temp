/**
 * 错误处理工具类
 * 提供统一的错误处理和用户提示机制
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  originalError?: Error;
}

/**
 * 根据HTTP状态码判断错误类型
 */
export function getErrorType(statusCode?: number): ErrorType {
  if (!statusCode) return ErrorType.NETWORK;

  if (statusCode === 400) return ErrorType.VALIDATION;
  if (statusCode === 401) return ErrorType.AUTHENTICATION;
  if (statusCode === 403) return ErrorType.AUTHORIZATION;
  if (statusCode === 404) return ErrorType.NOT_FOUND;
  if (statusCode >= 500) return ErrorType.SERVER;

  return ErrorType.UNKNOWN;
}

/**
 * 获取用户友好的错误提示信息
 */
export function getUserFriendlyMessage(error: ApiError | Error | string): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // 检查是否是API错误
    if ('type' in error && 'message' in error) {
      const apiError = error as ApiError;
      return getErrorMessage(apiError.type, apiError.message);
    }
    return error.message || '发生未知错误';
  }

  if ('type' in error) {
    const apiError = error as ApiError;
    return getErrorMessage(apiError.type, apiError.message);
  }

  return '发生未知错误';
}

/**
 * 根据错误类型获取相应的提示信息
 */
function getErrorMessage(type: ErrorType, originalMessage?: string): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: '网络连接失败，请检查您的网络设置',
    [ErrorType.VALIDATION]: originalMessage || '输入信息有误，请检查后重试',
    [ErrorType.AUTHENTICATION]: '登录已过期，请重新登录',
    [ErrorType.AUTHORIZATION]: '您没有权限执行此操作',
    [ErrorType.NOT_FOUND]: '请求的资源不存在',
    [ErrorType.SERVER]: '服务器出错，请稍后重试',
    [ErrorType.UNKNOWN]: originalMessage || '发生未知错误',
  };

  return messages[type];
}

/**
 * 处理API响应错误
 */
export function handleApiError(error: any): ApiError {
  // 处理网络错误
  if (!error.response) {
    return {
      type: ErrorType.NETWORK,
      message: '网络连接失败',
      originalError: error,
    };
  }

  const { status, data } = error.response;
  const message = data?.message || data?.error || '请求失败';

  return {
    type: getErrorType(status),
    message,
    statusCode: status,
    originalError: error,
  };
}

/**
 * 验证表单数据
 */
export interface ValidationRule {
  field: string;
  value: any;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

export function validateForm(rules: ValidationRule[]): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const { field, value, rules: fieldRules } = rule;

    // 必填验证
    if (fieldRules.required && !value) {
      errors[field] = `${field}不能为空`;
      continue;
    }

    if (!value) continue;

    // 最小长度验证
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${field}长度不能少于${fieldRules.minLength}个字符`;
      continue;
    }

    // 最大长度验证
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${field}长度不能超过${fieldRules.maxLength}个字符`;
      continue;
    }

    // 正则表达式验证
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = `${field}格式不正确`;
      continue;
    }

    // 自定义验证
    if (fieldRules.custom) {
      const result = fieldRules.custom(value);
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : `${field}验证失败`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 创建API错误类
 */
export class ApiErrorClass extends Error implements ApiError {
  type: ErrorType;
  statusCode?: number;
  originalError?: Error;

  constructor(type: ErrorType, message: string, statusCode?: number, originalError?: Error) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.name = 'ApiError';
  }
}
