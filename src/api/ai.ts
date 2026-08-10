import request from './request'

// ---- 类型定义 ----

export interface AiChatRequest {
  courseId: number
  knowledgePointId?: number
  message: string
}

export interface AiChatResponse {
  reply: string
  sources: string[]
}

// ---- API ----

/** 发送消息并获取 AI 回复 — POST /ai/chat */
export function sendMessage(data: AiChatRequest) {
  return request.post<AiChatResponse>('/ai/chat', data)
}

/** 获取问答历史 — GET /ai/history?courseId= */
export function getHistory(courseId: number) {
  return request.get('/ai/history', { params: { courseId } })
}
