import request from './request'

// ---- 类型定义 ----

export interface CreateHomeworkRequest {
  courseId: number
  knowledgePointId: number
  title: string
  description: string
  deadline: string
}

export interface HomeworkVO {
  id: number
  courseId: number
  knowledgePointId: number
  title: string
  description: string
  deadline: string
  status: string
  submissionCount: number
  createTime: string
}

export interface HomeworkSubmissionVO {
  id: number
  homeworkId: number
  userId: number
  username: string
  content: string
  attachments: string
  score: number
  feedback: string
  submitTime: string
}

// ---- API ----

/** 创建作业 — POST /homework */
export function createHomework(data: CreateHomeworkRequest) {
  return request.post('/homework', data)
}

/** 发布作业 — PUT /homework/{id}/publish */
export function publishHomework(id: number) {
  return request.put(`/homework/${id}/publish`)
}

/** 作业列表 — GET /homework?courseId= */
export function getHomeworkList(courseId: number) {
  return request.get<HomeworkVO[]>('/homework', { params: { courseId } })
}

/** 作业详情 — GET /homework/{id} */
export function getHomeworkDetail(id: number) {
  return request.get<HomeworkVO>(`/homework/${id}`)
}

/** 提交作业 — POST /homework/{id}/submit */
export function submitHomework(id: number, data: { content: string; attachments?: string }) {
  return request.post(`/homework/${id}/submit`, data)
}

/** 查看提交列表 — GET /homework/{id}/submissions */
export function getSubmissions(homeworkId: number) {
  return request.get<HomeworkSubmissionVO[]>(`/homework/${homeworkId}/submissions`)
}

/** 评分+反馈 — PUT /homework/submission/{id}/grade */
export function gradeSubmission(id: number, score: number, feedback?: string) {
  return request.put(`/homework/submission/${id}/grade`, null, {
    params: { score, feedback },
  })
}
