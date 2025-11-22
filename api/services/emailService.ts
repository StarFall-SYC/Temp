/**
 * 邮件服务
 * 提供验证码发送和验证功能
 */

// 存储验证码的临时对象（生产环境应使用Redis等持久化存储）
const verificationCodes: Map<string, { code: string; expires: number }> = new Map();

/**
 * 发送验证码到指定邮箱
 * @param email 邮箱地址
 * @returns Promise<{success: boolean; message: string}> 发送结果
 */
export async function sendVerificationCode(email: string): Promise<{success: boolean; message: string}> {
  try {
    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 设置验证码过期时间（5分钟）
    const expires = Date.now() + 5 * 60 * 1000;

    // 存储验证码
    verificationCodes.set(email, { code, expires });

    // 在实际项目中，这里应该调用邮件服务API发送邮件
    // 目前为了演示，我们只在控制台输出验证码
    console.log(`验证码已发送到 ${email}: ${code}`);

    return { success: true, message: '验证码已发送，请检查您的邮箱' };
  } catch (error) {
    console.error('发送验证码失败:', error);
    return { success: false, message: '发送验证码失败，请稍后重试' };
  }
}

/**
 * 验证邮箱验证码
 * @param email 邮箱地址
 * @param code 验证码
 * @returns {success: boolean; message: string} 验证结果
 */
export function verifyCode(email: string, code: string): {success: boolean; message: string} {
  const stored = verificationCodes.get(email);

  if (!stored) {
    return { success: false, message: '验证码不存在或已过期' };
  }

  // 检查验证码是否过期
  if (Date.now() > stored.expires) {
    verificationCodes.delete(email);
    return { success: false, message: '验证码已过期' };
  }

  // 验证码匹配
  if (stored.code === code) {
    verificationCodes.delete(email);
    return { success: true, message: '验证码验证成功' };
  }

  return { success: false, message: '验证码不正确' };
}

/**
 * 清理过期的验证码
 */
export function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  }
}

// 每分钟清理一次过期验证码
setInterval(cleanupExpiredCodes, 60 * 1000);

