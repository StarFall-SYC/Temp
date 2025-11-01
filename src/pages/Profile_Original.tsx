/**
 * 用户个人页面
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  BookOpen,
  Edit,
  Trash2,
  Plus,
  Eye,
  Calendar,
  Settings,
  Upload,
  X,
} from 'lucide-react';
import PrettySelect from '../components/PrettySelect';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../store/novelStore';
import type { Novel } from '../../shared/types';

interface ChapterForm {
  title: string;
  content: string;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthStore();
  const { novels, loading, fetchUserNovels, deleteNovel, createNovel, uploadCover } =
    useNovelStore();
  const navigate = useNavigate();
  const [userNovels, setUserNovels] = useState<Novel[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'profile' | 'creation'>('profile');

  // 创作中心状态
  const [showPublishForm, setShowPublishForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    status: 'ongoing' as 'ongoing' | 'completed',
  });

  const [chapters, setChapters] = useState<ChapterForm[]>([{ title: '', content: '' }]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 确定要显示的用户名
  const targetUsername = username || user?.username;
  const isOwnProfile = !username || username === user?.username;

  useEffect(() => {
    if (!targetUsername) {
      navigate('/login');
      return;
    }

    fetchUserNovels(targetUsername);
  }, [targetUsername, fetchUserNovels, navigate]);

  useEffect(() => {
    // 过滤出当前用户的小说
    if (targetUsername) {
      const filtered = novels.filter((novel) => novel.author === targetUsername);
      setUserNovels(filtered);
    }
  }, [novels, targetUsername]);

  // 计算总浏览量
  const totalViews = userNovels.reduce((total, novel) => total + (novel.views || 0), 0);

  const handleDeleteNovel = async (novelTitle: string) => {
    if (!targetUsername || !isOwnProfile) return;

    const confirmed = window.confirm(`确定要删除小说《${novelTitle}》吗？此操作不可恢复。`);
    if (!confirmed) return;

    setIsDeleting(novelTitle);
    try {
      await deleteNovel(targetUsername, novelTitle);
      toast.success('小说删除成功');
    } catch (error) {
      toast.error('删除失败，请重试');
    } finally {
      setIsDeleting(null);
    }
  };

  // 创作中心相关函数
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
    setChapters((prev) => [...prev, { title: '', content: '' }]);
  };

  const removeChapter = (index: number) => {
    if (chapters.length > 1) {
      setChapters((prev) => prev.filter((_, i) => i !== index));
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

    // 验证章节
    chapters.forEach((chapter, index) => {
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
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (!validateForm()) {
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
        status: formData.status,
      };

      const created = await createNovel(novelData);
      if (!created) {
        toast.error('小说创建失败：请检查标题/简介长度或同名冲突');
        return;
      }

      // 添加章节（使用统一的 store API，自动携带认证信息）
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
          toast.warning('小说创建成功，但封面上传失败');
        }
      }

      toast.success('小说发布成功！');

      // 重置表单
      setFormData({
        title: '',
        description: '',
        tags: '',
        status: 'ongoing',
      });
      setChapters([{ title: '', content: '' }]);
      setCoverFile(null);
      setCoverPreview(null);
      setShowPublishForm(false);

      // 刷新用户小说列表
      fetchUserNovels(user.username);
    } catch (error: any) {
      console.error('发布失败:', error);
      toast.error(error.message || '发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const NovelCard = ({ novel }: { novel: Novel }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 h-32 flex items-center justify-center relative overflow-hidden">
          {novel.coverUrl ? (
            <img
              src={novel.coverUrl}
              alt={novel.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 如果封面加载失败，显示默认图标
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <BookOpen className={`h-12 w-12 text-white ${novel.coverUrl ? 'hidden' : ''}`} />
        </div>
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              novel.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {novel.status === 'completed' ? '已完结' : '连载中'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{novel.title}</h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{novel.description}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {novel.views || 0}
            </span>
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(novel.updatedAt)}
            </span>
          </div>
          <span className="text-cyan-600 font-medium">{novel.chapters?.length || 0} 章</span>
        </div>

        {novel.tags && novel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {novel.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link
            to={`/novel/${novel.author}/${novel.title}`}
            className="flex-1 bg-cyan-600 text-white text-center py-2 px-3 rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
          >
            查看详情
          </Link>

          {isOwnProfile && (
            <>
              <Link
                to={`/edit/${novel.author}/${novel.title}`}
                className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="编辑小说"
              >
                <Edit className="h-4 w-4" />
              </Link>

              <button
                onClick={() => handleDeleteNovel(novel.title)}
                disabled={isDeleting === novel.title}
                className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                title="删除小说"
              >
                {isDeleting === novel.title ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (!targetUsername) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl text-gray-600">请先登录</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* 用户信息卡片 */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {targetUsername?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{targetUsername}</h1>
                  <div className="flex space-x-6 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5" />
                      <span>{userNovels.length} 部作品</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5" />
                      <span>{totalViews.toLocaleString()} 总浏览量</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 标签页导航 */}
            <div className="bg-white rounded-xl shadow-lg mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-8">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'profile'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    个人信息
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={() => setActiveTab('creation')}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === 'creation'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      创作中心
                    </button>
                  )}
                </nav>
              </div>

              {/* 标签页内容 */}
              <div className="p-8">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      {isOwnProfile ? '我的作品' : `${targetUsername} 的作品`}
                    </h2>

                    {userNovels.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-4">
                          {isOwnProfile ? '还没有发布任何作品' : '该用户还没有发布任何作品'}
                        </p>
                        {isOwnProfile && (
                          <button
                            onClick={() => setActiveTab('creation')}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                          >
                            <Plus className="w-5 h-5" />
                            <span>发布第一部作品</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userNovels.map((novel) => (
                          <NovelCard key={novel.id} novel={novel} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'creation' && isOwnProfile && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">创作中心</h2>
                      <button
                        onClick={() => setShowPublishForm(!showPublishForm)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>{showPublishForm ? '取消发布' : '发布新作品'}</span>
                      </button>
                    </div>

                    {/* 发布表单 */}
                    {showPublishForm && (
                      <div className="bg-gray-50 rounded-lg p-6 mb-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* 封面上传 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              小说封面
                            </label>
                            <div className="flex items-center space-x-4">
                              {coverPreview ? (
                                <div className="relative">
                                  <img
                                    src={coverPreview}
                                    alt="封面预览"
                                    className="w-32 h-40 object-cover rounded-lg border-2 border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={removeCover}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                  <Upload className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleCoverChange}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  选择封面
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                  支持 JPG、PNG 格式，大小不超过 5MB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 基本信息 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                小说标题 *
                              </label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent ${
                                  errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="请输入小说标题"
                              />
                              {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                标签
                              </label>
                              <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => handleInputChange('tags', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                                placeholder="请输入标签，用逗号分隔"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                连载状态
                              </label>
                              <PrettySelect
                                value={formData.status}
                                onChange={(val) => handleInputChange('status', val)}
                                options={[
                                  { value: 'ongoing', label: '连载中' },
                                  { value: 'completed', label: '已完结' },
                                  { value: 'paused', label: '暂停更新' },
                                ]}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              小说简介 *
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              rows={4}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent ${
                                errors.description ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="请输入小说简介"
                            />
                            {errors.description && (
                              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                            )}
                          </div>

                          {/* 章节内容 */}
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <label className="block text-sm font-medium text-gray-700">
                                章节内容
                              </label>
                              <button
                                type="button"
                                onClick={addChapter}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors flex items-center space-x-1"
                              >
                                <Plus className="w-4 h-4" />
                                <span>添加章节</span>
                              </button>
                            </div>

                            {chapters.map((chapter, index) => (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4 mb-4"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-medium text-gray-700">第 {index + 1} 章</h4>
                                  {chapters.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeChapter(index)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <input
                                      type="text"
                                      value={chapter.title}
                                      onChange={(e) =>
                                        handleChapterChange(index, 'title', e.target.value)
                                      }
                                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                        errors[`chapter_${index}_title`]
                                          ? 'border-red-500'
                                          : 'border-gray-300'
                                      }`}
                                      placeholder="章节标题"
                                    />
                                    {errors[`chapter_${index}_title`] && (
                                      <p className="text-red-500 text-sm mt-1">
                                        {errors[`chapter_${index}_title`]}
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <textarea
                                      value={chapter.content}
                                      onChange={(e) =>
                                        handleChapterChange(index, 'content', e.target.value)
                                      }
                                      rows={8}
                                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                        errors[`chapter_${index}_content`]
                                          ? 'border-red-500'
                                          : 'border-gray-300'
                                      }`}
                                      placeholder="章节内容"
                                    />
                                    {errors[`chapter_${index}_content`] && (
                                      <p className="text-red-500 text-sm mt-1">
                                        {errors[`chapter_${index}_content`]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 提交按钮 */}
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setShowPublishForm(false)}
                              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>发布中...</span>
                                </>
                              ) : (
                                <span>发布小说</span>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* 作品管理列表 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">我的作品管理</h3>
                      {userNovels.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">还没有发布任何作品</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {userNovels.map((novel) => (
                            <NovelCard key={novel.id} novel={novel} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
