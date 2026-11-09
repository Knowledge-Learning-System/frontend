import request from './request'
import type { SubTopicVO, KnowledgePointTreeNode } from '@/types/knowledgeGraph'
import type { QuestionItem } from './question'

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
  prerequisites: string[]
  masteryLevel: number
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

// 使用 Mock 数据（开发环境）
const USE_MOCK = false

// --- Mock 数据 ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockRadarData: RadarItem[] = [
  { id: 'kp-1-1', name: '软件工程概述', mastery: 72 },
  { id: 'kp-1-2', name: '需求分析', mastery: 65 },
  { id: 'kp-2-1', name: '系统设计', mastery: 48 },
  { id: 'kp-2-2', name: '数据库设计', mastery: 55 },
  { id: 'kp-3-1', name: '编码实践', mastery: 80 },
  { id: 'kp-3-2', name: '单元测试', mastery: 60 },
  { id: 'kp-4-1', name: '集成测试', mastery: 35 },
  { id: 'kp-4-2', name: '项目管理', mastery: 42 },
]

// 按知识领域（章节）聚合的 mock 数据
const mockDomainRadarData: RadarItem[] = [
  { id: 'ch-1', name: '软件工程概述', mastery: 69 },
  { id: 'ch-2', name: '需求与设计', mastery: 52 },
  { id: 'ch-3', name: '编码与测试', mastery: 70 },
  { id: 'ch-4', name: '项目管理', mastery: 39 },
]

// 时间趋势 mock 数据（近 7 天）
const mockTrendData: TrendPoint[] = [
  { date: '2026-11-03', mastery: 48, totalAttempts: 6, correctAttempts: 3, accuracy: 50 },
  { date: '2026-11-04', mastery: 51, totalAttempts: 9, correctAttempts: 5, accuracy: 56 },
  { date: '2026-11-05', mastery: 53, totalAttempts: 4, correctAttempts: 2, accuracy: 50 },
  { date: '2026-11-06', mastery: 57, totalAttempts: 11, correctAttempts: 7, accuracy: 64 },
  { date: '2026-11-07', mastery: 59, totalAttempts: 0, correctAttempts: 0, accuracy: 0 },
  { date: '2026-11-08', mastery: 61, totalAttempts: 8, correctAttempts: 6, accuracy: 75 },
  { date: '2026-11-09', mastery: 62, totalAttempts: 5, correctAttempts: 3, accuracy: 60 },
]

const mockWeakPointsData: WeakPointItem[] = [
  { id: 'kp-4-1', name: '集成测试', mastery: 35, totalAttempts: 12, errorCount: 8 },
  { id: 'kp-4-2', name: '项目管理', mastery: 42, totalAttempts: 8, errorCount: 5 },
  { id: 'kp-2-1', name: '系统设计', mastery: 48, totalAttempts: 10, errorCount: 4 },
]

// --- 智能推荐引擎（基于本地测评历史） ---

interface KpLookupEntry {
  name: string
  description: string
  prerequisites: string[]
  chapterName: string
}

/** 遍历知识图谱，构建 { kpId → info } 映射 */
function buildKpLookup(chapters: SubTopicVO[]): Map<string, KpLookupEntry> {
  const map = new Map<string, KpLookupEntry>()

  function walk(kp: KnowledgePointTreeNode, chapterName: string, parentIds: string[]) {
    const prereqs = [...parentIds]
    map.set(kp.id, {
      name: kp.name,
      description: kp.description || '',
      prerequisites: prereqs,
      chapterName,
    })
    for (const child of kp.children) {
      walk(child, chapterName, [...parentIds, kp.id])
    }
  }

  for (const ch of chapters) {
    for (const kp of ch.knowledgePoints) {
      walk(kp, ch.name, [])
    }
  }
  return map
}

/** 从 localStorage 收集所有测评错题，按知识点聚合 */
function collectWrongStats(): Map<string, { wrongCount: number; totalCount: number }> {
  const stats = new Map<string, { wrongCount: number; totalCount: number }>()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('assessment_history_')) continue
    try {
      const raw = localStorage.getItem(key)
      const records: any[] = raw ? JSON.parse(raw) : []
      for (const rec of records) {
        if (!rec?.questions) continue
        for (const q of rec.questions) {
          const kpId = q?.knowledgePointId
          if (!kpId) continue
          const cur = stats.get(kpId) || { wrongCount: 0, totalCount: 0 }
          cur.totalCount++
          if (!q.userAnswer || q.userAnswer !== q.correctAnswer) {
            cur.wrongCount++
          }
          stats.set(kpId, cur)
        }
      }
    } catch { /* ignore malformed data */ }
  }
  return stats
}

