/**
 * 增强的文本编辑器组件
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Undo,
  Redo,
  Search,
  Save,
  Maximize,
  Minimize,
} from 'lucide-react';

interface EnhancedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
  showWordCount?: boolean;
  showLineNumbers?: boolean;
  autoSave?: boolean;
  onSave?: () => void;
  theme?: 'light' | 'dark' | 'sepia';
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: 'system' | 'serif' | 'mono';
}

const EnhancedTextEditor: React.FC<EnhancedTextEditorProps> = ({
  value,
  onChange,
  placeholder = '开始写作...',
  className = '',
  showToolbar = true,
  showWordCount = true,
  showLineNumbers = false,
  autoSave = false,
  onSave,
  theme = 'light',
  fontSize = 16,
  lineHeight = 1.6,
  fontFamily = 'system',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 计算统计信息
  useEffect(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const chars = value.length;
    const lines = value.split('\n').length;

    setWordCount(words);
    setCharCount(chars);
    setLineCount(lines);
  }, [value]);

  // 自动保存
  useEffect(() => {
    if (autoSave && onSave) {
      const timer = setTimeout(() => {
        onSave();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [value, autoSave, onSave]);

  // 更新历史记录
  const updateHistory = (newValue: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newValue);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  // 插入文本
  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = before + selectedText + after;

    const newValue = value.substring(0, start) + newText + value.substring(end);
    updateHistory(newValue);

    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // 格式化文本
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
      case 'strikethrough':
        insertText('~~', '~~');
        break;
      case 'quote':
        insertText('> ');
        break;
      case 'code':
        insertText('`', '`');
        break;
      case 'list':
        insertText('- ');
        break;
      case 'orderedList':
        insertText('1. ');
        break;
      case 'link':
        insertText('[', '](url)');
        break;
      case 'image':
        insertText('![', '](image-url)');
        break;
    }
  };

  // 查找替换
  const findAndReplace = () => {
    if (!findText) return;

    const newValue = replaceText ? value.replace(new RegExp(findText, 'g'), replaceText) : value;

    if (newValue !== value) {
      updateHistory(newValue);
    }
  };

  // 获取主题样式
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-gray-100',
          border: 'border-gray-700',
          toolbar: 'bg-gray-800 border-gray-700',
          button: 'hover:bg-gray-700 text-gray-300',
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          toolbar: 'bg-amber-100 border-amber-200',
          button: 'hover:bg-amber-200 text-amber-700',
        };
      default:
        return {
          bg: 'bg-white',
          text: 'text-gray-800',
          border: 'border-gray-200',
          toolbar: 'bg-gray-50 border-gray-200',
          button: 'hover:bg-gray-100 text-gray-600',
        };
    }
  };

  // 获取字体样式
  const getFontStyle = () => {
    const fontFamilyMap = {
      system: 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"Fira Code", "Consolas", monospace',
    };

    return {
      fontSize: `${fontSize}px`,
      lineHeight: lineHeight,
      fontFamily: fontFamilyMap[fontFamily],
    };
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      <div
        className={`flex flex-col h-full rounded-lg border ${themeClasses.border} ${themeClasses.bg} overflow-hidden`}
      >
        {/* Toolbar */}
        <AnimatePresence>
          {showToolbar && (
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className={`border-b ${themeClasses.toolbar} p-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 flex-wrap">
                  {/* 格式化按钮 */}
                  <div className="flex items-center space-x-1">
                    {[
                      { type: 'bold', icon: Bold, title: '粗体 (Ctrl+B)' },
                      { type: 'italic', icon: Italic, title: '斜体 (Ctrl+I)' },
                      { type: 'underline', icon: Underline, title: '下划线 (Ctrl+U)' },
                      { type: 'strikethrough', icon: Strikethrough, title: '删除线' },
                    ].map(({ type, icon: Icon, title }) => (
                      <button
                        key={type}
                        onClick={() => formatText(type)}
                        className={`p-2 rounded transition-colors ${themeClasses.button}`}
                        title={title}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>

                  <div className={`w-px h-6 ${themeClasses.border}`}></div>

                  <div className="flex items-center space-x-1">
                    {[
                      { type: 'quote', icon: Quote, title: '引用' },
                      { type: 'code', icon: Code, title: '代码' },
                      { type: 'list', icon: List, title: '无序列表' },
                      { type: 'orderedList', icon: ListOrdered, title: '有序列表' },
                    ].map(({ type, icon: Icon, title }) => (
                      <button
                        key={type}
                        onClick={() => formatText(type)}
                        className={`p-2 rounded transition-colors ${themeClasses.button}`}
                        title={title}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>

                  <div className={`w-px h-6 ${themeClasses.border}`}></div>

                  <div className="flex items-center space-x-1">
                    {[
                      { type: 'link', icon: Link, title: '链接' },
                      { type: 'image', icon: Image, title: '图片' },
                    ].map(({ type, icon: Icon, title }) => (
                      <button
                        key={type}
                        onClick={() => formatText(type)}
                        className={`p-2 rounded transition-colors ${themeClasses.button}`}
                        title={title}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>

                  <div className={`w-px h-6 ${themeClasses.border}`}></div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={undo}
                      disabled={historyIndex <= 0}
                      className={`p-2 rounded transition-colors ${themeClasses.button} disabled:opacity-50`}
                      title="撤销 (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4" />
                    </button>

                    <button
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                      className={`p-2 rounded transition-colors ${themeClasses.button} disabled:opacity-50`}
                      title="重做 (Ctrl+Y)"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setShowFind(!showFind)}
                    className={`p-2 rounded transition-colors ${themeClasses.button}`}
                    title="查找替换 (Ctrl+F)"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {onSave && (
                    <button
                      onClick={onSave}
                      className={`p-2 rounded transition-colors ${themeClasses.button}`}
                      title="保存 (Ctrl+S)"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`p-2 rounded transition-colors ${themeClasses.button}`}
                    title={isFullscreen ? '退出全屏' : '全屏编辑'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 查找替换面板 */}
              <AnimatePresence>
                {showFind && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`mt-2 p-3 border-t ${themeClasses.border}`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="查找..."
                        className={`flex-1 px-3 py-1 border rounded ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text}`}
                      />
                      <input
                        type="text"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="替换为..."
                        className={`flex-1 px-3 py-1 border rounded ${themeClasses.border} ${themeClasses.bg} ${themeClasses.text}`}
                      />
                      <button
                        onClick={findAndReplace}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        替换
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex">
          {/* Line Numbers */}
          {showLineNumbers && (
            <div
              className={`w-12 ${themeClasses.bg} border-r ${themeClasses.border} p-2 text-right text-sm ${themeClasses.text} opacity-50 select-none`}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} style={{ lineHeight: lineHeight }}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                updateHistory(e.target.value);

                // 更新光标位置
                const textarea = e.target;
                const text = textarea.value;
                const cursorPos = textarea.selectionStart;
                const textBeforeCursor = text.substring(0, cursorPos);
                const lines = textBeforeCursor.split('\n');
                const currentLine = lines.length;
                const currentColumn = lines[lines.length - 1].length + 1;

                setCursorPosition({ line: currentLine, column: currentColumn });
              }}
              placeholder={placeholder}
              className={`w-full h-full p-4 border-none outline-none resize-none ${themeClasses.bg} ${themeClasses.text}`}
              style={getFontStyle()}
              spellCheck={false}
            />

            {/* Word Count Overlay */}
            {showWordCount && (
              <div
                className={`absolute bottom-4 right-4 ${themeClasses.text} opacity-50 text-sm bg-black bg-opacity-10 rounded px-2 py-1`}
              >
                {wordCount.toLocaleString()} 字 · {charCount.toLocaleString()} 字符
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div
          className={`border-t ${themeClasses.toolbar} px-4 py-2 flex items-center justify-between text-sm ${themeClasses.text} opacity-70`}
        >
          <div className="flex items-center space-x-4">
            <span>
              行 {cursorPosition.line}, 列 {cursorPosition.column}
            </span>
            <span>{lineCount} 行</span>
            <span>{wordCount} 字</span>
            <span>{charCount} 字符</span>
          </div>

          <div className="flex items-center space-x-2">
            {autoSave && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>自动保存</span>
              </span>
            )}
            <span>
              {fontFamily} · {fontSize}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTextEditor;
