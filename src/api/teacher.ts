import request from './request'
import type { CoursewareResource } from './resource'
import type { Course } from '@/types/course'
import { getMockQuestions, addMockQuestion, updateMockQuestion, deleteMockQuestion } from './mockQuestions'

// ---- Mock 开关 ----
// 后端题目接口未就绪时置为 true，使用内置 mock 数据（内存增删改，刷新后还原）
const USE_MOCK_QUESTIONS = true
const USE_MOCK_TEACHER = false

const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))

// 模拟教师课程数据（教师视角下的"我的授课"）
const MOCK_TEACHER_COURSES: Course[] = [
  {
    id: 1,
    name: '软件工程',
    description: '系统学习软件工程的核心概念、方法论和实践技能',
    instructor: '王教授',
    cover: '',
    status: 1,
  },
  {
    id: 2,
    name: '数据结构与算法',
    description: '掌握常用数据结构和算法设计方法',
    instructor: '李教授',
    cover: '',
    status: 1,
  },
  {
    id: 4,
    name: '数据库原理',
    description: '学习数据库设计、SQL 查询和优化技术',
    instructor: '张教授',
    cover: '',
    status: 1,
  },
]

// 模拟学生数据（教师视角）
const MOCK_STUDENTS: TeacherStudent[] = [
  { id: 1, username: 'zhangsan', role: 'student', nickname: '张三', currentCourseId: 1 },
  { id: 2, username: 'lisi', role: 'student', nickname: '李四', currentCourseId: 1 },
  { id: 3, username: 'wangwu', role: 'student', nickname: '王五', currentCourseId: 2 },
]

// ---- API ----

/** 教师"我的课程"（按 course.teacher_id 归属）— GET /courses/my-teaching */
export const getMyTeachingCourses = () => {
  if (USE_MOCK_TEACHER) {
    return delay(MOCK_TEACHER_COURSES.map(c => ({ ...c })))
  }
  return request.get<Course[], Course[]>('/courses/my-teaching')
}

/** 学生列表 — GET /users/students */
export const getStudents = () => {
  if (USE_MOCK_TEACHER) {
    return delay(MOCK_STUDENTS.map(s => ({ ...s })))
  }
  return request.get<TeacherStudent[], TeacherStudent[]>('/users/students')
}

export interface TeacherStudent {
  id: number
  username: string
  role: string
  avatar?: string
  nickname?: string
  currentCourseId?: number
}

export interface ImportStudentResult {
  totalCount: number
  successCount: number
  failCount: number
  failDetails: string[]
}

export interface TeacherQuestion {
  id: number
  courseId?: number
  knowledgePointId?: string
  type: string
  content: string
  options: string
  answer?: string
  analysis?: string
}

export interface QuestionPayload {
  courseId: number
  knowledgePointId?: string
  type: string
  content: string
  options: string
  answer?: string
  analysis?: string
}

/** Excel 批量导入学生 — POST /users/import */
export const importStudents = (file: File, courseId?: number) => {
  const formData = new FormData()
  formData.append('file', file)
  if (courseId != null) {
    formData.append('courseId', String(courseId))
  }
  return request.post<ImportStudentResult, ImportStudentResult>('/users/import', formData)
}

/** 题目列表 — GET /questions?courseId=&userId= */
export const listQuestions = (courseId: number, userId: number) => {
  if (USE_MOCK_QUESTIONS) {
    return delay(getMockQuestions(courseId))
  }
  return request.get<TeacherQuestion[], TeacherQuestion[]>('/questions', {
    params: { courseId, userId },
  })
}

/** 新增题目 — POST /questions */
export const addQuestion = (data: QuestionPayload) => {
  if (USE_MOCK_QUESTIONS) {
    return delay(addMockQuestion(data))
  }
  return request.post<TeacherQuestion, TeacherQuestion>('/questions', data)
}

/** 编辑题目 — PUT /questions/{id} */
export const updateQuestion = (id: number, data: QuestionPayload) => {
  if (USE_MOCK_QUESTIONS) {
    try {
      return delay(updateMockQuestion(id, data))
    } catch (e: any) {
      return Promise.reject(e)
    }
  }
  return request.put<TeacherQuestion, TeacherQuestion>(`/questions/${id}`, data)
}

/** 删除题目 — DELETE /questions/{id} */
export const deleteQuestion = (id: number) => {
  if (USE_MOCK_QUESTIONS) {
    deleteMockQuestion(id)
    return delay(undefined as void)
  }
  return request.delete<void, void>(`/questions/${id}`)
}

/** 上传学习资料 — POST /resources/upload */
export const uploadResource = (
  file: File,
  courseId?: number,
  knowledgePointId?: string,
  title?: string,
  type: 'video' | 'courseware' = 'courseware',
) => {
  const formData = new FormData()
  formData.append('file', file)
  if (courseId != null) {
    formData.append('courseId', String(courseId))
  }
  if (knowledgePointId) {
    formData.append('knowledgePointId', knowledgePointId)
  }
  if (title) {
    formData.append('title', title)
  }
  formData.append('type', type)
  return request.post<CoursewareResource, CoursewareResource>('/resources/upload', formData)
}
