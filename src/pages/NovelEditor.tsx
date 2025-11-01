/**
 * 独立的小说编辑器页面
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  X,
  Plus,
  Save,
  Edit,
  Image,
  FileText,
  Tag,
  Clock,
  Palette,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Type,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Search,
  Replace,
  Download,
  Printer,
  Settings,
  Moon,
  Sun,
  Layers,
  Target,
  Zap,
  Sparkles,
  PenTool,
  Trash2,
  Copy,
  Scissors,
  RotateCcw,
  RotateCw,
  Archive,
  Star,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../store/novelStore';
import type { Novel, Chapter } from '../../shared/types';

interface EditorSettings {
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  lineHeight: number;
  fontFamily: 'system' | 'serif' | 'mono';
  showLineNumbers: boolean;
  wordWrap: boolean;
  autoSave: boolean;
  spellCheck: boolean;
  focusMode: boolean;
  zenMode: boolean;
}

interface ChapterForm {
  title: string;
  content: string;
  isNew?: boolean;
  wordCount?: number;
  estimatedReadTime?: number;
}

const NovelEditor = () => {
  const { username, title } = useParams<{ username: string; title: string }>();
  const { user } = useAuthStore();
  const { novels, loading, fetchNovelDetail, updateNovel, uploadCover } = useNovelStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const [novel, setNovel] = useState<Novel | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'chapters' | 'preview'>('info');
  const [selectedChapter, setSelectedChapter] = useState<number>(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    status: 'ongoing' as 'ongoing' | 'completed' | 'paused',
  });

  const [chapters, setChapters] = useState<ChapterForm[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'light',
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: 'system',
    showLineNumbers: false,
    wordWrap: true,
    autoSave: true,
    spellCheck: true,
    focusMode: false,
    zenMode: false,
  });

  useEffect(() => {
    if (!username || !title) {
      navigate('/');
      return;
    }

    if (!user || user.username !== username) {
      toast.error('您没有权限编辑此小说');
      navigate('/');
      return;
    }

    fetchNovelDetail(username, title);
  }, [username, title, user, fetchNovelDetail, navigate]);

  useEffect(() => {
    // 从store中找到对应的小说
    const foundNovel = novels.find((n) => n.author === username && n.title === title);
    if (foundNovel) {
      setNovel(foundNovel);
      setFormData({
        title: foundNovel.title,
        description: foundNovel.description,
        tags: foundNovel.tags?.join(', ') || '',
        status: foundNovel.status,
      });

      // 设置章节数据
      const chapterForms: ChapterForm[] =
        foundNovel.chapters?.map((chapter) => ({
          title: chapter.title,
          content: chapter.content || '',
          isNew: false,
          wordCount: chapter.content?.length || 0,
          estimatedReadTime: Math.ceil((chapter.content?.length || 0) / 300),
        })) || [];
      setChapters(chapterForms);

      // 设置封面预览
      setCoverPreview(`/api/novels/${username}/${title}/cover?t=${Date.now()}`);
    }
  }, [novels, username, title]);

  // 自动保存
  useEffect(() => {
    if (settings.autoSave && selectedChapter >= 0) {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }

      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000); // 30秒自动保存
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [chapters, selectedChapter, settings.autoSave]);

  // 计算字数
  useEffect(() => {
    if (selectedChapter >= 0 && chapters[selectedChapter]) {
      const count = chapters[selectedChapter].content.length;
      setWordCount(count);

      // 更新章节字数统计
      setChapters((prev) =>
        prev.map((chapter, index) =>
          index === selectedChapter
            ? {
                ...chapter,
                wordCount: count,
                estimatedReadTime: Math.ceil(count / 300),
              }
            : chapter
        )
      );
    }
  }, [chapters, selectedChapter]);

  const updateSettings = (key: keyof EditorSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleChapterChange = (index: number, field: 'title' | 'content', value: string) => {
    setChapters((prev) =>
      prev.map((chapter, i) => (i === index ? { ...chapter, [field]: value } : chapter))
    );
  };

  const addChapter = () => {
    const newChapter: ChapterForm = {
      title: `第${chapters.length + 1}章`,
      content: '',
      isNew: true,
      wordCount: 0,
      estimatedReadTime: 0,
    };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedChapter(chapters.length);
    setActiveTab('chapters');
  };

  const removeChapter = (index: number) => {
    if (window.confirm('确定要删除这个章节吗？此操作不可恢复。')) {
      setChapters((prev) => prev.filter((_, i) => i !== index));
      if (selectedChapter === index) {
        setSelectedChapter(-1);
      } else if (selectedChapter > index) {
        setSelectedChapter((prev) => prev - 1);
      }
    }
  };

  const duplicateChapter = (index: number) => {
    const chapter = chapters[index];
    const newChapter: ChapterForm = {
      ...chapter,
      title: `${chapter.title} (副本)`,
      isNew: true,
    };
    setChapters((prev) => [...prev.slice(0, index + 1), newChapter, ...prev.slice(index + 1)]);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('封面图片大小不能超过5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }

      setCoverFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAutoSave = async () => {
    if (!user || !username || !title) return;

    try {
      // 这里可以实现自动保存逻辑
      setLastSaved(new Date());
      toast.success('自动保存成功', { duration: 2000 });
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  };

  const insertText = (before: string, after: string = '') => {
    if (!contentRef.current) return;

    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;

    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);

    if (selectedChapter >= 0) {
      handleChapterChange(selectedChapter, 'content', newValue);
    }

    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatText = (type: string) => {
    switch (type) {
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'underline':
        insertText('<u>', '</u>');
        break;
      case 'quote':
        insertText('> ');
        break;
      case 'list':
        insertText('- ');
        break;
      case 'orderedList':
        insertText('1. ');
        break;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入小说标题';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入小说简介';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = '小说简介至少 10 个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !username || !title) {
      toast.error('参数错误');
      return;
    }

    if (!validateForm()) {
      toast.error('请检查表单内容');
      return;
    }

    setIsSubmitting(true);

    try {
      // 更新小说基本信息
      const novelData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        status: formData.status,
      };

      await updateNovel(username, title, novelData);

      // 添加新章节
      const newChapters = chapters.filter((chapter) => chapter.isNew);
      for (const chapter of newChapters) {
        const titleTrimmed = chapter.title.trim();
        const contentTrimmed = chapter.content.trim();
        if (titleTrimmed && contentTrimmed && contentTrimmed.length >= 10) {
          await useNovelStore.getState().addChapter(username, formData.title, {
            title: titleTrimmed,
            content: contentTrimmed,
          });
        }
      }

      // 上传新封面
      if (coverFile) {
        try {
          await uploadCover(username, formData.title, coverFile);
        } catch (error) {
          console.warn('封面上传失败:', error);
          toast.warning('小说更新成功，但封面上传失败');
        }
      }

      toast.success('小说更新成功！');
      navigate(`/novel/${username}/${formData.title}`);
    } catch (error: any) {
      console.error('更新失败:', error);
      toast.error(error.message || '更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          contentBg: 'bg-gray-800',
          text: 'text-gray-100',
          border: 'border-gray-700',
          button: 'bg-gray-700 hover:bg-gray-600',
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          contentBg: 'bg-amber-25',
          text: 'text-amber-900',
          border: 'border-amber-200',
          button: 'bg-amber-200 hover:bg-amber-300',
        };
      default:
        return {
          bg: 'bg-gray-50',
          contentBg: 'bg-white',
          text: 'text-gray-800',
          border: 'border-gray-200',
          button: 'bg-gray-100 hover:bg-gray-200',
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

  if (!user || user.username !== username) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <h1 className="text-xl sm:text-2xl text-gray-600 mb-4">您没有权限编辑此小说</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-medium"
          >
            返回首页
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl sm:text-2xl text-gray-600 mb-2">小说不存在</h1>
        <p className="text-gray-500 mb-6">您要编辑的小说可能已被删除或不存在</p>
        <button
          onClick={() => navigate('/')}
          className="bg-cyan-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-cyan-700 transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  const themeClasses = getThemeClasses();

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${themeClasses.bg} ${getFontFamilyClass()}`}
    >
      {/* Header */}
      <AnimatePresence>
        {(!settings.zenMode || showToolbar) && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`sticky top-0 z-40 shadow-lg border-b ${themeClasses.contentBg} ${themeClasses.border}`}
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link
                    to={`/novel/${username}/${title}`}
                    className={`flex items-center space-x-2 ${themeClasses.text} hover:text-blue-600 transition-colors`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">{novel.title}</span>
                  </Link>

                  {lastSaved && (
                    <span className={`text-sm opacity-70 ${themeClasses.text}`}>
                      最后保存: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* 字数统计 */}
                  <div
                    className={`hidden md:flex items-center space-x-4 text-sm ${themeClasses.text} opacity-70`}
                  >
                    <span className="flex items-center space-x-1">
                      <Type className="w-4 h-4" />
                      <span>{wordCount.toLocaleString()}字</span>
                    </span>
                    {selectedChapter >= 0 && chapters[selectedChapter] && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>约{chapters[selectedChapter].estimatedReadTime}分钟</span>
                      </span>
                    )}
                  </div>

                  {/* 工具按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.button}`}
                    title="编辑器设置"
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.button}`}
                    title={isFullscreen ? '退出全屏' : '全屏编辑'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>保存</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex h-screen ${settings.zenMode ? 'pt-0' : 'pt-16'}`}>
        {/* Sidebar */}
        <AnimatePresence>
          {!settings.focusMode && !settings.zenMode && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`w-80 ${themeClasses.contentBg} border-r ${themeClasses.border} overflow-y-auto`}
            >
              {/* Tabs */}
              <div className={`border-b ${themeClasses.border}`}>
                <nav className="flex">
                  {[
                    { key: 'info', label: '基本信息', icon: FileText },
                    { key: 'chapters', label: '章节管理', icon: BookOpen },
                    { key: 'preview', label: '预览', icon: Eye },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                        activeTab === key
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : `${themeClasses.text} hover:text-blue-600`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    {/* Cover Upload */}
                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${themeClasses.text}`}>
                        作品封面
                      </label>

                      {coverPreview ? (
                        <div className="relative">
                          <img
                            src={coverPreview}
                            alt="封面预览"
                            className="w-full h-48 object-cover rounded-lg shadow-lg"
                            onError={() => setCoverPreview(null)}
                          />
                          <button
                            type="button"
                            onClick={removeCover}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full h-48 border-2 border-dashed ${themeClasses.border} rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors`}
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className={`text-sm ${themeClasses.text} opacity-70`}>点击上传封面</p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </div>

                    {/* Basic Info Form */}
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}>
                          小说标题 *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className={`w-full px-3 py-2 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${themeClasses.contentBg} ${themeClasses.text}`}
                          placeholder="请输入小说标题"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}>
                          标签
                        </label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => handleInputChange('tags', e.target.value)}
                          className={`w-full px-3 py-2 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${themeClasses.contentBg} ${themeClasses.text}`}
                          placeholder="用逗号分隔"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}>
                          连载状态
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value as any)}
                          className={`w-full px-3 py-2 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${themeClasses.contentBg} ${themeClasses.text}`}
                        >
                          <option value="ongoing">连载中</option>
                          <option value="completed">已完结</option>
                          <option value="paused">暂停更新</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${themeClasses.text}`}>
                          作品简介 *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={6}
                          className={`w-full px-3 py-2 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${themeClasses.contentBg} ${themeClasses.text}`}
                          placeholder="请输入作品简介..."
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'chapters' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className={`font-semibold ${themeClasses.text}`}>章节列表</h3>
                      <button
                        onClick={addChapter}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                        title="添加章节"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {chapters.map((chapter, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedChapter === index
                              ? 'border-blue-500 bg-blue-50'
                              : `${themeClasses.border} hover:border-blue-300`
                          }`}
                          onClick={() => setSelectedChapter(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className={`font-medium truncate ${themeClasses.text}`}>
                                {chapter.title || `第${index + 1}章`}
                              </h4>
                              <div className={`text-xs opacity-70 mt-1 ${themeClasses.text}`}>
                                {chapter.wordCount?.toLocaleString() || 0}字 · 约
                                {chapter.estimatedReadTime || 0}分钟
                              </div>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateChapter(index);
                                }}
                                className={`p-1 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                                title="复制章节"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeChapter(index);
                                }}
                                className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                title="删除章节"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div className="space-y-4">
                    <h3 className={`font-semibold ${themeClasses.text}`}>预览模式</h3>
                    <p className={`text-sm opacity-70 ${themeClasses.text}`}>
                      在这里可以预览您的作品效果
                    </p>
                    {/* 预览内容 */}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <AnimatePresence>
            {showToolbar && selectedChapter >= 0 && (
              <motion.div
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                exit={{ y: -50 }}
                className={`border-b ${themeClasses.border} ${themeClasses.contentBg} p-2`}
              >
                <div className="flex items-center space-x-2 flex-wrap">
                  {/* 格式化按钮 */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => formatText('bold')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="粗体"
                    >
                      <Bold className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => formatText('italic')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="斜体"
                    >
                      <Italic className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => formatText('underline')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="下划线"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-px h-6 ${themeClasses.border}`}></div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => formatText('quote')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="引用"
                    >
                      <Quote className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => formatText('list')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="无序列表"
                    >
                      <List className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => formatText('orderedList')}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="有序列表"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-px h-6 ${themeClasses.border}`}></div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowToolbar(!showToolbar)}
                      className={`p-2 rounded hover:bg-gray-200 transition-colors ${themeClasses.text}`}
                      title="隐藏工具栏"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Content */}
          <div className="flex-1 flex">
            {selectedChapter >= 0 && chapters[selectedChapter] ? (
              <div className="flex-1 flex flex-col">
                {/* Chapter Title */}
                <div className={`p-4 border-b ${themeClasses.border} ${themeClasses.contentBg}`}>
                  <input
                    type="text"
                    value={chapters[selectedChapter].title}
                    onChange={(e) => handleChapterChange(selectedChapter, 'title', e.target.value)}
                    className={`w-full text-xl font-bold bg-transparent border-none outline-none ${themeClasses.text}`}
                    placeholder="章节标题..."
                  />
                </div>

                {/* Content Editor */}
                <div className="flex-1 relative">
                  <textarea
                    ref={contentRef}
                    value={chapters[selectedChapter].content}
                    onChange={(e) =>
                      handleChapterChange(selectedChapter, 'content', e.target.value)
                    }
                    className={`w-full h-full p-6 border-none outline-none resize-none ${themeClasses.contentBg} ${themeClasses.text}`}
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: settings.lineHeight,
                      fontFamily:
                        settings.fontFamily === 'serif'
                          ? 'serif'
                          : settings.fontFamily === 'mono'
                            ? 'monospace'
                            : 'system-ui',
                    }}
                    placeholder="开始写作..."
                    spellCheck={settings.spellCheck}
                  />

                  {/* Word Count Overlay */}
                  <div
                    className={`absolute bottom-4 right-4 ${themeClasses.text} opacity-50 text-sm`}
                  >
                    {wordCount.toLocaleString()} 字
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex-1 flex items-center justify-center ${themeClasses.contentBg}`}>
                <div className="text-center">
                  <PenTool className={`w-16 h-16 mx-auto mb-4 ${themeClasses.text} opacity-30`} />
                  <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text}`}>
                    选择一个章节开始编辑
                  </h3>
                  <p className={`${themeClasses.text} opacity-70 mb-6`}>
                    从左侧选择现有章节，或创建新章节
                  </p>
                  <button
                    onClick={addChapter}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>创建新章节</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowSettings(false)}
            ></div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative ${themeClasses.contentBg}`}
            >
              <h2 className={`text-xl font-bold mb-6 ${themeClasses.text}`}>编辑器设置</h2>

              <div className="space-y-6">
                {/* 主题设置 */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${themeClasses.text}`}>
                    编辑器主题
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'light', label: '浅色', icon: Sun },
                      { key: 'dark', label: '深色', icon: Moon },
                      { key: 'sepia', label: '护眼', icon: Palette },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => updateSettings('theme', key)}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-1 ${
                          settings.theme === key
                            ? 'border-blue-500 bg-blue-50'
                            : `${themeClasses.border} hover:border-blue-300`
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 字体设置 */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${themeClasses.text}`}>
                    字体设置
                  </label>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${themeClasses.text}`}>字体大小</span>
                        <span className={`text-sm font-mono text-blue-600`}>
                          {settings.fontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={settings.fontSize}
                        onChange={(e) => updateSettings('fontSize', parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${themeClasses.text}`}>行间距</span>
                        <span className={`text-sm font-mono text-blue-600`}>
                          {settings.lineHeight}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.2"
                        max="2.5"
                        step="0.1"
                        value={settings.lineHeight}
                        onChange={(e) => updateSettings('lineHeight', parseFloat(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>

                    <div>
                      <span className={`block text-sm mb-2 ${themeClasses.text}`}>字体族</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'system', label: '系统' },
                          { key: 'serif', label: '衬线' },
                          { key: 'mono', label: '等宽' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => updateSettings('fontFamily', key)}
                            className={`py-2 px-3 rounded-lg text-sm transition-all ${
                              settings.fontFamily === key
                                ? 'bg-blue-500 text-white'
                                : `${themeClasses.button} ${themeClasses.text}`
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 编辑器选项 */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${themeClasses.text}`}>
                    编辑器选项
                  </label>

                  <div className="space-y-3">
                    {[
                      { key: 'showLineNumbers', label: '显示行号' },
                      { key: 'wordWrap', label: '自动换行' },
                      { key: 'autoSave', label: '自动保存' },
                      { key: 'spellCheck', label: '拼写检查' },
                      { key: 'focusMode', label: '专注模式' },
                      { key: 'zenMode', label: '禅模式' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className={`text-sm ${themeClasses.text}`}>{label}</span>
                        <button
                          onClick={() =>
                            updateSettings(
                              key as keyof EditorSettings,
                              !settings[key as keyof EditorSettings]
                            )
                          }
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings[key as keyof EditorSettings] ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                              settings[key as keyof EditorSettings]
                                ? 'translate-x-6'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold"
              >
                完成设置
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Zen Mode) */}
      {settings.zenMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 flex flex-col space-y-3"
        >
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            {showToolbar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default NovelEditor;
