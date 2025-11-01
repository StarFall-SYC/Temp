import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Novel, Chapter, NovelMetadata, ChapterMetadata } from '../../shared/types.js';
import { getUserById } from './userStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础路径
const USERS_DIR = path.join(__dirname, '../../users');

// 生成小说ID
export function generateNovelId(): string {
  return 'novel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 生成章节ID
export function generateChapterId(): string {
  return 'chapter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 获取用户小说目录路径
export function getUserNovelsPath(username: string): string {
  return path.join(USERS_DIR, username, 'articles');
}

// 获取小说目录路径
export function getNovelPath(username: string, novelTitle: string): string {
  return path.join(getUserNovelsPath(username), novelTitle);
}

// 获取小说元数据文件路径
export function getNovelMetadataPath(username: string, novelTitle: string): string {
  return path.join(getNovelPath(username, novelTitle), 'metadata.json');
}

// 获取章节文件路径
export function getChapterPath(
  username: string,
  novelTitle: string,
  chapterNumber: number
): string {
  return path.join(getNovelPath(username, novelTitle), `chapter_${chapterNumber}.json`);
}

// 获取封面文件路径
export function getCoverPath(username: string, novelTitle: string): string {
  return path.join(getNovelPath(username, novelTitle), 'cover.png');
}

// 确保小说目录存在
export async function ensureNovelDirectory(username: string, novelTitle: string): Promise<void> {
  const novelDir = getNovelPath(username, novelTitle);
  try {
    await fs.access(novelDir);
  } catch {
    await fs.mkdir(novelDir, { recursive: true });
  }
}

// 创建新小说
export async function createNovel(
  authorId: string,
  novelData: {
    title: string;
    description: string;
    tags: string[];
    status: 'ongoing' | 'completed' | 'paused';
  }
): Promise<Novel> {
  // 获取作者信息
  const author = await getUserById(authorId);
  if (!author) {
    throw new Error('作者不存在');
  }

  const novelId = generateNovelId();
  const now = new Date();

  const novel: Novel = {
    id: novelId,
    title: novelData.title,
    author: author.username,
    authorId: author.id,
    description: novelData.description,
    tags: novelData.tags,
    status: novelData.status,
    chapters: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    viewCount: 0,
    likeCount: 0,
    views: 0,
    chapterCount: 0,
  };

  // 创建小说目录
  await ensureNovelDirectory(author.username, novelData.title);

  // 创建元数据文件
  const metadata: NovelMetadata = {
    title: novel.title,
    author: novel.author,
    authorId: novel.authorId,
    description: novel.description,
    tags: novel.tags,
    status: novel.status,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
    viewCount: novel.viewCount,
    likeCount: novel.likeCount,
    chapters: [],
  };

  const metadataPath = getNovelMetadataPath(author.username, novelData.title);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  return novel;
}

// 获取小说信息
export async function getNovel(username: string, novelTitle: string): Promise<Novel | null> {
  try {
    const metadataPath = getNovelMetadataPath(username, novelTitle);
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata: NovelMetadata = JSON.parse(metadataContent);

    const novel: Novel = {
      id: `novel_${username}_${novelTitle}`,
      title: metadata.title,
      author: metadata.author,
      authorId: metadata.authorId,
      description: metadata.description,
      tags: metadata.tags,
      status: metadata.status,
      chapters: [],
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      viewCount: metadata.viewCount,
      likeCount: metadata.likeCount,
      views: metadata.viewCount,
      chapterCount: metadata.chapters.length,
    };

    // 加载章节信息
    for (const chapterMeta of metadata.chapters) {
      const chapterPath = getChapterPath(username, novelTitle, chapterMeta.chapterNumber);
      try {
        const chapterContent = await fs.readFile(chapterPath, 'utf-8');
        const chapterData = JSON.parse(chapterContent);

        const chapter: Chapter = {
          id: chapterMeta.id,
          novelId: novel.id,
          title: chapterMeta.title,
          content: chapterData.content,
          chapterNumber: chapterMeta.chapterNumber,
          wordCount: chapterMeta.wordCount,
          createdAt: chapterMeta.createdAt,
          updatedAt: chapterMeta.updatedAt,
        };

        novel.chapters.push(chapter);
      } catch (error) {
        console.error(`加载章节失败: ${chapterPath}`, error);
      }
    }

    return novel;
  } catch (_error) {
    return null;
  }
}

// 获取用户所有小说
export async function getUserNovels(username: string): Promise<Novel[]> {
  try {
    const novelsDir = getUserNovelsPath(username);
    const novelDirs = await fs.readdir(novelsDir, { withFileTypes: true });

    const novels: Novel[] = [];

    for (const dirent of novelDirs) {
      if (dirent.isDirectory()) {
        const novel = await getNovel(username, dirent.name);
        if (novel) {
          novels.push(novel);
        }
      }
    }

    return novels;
  } catch (_error) {
    return [];
  }
}

// 获取所有小说（用于首页展示）
export async function getAllNovels(): Promise<Novel[]> {
  try {
    const userDirs = await fs.readdir(USERS_DIR, { withFileTypes: true });
    const allNovels: Novel[] = [];

    for (const userDir of userDirs) {
      if (userDir.isDirectory() && userDir.name !== 'users.json') {
        const userNovels = await getUserNovels(userDir.name);
        allNovels.push(...userNovels);
      }
    }

    return allNovels;
  } catch (_error) {
    return [];
  }
}

// 添加章节
export async function addChapter(
  username: string,
  novelTitle: string,
  chapterData: {
    title: string;
    content: string;
  }
): Promise<Chapter> {
  const novel = await getNovel(username, novelTitle);
  if (!novel) {
    throw new Error('小说不存在');
  }

  const chapterId = generateChapterId();
  const chapterNumber = novel.chapters.length + 1;
  const now = new Date();
  const wordCount = chapterData.content.length;

  const chapter: Chapter = {
    id: chapterId,
    novelId: novel.id,
    title: chapterData.title,
    content: chapterData.content,
    chapterNumber,
    wordCount,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 保存章节文件
  const chapterPath = getChapterPath(username, novelTitle, chapterNumber);
  await fs.writeFile(
    chapterPath,
    JSON.stringify(
      {
        id: chapterId,
        title: chapterData.title,
        content: chapterData.content,
        chapterNumber,
        wordCount,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      null,
      2
    )
  );

  // 更新元数据
  const metadataPath = getNovelMetadataPath(username, novelTitle);
  const metadataContent = await fs.readFile(metadataPath, 'utf-8');
  const metadata: NovelMetadata = JSON.parse(metadataContent);

  const chapterMeta: ChapterMetadata = {
    id: chapterId,
    title: chapterData.title,
    chapterNumber,
    wordCount,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  metadata.chapters.push(chapterMeta);
  metadata.updatedAt = now.toISOString();

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  return chapter;
}

// 更新小说信息
export async function updateNovel(
  username: string,
  novelTitle: string,
  updates: {
    description?: string;
    tags?: string[];
    status?: 'ongoing' | 'completed' | 'paused';
  }
): Promise<Novel | null> {
  try {
    const metadataPath = getNovelMetadataPath(username, novelTitle);
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata: NovelMetadata = JSON.parse(metadataContent);

    // 更新元数据
    if (updates.description !== undefined) metadata.description = updates.description;
    if (updates.tags !== undefined) metadata.tags = updates.tags;
    if (updates.status !== undefined) metadata.status = updates.status;
    metadata.updatedAt = new Date().toISOString();

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return await getNovel(username, novelTitle);
  } catch (_error) {
    return null;
  }
}

// 删除小说
export async function deleteNovel(username: string, novelTitle: string): Promise<boolean> {
  try {
    const novelPath = getNovelPath(username, novelTitle);
    await fs.rmdir(novelPath, { recursive: true });
    return true;
  } catch (_error) {
    return false;
  }
}

// 增加浏览量
export async function incrementViewCount(username: string, novelTitle: string): Promise<void> {
  try {
    const metadataPath = getNovelMetadataPath(username, novelTitle);
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata: NovelMetadata = JSON.parse(metadataContent);

    metadata.viewCount += 1;
    metadata.updatedAt = new Date().toISOString();

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('增加浏览量失败:', error);
  }
}
