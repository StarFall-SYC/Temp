// api/utils/sanitizer.ts
import sanitizeHtml from 'sanitize-html';

const defaultOptions: any = {
  // 允许的标签，用户输入中只保留这些标签
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote'],
  // 允许的属性，仅保留 a 标签的 href 属性
  allowedAttributes: {
    'a': ['href', 'name', 'target']
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
  // 强制移除所有 style 属性以防止 XSS 攻击
  disallowedTagsMode: 'discard', 
  // 移除所有 class 属性，防止样式注入
  transformTags: {
    '*': (tagName: string, attribs: { [key: string]: string }) => {
      delete attribs.class;
      delete attribs.style;
      return { tagName, attribs };
    }
  }
};

/**
 * 清理 HTML 内容以防止 XSS 攻击
 * @param html 待清理的 HTML 字符串
 * @returns 清理后的字符串
 */
export function sanitize(html: string): string {
  return sanitizeHtml(html, defaultOptions);
}

/**
 * 清理路径部分，移除所有可能导致路径遍历的字符
 * @param pathPart 路径片段
 * @returns 清理后的路径片段
 */
export function sanitizePath(pathPart: string): string {
    // 移除所有非字母、数字、中文、下划线、空格、连字符的字符
    // 允许中文是为了支持中文标题
    return pathPart.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5 -]/g, '').trim();
}

/**
 * 清理普通文本，移除所有 HTML 标签
 * @param text 待清理的文本
 * @returns 清理后的文本
 */
export function sanitizeText(text: string): string {
    return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
}

