// Mock 数据服务
import type { LoginParams, LoginResult, RegisterParams, UserInfo } from '@/types/user'

// 模拟用户数据（默认内置两个账号）
const DEFAULT_USERS = [
  {
    id: 1,
    studentId: '2024001',
    username: 'zhangsan',
    password: '123456',
    email: 'zhangsan@example.com',
    currentCourseId: 1,
    name: '张三',
    nickname: '小张',
    grade: '大二',
    age: 20,
    major: '计算机科学与技术',
    role: 'student',
  },
  {
    id: 2,
    studentId: '2024002',
    username: 'lisi',
    password: '123456',
    email: 'lisi@example.com',
    currentCourseId: 1,
    name: '李四',
    nickname: '小李',
    grade: '大三',
    age: 21,
    major: '软件工程',
    role: 'student',
  },
]

// localStorage 持久化 key
const MOCK_USERS_KEY = 'mock_users'

// 从 localStorage 读取已注册用户；首次使用时初始化默认账号
const loadMockUsers = (): typeof DEFAULT_USERS => {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch { /* ignore */ }
  // 初始化
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(DEFAULT_USERS))
  return JSON.parse(JSON.stringify(DEFAULT_USERS))
}

let mockUsers = loadMockUsers()

// 持久化到 localStorage
const persistMockUsers = () => {
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(mockUsers))
  } catch { /* ignore */ }
}

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 登录接口
export const mockLogin = async (params: LoginParams): Promise<LoginResult> => {
  await delay(500)
  
  const user = mockUsers.find(
    u => u.studentId === params.username && u.password === params.password
  )
  
  if (!user) {
    throw new Error('学号或密码错误')
  }
  
  return {
    token: `mock-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      currentCourseId: user.currentCourseId,
      studentId: user.studentId,
      name: user.name,
      nickname: user.nickname,
      grade: user.grade,
      age: user.age,
      major: user.major,
      role: user.role || 'student',
    },
  }
}

// Mock 注册接口
export const mockRegister = async (params: RegisterParams): Promise<void> => {
  await delay(500)
  
  // 检查学号是否已存在
  const existingUser = mockUsers.find(u => u.studentId === params.studentId)
  if (existingUser) {
    throw new Error('该学号已被注册')
  }
  
  // 检查邮箱是否已存在
  const existingEmail = mockUsers.find(u => u.email === params.email)
  if (existingEmail) {
    throw new Error('该邮箱已被注册')
  }
  
// 创建新用户
  const newUser = {
    id: mockUsers.length + 1,
    studentId: params.studentId,
    username: params.username,
    password: params.password,
    email: params.email,
    currentCourseId: 1,
    name: params.name || '',
    nickname: params.nickname || '',
    grade: params.grade || '',
    age: params.age || 0,
    major: params.major || '',
    role: params.role === 'teacher' ? 'teacher' : 'student',
  }

  mockUsers.push(newUser)
  persistMockUsers()
}

// Mock 获取当前用户信息
export const mockGetCurrentUser = async (): Promise<UserInfo> => {
  await delay(300)

  return {
    id: 1,
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    currentCourseId: 1,
    studentId: '2024001',
    role: 'student',
    name: '张三',
    nickname: '小张',
    grade: '大二',
    age: 20,
    major: '计算机科学与技术',
  }
}