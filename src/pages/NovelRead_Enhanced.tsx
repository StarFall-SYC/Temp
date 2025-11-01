/**
 * 优化后的小说阅读页面
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
  Moon,
  Sun,
  Palette,
  Type,
  Volume2,
  VolumeX,
  Bookmark,
  Share2,
  MessageCircle,
  Heart,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Clock,
  Target,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Download,
  Printer,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNovelStore } from '../store/novelStore';
import type { Novel, Chapter } from '../../shared/types';

interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia' | 'night';
  fontFamily: 'system' | 'serif' | 'mono';
  textAlign: 'left' | 'center' | 'justify';
  readingMode: 'normal' | 'focus' | 'immersive';
  autoScroll: boolean;
  scrollSpeed: number;
  showProgress: boolean;
  enableSpeech: boolean;
}

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
  const [showSettings, setShowSettings] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 16,
    lineHeight: 1.8,
    theme: 'light',
    fontFamily: 'system',
    textAlign: 'justify',
    readingMode: 'normal',
    autoScroll: false,
    scrollSpeed: 50,
    showProgress: true,
    enableSpeech: false,
  });

  useEffect(() => {
    if (!username || !title || !chapterNum) {
      navigate('/');
      return;
    }

    fetchNovelDetail(username, title);
  }, [username, title, fetchNovelDetail, navigate]);

  useEffect(() => {
    // 从store中找到对应的小说
    const foundNovel = novels.find((n) => n.author === username && n.title === title);
    if (foundNovel) {
      setNovel(foundNovel);

      // 设置当前章节
      const chapterIdx = parseInt(chapterNum || '1') - 1;
      if (foundNovel.chapters && foundNovel.chapters[chapterIdx]) {
        setCurrentChapter(foundNovel.chapters[chapterIdx]);
        setChapterIndex(chapterIdx);
        setWordCount(foundNovel.chapters[chapterIdx].content?.length || 0);

        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error('章节不存在');
        navigate(`/novel/${username}/${title}`);
      }
    }
  }, [novels, username, title, chapterNum, navigate]);

  // 监听滚动进度
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const scrollTop = window.pageYOffset;
        const scrollHeight = element.scrollHeight - window.innerHeight;
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 阅读计时器
  useEffect(() => {
    if (isReading) {
      readingTimerRef.current = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
    }

    return () => {
      if (readingTimerRef.current) {
        clearInterval(readingTimerRef.current);
      }
    };
  }, [isReading]);

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

  const updateSettings = (key: keyof ReadingSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const goToChapter = (index: number) => {
    if (!novel || !novel.chapters || index < 0 || index >= novel.chapters.length) {
      return;
    }

    navigate(`/read/${username}/${title}/${index + 1}`);
    setShowChapterList(false);

    // 滚动到页面顶部
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

  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          contentBg: 'bg-gray-800',
          text: 'text-gray-100',
          headerBg: 'bg-gray-800/95 backdrop-blur-sm border-gray-700',
          buttonBg: 'bg-gray-700 hover:bg-gray-600',
          borderColor: 'border-gray-700',
          accent: 'text-blue-400',
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          contentBg: 'bg-amber-25',
          text: 'text-amber-900',
          headerBg: 'bg-amber-100/95 backdrop-blur-sm border-amber-200',
          buttonBg: 'bg-amber-200 hover:bg-amber-300',
          borderColor: 'border-amber-200',
          accent: 'text-amber-700',
        };
      case 'night':
        return {
          bg: 'bg-black',
          contentBg: 'bg-gray-950',
          text: 'text-green-400',
          headerBg: 'bg-gray-950/95 backdrop-blur-sm border-gray-800',
          buttonBg: 'bg-gray-800 hover:bg-gray-700',
          borderColor: 'border-gray-800',
          accent: 'text-green-300',
        };
      default:
        return {
          bg: 'bg-gray-50',
          contentBg: 'bg-white',
          text: 'text-gray-800',
          headerBg: 'bg-white/95 backdrop-blur-sm border-gray-200',
          buttonBg: 'bg-gray-100 hover:bg-gray-200',
          borderColor: 'border-gray-200',
          accent: 'text-blue-600',
        };
    }
  };

  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  const getTextAlignClass = () => {
    switch (settings.textAlign) {
      case 'center':
        return 'text-center';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${themeClasses.bg} ${getFontFamilyClass()}`}
    >
      {/* 阅读进度条 */}
      {settings.showProgress && (
        <motion.div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50"
          style={{ width: `${readingProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${readingProgress}%` }}
        />
      )}

      {/* Header */}
      <AnimatePresence>
        {(showToolbar || settings.readingMode !== 'immersive') && (
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
                  {/* 阅读统计 */}
                  <div
                    className={`hidden md:flex items-center space-x-4 text-sm ${themeClasses.text} opacity-70`}
                  >
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(readingTime)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Type className="w-4 h-4" />
                      <span>{wordCount.toLocaleString()}字</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{Math.round(readingProgress)}%</span>
                    </span>
                  </div>

                  {/* 工具按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleBookmark}
                    className={`p-2 rounded-lg transition-colors ${
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
                    className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                    title="分享"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>

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

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowToolbar(!showToolbar)}
                    className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                    title={showToolbar ? '隐藏工具栏' : '显示工具栏'}
                  >
                    {showToolbar ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[80vh] overflow-y-auto relative ${themeClasses.contentBg}`}
            >
              <h2 className={`text-2xl font-bold mb-8 ${themeClasses.text}`}>阅读设置</h2>

              <div className="space-y-8">
                {/* 主题选择 */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${themeClasses.text}`}>
                    <Palette className="inline h-4 w-4 mr-2" />
                    阅读主题
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        key: 'light',
                        label: '浅色',
                        icon: Sun,
                        bg: 'bg-white',
                        text: 'text-gray-800',
                        border: 'border-gray-300',
                      },
                      {
                        key: 'dark',
                        label: '深色',
                        icon: Moon,
                        bg: 'bg-gray-800',
                        text: 'text-white',
                        border: 'border-gray-600',
                      },
                      {
                        key: 'sepia',
                        label: '护眼',
                        icon: Palette,
                        bg: 'bg-amber-50',
                        text: 'text-amber-900',
                        border: 'border-amber-300',
                      },
                      {
                        key: 'night',
                        label: '夜间',
                        icon: Moon,
                        bg: 'bg-black',
                        text: 'text-green-400',
                        border: 'border-gray-800',
                      },
                    ].map(({ key, label, icon: Icon, bg, text, border }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSettings('theme', key)}
                        className={`p-4 rounded-xl border-2 transition-all ${bg} ${text} ${border} ${
                          settings.theme === key ? 'ring-2 ring-blue-500 shadow-lg' : ''
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">{label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 字体设置 */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${themeClasses.text}`}>
                    <Type className="inline h-4 w-4 mr-2" />
                    字体设置
                  </label>

                  {/* 字体大小 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${themeClasses.text}`}>字体大小</span>
                      <span className={`text-sm font-mono ${themeClasses.accent}`}>
                        {settings.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="28"
                      value={settings.fontSize}
                      onChange={(e) => updateSettings('fontSize', parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* 行间距 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${themeClasses.text}`}>行间距</span>
                      <span className={`text-sm font-mono ${themeClasses.accent}`}>
                        {settings.lineHeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="3.0"
                      step="0.1"
                      value={settings.lineHeight}
                      onChange={(e) => updateSettings('lineHeight', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* 字体族 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'system', label: '系统' },
                      { key: 'serif', label: '衬线' },
                      { key: 'mono', label: '等宽' },
                    ].map(({ key, label }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSettings('fontFamily', key)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          settings.fontFamily === key
                            ? 'bg-blue-500 text-white shadow-lg'
                            : `${themeClasses.buttonBg} ${themeClasses.text}`
                        }`}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 文本对齐 */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${themeClasses.text}`}>
                    <AlignLeft className="inline h-4 w-4 mr-2" />
                    文本对齐
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'left', label: '左对齐', icon: AlignLeft },
                      { key: 'center', label: '居中', icon: AlignCenter },
                      { key: 'justify', label: '两端对齐', icon: AlignJustify },
                    ].map(({ key, label, icon: Icon }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSettings('textAlign', key)}
                        className={`py-3 px-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center space-y-1 ${
                          settings.textAlign === key
                            ? 'bg-blue-500 text-white shadow-lg'
                            : `${themeClasses.buttonBg} ${themeClasses.text}`
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 阅读模式 */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${themeClasses.text}`}>
                    阅读模式
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'normal', label: '普通模式', desc: '显示所有界面元素' },
                      { key: 'focus', label: '专注模式', desc: '隐藏干扰元素' },
                      { key: 'immersive', label: '沉浸模式', desc: '全屏阅读体验' },
                    ].map(({ key, label, desc }) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateSettings('readingMode', key)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          settings.readingMode === key
                            ? 'bg-blue-500 text-white shadow-lg'
                            : `${themeClasses.buttonBg} ${themeClasses.text}`
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div
                          className={`text-xs opacity-70 ${
                            settings.readingMode === key ? 'text-white' : themeClasses.text
                          }`}
                        >
                          {desc}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 高级设置 */}
                <div>
                  <label className={`block text-sm font-semibold mb-4 ${themeClasses.text}`}>
                    高级设置
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${themeClasses.text}`}>显示阅读进度</span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSettings('showProgress', !settings.showProgress)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.showProgress ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: settings.showProgress ? 24 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${themeClasses.text}`}>自动滚动</span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => updateSettings('autoScroll', !settings.autoScroll)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.autoScroll ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{ x: settings.autoScroll ? 24 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>

                    {settings.autoScroll && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm ${themeClasses.text}`}>滚动速度</span>
                          <span className={`text-sm font-mono ${themeClasses.accent}`}>
                            {settings.scrollSpeed}ms
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="200"
                          value={settings.scrollSpeed}
                          onChange={(e) => updateSettings('scrollSpeed', parseInt(e.target.value))}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettings(false)}
                className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg"
              >
                完成设置
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        className={`transition-all duration-500 ${
          settings.readingMode === 'focus'
            ? 'max-w-3xl'
            : settings.readingMode === 'immersive'
              ? 'max-w-4xl'
              : 'max-w-5xl'
        } mx-auto px-4 py-8`}
      >
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl shadow-xl p-8 md:p-12 transition-all duration-500 ${themeClasses.contentBg}`}
          onMouseEnter={() => setIsReading(true)}
          onMouseLeave={() => setIsReading(false)}
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
                <span>{wordCount.toLocaleString()} 字</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>约 {Math.ceil(wordCount / 300)} 分钟</span>
              </span>
            </div>
          </motion.div>

          {/* Chapter Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`prose prose-lg max-w-none ${themeClasses.text} ${getTextAlignClass()}`}
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

      {/* 浮动操作按钮 */}
      {settings.readingMode === 'immersive' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 flex flex-col space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)}
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
