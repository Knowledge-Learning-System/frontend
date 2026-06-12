import request from './request'

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
  }[]
}

export const getQuestions = (courseId: number, userId: number, knowledgePointId?: string) => {
  return request.get<QuestionItem[], QuestionItem[]>('/questions', {
    params: { courseId, userId, knowledgePointId },
  })
}

export const submitAnswers = (data: SubmitAnswerRequest) => {
  return request.post<SubmitAnswerResult, SubmitAnswerResult>('/questions/submit', data)
}
