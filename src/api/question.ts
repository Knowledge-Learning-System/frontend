import request from './request'
import { getMockQuestions } from './mockQuestions'

// ---- Mock 开关 ----
// 后端题目接口未就绪时置为 true，学生端从统一 mock 题库读取
const USE_MOCK = true

export interface QuestionItem {
  id: number
  type: string
  content: string
  options: string
  knowledgePointId: string
}

export interface SubmitAnswerRequest {
  userId: number
  courseId: number
  answers: {
    questionId: number
    knowledgePointId: string
    answer: string
  }[]
}

export interface SubmitAnswerResult {
  totalQuestions: number
  correctCount: number
  items: {
    questionId: number
    isCorrect: boolean
    correctAnswer: string
    analysis: string
    // 以下字段用于历史记录详情展示，API 返回可能没有，由前端在 mock 分支补全
    userAnswer?: string
    content?: string
    options?: string
    type?: string
  }[]
}

export const getQuestions = (courseId: number, userId: number, knowledgePointId?: string) => {
  if (USE_MOCK) {
    const list = getMockQuestions(courseId, knowledgePointId)
    // 转换为 QuestionItem 结构
    const items: QuestionItem[] = list.map((q) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      options: q.options,
      knowledgePointId: q.knowledgePointId || '',
    }))
    return Promise.resolve(items)
  }
  return request.get<QuestionItem[], QuestionItem[]>('/questions', {
    params: { courseId, userId, knowledgePointId },
  })
}

export const submitAnswers = (data: SubmitAnswerRequest) => {
  return request.post<SubmitAnswerResult, SubmitAnswerResult>('/questions/submit', data)
}
