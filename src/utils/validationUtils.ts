/**
 * 验证工具函数集合
 * 提供常见的数据验证功能
 */

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 密码强度等级 (1-4)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;

  return Math.min(strength, 4);
}

/**
 * 验证用户名格式
 * @param username 用户名
 * @returns 是否有效
 */
export function isValidUsername(username: string): boolean {
  // 用户名长度 3-20，只包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * 验证 URL 格式
 * @param url URL 地址
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证中文字符
 * @param text 文本
 * @returns 是否包含中文
 */
export function containsChinese(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  return chineseRegex.test(text);
}

/**
 * 验证文件大小
 * @param file 文件
 * @param maxSize 最大大小（字节）
 * @returns 是否超过限制
 */
export function isFileTooLarge(file: File, maxSize: number): boolean {
  return file.size > maxSize;
}

/**
 * 验证文件类型
 * @param file 文件
 * @param allowedTypes 允许的 MIME 类型
 * @returns 是否允许
 */
export function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 获取验证错误信息
 * @param field 字段名
 * @param error 错误类型
 * @returns 错误信息
 */
export function getValidationErrorMessage(field: string, error: string): string {
  const messages: { [key: string]: { [key: string]: string } } = {
    email: {
      required: '邮箱不能为空',
      invalid: '邮箱格式不正确',
    },
    password: {
      required: '密码不能为空',
      tooShort: '密码长度至少 6 位',
      weak: '密码强度不足，请使用大小写字母、数字和特殊字符的组合',
    },
    username: {
      required: '用户名不能为空',
      invalid: '用户名长度 3-20，只能包含字母、数字和下划线',
    },
  };

  return messages[field]?.[error] || '输入不合法';
}

