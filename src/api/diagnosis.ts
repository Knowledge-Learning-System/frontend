import request from './request'

export interface RadarItem {
  id: string
  name: string
  mastery: number
}

/** 诊断分析维度：整体掌握度 / 按知识领域（章节） / 按时间趋势 */
export type RadarDimension = 'overall' | 'by_domain' | 'by_time'

/** 掌握度时间趋势上的一个数据点（按自然日） */
export interface TrendPoint {
  date: string
  /** 截至当日的累计掌握度 0-100 */
  mastery: number
  /** 当日答题数 */
  totalAttempts: number
  /** 当日答对数 */
  correctAttempts: number
  /** 当日正确率 0-100 */
  accuracy: number
}

export interface WeakPoint {
  id: string
  name: string
  mastery: number
  totalAttempts: number
  errorCount: number
}

export const getRadar = (
  userId: number,
  courseId: number,
  dimension: RadarDimension = 'overall',
) => {
  return request.get<RadarItem[], RadarItem[]>('/diagnosis/radar', {
    params: { userId, courseId, dimension },
  })
}

/** 掌握度时间趋势：按自然日返回每日答题量与截至当日的累计掌握度 */
export const getMasteryTrend = (userId: number, courseId: number, days = 30) => {
  return request.get<TrendPoint[], TrendPoint[]>('/diagnosis/trend', {
    params: { userId, courseId, days },
  })
}

export const getWeakPoints = (userId: number, courseId: number) => {
  return request.get<WeakPoint[], WeakPoint[]>('/diagnosis/weak-points', {
    params: { userId, courseId },
  })
}