/** 根据错题统计和知识图谱生成推荐列表 */
async function generateSmartRecommendations(): Promise<Recommendation[]> {
  const { MOCK_CHAPTERS } = await import('./knowledgeGraph')
  const kpLookup = buildKpLookup(MOCK_CHAPTERS)
  const wrongStats = collectWrongStats()

  if (wrongStats.size === 0) return []

  // 按错误数降序排列
  const sorted = [...wrongStats.entries()]
    .filter(([, s]) => s.wrongCount > 0)
    .sort((a, b) => b[1].wrongCount - a[1].wrongCount)

  const results: Recommendation[] = []
  const included = new Set<string>()

  for (const [kpId, stats] of sorted) {
    const info = kpLookup.get(kpId)
    if (!info || included.has(kpId)) continue
    const masteryLevel = Math.max(5, Math.round((1 - stats.wrongCount / stats.totalCount) * 100))
    const reasonParts: string[] = []

    // 错题 -> 知识点定位
    if (stats.wrongCount >= 3) {
      reasonParts.push(`${stats.wrongCount}道错题集中在${info.name}`)
    } else if (stats.wrongCount >= 1) {
      reasonParts.push(`${info.name}掌握薄弱`)
    }
    // 跨章节 / 前置知识点
    const unreviewedPrereqs = info.prerequisites
      .filter(pid => wrongStats.has(pid) && (wrongStats.get(pid)?.wrongCount ?? 0) > 0)
      .map(pid => kpLookup.get(pid)?.name || pid)
    if (unreviewedPrereqs.length > 0) {
      reasonParts.push(`前置知识点「${unreviewedPrereqs.join('」「')}」也需复习`)
    } else if (info.prerequisites.length > 0) {
      reasonParts.push(`建议先巩固前置知识`)
    }
    // 跨章节归属
    if (info.chapterName && info.chapterName !== '') {
      reasonParts.push(`属于「${info.chapterName}」章节`)
    }

    results.push({
      id: kpId,
      name: info.name,
      description: info.description || `${info.name}相关知识点`,
      reason: reasonParts.join('；'),
      prerequisites: info.prerequisites,
      masteryLevel,
    })
    included.add(kpId)
  }

  return results
}

const mockRemindersData: Reminder[] = [
  { id: 'kp-4-1', name: '集成测试', errorCount: 8, lastAttemptDaysAgo: 3 },
  { id: 'kp-4-2', name: '项目管理', errorCount: 5, lastAttemptDaysAgo: 5 },
]

// --- API ---
export const getRadar = async (
  userId: number,
  courseId: number,
  dimension: RadarDimension = 'overall',
) => {
  if (USE_MOCK) {
    await delay(300)
    return dimension === 'by_domain' ? mockDomainRadarData : mockRadarData
  }
  return request.get<RadarItem[], RadarItem[]>('/diagnosis/radar', {
    params: { userId, courseId, dimension },
  })
}

/** 掌握度时间趋势：按自然日返回每日答题量与截至当日的累计掌握度 */
export const getMasteryTrend = async (userId: number, courseId: number, days = 30) => {
  if (USE_MOCK) {
    await delay(300)
    return mockTrendData
  }
  return request.get<TrendPoint[], TrendPoint[]>('/diagnosis/trend', {
    params: { userId, courseId, days },
  })
}

export const getWeakPoints = async (userId: number, courseId: number) => {
  if (USE_MOCK) {
    await delay(300)
    return mockWeakPointsData
  }
  return request.get<WeakPointItem[], WeakPointItem[]>('/diagnosis/weak-points', {
    params: { userId, courseId },
  })
}

// ===== 大模型分析建议（诊断页底部卡片） =====
export interface AiAnalysis {
  /** 总体判断 */
  overview: string
  /** 掌握较好的部分 */
  strengths: string[]
  /** 需要重点关注的薄弱环节 */
  weaknesses: string[]
  /** 下一步学习建议 */
  suggestions: string[]
  /** 掌握度变化趋势点评 */
  trend: string
  /** 是否命中服务端缓存 */
  cached: boolean
  /** 生成时间 yyyy-MM-dd HH:mm */
  generatedAt: string
}

/** 大模型分析建议：服务端会缓存 10 分钟，模型响应较慢故放宽超时 */
export const getAiAnalysis = async (userId: number, courseId: number, days = 30) => {
  return request.get<AiAnalysis, AiAnalysis>('/diagnosis/ai-analysis', {
    params: { userId, courseId, days },
    timeout: 60000,
  })
}

