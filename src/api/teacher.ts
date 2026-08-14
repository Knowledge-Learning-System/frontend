import request from './request'
import type { CoursewareResource } from './resource'

// ---- 类型定义 ----

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

// ---- API ----

/** 学生列表 — GET /users/students */
export const getStudents = () => {
  return request.get<TeacherStudent[], TeacherStudent[]>('/users/students')
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
  return request.get<TeacherQuestion[], TeacherQuestion[]>('/questions', {
    params: { courseId, userId },
  })
}

/** 新增题目 — POST /questions */
export const addQuestion = (data: QuestionPayload) => {
  return request.post<TeacherQuestion, TeacherQuestion>('/questions', data)
}

/** 编辑题目 — PUT /questions/{id} */
export const updateQuestion = (id: number, data: QuestionPayload) => {
  return request.put<TeacherQuestion, TeacherQuestion>(`/questions/${id}`, data)
}

/** 删除题目 — DELETE /questions/{id} */
export const deleteQuestion = (id: number) => {
  return request.delete<void, void>(`/questions/${id}`)
}

/** 上传学习资料 — POST /resources/upload */
export const uploadResource = (
  file: File,
  courseId?: number,
  knowledgePointId?: string,
  title?: string,
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
  return request.post<CoursewareResource, CoursewareResource>('/resources/upload', formData)
}
