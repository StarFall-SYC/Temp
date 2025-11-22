/**
 * 增强的阅读设置面板组件
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Type,
  Palette,
  Sun,
  Moon,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Settings,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  BarChart3,
  Calendar,
  Flame,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { useReadingSettings } from '../hooks/useReadingSettings';
import { useReadingStats } from '../hooks/useReadingStats';

interface ReadingSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReadingSettingsPanel: React.FC<ReadingSettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, saveSettings, resetSettings, getThemeClasses } = useReadingSettings();
  const {
    stats,
    getTodayReadingTime,
    getTodayProgress,
    getWeeklyTotal,
    formatMinutes,
    setDailyGoal,
  } = useReadingStats();

  const themeClasses = getThemeClasses();

  if (!isOpen) return null;

  const handleSliderChange = (key: string, value: number) => {
    saveSettings({ [key]: value });
  };

  const handleToggle = (key: string, value: boolean) => {
    saveSettings({ [key]: value });
  };

  const handleSelect = (key: string, value: string) => {
    saveSettings({ [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative ${themeClasses.contentBg}`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${themeClasses.borderColor}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>阅读设置</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-64 border-r ${themeClasses.borderColor} overflow-y-auto`}>
            <div className="p-4">
              <nav className="space-y-2">
                {[
                  { id: 'display', label: '显示设置', icon: Monitor },
                  { id: 'typography', label: '字体排版', icon: Type },
                  { id: 'theme', label: '主题外观', icon: Palette },
                  { id: 'reading', label: '阅读模式', icon: BookOpen },
                  { id: 'stats', label: '阅读统计', icon: BarChart3 },
                  { id: 'advanced', label: '高级设置', icon: Settings },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* 显示设置 */}
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text} flex items-center`}>
                  <Monitor className="w-5 h-5 mr-2" />
                  显示设置
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 字体大小 */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className={`text-sm font-medium ${themeClasses.text}`}>字体大小</label>
                      <span className={`text-sm font-mono ${themeClasses.accent}`}>
                        {settings.fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="32"
                      value={settings.fontSize}
                      onChange={(e) => handleSliderChange('fontSize', parseInt(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>小</span>
                      <span>大</span>
                    </div>
                  </div>

                  {/* 行间距 */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className={`text-sm font-medium ${themeClasses.text}`}>行间距</label>
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
                      onChange={(e) => handleSliderChange('lineHeight', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>紧密</span>
                      <span>宽松</span>
                    </div>
                  </div>

                  {/* 页面宽度 */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${themeClasses.text}`}>
                      页面宽度
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'narrow', label: '窄', icon: Smartphone },
                        { key: 'normal', label: '标准', icon: Tablet },
                        { key: 'wide', label: '宽', icon: Monitor },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => handleSelect('pageWidth', key)}
                          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-1 ${
                            settings.pageWidth === key
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : `${themeClasses.borderColor} ${themeClasses.text} hover:border-blue-300`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 文本对齐 */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${themeClasses.text}`}>
                      文本对齐
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'left', label: '左对齐', icon: AlignLeft },
                        { key: 'center', label: '居中', icon: AlignCenter },
                        { key: 'justify', label: '两端对齐', icon: AlignJustify },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => handleSelect('textAlign', key)}
                          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-1 ${
                            settings.textAlign === key
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : `${themeClasses.borderColor} ${themeClasses.text} hover:border-blue-300`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 字体设置 */}
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text} flex items-center`}>
                  <Type className="w-5 h-5 mr-2" />
                  字体设置
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'system', label: '系统字体', desc: '默认无衬线字体' },
                    { key: 'serif', label: '衬线字体', desc: '适合长文阅读' },
                    { key: 'mono', label: '等宽字体', desc: '代码风格字体' },
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => handleSelect('fontFamily', key)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        settings.fontFamily === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : `${themeClasses.borderColor} ${themeClasses.text} hover:border-blue-300`
                      }`}
                    >
                      <div className="font-semibold mb-1">{label}</div>
                      <div className="text-xs opacity-70">{desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* 主题设置 */}
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text} flex items-center`}>
                  <Palette className="w-5 h-5 mr-2" />
                  主题外观
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    <button
                      key={key}
                      onClick={() => handleSelect('theme', key)}
                      className={`p-4 rounded-xl border-2 transition-all ${bg} ${text} ${border} ${
                        settings.theme === key ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{label}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* 阅读模式 */}
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text} flex items-center`}>
                  <BookOpen className="w-5 h-5 mr-2" />
                  阅读模式
                </h3>

                <div className="space-y-3">
                  {[
                    { key: 'normal', label: '普通模式', desc: '显示所有界面元素，适合一般阅读' },
                    { key: 'focus', label: '专注模式', desc: '隐藏干扰元素，专注内容阅读' },
                    { key: 'immersive', label: '沉浸模式', desc: '全屏阅读体验，最小化界面' },
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => handleSelect('readingMode', key)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        settings.readingMode === key
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : `${themeClasses.borderColor} ${themeClasses.text} hover:border-blue-300`
                      }`}
                    >
                      <div className="font-semibold mb-1">{label}</div>
                      <div className="text-sm opacity-70">{desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* 阅读统计 */}
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text} flex items-center`}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  阅读统计
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 今日阅读 */}
                  <div className={`p-4 rounded-xl border ${themeClasses.borderColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${themeClasses.text} opacity-70`}>今日阅读</span>
                      <Calendar className={`w-4 h-4 ${themeClasses.accent}`} />
                    </div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {formatMinutes(getTodayReadingTime())}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>目标: {formatMinutes(stats.dailyGoal)}</span>
                        <span>{Math.round(getTodayProgress())}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(getTodayProgress(), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 连续天数 */}
                  <div className={`p-4 rounded-xl border ${themeClasses.borderColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${themeClasses.text} opacity-70`}>连续阅读</span>
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {stats.readingStreak} 天
                    </div>
                    <div className={`text-xs ${themeClasses.text} opacity-70 mt-1`}>
                      保持良好的阅读习惯
                    </div>
                  </div>

                  {/* 本周总计 */}
                  <div className={`p-4 rounded-xl border ${themeClasses.borderColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${themeClasses.text} opacity-70`}>本周总计</span>
                      <TrendingUp className={`w-4 h-4 ${themeClasses.accent}`} />
                    </div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {formatMinutes(getWeeklyTotal())}
                    </div>
                    <div className={`text-xs ${themeClasses.text} opacity-70 mt-1`}>
                      已读 {stats.chaptersRead} 章节
                    </div>
                  </div>
                </div>

                {/* 每日目标设置 */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className={`text-sm font-medium ${themeClasses.text}`}>
                      每日阅读目标
                    </label>
                    <span className={`text-sm font-mono ${themeClasses.accent}`}>
                      {stats.dailyGoal}分钟
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="10"
                    value={stats.dailyGoal}
                    onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>10分钟</span>
                    <span>3小时</span>
                  </div>
                </div>
              </section>

              {/* 高级设置 */}
              <section>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text} flex items-center`}>
                  <Settings className="w-5 h-5 mr-2" />
                  高级设置
                </h3>

                <div className="space-y-4">
                  {/* 功能开关 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'showProgress', label: '显示阅读进度', desc: '在页面顶部显示进度条' },
                      { key: 'autoScroll', label: '自动滚动', desc: '自动滚动页面内容' },
                      { key: 'showLineNumbers', label: '显示行号', desc: '在编辑模式下显示行号' },
                      {
                        key: 'highlightCurrentLine',
                        label: '高亮当前行',
                        desc: '高亮显示当前阅读行',
                      },
                      {
                        key: 'enableNightMode',
                        label: '启用夜间模式',
                        desc: '在指定时间自动切换主题',
                      },
                      { key: 'enableSpeech', label: '语音朗读', desc: '启用文本转语音功能' },
                    ].map(({ key, label, desc }) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border ${themeClasses.borderColor}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${themeClasses.text}`}>{label}</span>
                          <button
                            onClick={() =>
                              handleToggle(key, !settings[key as keyof typeof settings])
                            }
                            className={`w-12 h-6 rounded-full transition-colors ${
                              settings[key as keyof typeof settings] ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                                settings[key as keyof typeof settings]
                                  ? 'translate-x-6'
                                  : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                        <p className={`text-xs ${themeClasses.text} opacity-70`}>{desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* 自动滚动速度 */}
                  {settings.autoScroll && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className={`text-sm font-medium ${themeClasses.text}`}>
                          自动滚动速度
                        </label>
                        <span className={`text-sm font-mono ${themeClasses.accent}`}>
                          {settings.scrollSpeed}ms
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        value={settings.scrollSpeed}
                        onChange={(e) =>
                          handleSliderChange('scrollSpeed', parseInt(e.target.value))
                        }
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>快</span>
                        <span>慢</span>
                      </div>
                    </div>
                  )}

                  {/* 夜间模式时间设置 */}
                  {settings.enableNightMode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                          夜间模式开始
                        </label>
                        <input
                          type="time"
                          value={settings.nightModeStart}
                          onChange={(e) => handleSelect('nightModeStart', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg ${themeClasses.borderColor} ${themeClasses.contentBg} ${themeClasses.text}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                          夜间模式结束
                        </label>
                        <input
                          type="time"
                          value={settings.nightModeEnd}
                          onChange={(e) => handleSelect('nightModeEnd', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg ${themeClasses.borderColor} ${themeClasses.contentBg} ${themeClasses.text}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t ${themeClasses.borderColor} flex justify-between items-center`}
        >
          <button
            onClick={resetSettings}
            className={`px-4 py-2 rounded-lg transition-colors ${themeClasses.text} ${themeClasses.buttonBg} flex items-center space-x-2`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置设置</span>
          </button>

          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            完成设置
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReadingSettingsPanel;