export const getRecommendations = async (userId: number, courseId: number, kpId?: string) => {
  if (USE_MOCK) {
    await delay(300)
    return await generateSmartRecommendations()
  }
  return request.get<Recommendation[], Recommendation[]>('/study/recommendations', {
    params: kpId ? { userId, courseId, kpId } : { userId, courseId },
  })
}

export const getStudyPlan = async (userId: number, courseId: number) => {
  if (USE_MOCK) {
    await delay(300)
    const groups: Record<number, LearningPathItem[]> = {}
    return groups
  }
  return request.get<Record<number, LearningPathItem[]>, Record<number, LearningPathItem[]>>(
    '/study/plan',
    { params: { userId, courseId } },
  )
}

// ===== 完整学习计划（基于知识图谱拓扑序） =====
export interface StudyPlanStep {
  order: number
  kpId: string
  name: string
  description: string
  group: number
  mastery: number
  completed: boolean
  prerequisites: string[]
  prerequisiteNames: string[]
}

export interface FullStudyPlan {
  courseId: number
  courseName: string
  totalSteps: number
  completedSteps: number
  completionRate: number
  estimatedDays: number
  steps: StudyPlanStep[]
}

export const getFullStudyPlan = async (courseId: number) => {
  return request.get<FullStudyPlan, FullStudyPlan>('/study/full-plan', {
    params: { courseId },
  })
}

export const completePlanStep = (courseId: number, kpId: string, completed: boolean) => {
  return request.post('/study/plan/complete', { courseId, kpId, completed })
}

export const getReminders = async (userId: number, courseId: number) => {
  return request.get<Reminder[], Reminder[]>('/study/reminders', {
    params: { userId, courseId },
  })
}

export const getActiveDays = async (userId: number) => {
  return request.get<{ activeDays: number }, { activeDays: number }>('/users/active-days', {
    params: { userId },
  })
}

// ===== 薄弱点原因分析（功能2-接通图谱缺陷链溯源） =====
export interface WeaknessChain {
  id: string
  name: string
  mastery: number
  chainNames: string[]
}

export const getWeaknessTrace = async (courseId: number) => {
  return request.get<WeaknessChain[], WeaknessChain[]>('/diagnosis/graph/weakness/trace', {
    params: { courseId },
  })
}

// ===== 学习统计真实链路 & 学习时长（功能3） =====
export interface StudentOverview {
  totalQuestions: number
  accuracy: number
  kpCount: number
  totalStudySeconds: number
  courseProgress: number
  masteryDistribution: { name: string; value: number }[]
  dailyTrend: { label: string; total: number; correct: number }[]
  kpStats: { kpId: string; kpName: string; total: number; correct: number; rate: number }[]
}

export const getStudentOverview = async (userId: number, courseId: number) => {
  return request.get<StudentOverview, StudentOverview>('/statistics/student/overview', {
    params: { userId, courseId },
  })
}

export const recordStudyTime = (durationSeconds: number, knowledgePointId?: string) => {
  return request.post('/study/time', { durationSeconds, knowledgePointId })
}

// ===== 学习计划 CRUD =====
export interface StudyPlanItem {
  id: number
  userId: number
  courseId: number
  courseName: string
  startDate: string
  endDate: string
  dailyHours: number
  dailyTarget: number
  remindTime: string
  createTime: string
}

export interface CreatePlanRequest {
  courseId: number
  startDate: string
  endDate: string
  dailyHours?: number
  dailyTarget?: number
  remindTime?: string
}

export const createPlan = (data: CreatePlanRequest) => {
  return request.post<StudyPlanItem, StudyPlanItem>('/study/plan', data)
}

export const updatePlan = (id: number, data: Partial<CreatePlanRequest>) => {
  return request.put<StudyPlanItem, StudyPlanItem>(`/study/plan/${id}`, data)
}

export const deletePlan = (id: number) => {
  return request.delete(`/study/plan/${id}`)
}

export const getMyPlans = (courseId?: number) => {
  return request.get<StudyPlanItem[], StudyPlanItem[]>('/study/plans', { params: { courseId } })
}

// ===== 学习记录 & 每日测试 =====
export const recordStudy = (courseId: number, knowledgePointId: string) => {
  return request.post('/study/record', { courseId, knowledgePointId })
}

export const getDailyQuiz = (courseId: number) => {
  return request.get<QuestionItem[], QuestionItem[]>('/study/daily-quiz', { params: { courseId } })
}

// ===== 通知 =====
export interface NotificationItem {
  id: number
  userId: number
  content: string
  type: string
  isRead: number
  createTime: string
}

export const getNotifications = () => {
  return request.get<NotificationItem[], NotificationItem[]>('/notifications')
}

export const markNotificationsRead = () => {
  return request.put('/notifications/read')
}
