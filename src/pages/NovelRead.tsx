/**
 * 小说阅读页面
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, List, Settings, ArrowLeft, Moon, Sun, Palette, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNovelStore } from '../store/novelStore';
import type { Novel, Chapter } from '../../shared/types';

const NovelRead = () => {
  const { username, title, chapterNum } = useParams<{ 
    username: string; 
    title: string; 
    chapterNum: string; 
  }>();
  const { novels, loading, fetchNovelDetail } = useNovelStore();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [showChapterList, setShowChapterList] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [readingMode, setReadingMode] = useState<'normal' | 'focus'>('normal');

  useEffect(() => {
    if (!username || !title || !chapterNum) {
      navigate('/');
      return;
    }

    fetchNovelDetail(username, title);
  }, [username, title, fetchNovelDetail, navigate]);

  useEffect(() => {
    // 从store中找到对应的小说
    const foundNovel = novels.find(
      n => n.author === username && n.title === title
    );
    if (foundNovel) {
      setNovel(foundNovel);
      
      // 设置当前章节
      const chapterIdx = parseInt(chapterNum || '1') - 1;
      if (foundNovel.chapters && foundNovel.chapters[chapterIdx]) {
        setCurrentChapter(foundNovel.chapters[chapterIdx]);
        setChapterIndex(chapterIdx);
      } else {
        toast.error('章节不存在');
        navigate(`/novel/${username}/${title}`);
      }
    }
  }, [novels, username, title, chapterNum, navigate]);

  const goToChapter = (index: number) => {
    if (!novel || !novel.chapters || index < 0 || index >= novel.chapters.length) {
      return;
    }
    
    navigate(`/read/${username}/${title}/${index + 1}`);
    setShowChapterList(false);
  };

  const goToPrevChapter = () => {
    if (chapterIndex > 0) {
      goToChapter(chapterIndex - 1);
    }
  };

  const goToNextChapter = () => {
    if (novel && novel.chapters && chapterIndex < novel.chapters.length - 1) {
      goToChapter(chapterIndex + 1);
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-4 text-justify leading-relaxed">
        {paragraph.trim() || '\u00A0'}
      </p>
    ));
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          contentBg: 'bg-gray-800',
          text: 'text-gray-100',
          headerBg: 'bg-gray-800 border-gray-700',
          buttonBg: 'bg-gray-700 hover:bg-gray-600',
          borderColor: 'border-gray-700'
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          contentBg: 'bg-amber-25',
          text: 'text-amber-900',
          headerBg: 'bg-amber-100 border-amber-200',
          buttonBg: 'bg-amber-200 hover:bg-amber-300',
          borderColor: 'border-amber-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          contentBg: 'bg-white',
          text: 'text-gray-800',
          headerBg: 'bg-white border-gray-200',
          buttonBg: 'bg-gray-100 hover:bg-gray-200',
          borderColor: 'border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!novel || !currentChapter) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl text-gray-600 mb-2">章节不存在</h1>
        <p className="text-gray-500 mb-6">您要查找的章节可能已被删除或不存在</p>
        <Link 
          to="/"
          className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
        >
          返回首页
        </Link>
      </div>
    );
  }

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.bg}`}>
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`shadow-sm border-b sticky top-0 z-40 transition-colors duration-300 ${themeClasses.headerBg}`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link 
                  to={`/novel/${username}/${title}`}
                  className={`p-2 rounded-lg transition-colors ${themeClasses.text} hover:bg-opacity-80`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </motion.div>
              
              <div>
                <h1 className={`font-bold truncate max-w-xs ${themeClasses.text}`}>
                  {novel.title}
                </h1>
                <p className={`text-sm opacity-70 ${themeClasses.text}`}>
                  第{chapterIndex + 1}章 {currentChapter.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowChapterList(!showChapterList)}
                className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                title="章节目录"
              >
                <List className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                title="阅读设置"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chapter List Sidebar */}
      <AnimatePresence>
        {showChapterList && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-black bg-opacity-50"
              onClick={() => setShowChapterList(false)}
            ></motion.div>
            
            <motion.div 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`w-80 shadow-xl overflow-y-auto ${themeClasses.contentBg}`}
            >
              <div className={`p-4 border-b ${themeClasses.borderColor}`}>
                <h2 className={`font-bold ${themeClasses.text}`}>章节目录</h2>
              </div>
              
              <div className="p-2">
                {novel.chapters?.map((chapter, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToChapter(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === chapterIndex
                        ? 'bg-cyan-100 text-cyan-900'
                        : `hover:bg-opacity-80 ${themeClasses.text} ${themeClasses.buttonBg}`
                    }`}
                  >
                    <div className="font-medium truncate">
                      第{index + 1}章 {chapter.title}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowSettings(false)}
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`rounded-xl shadow-xl p-6 w-80 relative ${themeClasses.contentBg}`}
            >
              <h2 className={`font-bold mb-6 ${themeClasses.text}`}>阅读设置</h2>
              
              <div className="space-y-6">
                {/* 主题选择 */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${themeClasses.text}`}>
                    <Palette className="inline h-4 w-4 mr-2" />
                    阅读主题
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'light', label: '浅色', icon: Sun, bg: 'bg-white', border: 'border-gray-300' },
                      { key: 'dark', label: '深色', icon: Moon, bg: 'bg-gray-800', border: 'border-gray-600' },
                      { key: 'sepia', label: '护眼', icon: Palette, bg: 'bg-amber-50', border: 'border-amber-300' }
                    ].map(({ key, label, icon: Icon, bg, border }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTheme(key as any)}
                        className={`p-3 rounded-lg border-2 transition-all ${bg} ${border} ${
                          theme === key ? 'ring-2 ring-cyan-500' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 字体大小 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    <Type className="inline h-4 w-4 mr-2" />
                    字体大小: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>小</span>
                    <span>大</span>
                  </div>
                </div>
                
                {/* 行间距 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                    行间距: {lineHeight}
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>紧密</span>
                    <span>宽松</span>
                  </div>
                </div>

                {/* 阅读模式 */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${themeClasses.text}`}>
                    阅读模式
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {[
                      { key: 'normal', label: '普通' },
                      { key: 'focus', label: '专注' }
                    ].map(({ key, label }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setReadingMode(key as any)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                          readingMode === key
                            ? 'bg-white text-cyan-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full gradient-button py-3 rounded-lg font-medium"
              >
                确定
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`max-w-4xl mx-auto px-4 py-8 ${readingMode === 'focus' ? 'max-w-2xl' : ''}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl shadow-lg p-8 transition-colors duration-300 ${themeClasses.contentBg}`}
        >
          {/* Chapter Title */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-center mb-8 pb-6 border-b ${themeClasses.borderColor}`}
          >
            <h1 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>
              第{chapterIndex + 1}章 {currentChapter.title}
            </h1>
            <p className={`opacity-70 ${themeClasses.text}`}>
              {new Date(currentChapter.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </motion.div>
          
          {/* Chapter Content */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`prose max-w-none ${themeClasses.text}`}
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight
            }}
          >
            {formatContent(currentChapter.content || '')}
          </motion.div>
          
          {/* Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`flex items-center justify-between mt-12 pt-6 border-t ${themeClasses.borderColor}`}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevChapter}
              disabled={chapterIndex === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.buttonBg} ${themeClasses.text}`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>上一章</span>
            </motion.button>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to={`/novel/${username}/${title}`}
                className="px-6 py-3 text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
              >
                返回目录
              </Link>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextChapter}
              disabled={!novel.chapters || chapterIndex >= novel.chapters.length - 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.buttonBg} ${themeClasses.text}`}
            >
              <span>下一章</span>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NovelRead;