// Mock 课程数据
import type { Course, CourseListResponse } from '@/types/course'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟课程数据
const mockAllCourses: Course[] = [
  {
    id: 1,
    name: '软件工程',
    description: '系统学习软件工程的核心概念、方法论和实践技能',
    instructor: '王教授',
    progress: 35,
    cover: '',
  },
  {
    id: 2,
    name: '数据结构与算法',
    description: '掌握常用数据结构和算法设计方法',
    instructor: '李教授',
    progress: 20,
    cover: '',
  },
  {
    id: 3,
    name: '计算机网络',
    description: '理解网络协议、架构和安全技术',
    instructor: '刘教授',
    progress: 0,
    cover: '',
  },
  {
    id: 4,
    name: '数据库原理',
    description: '学习数据库设计、SQL 查询和优化技术',
    instructor: '张教授',
    progress: 0,
    cover: '',
  },
  {
    id: 5,
    name: 'Python科学计算',
    description: '掌握 NumPy、SciPy、Matplotlib 等科学计算工具',
    instructor: '赵教授',
    progress: 0,
    cover: '',
  },
  {
    id: 6,
    name: '开源大数据技术',
    description: '学习 Hadoop、Spark、Flink 等大数据处理框架',
    instructor: '陈教授',
    progress: 0,
    cover: '',
  },
  {
    id: 7,
    name: '机器学习与AI',
    description: '深入理解机器学习算法与人工智能应用',
    instructor: '周教授',
    progress: 0,
    cover: '',
  },
]

const mockMyCourses: Course[] = [
  {
    id: 1,
    name: '软件工程',
    description: '系统学习软件工程的核心概念、方法论和实践技能',
    instructor: '王教授',
    progress: 35,
    cover: '',
  },
]

// Mock 获取所有课程
export const mockGetAllCourses = async (): Promise<CourseListResponse> => {
  await delay(300)
  return {
    courses: mockAllCourses,
    total: mockAllCourses.length,
  }
}

// Mock 获取我的课程
export const mockGetMyCourses = async (): Promise<CourseListResponse> => {
  await delay(300)
  return {
    courses: mockMyCourses,
    total: mockMyCourses.length,
  }
}

// Mock 选课
export const mockEnrollCourse = async (courseId: number): Promise<void> => {
  await delay(500)
  const course = mockAllCourses.find(c => c.id === courseId)
  if (!course) {
    throw new Error('课程不存在')
  }
  
  // 检查是否已选
  if (mockMyCourses.some(c => c.id === courseId)) {
    throw new Error('已选过该课程')
  }
  
  mockMyCourses.push({ ...course, progress: 0 })
}

// Mock 切换课程
export const mockSwitchCourse = async (courseId: number): Promise<void> => {
  await delay(300)
  const course = mockMyCourses.find(c => c.id === courseId)
  if (!course) {
    throw new Error('未选择该课程')
  }
}