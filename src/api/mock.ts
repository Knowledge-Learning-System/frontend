// Mock 数据服务
import type { LoginParams, LoginResult, RegisterParams, UserInfo } from '@/types/user'

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    studentId: '2024001',
    username: '张三',
    password: '123456',
    email: 'zhangsan@example.com',
    currentCourseId: 1,
  },
  {
    id: 2,
    studentId: '2024002',
    username: '李四',
    password: '123456',
    email: 'lisi@example.com',
    currentCourseId: 1,
  },
]

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 登录接口
export const mockLogin = async (params: LoginParams): Promise<LoginResult> => {
  await delay(500)
  
  const user = mockUsers.find(
    u => u.studentId === params.studentId && u.password === params.password
  )
  
  if (!user) {
    throw new Error('学号或密码错误')
  }
  
  return {
    token: `mock-token-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      studentId: user.studentId,
      username: user.username,
      email: user.email,
      currentCourseId: user.currentCourseId,
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
  }
  
  mockUsers.push(newUser)
}

// Mock 获取当前用户信息
export const mockGetCurrentUser = async (): Promise<UserInfo> => {
  await delay(300)
  
  // 返回模拟用户信息
  return {
    id: 1,
    studentId: '2024001',
    username: '张三',
    email: 'zhangsan@example.com',
    currentCourseId: 1,
  }
}