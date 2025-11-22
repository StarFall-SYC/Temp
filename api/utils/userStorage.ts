import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { User, UserRegistration } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 用户数据存储路径
const USERS_DIR = path.join(__dirname, '../../users');

export function getUserDir(username: string): string {
  return path.join(USERS_DIR, username);
}

function getUserJsonPath(username: string): string {
  return path.join(getUserDir(username), 'user.json');
}

export function getAvatarPath(username: string): string {
  return path.join(getUserDir(username), 'avatar.png'); // 假设头像统一保存为avatar.png
}

// 确保用户目录存在
export async function ensureUsersDirectory(): Promise<void> {
  try {
    await fs.access(USERS_DIR);
  } catch {
    await fs.mkdir(USERS_DIR, { recursive: true });
  }
}

// 读取所有用户
export async function getAllUsers(): Promise<User[]> {
  await ensureUsersDirectory();
  try {
    const entries = await fs.readdir(USERS_DIR, { withFileTypes: true });
    const users: User[] = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const username = entry.name;
        const userJson = getUserJsonPath(username);
        try {
          const data = await fs.readFile(userJson, 'utf-8');
          const user = JSON.parse(data) as User;
          users.push(user);
        } catch {
          // ignore broken user folder
        }
      }
    }
    return users;
  } catch {
    return [];
  }
}

// 根据ID查找用户
export async function getUserById(id: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find((user) => user.id === id) || null;
}

// 根据邮箱查找用户
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find((user) => user.email === email) || null;
}

// 根据用户名查找用户
export async function getUserByUsername(username: string): Promise<User | null> {
  const userJson = getUserJsonPath(username);
  try {
    const data = await fs.readFile(userJson, 'utf-8');
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

// 创建新用户
export async function createUser(
  userData: UserRegistration & { id: string; hashedPassword: string; avatarUrl?: string }
): Promise<User> {
  await ensureUsersDirectory();

  const newUser: User = {
    id: userData.id,
    username: userData.username,
    email: userData.email,
    password: userData.hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    avatarUrl: userData.avatarUrl || undefined,
  };

  // 创建用户专属目录与文件
  const userDir = getUserDir(userData.username);
  const articlesDir = path.join(userDir, 'articles');
  const userJson = getUserJsonPath(userData.username);

  try {
    await fs.mkdir(userDir, { recursive: true });
    await fs.mkdir(articlesDir, { recursive: true });
    await fs.writeFile(userJson, JSON.stringify(newUser, null, 2), 'utf-8');
  } catch (error) {
    console.error('创建用户目录或写入user.json失败:', error);
  }

  return newUser;
}

// 更新用户信息
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const users = await getAllUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return null;

  const updated: User = {
    ...target,
    ...updates,
    updatedAt: new Date().toISOString(),
    avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : target.avatarUrl,
  };

  const userJson = getUserJsonPath(updated.username);
  await fs.writeFile(userJson, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// 删除用户
export async function deleteUser(id: string): Promise<boolean> {
  const users = await getAllUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return false;

  // 删除用户目录
  const userDir = getUserDir(target.username);
  try {
    await fs.rm(userDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}
