/**
 * 小说管理API路由
 * 处理小说的CRUD操作、章节管理、封面上传等
 */
import { Router, type Request, type Response } from 'express';
import { sanitize, sanitizeText, sanitizePath } from '../utils/sanitizer.js';
import type { ApiResponse, Novel, Chapter } from '../../shared/types.js';
import {
  createNovel,
  getNovel,
  getUserNovels,
  getAllNovels,
  addChapter,
  updateNovel,
  deleteNovel,
  incrementViewCount,
} from '../utils/novelStorage.js';
import { upload, saveCoverImage, getCoverImage, coverImageExists } from '../utils/fileUpload.js';
import { authenticateToken, optionalAuth } from '../utils/auth.js';
import { getUserById } from '../utils/userStorage.js';

const router = Router();

/**
 * 获取所有小说（首页展示）
 * GET /api/novels
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const novels = await getAllNovels();

    // 按更新时间排序
    novels.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.status(200).json({
      success: true,
      message: '获取小说列表成功',
      data: novels,
    } as ApiResponse<Novel[]>);
  } catch (error) {
    console.error('获取小说列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    } as ApiResponse);
  }
});

/**
 * 创建新小说
 * POST /api/novels
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title: rawTitle, description: rawDescription, tags, status } = req.body;
    
    // 清理输入
    const title = sanitizeText(rawTitle);
    const description = sanitizeText(rawDescription);
    const authorId = req.user!.id;

    // 验证输入
    if (!title || !description) {
      res.status(400).json({
        success: false,
        message: '标题和描述都是必填项',
      } as ApiResponse);
      return;
    }

    if (title.length < 1 || title.length > 100) {
      res.status(400).json({
        success: false,
        message: '标题长度必须在1-100个字符之间',
      } as ApiResponse);
      return;
    }

    if (description.length < 10 || description.length > 1000) {
      res.status(400).json({
        success: false,
        message: '描述长度必须在10-1000个字符之间',
      } as ApiResponse);
      return;
    }

    // 检查用户是否已有同名小说
    const existingNovel = await getNovel(req.user!.username, title);
    if (existingNovel) {
      res.status(409).json({
        success: false,
        message: '您已有同名小说存在',
      } as ApiResponse);
      return;
    }

    const novel = await createNovel(authorId, {
      title,
      description,
      tags: tags || [],
      status: status || 'ongoing',
    });

    res.status(201).json({
      success: true,
      message: '小说创建成功',
      data: novel,
    } as ApiResponse<Novel>);
  } catch (error) {
    console.error('创建小说失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    } as ApiResponse);
  }
});

/**
 * 搜索小说
 * GET /api/novels/search?q={query}&type={type}&page={page}&limit={limit}
 */
router.get('/search', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type = 'all', page = '1', limit = '20' } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      res.status(400).json({
        success: false,
        message: '搜索关键词不能为空',
      } as ApiResponse);
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const searchType = (type as string).toLowerCase();
    const keyword = q.toLowerCase().trim();

    // 获取所有小说
    const allNovels = await getAllNovels();

    // 根据搜索类型过滤
    const results = allNovels.filter((novel) => {
      switch (searchType) {
        case 'title':
          return novel.title.toLowerCase().includes(keyword);
        case 'author':
          return novel.author.toLowerCase().includes(keyword);
        case 'tag':
          return novel.tags?.some((tag) => tag.toLowerCase().includes(keyword)) || false;
        case 'content':
          return (
            novel.chapters?.some((chapter) => chapter.content.toLowerCase().includes(keyword)) ||
            false
          );
        case 'all':
        default:
          return (
            novel.title.toLowerCase().includes(keyword) ||
            novel.author.toLowerCase().includes(keyword) ||
            novel.description.toLowerCase().includes(keyword) ||
            novel.tags?.some((tag) => tag.toLowerCase().includes(keyword)) ||
            false
          );
      }
    });

    // 按相关度排序（标题匹配度最高）
    results.sort((a, b) => {
      const aMatch = a.title.toLowerCase().includes(keyword)
        ? 2
        : a.description.toLowerCase().includes(keyword)
          ? 1
          : 0;
      const bMatch = b.title.toLowerCase().includes(keyword)
        ? 2
        : b.description.toLowerCase().includes(keyword)
          ? 1
          : 0;
      return bMatch - aMatch || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // 分页
    const total = results.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedResults = results.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      success: true,
      message: '搜索成功',
      data: {
        results: paginatedResults,
        total,
        page: pageNum,
        limit: limitNum,
        hasMore: startIndex + limitNum < total,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('搜索小说失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    } as ApiResponse);
  }
});

/**
 * 获取用户的所有小说
 * GET /api/novels/user/:username
 */
router.get('/user/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username: rawUsername } = req.params;
    const username = sanitizePath(rawUsername);
    const novels = await getUserNovels(username);

    res.status(200).json({
      success: true,
      message: '获取用户小说列表成功',
      data: novels,
    } as ApiResponse<Novel[]>);
  } catch (error) {
    console.error('获取用户小说列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    } as ApiResponse);
  }
});

/**
 * 获取特定小说详情
 * GET /api/novels/:username/:title
 */
