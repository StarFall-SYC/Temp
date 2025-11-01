/**
 * 优化后的用户个人页面
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
  TrendingUp,
  Award,
  Clock,
  Star,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
  PenTool,
  Bookmark,
  Users,
  Globe,
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
  const [activeTab, setActiveTab] = useState<'profile' | 'creation' | 'analytics'>('profile');

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

  // 计算统计数据
  const totalViews = userNovels.reduce((total, novel) => total + (novel.views || 0), 0);
  const totalChapters = userNovels.reduce(
    (total, novel) => total + (novel.chapters?.length || 0),
    0
  );
  const completedNovels = userNovels.filter((novel) => novel.status === 'completed').length;
  const ongoingNovels = userNovels.filter((novel) => novel.status === 'ongoing').length;

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

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = 'blue',
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-cyan-500',
      green: 'from-green-500 to-emerald-500',
      purple: 'from-purple-500 to-indigo-500',
      orange: 'from-orange-500 to-red-500',
      pink: 'from-pink-500 to-rose-500',
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          </div>
          <div
            className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const NovelCard = ({ novel }: { novel: Novel }) => (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
      <div className="relative">
        <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 h-48 flex items-center justify-center relative overflow-hidden">
          {novel.coverUrl ? (
            <img
              src={novel.coverUrl}
              alt={novel.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <BookOpen className={`h-16 w-16 text-white/80 ${novel.coverUrl ? 'hidden' : ''}`} />

          {/* 悬浮效果 */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex space-x-2">
              <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                <Heart className="w-4 h-4" />
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              novel.status === 'completed'
                ? 'bg-green-500/90 text-white'
                : 'bg-blue-500/90 text-white'
            }`}
          >
            {novel.status === 'completed' ? '已完结' : '连载中'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-gray-900 mb-3 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
          {novel.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {novel.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <Eye className="h-3 w-3 mr-1" />
              {novel.views || 0}
            </span>
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <BookOpen className="h-3 w-3 mr-1" />
              {novel.chapters?.length || 0}章
            </span>
          </div>
          <span className="text-gray-400">{formatDate(novel.updatedAt)}</span>
        </div>

        {novel.tags && novel.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {novel.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link
            to={`/novel/${novel.author}/${novel.title}`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
          >
            查看详情
          </Link>

          {isOwnProfile && (
            <>
              <Link
                to={`/edit/${novel.author}/${novel.title}`}
                className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors group"
                title="编辑小说"
              >
                <Edit className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
              </Link>

              <button
                onClick={() => handleDeleteNovel(novel.title)}
                disabled={isDeleting === novel.title}
                className="bg-red-100 text-red-700 p-3 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 group"
                title="删除小说"
              >
                {isDeleting === novel.title ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                ) : (
                  <Trash2 className="h-4 w-4 group-hover:text-red-800 transition-colors" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* 用户信息卡片 - 增强版 */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden">
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-cyan-400/10 to-blue-400/10 rounded-full translate-y-24 -translate-x-24"></div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                      {targetUsername?.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">{targetUsername}</h1>
                    <p className="text-gray-600 mb-4">
                      {isOwnProfile ? '欢迎回到您的创作空间' : `${targetUsername} 的个人主页`}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-600">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold">{userNovels.length}</span>
                        <span>部作品</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-green-500" />
                        <span className="font-semibold">{totalViews.toLocaleString()}</span>
                        <span>总浏览量</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PenTool className="w-5 h-5 text-purple-500" />
                        <span className="font-semibold">{totalChapters}</span>
                        <span>总章节</span>
                      </div>
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="flex space-x-3">
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>设置</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 统计卡片 */}
            {isOwnProfile && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={BookOpen}
                  title="总作品数"
                  value={userNovels.length}
                  subtitle="部作品"
                  color="blue"
                />
                <StatCard
                  icon={Eye}
                  title="总浏览量"
                  value={totalViews.toLocaleString()}
                  subtitle="次浏览"
                  color="green"
                />
                <StatCard
                  icon={Award}
                  title="已完结"
                  value={completedNovels}
                  subtitle="部作品"
                  color="purple"
                />
                <StatCard
                  icon={TrendingUp}
                  title="连载中"
                  value={ongoingNovels}
                  subtitle="部作品"
                  color="orange"
                />
              </div>
            )}

            {/* 标签页导航 - 增强版 */}
            <div className="bg-white rounded-2xl shadow-xl mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-8">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>作品展示</span>
                  </button>
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => setActiveTab('creation')}
                        className={`py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                          activeTab === 'creation'
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <PenTool className="w-4 h-4" />
                        <span>创作中心</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className={`py-4 px-2 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                          activeTab === 'analytics'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>数据分析</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>

              {/* 标签页内容 */}
              <div className="p-8">
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-800">
                        {isOwnProfile ? '我的作品' : `${targetUsername} 的作品`}
                      </h2>
                      {isOwnProfile && (
                        <button
                          onClick={() => setActiveTab('creation')}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        >
                          <Plus className="w-5 h-5" />
                          <span>创作新作品</span>
                        </button>
                      )}
                    </div>

                    {userNovels.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <BookOpen className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          {isOwnProfile ? '开始您的创作之旅' : '暂无作品'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {isOwnProfile
                            ? '发布您的第一部作品，与读者分享您的故事'
                            : '该用户还没有发布任何作品'}
                        </p>
                        {isOwnProfile && (
                          <button
                            onClick={() => setActiveTab('creation')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
                          >
                            <Plus className="w-5 h-5" />
                            <span>发布第一部作品</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {userNovels.map((novel) => (
                          <NovelCard key={novel.id} novel={novel} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'creation' && isOwnProfile && (
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-800">创作中心</h2>
                      <button
                        onClick={() => setShowPublishForm(!showPublishForm)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>{showPublishForm ? '取消发布' : '发布新作品'}</span>
                      </button>
                    </div>

                    {showPublishForm && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border border-purple-100">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                          <PenTool className="w-6 h-6 text-purple-600" />
                          <span>发布新作品</span>
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-8">
                          {/* 封面上传 */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                              作品封面
                            </label>
                            <div className="flex items-start space-x-6">
                              {coverPreview ? (
                                <div className="relative">
                                  <img
                                    src={coverPreview}
                                    alt="封面预览"
                                    className="w-32 h-40 object-cover rounded-lg shadow-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={removeCover}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-32 h-40 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center bg-white/50">
                                  <Upload className="w-8 h-8 text-purple-400" />
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
                                  className="bg-white border-2 border-purple-300 rounded-lg px-6 py-3 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors shadow-sm"
                                >
                                  选择封面
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                  支持 JPG、PNG 格式，大小不超过 5MB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 基本信息 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                小说标题 *
                              </label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                                  errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="请输入小说标题"
                              />
                              {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                标签
                              </label>
                              <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => handleInputChange('tags', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="请输入标签，用逗号分隔"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              小说简介 *
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              rows={4}
                              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
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
                            <div className="flex justify-between items-center mb-6">
                              <label className="block text-sm font-semibold text-gray-700">
                                章节内容
                              </label>
                              <button
                                type="button"
                                onClick={addChapter}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center space-x-2 shadow-lg"
                              >
                                <Plus className="w-4 h-4" />
                                <span>添加章节</span>
                              </button>
                            </div>

                            {chapters.map((chapter, index) => (
                              <div
                                key={index}
                                className="border-2 border-gray-200 rounded-lg p-6 mb-6 bg-white"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-semibold text-gray-700 flex items-center space-x-2">
                                    <BookOpen className="w-4 h-4" />
                                    <span>第 {index + 1} 章</span>
                                  </h4>
                                  {chapters.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeChapter(index)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <input
                                      type="text"
                                      value={chapter.title}
                                      onChange={(e) =>
                                        handleChapterChange(index, 'title', e.target.value)
                                      }
                                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
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
                                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
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
                              className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>发布中...</span>
                                </>
                              ) : (
                                <>
                                  <PenTool className="w-4 h-4" />
                                  <span>发布小说</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* 作品管理列表 */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-6">我的作品管理</h3>
                      {userNovels.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">还没有发布任何作品</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {userNovels.map((novel) => (
                            <NovelCard key={novel.id} novel={novel} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && isOwnProfile && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">数据分析</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 浏览量趋势 */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <span>浏览量趋势</span>
                        </h3>
                        <div className="h-48 flex items-center justify-center text-gray-500">
                          <p>图表功能开发中...</p>
                        </div>
                      </div>

                      {/* 作品表现 */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                          <Award className="w-5 h-5 text-green-600" />
                          <span>作品表现</span>
                        </h3>
                        <div className="space-y-4">
                          {userNovels.slice(0, 3).map((novel, index) => (
                            <div
                              key={novel.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </span>
                                <span className="font-medium">{novel.title}</span>
                              </div>
                              <span className="text-green-600 font-semibold">
                                {novel.views || 0} 浏览
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
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
