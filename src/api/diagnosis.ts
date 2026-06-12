import request from './request'

export interface RadarItem {
  id: string
  name: string
  mastery: number
}

export interface WeakPoint {
  id: string
  name: string
  mastery: number
  totalAttempts: number
  errorCount: number
}

export const getRadar = (userId: number, courseId: number) => {
  return request.get<RadarItem[], RadarItem[]>('/diagnosis/radar', {
    params: { userId, courseId },
  })
}

export const getWeakPoints = (userId: number, courseId: number) => {
  return request.get<WeakPoint[], WeakPoint[]>('/diagnosis/weak-points', {
    params: { userId, courseId },
  })
}
