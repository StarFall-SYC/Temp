/**
 * 小说编辑页面
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../store/novelStore';
import type { Novel, Chapter } from '../../shared/types';

interface ChapterForm {
  title: string;
  content: string;
  isNew?: boolean;
}

const NovelEdit = () => {
  const { username, title } = useParams<{ username: string; title: string }>();
  const { user } = useAuthStore();
  const { novels, loading, fetchNovelDetail, updateNovel, uploadCover } = useNovelStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [novel, setNovel] = useState<Novel | null>(null);
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
        })) || [];
      setChapters(chapterForms);

      // 设置封面预览
      setCoverPreview(`/api/novels/${username}/${title}/cover?t=${Date.now()}`);
    }
  }, [novels, username, title]);

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
    setChapters((prev) => [...prev, { title: '', content: '', isNew: true }]);
  };

  const removeChapter = (index: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
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

    // 验证新章节
    chapters.forEach((chapter, index) => {
      if (chapter.isNew) {
        const titleTrimmed = chapter.title.trim();
        const contentTrimmed = chapter.content.trim();
        if (!titleTrimmed) {
          newErrors[`chapter_${index}_title`] = '请输入章节标题';
        } else if (titleTrimmed.length > 100) {
          newErrors[`chapter_${index}_title`] = '章节标题不能超过 100 个字符';
        }
        if (!contentTrimmed) {
          newErrors[`chapter_${index}_content`] = '请输入章节内容';
        } else if (contentTrimmed.length < 10) {
          newErrors[`chapter_${index}_content`] = '章节内容至少 10 个字符';
        }
      }
    });

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

      // 添加新章节（统一使用 store API，自动携带认证）
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
          <h1 className="text-2xl text-gray-600 mb-4">您没有权限编辑此小说</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="gradient-button px-6 py-3 rounded-lg font-medium"
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
        <h1 className="text-2xl text-gray-600 mb-2">小说不存在</h1>
        <p className="text-gray-500 mb-6">您要编辑的小说可能已被删除或不存在</p>
        <button
          onClick={() => navigate('/')}
          className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">编辑作品</h1>
          <p className="text-gray-600">修改您的作品信息或添加新章节</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-2xl p-8 neon-border"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-cyan-600" />
              基本信息
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cover Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Image className="h-4 w-4 mr-2" />
                  封面图片
                </label>

                <div className="relative">
                  {coverPreview ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden shadow-lg"
                    >
                      <img
                        src={coverPreview}
                        alt="封面预览"
                        className="w-full h-full object-cover"
                        onError={() => setCoverPreview(null)}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={removeCover}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-cyan-500 text-white p-2 rounded-full hover:bg-cyan-600 transition-colors shadow-lg"
                        title="更换封面"
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 text-center">
                        点击上传封面
                        <br />
                        <span className="text-sm text-gray-500">支持 JPG、PNG 格式</span>
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
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    小说标题 *
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="请输入小说标题"
                  />
                  <AnimatePresence>
                    {errors.title && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-1 text-sm text-red-600"
                      >
                        {errors.title}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    标签
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    placeholder="请输入标签，用逗号分隔"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    连载状态
                  </label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="ongoing">连载中</option>
                    <option value="completed">已完结</option>
                    <option value="paused">暂停更新</option>
                  </motion.select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">作品简介</label>
                  <motion.textarea
                    whileFocus={{ scale: 1.02 }}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                    placeholder="请输入作品简介..."
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chapters Section */}

          {/* Existing Chapters */}
          {novel.chapters && novel.chapters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-effect rounded-2xl p-8 neon-border"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-cyan-600" />
                已发布章节
              </h2>

              <div className="space-y-3">
                {novel.chapters.map((chapter, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-cyan-50 hover:to-blue-50 transition-all"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        第{index + 1}章 {chapter.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(chapter.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                      {Math.ceil((chapter.content?.length || 0) / 500)} 分钟阅读
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* New Chapters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-2xl p-8 neon-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-cyan-600" />
                添加新章节
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={addChapter}
                className="gradient-button px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                添加章节
              </motion.button>
            </div>

            {chapters.filter((c) => c.isNew).length > 0 ? (
              <div className="space-y-6">
                {chapters.map((chapter, index) => {
                  if (!chapter.isNew) return null;

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">
                          新章节 {chapters.filter((c, i) => c.isNew && i <= index).length}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeChapter(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="删除章节"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            章节标题 *
                          </label>
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                              errors[`chapter_${index}_title`]
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            placeholder="请输入章节标题"
                          />
                          {errors[`chapter_${index}_title`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`chapter_${index}_title`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            章节内容 *
                          </label>
                          <textarea
                            value={chapter.content}
                            onChange={(e) => handleChapterChange(index, 'content', e.target.value)}
                            rows={12}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                              errors[`chapter_${index}_content`]
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                            placeholder="请输入章节内容..."
                          />
                          {errors[`chapter_${index}_content`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`chapter_${index}_content`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无新章节，点击上方按钮添加新章节</p>
              </div>
            )}
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className="gradient-button px-8 py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存修改
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default NovelEdit;