router.get(
  '/:username/:title',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username: rawUsername, title: rawTitle } = req.params;
      const username = sanitizePath(rawUsername);
      const title = sanitizePath(rawTitle);
      const novel = await getNovel(username, decodeURIComponent(title));

      if (!novel) {
        res.status(404).json({
          success: false,
          message: '小说不存在',
        } as ApiResponse);
        return;
      }

      // 增加浏览量
      await incrementViewCount(username, decodeURIComponent(title));

      res.status(200).json({
        success: true,
        message: '获取小说详情成功',
        data: novel,
      } as ApiResponse<Novel>);
    } catch (error) {
      console.error('获取小说详情失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
      } as ApiResponse);
    }
  }
);

/**
 * 更新小说信息
 * PUT /api/novels/:username/:title
 */
router.put(
  '/:username/:title',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username: rawUsername, title: rawTitle } = req.params;
      const { description: rawDescription, tags, status } = req.body;
      
      const username = sanitizePath(rawUsername);
      const title = sanitizePath(rawTitle);
      const description = sanitizeText(rawDescription);

      // 验证权限
      if (req.user!.username !== username) {
        res.status(403).json({
          success: false,
          message: '无权限修改此小说',
        } as ApiResponse);
        return;
      }

      const updatedNovel = await updateNovel(username, decodeURIComponent(title), {
        description,
        tags,
        status,
      });

      if (!updatedNovel) {
        res.status(404).json({
          success: false,
          message: '小说不存在',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: '小说更新成功',
        data: updatedNovel,
      } as ApiResponse<Novel>);
    } catch (error) {
      console.error('更新小说失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
      } as ApiResponse);
    }
  }
);

/**
 * 删除小说
 * DELETE /api/novels/:username/:title
 */
router.delete(
  '/:username/:title',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username: rawUsername, title: rawTitle } = req.params;
      const username = sanitizePath(rawUsername);
      const title = sanitizePath(rawTitle);

      // 验证权限
      if (req.user!.username !== username) {
        res.status(403).json({
          success: false,
          message: '无权限删除此小说',
        } as ApiResponse);
        return;
      }

      const success = await deleteNovel(username, decodeURIComponent(title));

      if (!success) {
        res.status(404).json({
          success: false,
          message: '小说不存在',
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: '小说删除成功',
      } as ApiResponse);
    } catch (error) {
      console.error('删除小说失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
      } as ApiResponse);
    }
  }
);

/**
 * 添加章节
 * POST /api/novels/:username/:title/chapters
 */
router.post(
  '/:username/:title/chapters',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username: rawUsername, title: rawTitle } = req.params;
      const { title: rawChapterTitle, content: rawContent } = req.body;
      
      const username = sanitizePath(rawUsername);
      const title = sanitizePath(rawTitle);
      
      // 清理输入
      const chapterTitle = sanitizeText(rawChapterTitle);
      const content = sanitize(rawContent);

      // 验证权限
      if (req.user!.username !== username) {
        res.status(403).json({
          success: false,
          message: '无权限为此小说添加章节',
        } as ApiResponse);
        return;
      }

      // 验证输入
      if (!chapterTitle || !content) {
        res.status(400).json({
          success: false,
          message: '章节标题和内容都是必填项',
        } as ApiResponse);
        return;
      }

      if (chapterTitle.length < 1 || chapterTitle.length > 100) {
        res.status(400).json({
          success: false,
          message: '章节标题长度必须在1-100个字符之间',
        } as ApiResponse);
        return;
      }

      if (content.length < 10) {
        res.status(400).json({
          success: false,
          message: '章节内容至少需要10个字符',
        } as ApiResponse);
        return;
      }

      const chapter = await addChapter(username, decodeURIComponent(title), {
        title: chapterTitle,
        content,
      });

      res.status(201).json({
        success: true,
        message: '章节添加成功',
        data: chapter,
      } as ApiResponse<Chapter>);
    } catch (error) {
      console.error('添加章节失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '服务器内部错误',
      } as ApiResponse);
    }
  }
);

/**
 * 上传小说封面
 * POST /api/novels/:username/:title/cover
 */
router.post(
  '/:username/:title/cover',
  authenticateToken,
  upload.single('cover'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username: rawUsername, title: rawTitle } = req.params;
      const username = sanitizePath(rawUsername);
      const title = sanitizePath(rawTitle);

      // 验证权限
      if (req.user!.username !== username) {
        res.status(403).json({
          success: false,
          message: '无权限上传此小说封面',
        } as ApiResponse);
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件',
        } as ApiResponse);
        return;
      }

      const coverUrl = await saveCoverImage(username, decodeURIComponent(title), req.file.buffer);

      res.status(200).json({
        success: true,
        message: '封面上传成功',
        data: { coverUrl },
      } as ApiResponse<{ coverUrl: string }>);
    } catch (error) {
      console.error('上传封面失败:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '服务器内部错误',
      } as ApiResponse);
    }
  }
);

/**
 * 获取小说封面
 * GET /api/novels/:username/:title/cover
 */
router.get('/:username/:title/cover', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username: rawUsername, title: rawTitle } = req.params;
    const username = sanitizePath(rawUsername);
    const title = sanitizePath(rawTitle);
    const imageBuffer = await getCoverImage(username, decodeURIComponent(title));

    if (!imageBuffer) {
      res.status(404).json({
        success: false,
        message: '封面图片不存在',
      } as ApiResponse);
      return;
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存1天
    res.send(imageBuffer);
  } catch (error) {
    console.error('获取封面失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    } as ApiResponse);
  }
});

export default router;
