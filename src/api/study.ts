import request from './request'

export interface RadarItem {
  id: string
  name: string
  mastery: number
}

export interface WeakPointItem {
  id: string
  name: string
  mastery: number
  totalAttempts: number
  errorCount: number
}

export interface Recommendation {
  id: string
  name: string
  description: string
  reason: string
}

export interface LearningPathItem {
  id: string
  name: string
  description: string
  order: number
  prerequisites: string[]
  courseId: string
  group: number
}

export interface Reminder {
  id: string
  name: string
  errorCount: number
  lastAttemptDaysAgo: number
}

export const getRadar = (userId: number, courseId: number) => {
  return request.get<RadarItem[], RadarItem[]>('/diagnosis/radar', {
    params: { userId, courseId },
  })
}

export const getWeakPoints = (userId: number, courseId: number) => {
  return request.get<WeakPointItem[], WeakPointItem[]>('/diagnosis/weak-points', {
    params: { userId, courseId },
  })
}

export const getRecommendations = (userId: number, courseId: number) => {
  return request.get<Recommendation[], Recommendation[]>('/study/recommendations', {
    params: { userId, courseId },
  })
}

export const getStudyPlan = (userId: number, courseId: number) => {
  return request.get<Record<number, LearningPathItem[]>, Record<number, LearningPathItem[]>>(
    '/study/plan',
    { params: { userId, courseId } },
  )
}

export const getReminders = (userId: number, courseId: number) => {
  return request.get<Reminder[], Reminder[]>('/study/reminders', {
    params: { userId, courseId },
  })
}
