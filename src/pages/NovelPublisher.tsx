/**
 * 独立的小说发布页面
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  X,
  Plus,
  Save,
  Image,
  FileText,
  Tag,
  Clock,
  Palette,
  Eye,
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
  Sparkles,
  Wand2,
  Zap,
  Target,
  Star,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  User,
  Globe,
  Lock,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  TrendingUp,
  Award,
  Crown,
  Edit,
  PenTool,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../store/novelStore';

interface PublishSettings {
  visibility: 'public' | 'private' | 'unlisted';
  allowComments: boolean;
  allowRatings: boolean;
  mature: boolean;
  copyright: string;
  publishSchedule: 'now' | 'scheduled';
  scheduledDate?: Date;
  categories: string[];
  targetAudience: 'general' | 'teen' | 'adult';
  language: string;
}

interface ChapterForm {
  title: string;
  content: string;
  summary?: string;
  wordCount: number;
  estimatedReadTime: number;
}

const NovelPublisher = () => {
  const { user } = useAuthStore();
  const { createNovel, uploadCover } = useNovelStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    genre: '',
    status: 'ongoing' as 'ongoing' | 'completed' | 'paused',
  });

  const [chapters, setChapters] = useState<ChapterForm[]>([
    {
      title: '第一章',
      content: '',
      summary: '',
      wordCount: 0,
      estimatedReadTime: 0,
    },
  ]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedChapter, setSelectedChapter] = useState(0);

  const [publishSettings, setPublishSettings] = useState<PublishSettings>({
    visibility: 'public',
    allowComments: true,
    allowRatings: true,
    mature: false,
    copyright: 'original',
    publishSchedule: 'now',
    categories: [],
    targetAudience: 'general',
    language: 'zh-CN',
  });

  const steps = [
    { id: 1, title: '基本信息', desc: '设置作品标题、简介等基本信息' },
    { id: 2, title: '内容创作', desc: '编写章节内容' },
    { id: 3, title: '发布设置', desc: '配置发布选项和权限' },
    { id: 4, title: '预览确认', desc: '最终预览和发布' },
  ];

  const genres = [
    '玄幻',
    '都市',
    '历史',
    '科幻',
    '游戏',
    '体育',
    '军事',
    '悬疑',
    '仙侠',
    '武侠',
    '奇幻',
    '现实',
    '二次元',
    '轻小说',
    '短篇',
  ];

  const categories = [
    '热血',
    '冒险',
    '恋爱',
    '校园',
    '职场',
    '家庭',
    '友情',
    '成长',
    '励志',
    '治愈',
    '搞笑',
    '悬疑',
    '推理',
    '恐怖',
    '科幻',
    '奇幻',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleChapterChange = (index: number, field: keyof ChapterForm, value: string) => {
    setChapters((prev) =>
      prev.map((chapter, i) => {
        if (i === index) {
          const updated = { ...chapter, [field]: value };
          if (field === 'content') {
            updated.wordCount = value.length;
            updated.estimatedReadTime = Math.ceil(value.length / 300);
          }
          return updated;
        }
        return chapter;
      })
    );
  };

  const addChapter = () => {
    const newChapter: ChapterForm = {
      title: `第${chapters.length + 1}章`,
      content: '',
      summary: '',
      wordCount: 0,
      estimatedReadTime: 0,
    };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedChapter(chapters.length);
  };

  const removeChapter = (index: number) => {
    if (chapters.length <= 1) {
      toast.error('至少需要保留一个章节');
      return;
    }

    if (window.confirm('确定要删除这个章节吗？')) {
      setChapters((prev) => prev.filter((_, i) => i !== index));
      if (selectedChapter >= index) {
        setSelectedChapter(Math.max(0, selectedChapter - 1));
      }
    }
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

  const insertText = (before: string, after: string = '') => {
    if (!contentRef.current) return;

    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;

    const newValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    handleChapterChange(selectedChapter, 'content', newValue);

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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = '请输入小说标题';
        }
        if (!formData.description.trim()) {
          newErrors.description = '请输入小说简介';
        } else if (formData.description.trim().length < 20) {
          newErrors.description = '小说简介至少需要20个字符';
        }
        if (!formData.genre) {
          newErrors.genre = '请选择小说类型';
        }
        break;

      case 2:
        chapters.forEach((chapter, index) => {
          if (!chapter.title.trim()) {
            newErrors[`chapter_${index}_title`] = '请输入章节标题';
          }
          if (!chapter.content.trim()) {
            newErrors[`chapter_${index}_content`] = '请输入章节内容';
          } else if (chapter.content.trim().length < 100) {
            newErrors[`chapter_${index}_content`] = '章节内容至少需要100个字符';
          }
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error('请完善当前步骤的信息');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!validateStep(1) || !validateStep(2)) {
      toast.error('请检查表单内容');
      return;
    }

    setIsSubmitting(true);

    try {
      // 创建小说
      const novelData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        genre: formData.genre,
        status: formData.status,
        visibility: publishSettings.visibility,
        allowComments: publishSettings.allowComments,
        allowRatings: publishSettings.allowRatings,
        mature: publishSettings.mature,
        categories: publishSettings.categories,
        targetAudience: publishSettings.targetAudience,
      };

      await createNovel(novelData);

      // 添加章节
      for (const chapter of chapters) {
        if (chapter.title.trim() && chapter.content.trim()) {
          await useNovelStore.getState().addChapter(user.username, formData.title, {
            title: chapter.title.trim(),
            content: chapter.content.trim(),
          });
        }
      }

      // 上传封面
      if (coverFile) {
        try {
          await uploadCover(user.username, formData.title, coverFile);
        } catch (error) {
          console.warn('封面上传失败:', error);
        }
      }

      toast.success('小说发布成功！');
      navigate(`/novel/${user.username}/${formData.title}`);
    } catch (error: any) {
      console.error('发布失败:', error);
      toast.error(error.message || '发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalWordCount = () => {
    return chapters.reduce((total, chapter) => total + chapter.wordCount, 0);
  };

  const getTotalReadTime = () => {
    return chapters.reduce((total, chapter) => total + chapter.estimatedReadTime, 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <h1 className="text-2xl text-gray-600 mb-4">请先登录</h1>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            前往登录
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-8 h-8 mr-3 text-purple-600" />
                发布新作品
              </h1>
              <p className="text-gray-600 mt-2">创作属于您的精彩故事</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">总字数</div>
                <div className="text-lg font-semibold text-blue-600">
                  {getTotalWordCount().toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">预计阅读</div>
                <div className="text-lg font-semibold text-purple-600">
                  {getTotalReadTime()}分钟
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                  </motion.div>
                  <div className="ml-3">
                    <div
                      className={`font-semibold ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-500">{step.desc}</div>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-6 rounded-full transition-all ${
                      currentStep > step.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-600" />
                  基本信息
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Cover Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      作品封面
                    </label>

                    {coverPreview ? (
                      <div className="relative group">
                        <img
                          src={coverPreview}
                          alt="封面预览"
                          className="w-full h-80 object-cover rounded-xl shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={removeCover}
                            className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-80 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-500 mb-4 transition-colors" />
                        <p className="text-gray-600 text-center">
                          点击上传封面
                          <br />
                          <span className="text-sm text-gray-500">推荐尺寸: 400x600px</span>
                        </p>
                      </motion.div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        作品标题 *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="请输入一个吸引人的标题"
                      />
                      {errors.title && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          作品类型 *
                        </label>
                        <select
                          value={formData.genre}
                          onChange={(e) => handleInputChange('genre', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.genre ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">请选择类型</option>
                          {genres.map((genre) => (
                            <option key={genre} value={genre}>
                              {genre}
                            </option>
                          ))}
                        </select>
                        {errors.genre && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.genre}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          连载状态
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value as any)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="ongoing">连载中</option>
                          <option value="completed">已完结</option>
                          <option value="paused">暂停更新</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">标签</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="请输入标签，用逗号分隔，如：冒险,友情,成长"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        作品简介 *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={6}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                          errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="请详细描述您的作品内容、特色和亮点，让读者对您的作品产生兴趣..."
                      />
                      <div className="flex justify-between items-center mt-2">
                        {errors.description ? (
                          <p className="text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.description}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-1" />
                            好的简介能吸引更多读者
                          </p>
                        )}
                        <span className="text-sm text-gray-500">
                          {formData.description.length}/500
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Content Creation */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <PenTool className="w-6 h-6 mr-3 text-purple-600" />
                      内容创作
                    </h2>

                    <button
                      onClick={addChapter}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加章节</span>
                    </button>
                  </div>
                </div>

                <div className="flex h-[600px]">
                  {/* Chapter List */}
                  <div className="w-80 border-r border-gray-200 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">章节列表</h3>
                      <div className="space-y-2">
                        {chapters.map((chapter, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedChapter === index
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedChapter(index)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {chapter.title || `第${index + 1}章`}
                                </h4>
                                <div className="text-xs text-gray-500 mt-1">
                                  {chapter.wordCount.toLocaleString()}字 · 约
                                  {chapter.estimatedReadTime}分钟
                                </div>
                              </div>

                              {chapters.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeChapter(index);
                                  }}
                                  className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                  title="删除章节"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 flex flex-col">
                    {/* Toolbar */}
                    <div className="border-b border-gray-200 p-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => formatText('bold')}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          title="粗体"
                        >
                          <Bold className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => formatText('italic')}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          title="斜体"
                        >
                          <Italic className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => formatText('underline')}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          title="下划线"
                        >
                          <Underline className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-gray-300"></div>

                        <button
                          onClick={() => formatText('quote')}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          title="引用"
                        >
                          <Quote className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => formatText('list')}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          title="无序列表"
                        >
                          <List className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => formatText('orderedList')}
                          className="p-2 rounded hover:bg-gray-100 transition-colors"
                          title="有序列表"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Chapter Title */}
                    <div className="p-4 border-b border-gray-200">
                      <input
                        type="text"
                        value={chapters[selectedChapter]?.title || ''}
                        onChange={(e) =>
                          handleChapterChange(selectedChapter, 'title', e.target.value)
                        }
                        className="w-full text-xl font-bold bg-transparent border-none outline-none text-gray-900"
                        placeholder="章节标题..."
                      />
                      {errors[`chapter_${selectedChapter}_title`] && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`chapter_${selectedChapter}_title`]}
                        </p>
                      )}
                    </div>

                    {/* Content Editor */}
                    <div className="flex-1 relative">
                      <textarea
                        ref={contentRef}
                        value={chapters[selectedChapter]?.content || ''}
                        onChange={(e) =>
                          handleChapterChange(selectedChapter, 'content', e.target.value)
                        }
                        className="w-full h-full p-6 border-none outline-none resize-none text-gray-800 leading-relaxed"
                        placeholder="开始您的创作之旅..."
                        style={{ fontSize: '16px', lineHeight: '1.8' }}
                      />

                      {errors[`chapter_${selectedChapter}_content`] && (
                        <div className="absolute top-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3">
                          <p className="text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors[`chapter_${selectedChapter}_content`]}
                          </p>
                        </div>
                      )}

                      {/* Word Count */}
                      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-1 text-sm text-gray-600 shadow-sm">
                        {chapters[selectedChapter]?.wordCount.toLocaleString() || 0} 字
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Publish Settings */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Settings className="w-6 h-6 mr-3 text-green-600" />
                  发布设置
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Visibility Settings */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        可见性设置
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'public', label: '公开', desc: '所有人都可以看到', icon: Globe },
                          {
                            key: 'unlisted',
                            label: '不公开列出',
                            desc: '只有链接才能访问',
                            icon: Users,
                          },
                          { key: 'private', label: '私人', desc: '只有您可以看到', icon: Lock },
                        ].map(({ key, label, desc, icon: Icon }) => (
                          <label
                            key={key}
                            className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name="visibility"
                              value={key}
                              checked={publishSettings.visibility === key}
                              onChange={(e) =>
                                setPublishSettings((prev) => ({
                                  ...prev,
                                  visibility: e.target.value as any,
                                }))
                              }
                              className="mr-3"
                            />
                            <Icon className="w-5 h-5 mr-3 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">{label}</div>
                              <div className="text-sm text-gray-500">{desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        互动设置
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <MessageCircle className="w-5 h-5 mr-3 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">允许评论</div>
                              <div className="text-sm text-gray-500">读者可以发表评论</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={publishSettings.allowComments}
                            onChange={(e) =>
                              setPublishSettings((prev) => ({
                                ...prev,
                                allowComments: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <Star className="w-5 h-5 mr-3 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900">允许评分</div>
                              <div className="text-sm text-gray-500">读者可以给作品评分</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={publishSettings.allowRatings}
                            onChange={(e) =>
                              setPublishSettings((prev) => ({
                                ...prev,
                                allowRatings: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Content Settings */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        内容分类
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <label
                            key={category}
                            className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={publishSettings.categories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPublishSettings((prev) => ({
                                    ...prev,
                                    categories: [...prev.categories, category],
                                  }));
                                } else {
                                  setPublishSettings((prev) => ({
                                    ...prev,
                                    categories: prev.categories.filter((c) => c !== category),
                                  }));
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        目标读者
                      </label>
                      <select
                        value={publishSettings.targetAudience}
                        onChange={(e) =>
                          setPublishSettings((prev) => ({
                            ...prev,
                            targetAudience: e.target.value as any,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="general">全年龄</option>
                        <option value="teen">青少年</option>
                        <option value="adult">成人</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 mr-3 text-orange-500" />
                          <div>
                            <div className="font-medium text-gray-900">成人内容</div>
                            <div className="text-sm text-gray-500">包含成人或敏感内容</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={publishSettings.mature}
                          onChange={(e) =>
                            setPublishSettings((prev) => ({ ...prev, mature: e.target.checked }))
                          }
                          className="rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview & Publish */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Eye className="w-6 h-6 mr-3 text-indigo-600" />
                  预览确认
                </h2>

                {/* Preview Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Cover Preview */}
                  <div>
                    <div className="w-full h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center overflow-hidden">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-16 h-16 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Novel Info */}
                  <div className="lg:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{formData.title}</h3>
                    <p className="text-gray-600 mb-4">作者：{user.username}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${
                          formData.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : formData.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {formData.status === 'completed'
                          ? '已完结'
                          : formData.status === 'paused'
                            ? '已暂停'
                            : '连载中'}
                      </span>

                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {chapters.length} 章
                      </span>

                      <span className="flex items-center">
                        <Type className="w-4 h-4 mr-1" />
                        {getTotalWordCount().toLocaleString()} 字
                      </span>
                    </div>

                    {formData.tags && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-gray-700 leading-relaxed mb-6">{formData.description}</p>

                    {/* Publish Settings Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">发布设置</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">可见性：</span>
                          <span className="font-medium">
                            {publishSettings.visibility === 'public'
                              ? '公开'
                              : publishSettings.visibility === 'unlisted'
                                ? '不公开列出'
                                : '私人'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">目标读者：</span>
                          <span className="font-medium">
                            {publishSettings.targetAudience === 'general'
                              ? '全年龄'
                              : publishSettings.targetAudience === 'teen'
                                ? '青少年'
                                : '成人'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">允许评论：</span>
                          <span className="font-medium">
                            {publishSettings.allowComments ? '是' : '否'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">允许评分：</span>
                          <span className="font-medium">
                            {publishSettings.allowRatings ? '是' : '否'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chapter List Preview */}
                <div className="mt-8">
                  <h4 className="font-semibold text-gray-900 mb-4">章节目录</h4>
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h5 className="font-medium text-gray-900">{chapter.title}</h5>
                          <div className="text-sm text-gray-500">
                            {chapter.wordCount.toLocaleString()}字 · 约{chapter.estimatedReadTime}
                            分钟阅读
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            上一步
          </button>

          <div className="flex items-center space-x-4">
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>发布中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>发布作品</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelPublisher;
