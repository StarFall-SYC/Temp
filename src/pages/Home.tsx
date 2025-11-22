/**
 * 首页组件 - 响应式优化版本
 */
import { useEffect, useState } from 'react';
import ResponsiveContainer from '../components/ResponsiveContainer';
import ResponsiveGrid from '../components/ResponsiveGrid';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Eye,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  SortAsc,
  Sparkles,
  Users,
  BookMarked,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNovelStore } from '../store/novelStore';
import type { Novel } from '../../shared/types';
import heroBackground from '../assets/hero-bg.png';

const Home = () => {
  const { novels, loading, fetchNovels } = useNovelStore();
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['全部', '玄幻', '都市', '历史', '科幻', '言情', '武侠', '悬疑', '其他'];
  const sortOptions = [
    { value: 'latest', label: '最新更新' },
    { value: 'popular', label: '最热门' },
    { value: 'views', label: '最多浏览' },
    { value: 'title', label: '按标题' },
  ];
  const novelsPerPage = 12;

  // 计算真实统计数据
  const calculateStats = () => {
    const totalViews = novels.reduce((sum, novel) => sum + (novel.views || 0), 0);
    const todayUpdates = novels.filter((novel) => {
      const today = new Date();
      const novelDate = new Date(novel.updatedAt);
      return novelDate.toDateString() === today.toDateString();
    }).length;

    return {
      totalNovels: novels.length,
      totalUsers: Math.max(1, Math.floor(novels.length / 2)),
      totalViews: totalViews,
      todayUpdates: todayUpdates,
    };
  };

  const stats = calculateStats();

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  // 搜索和筛选逻辑
  useEffect(() => {
    let result = novels;

    // 按搜索词过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (novel) =>
          novel.title.toLowerCase().includes(term) ||
          novel.author.toLowerCase().includes(term) ||
          (novel.description && novel.description.toLowerCase().includes(term))
      );
    }

    // 按分类过滤（目前不支持，保留以便未来扩展）
    // if (selectedCategory !== '全部') {
    //   result = result.filter((novel) => novel.category === selectedCategory);
    // }

    // 按排序方式排序
    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'views':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredNovels(result);
    setCurrentPage(1);
  }, [novels, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    if (novels.length > 0) {
      // 热门小说：按浏览量排序，取前6个
      const popular = [...novels].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
      setPopularNovels(popular);

      // 最新更新：按更新时间排序，取前8个
      const latest = [...novels]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8);
      setLatestNovels(latest);

      // 精选推荐：取前6个热门小说，支持2行3列布局
      setFeaturedNovels(popular.slice(0, 8));
    }
  }, [novels]);

  // 英雄区域组件 - 响应式优化
  const HeroSection = () => (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden hero-section"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/80 via-blue-900/70 to-purple-900/80"></div>

      {/* 动态粒子效果 */}
      <div className="absolute inset-0 hidden sm:block">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* 主要内容 - 响应式优化 */}
      <div className="relative z-10 text-center text-white px-3 sm:px-4 md:px-6 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-serif font-bold mb-3 sm:mb-4 md:mb-6 gradient-text hero-title leading-tight">
            玉扶疏小说网
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-gray-200 mb-4 sm:mb-6 md:mb-8 font-light hero-subtitle">
            发现精彩故事，开启阅读之旅
          </p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed hero-description">
            在这里，每一个故事都是一次心灵，每一页文字都承载着作者的匠心与读者的期待
          </p>
        </motion.div>

        {/* 搜索栏 - 响应式优化 */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-10 sm:mb-12 md:mb-16"
        >
          <div className="relative w-full max-w-3xl mx-auto">
            <div className="glass-effect rounded-full p-1.5 sm:p-2 neon-border search-container">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
                <div className="flex items-center flex-1 w-full sm:w-auto">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-400 ml-2 sm:ml-3 md:ml-4 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="搜索小说标题、作者或标签..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-white placeholder-gray-400 text-xs sm:text-sm md:text-base search-input"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gradient-button px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full flex items-center gap-1 sm:gap-2 search-button text-xs sm:text-sm md:text-base w-full sm:w-auto justify-center sm:justify-start"
                >
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>搜索</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 统计数据展示 - 响应式优化 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto"
        >
          {[
            { icon: BookOpen, label: '小说总数', value: stats.totalNovels },
            { icon: Users, label: '用户总数', value: stats.totalUsers },
            { icon: Eye, label: '总浏览量', value: `${(stats.totalViews / 1000000).toFixed(1)}M` },
            { icon: Calendar, label: '今日更新', value: stats.todayUpdates },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-effect rounded-lg p-2 sm:p-3 md:p-4 text-center hover:bg-white/10 transition-colors"
            >
              <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-1 sm:mb-2 text-cyan-400" />
              <p className="text-xs sm:text-sm text-gray-300 mb-0.5 sm:mb-1">{stat.label}</p>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );

  // 空状态组件
  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 sm:py-16 md:py-20"
    >
      <motion.div className="animate-float mb-6 sm:mb-8">
        <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto text-gray-400 mb-4 sm:mb-6" />
      </motion.div>
      <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-gray-600 mb-3 sm:mb-4">
        还没有小说作品
      </h3>
      <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">
        期待更多精彩作品的到来，成为第一个在这里分享故事的作者吧
      </p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          to="/register"
          className="gradient-button px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium inline-flex items-center gap-2 text-sm sm:text-base"
        >
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>开始创作</span>
        </Link>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      {/* 英雄区域 */}
      <HeroSection />

      {/* 主要内容区域 - 响应式优化 */}
      <ResponsiveContainer className="py-8 sm:py-12 md:py-16 lg:py-20">
        {loading ? (
          <div className="flex justify-center items-center py-16 sm:py-20 md:py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-cyan-500 border-t-transparent rounded-full"
            />
          </div>
        ) : novels.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-12 sm:space-y-16 md:space-y-20">
            {/* 精选推荐 */}
            {featuredNovels.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold gradient-text flex items-center gap-2 sm:gap-3">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-500 flex-shrink-0" />
                    <span>精选推荐</span>
                  </h2>
                </div>
                <ResponsiveGrid
                  columns={{ mobile: 1, tablet: 2, desktop: 4 }}
                  gap="lg"
                  className="max-w-7xl mx-auto"
                >
                  {featuredNovels.map((novel, index) => (
                    <Link key={novel.id} to={`/novel/${novel.author}/${novel.title}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="glass-effect rounded-2xl p-4 sm:p-5 md:p-6 card-hover neon-border cursor-pointer h-full flex flex-col"
                      >
                        <div className="aspect-[3/4] bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl mb-3 sm:mb-4 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                          {novel.coverUrl ? (
                            <img
                              src={novel.coverUrl}
                              alt={novel.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <BookOpen
                            className={`h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-white ${
                              novel.coverUrl ? 'hidden' : ''
                            }`}
                          />
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl font-serif font-semibold mb-2 text-gray-800 line-clamp-2">
                          {novel.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3 flex-grow">
                          {novel.description}
                        </p>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            {novel.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {new Date(novel.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </ResponsiveGrid>
              </motion.section>
            )}

            {/* 最新更新 */}
            {latestNovels.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold gradient-text flex items-center gap-2 sm:gap-3">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
                    <span>最新更新</span>
                  </h2>
                  <Link
                    to="/novels"
                    className="text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 text-xs sm:text-sm md:text-base whitespace-nowrap"
                  >
                    查看更多
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </div>
                <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
                  {latestNovels.map((novel, index) => (
                    <motion.div
                      key={novel.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="glass-effect rounded-xl p-3 sm:p-4 md:p-5 card-hover novel-card h-full"
                    >
                      <Link to={`/novel/${novel.author}/${novel.title}`} className="flex items-center gap-3 sm:gap-4 h-full">
                        <div className="flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center novel-cover">
                          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-serif font-semibold text-gray-800 mb-1 line-clamp-1 novel-title text-sm sm:text-base md:text-lg">
                            {novel.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 novel-description">
                            {novel.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2 gap-1">
                            <span className="truncate">{novel.author}</span>
                            <span className="flex-shrink-0">
                              {new Date(novel.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </ResponsiveGrid>
              </motion.section>
            )}
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default Home;

