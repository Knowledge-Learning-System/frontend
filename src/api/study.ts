import request from './request'
import type { SubTopicVO, KnowledgePointTreeNode } from '@/types/knowledgeGraph'
import type { QuestionItem } from './question'

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
export const getRadar = async (userId: number, courseId: number) => {
  if (USE_MOCK) {
    await delay(300)
    return mockRadarData
  }
  return request.get<RadarItem[], RadarItem[]>('/diagnosis/radar', {
    params: { userId, courseId },
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

export const getRecommendations = async (userId: number, courseId: number) => {
  if (USE_MOCK) {
    await delay(300)
    return await generateSmartRecommendations()
  }
  return request.get<Recommendation[], Recommendation[]>('/study/recommendations', {
    params: { userId, courseId },
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
