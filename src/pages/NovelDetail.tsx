/**
 * 小说详情页面
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, Eye, Calendar, Edit, Trash2, Plus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../store/novelStore';
import type { Novel, Chapter } from '../../shared/types';

const NovelDetail = () => {
  const { username, title } = useParams<{ username: string; title: string }>();
  const { user } = useAuthStore();
  const { novels, loading, fetchNovelDetail, deleteNovel } = useNovelStore();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const isAuthor = user?.username === username;

  useEffect(() => {
    if (!username || !title) {
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
      // 设置封面图片URL
      setCoverImageUrl(`/api/novels/${username}/${title}/cover?t=${Date.now()}`);
    }
  }, [novels, username, title]);

  const handleDeleteNovel = async () => {
    if (!username || !title || !isAuthor) return;

    const confirmed = window.confirm(`确定要删除小说《${title}》吗？此操作不可恢复。`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteNovel(username, title);
      toast.success('小说删除成功');
      navigate('/profile');
    } catch (error) {
      toast.error('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays - 1}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const ChapterItem = ({ chapter, index }: { chapter: Chapter; index: number }) => (
    <Link
      to={`/read/${username}/${title}/${index + 1}`}
      className="block bg-white rounded-lg border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all duration-200 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">
            第{index + 1}章 {chapter.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(chapter.createdAt)}
            </span>
            <span>{Math.ceil((chapter.content?.length || 0) / 500)} 分钟阅读</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl text-gray-600 mb-2">小说不存在</h1>
        <p className="text-gray-500 mb-6">您要查找的小说可能已被删除或不存在</p>
        <Link 
          to="/"
          className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Novel Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center overflow-hidden">
                {coverImageUrl ? (
                  <img 
                    src={coverImageUrl}
                    alt={novel.title}
                    className="w-full h-full object-cover"
                    onError={() => setCoverImageUrl(null)}
                  />
                ) : (
                  <BookOpen className="h-16 w-16 text-white" />
                )}
              </div>
            </div>
            
            {/* Novel Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {novel.title}
                  </h1>
                  <Link 
                    to={`/profile/${novel.author}`}
                    className="flex items-center text-cyan-600 hover:text-cyan-700 font-medium mb-4"
                  >
                    <User className="h-4 w-4 mr-1" />
                    {novel.author}
                  </Link>
                </div>
                
                {isAuthor && (
                  <div className="flex gap-2">
                    <Link 
                      to={`/edit/${username}/${title}`}
                      className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      title="编辑小说"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={handleDeleteNovel}
                      disabled={isDeleting}
                      className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      title="删除小说"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  novel.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : novel.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {novel.status === 'completed' ? '已完结' : novel.status === 'paused' ? '已暂停' : '连载中'}
                </span>
                
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {novel.views || 0} 浏览
                </span>
                
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(novel.updatedAt)}
                </span>
                
                <span className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {novel.chapters?.length || 0} 章
                </span>
              </div>
              
              {novel.tags && novel.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {novel.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-gray-700 leading-relaxed mb-6">
                {novel.description}
              </p>
              
              <div className="flex gap-4">
                {novel.chapters && novel.chapters.length > 0 && (
                  <Link 
                    to={`/read/${username}/${title}/1`}
                    className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    开始阅读
                  </Link>
                )}
                
                {isAuthor && (
                  <Link 
                    to={`/edit/${username}/${title}`}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    添加章节
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            章节目录
          </h2>
          {isAuthor && (
            <Link 
              to={`/edit/${username}/${title}`}
              className="text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              添加章节
            </Link>
          )}
        </div>
        
        {novel.chapters && novel.chapters.length > 0 ? (
          <div className="space-y-3">
            {novel.chapters.map((chapter, index) => (
              <ChapterItem key={index} chapter={chapter} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              还没有章节
            </h3>
            {isAuthor ? (
              <>
                <p className="text-gray-500 mb-6">
                  开始创作您的第一个章节吧！
                </p>
                <Link 
                  to={`/edit/${username}/${title}`}
                  className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加章节
                </Link>
              </>
            ) : (
              <p className="text-gray-500">
                作者还没有发布章节，请稍后再来查看。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NovelDetail;