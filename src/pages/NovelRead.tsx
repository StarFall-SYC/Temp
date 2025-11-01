/**
 * 小说阅读页面
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
  Settings,
  ArrowLeft,
  Bookmark,
  Share2,
  MessageCircle,
  Heart,
  Clock,
  Type,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNovelStore } from '../store/novelStore';
import type { Novel, Chapter } from '../../shared/types';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { useReadingStats } from '../hooks/useReadingStats';
import ReadingSettingsPanel from '../components/ReadingSettingsPanel';

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
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const {
    settings,
    saveSettings,
    getThemeClasses,
    getFontFamilyClass,
    getTextAlignClass,
    getPageWidthClass,
  } = useReadingSettings();
  const { startReading, stopReading, recordProgress, stats, formatTime } = useReadingStats();

  useEffect(() => {
    if (!username || !title || !chapterNum) {
      navigate('/');
      return;
    }

    fetchNovelDetail(username, title);
  }, [username, title, fetchNovelDetail, navigate]);

  useEffect(() => {
    const foundNovel = novels.find((n) => n.author === username && n.title === title);
    if (foundNovel) {
      setNovel(foundNovel);
      const chapterIdx = parseInt(chapterNum || '1') - 1;
      if (foundNovel.chapters && foundNovel.chapters[chapterIdx]) {
        setCurrentChapter(foundNovel.chapters[chapterIdx]);
        setChapterIndex(chapterIdx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        startReading(); // 开始阅读计时
      } else {
        toast.error('章节不存在');
        navigate(`/novel/${username}/${title}`);
      }
    }
    return () => stopReading(); // 离开页面时停止计时
  }, [novels, username, title, chapterNum, navigate, startReading, stopReading]);

  // 监听滚动进度并记录字数
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current && currentChapter) {
        const element = contentRef.current;
        const scrollTop = window.pageYOffset;
        const scrollHeight = element.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);

        // 估算已读字数
        const totalWords = currentChapter.content?.length || 0;
        const wordsRead = Math.floor(totalWords * (progress / 100));
        recordProgress(wordsRead); // 记录阅读进度
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentChapter, recordProgress]);

  // 自动滚动
  useEffect(() => {
    if (settings.autoScroll) {
      autoScrollRef.current = setInterval(() => {
        window.scrollBy(0, 1);
      }, settings.scrollSpeed);
    } else {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    }
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [settings.autoScroll, settings.scrollSpeed]);

  const goToChapter = (index: number) => {
    if (!novel || !novel.chapters || index < 0 || index >= novel.chapters.length) {
      return;
    }
    navigate(`/read/${username}/${title}/${index + 1}`);
    setShowChapterList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="mb-6 leading-relaxed"
        style={{ textIndent: '2em' }}
      >
        {paragraph.trim() || '\u00A0'}
      </motion.p>
    ));
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? '已取消收藏' : '已添加到书签');
  };

  const shareChapter = () => {
    if (navigator.share) {
      navigator.share({
        title: `${novel?.title} - 第${chapterIndex + 1}章 ${currentChapter?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
  const fontFamilyClass = getFontFamilyClass();
  const textAlignClass = getTextAlignClass();
  const pageWidthClass = getPageWidthClass();

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${themeClasses.bg} ${fontFamilyClass}`}
    >
      {/* 阅读进度条 */}
      {settings.showProgress && (
        <motion.div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50"
          style={{
            width: `${(window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`,
          }}
          initial={{ width: 0 }}
          animate={{
            width: `${(window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`,
          }}
        />
      )}

      {/* Header */}
      <AnimatePresence>
        {settings.readingMode !== 'immersive' && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`shadow-lg border-b sticky top-0 z-40 transition-all duration-300 ${themeClasses.headerBg}`}
          >
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Link
                      to={`/novel/${username}/${title}`}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${themeClasses.text} hover:bg-opacity-80`}
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
                  {/* 阅读统计 */}
                  <div
                    className={`hidden md:flex items-center space-x-4 text-sm ${themeClasses.text} opacity-70`}
                  >
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(stats.currentSessionTime)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Type className="w-4 h-4" />
                      <span>{(currentChapter.content?.length || 0).toLocaleString()}字</span>
                    </span>
                  </div>

                  {/* 工具按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleBookmark}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      isBookmarked ? 'text-red-500' : themeClasses.text
                    } ${themeClasses.buttonBg}`}
                    title="书签"
                  >
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={shareChapter}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                    title="分享"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowChapterList(!showChapterList)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                    title="章节目录"
                  >
                    <List className="h-5 w-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettingsPanel(true)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                    title="阅读设置"
                  >
                    <Settings className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-96 shadow-2xl overflow-y-auto ${themeClasses.contentBg}`}
            >
              <div className={`p-6 border-b ${themeClasses.borderColor}`}>
                <h2 className={`text-xl font-bold ${themeClasses.text}`}>章节目录</h2>
                <p className={`text-sm opacity-70 mt-1 ${themeClasses.text}`}>
                  共 {novel.chapters?.length || 0} 章
                </p>
              </div>

              <div className="p-4">
                {novel.chapters?.map((chapter, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToChapter(index)}
                    className={`w-full text-left p-4 rounded-xl mb-2 transition-all ${
                      index === chapterIndex
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : `hover:bg-opacity-80 ${themeClasses.text} ${themeClasses.buttonBg}`
                    }`}
                  >
                    <div className="font-semibold truncate mb-1">
                      第{index + 1}章 {chapter.title}
                    </div>
                    <div
                      className={`text-xs opacity-70 ${
                        index === chapterIndex ? 'text-white' : themeClasses.text
                      }`}
                    >
                      {new Date(chapter.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <ReadingSettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
      />

      {/* Content */}
      <div className={`transition-all duration-500 ${pageWidthClass} mx-auto px-4 py-8`}>
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl shadow-xl p-8 md:p-12 transition-all duration-500 ${themeClasses.contentBg}`}
        >
          {/* Chapter Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-center mb-12 pb-8 border-b-2 ${themeClasses.borderColor}`}
          >
            <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${themeClasses.text}`}>
              第{chapterIndex + 1}章 {currentChapter.title}
            </h1>
            <div
              className={`flex items-center justify-center space-x-6 text-sm opacity-70 ${themeClasses.text}`}
            >
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(currentChapter.createdAt).toLocaleDateString('zh-CN')}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Type className="w-4 h-4" />
                <span>{(currentChapter.content?.length || 0).toLocaleString()} 字</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  约 {Math.ceil((currentChapter.content?.length || 0) / stats.averageReadingSpeed)}{' '}
                  分钟
                </span>
              </span>
            </div>
          </motion.div>

          {/* Chapter Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`prose prose-lg max-w-none ${themeClasses.text} ${textAlignClass}`}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            {formatContent(currentChapter.content || '')}
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`flex items-center justify-between mt-16 pt-8 border-t-2 ${themeClasses.borderColor}`}
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevChapter}
              disabled={chapterIndex === 0}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                chapterIndex === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : `${themeClasses.buttonBg} ${themeClasses.text} hover:shadow-lg`
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>上一章</span>
            </motion.button>

            <div className={`text-center ${themeClasses.text} opacity-70`}>
              <div className="text-sm">
                {chapterIndex + 1} / {novel.chapters?.length || 0}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextChapter}
              disabled={!novel.chapters || chapterIndex >= novel.chapters.length - 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                !novel.chapters || chapterIndex >= novel.chapters.length - 1
                  ? 'opacity-50 cursor-not-allowed'
                  : `${themeClasses.buttonBg} ${themeClasses.text} hover:shadow-lg`
              }`}
            >
              <span>下一章</span>
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* 浮动操作按钮 (沉浸模式) */}
      {settings.readingMode === 'immersive' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 flex flex-col space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettingsPanel(true)}
            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChapterList(true)}
            className="w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <List className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default NovelRead;
