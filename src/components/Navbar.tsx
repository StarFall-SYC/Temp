/**
 * 导航栏组件
 */
import { Link, useNavigate } from 'react-router-dom';
import { User, BookOpen, PenTool, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-effect sticky top-0 z-50 border-b border-white/20"
    >
      <div className="container mx-auto px-4 navbar-mobile">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold gradient-text hover:scale-105 transition-transform"
            onClick={closeMobileMenu}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <BookOpen className="h-6 w-6" />
            </motion.div>
            <span className="font-serif navbar-brand">玉扶疏小说网</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 navbar-links">
            <Link 
              to="/" 
              className="relative text-gray-700 hover:text-cyan-600 transition-colors font-medium group navbar-link"
            >
              首页
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-cyan-600 transition-colors font-medium group"
                >
                  <PenTool className="h-4 w-4 group-hover:animate-pulse" />
                  <span>创作中心</span>
                </Link>
                
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-1 text-gray-700 hover:text-cyan-600 transition-colors font-medium"
                >
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出</span>
                </motion.button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-cyan-600 transition-colors font-medium"
                >
                  登录
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    to="/register" 
                    className="gradient-button px-6 py-2 rounded-full font-medium shadow-lg"
                  >
                    注册
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-white/20 transition-colors"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-white/20"
            >
              <div className="flex flex-col space-y-3">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2 block"
                    onClick={closeMobileMenu}
                  >
                    首页
                  </Link>
                </motion.div>
                
                {user ? (
                  <>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Link 
                        to="/profile" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2"
                        onClick={closeMobileMenu}
                      >
                        <PenTool className="h-4 w-4" />
                        <span>创作中心</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link 
                        to="/profile" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2"
                        onClick={closeMobileMenu}
                      >
                        <User className="h-4 w-4" />
                        <span>{user.username}</span>
                      </Link>
                    </motion.div>
                    
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors font-medium py-2 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>退出</span>
                      </button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Link 
                        to="/login" 
                        className="text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2 block"
                        onClick={closeMobileMenu}
                      >
                        登录
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link 
                        to="/register" 
                        className="gradient-button px-4 py-2 rounded-full font-medium text-center block"
                        onClick={closeMobileMenu}
                      >
                        注册
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;