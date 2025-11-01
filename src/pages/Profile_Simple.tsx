/**
 * 简化的用户个人页面 - 专注于头像功能
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, User, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useNovelStore } from '../store/novelStore';

const ProfileSimple = () => {
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const { username } = useParams<{ username: string }>();
  const { user, token } = useAuthStore();
  const { novels, fetchUserNovels } = useNovelStore();
  const navigate = useNavigate();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    if (user?.avatarUrl) {
      setAvatarPreview(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('头像图片大小不能超过2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!user || !avatarFile || !token) {
      toast.error('请先登录并选择头像文件');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success('头像上传成功');
        // 更新store中的用户数据
        useAuthStore.getState().setUser(data.data.user, useAuthStore.getState().token || "");
        setAvatarFile(null);
      } else {
        toast.error(data.message || '头像上传失败');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      toast.error('上传头像失败');
    } finally {
      setIsUploading(false);
    }
  };

  const userNovels = novels.filter((novel) => novel.author === targetUsername);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* 头像区域 */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={
                      avatarPreview ||
                      `https://ui-avatars.com/api/?name=${targetUsername}&background=random&color=fff&size=128`
                    }
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-full">
                      <Upload
                        className="w-8 h-8 text-white"
                        onClick={() => avatarFileInputRef.current?.click()}
                      />
                    </div>
                  )}
                </div>

                {/* 隐藏的文件输入 */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* 用户信息 */}
              <div className="flex-1 text-center md:text-left text-white">
                <h1 className="text-4xl font-bold mb-2">{targetUsername}</h1>
                <p className="text-blue-100 mb-4">
                  {isOwnProfile ? '欢迎回到您的创作空间' : `${targetUsername} 的个人主页`}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{userNovels.length}</div>
                    <div className="text-blue-100">作品</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {userNovels.reduce((total, novel) => total + (novel.views || 0), 0)}
                    </div>
                    <div className="text-blue-100">总浏览量</div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              {isOwnProfile && (
                <div className="flex flex-col space-y-3">
                  <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>设置</span>
                  </button>

                  {avatarFile && (
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                      onClick={handleAvatarUpload}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? '上传中...' : '上传头像'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 作品展示 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isOwnProfile ? '我的作品' : `${targetUsername} 的作品`}
          </h2>

          {userNovels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNovels.map((novel) => (
                <div
                  key={novel.id}
                  className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{novel.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{novel.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{novel.chapters?.length || 0} 章节</span>
                    <span>{novel.views || 0} 浏览</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {isOwnProfile ? '您还没有发布任何作品' : '该用户还没有发布任何作品'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSimple;
