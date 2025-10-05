/**
 * 登录页面
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Mail, Lock, Send, Clock, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'verification'>('password');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { login, setUser, user, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // 如果已登录，重定向到首页
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // 清除错误信息
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // 倒计时效果（60秒）
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      toast.error('请先输入邮箱地址');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('邮箱格式不正确');
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await axios.post('/api/auth/send-verification-code', {
        email: formData.email
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setCountdown(60); // 60秒倒计时
      } else {
        toast.error(response.data.message);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '发送验证码失败';
      toast.error(message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMethod === 'password') {
      if (!formData.email || !formData.password) {
        toast.error('请填写邮箱和密码');
        return;
      }
    } else {
      if (!formData.email || !formData.verificationCode) {
        toast.error('请填写邮箱和验证码');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      if (loginMethod === 'password') {
        const success = await login(formData.email, formData.password);
        if (success) {
          toast.success('登录成功！');
          navigate('/');
        }
      } else {
        // 邮箱验证码登录
        const response = await axios.post('/api/auth/login-with-code', {
          email: formData.email,
          verificationCode: formData.verificationCode
        });
        
        if (response.data.success) {
          // 手动设置用户状态
          const { user, token } = response.data.data;
          setUser(user, token);
          toast.success('登录成功！');
          navigate('/');
        } else {
          toast.error(response.data.message);
          return;
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '登录失败';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-full mb-4">
            <LogIn className="h-8 w-8 text-cyan-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h1>
          <p className="text-gray-600">登录您的账户继续阅读</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 登录方式切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                loginMethod === 'password'
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>密码登录</span>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLoginMethod('verification')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                loginMethod === 'verification'
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>验证码登录</span>
            </motion.button>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="请输入邮箱地址"
                required
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loginMethod === 'password' ? (
              <motion.div
                key="password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="请输入密码"
                    required={loginMethod === 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="verification"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱验证码
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required={loginMethod === 'verification'}
                      value={formData.verificationCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="请输入验证码"
                      maxLength={6}
                    />
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendVerificationCode}
                    disabled={isSendingCode || countdown > 0}
                    className="px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 min-w-[120px] justify-center"
                  >
                    {isSendingCode ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : countdown > 0 ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>{countdown}s</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>发送</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 text-white py-3 px-4 rounded-lg hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                登录中...
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            还没有账户？{' '}
            <Link 
              to="/register" 
              className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;