import request from './request'

export interface TeacherCourseItem {
  id: number
  name: string
  courseCode: string
  source: string
}

export interface TeacherCourseVO {
  teacherId: number
  teacherUsername: string
  teacherName: string
  courses: TeacherCourseItem[]
}

/** 管理员：所有教师及其负责课程（教师-课程分配）— GET /courses/teachers */
export const getTeacherCourses = () => {
  return request.get<TeacherCourseVO[], TeacherCourseVO[]>('/courses/teachers')
}

/** 系统数据概览 — GET /admin/overview */
export interface AdminOverview {
  userTotal: number
  adminCount: number
  teacherCount: number
  studentCount: number
  courseTotal: number
  enrollTotal: number
  videoTotal: number
  coursewareTotal: number
  questionTotal: number
  homeworkTotal: number
  discussionTotal: number
  roleStat: Record<string, number>
}

/** 用户管理行 — GET /admin/users */
export interface AdminUserRow {
  id: number
  username: string
  nickname: string | null
  role: string
  avatar: string | null
  currentCourseId: number | null
  courseCount: number
  createTime: string | null
}

export interface AdminUserPage {
  total: number
  page: number
  size: number
  records: AdminUserRow[]
  roleStat: Record<string, number>
}

/** 课程总览行 — GET /admin/courses */
export interface AdminCourseRow {
  id: number
  name: string
  courseCode: string | null
  source: string | null
  status: number | null
  description: string | null
  teacherId: number | null
  teacherName: string | null
  studentCount: number
  createTime: string | null
}

export const getAdminOverview = () => {
  return request.get<AdminOverview, AdminOverview>('/admin/overview')
}

export const getAdminUsers = (params: { role?: string; keyword?: string; page?: number; size?: number }) => {
  return request.get<AdminUserPage, AdminUserPage>('/admin/users', { params })
}

export const getAdminCourses = () => {
  return request.get<AdminCourseRow[], AdminCourseRow[]>('/admin/courses')
}

export const resetUserPassword = (id: number, password: string) => {
  return request.put<void, void>(`/admin/users/${id}/password`, { password })
}

export const updateUserRole = (id: number, role: string) => {
  return request.put<void, void>(`/admin/users/${id}/role`, { role })
}

/** 知识图谱总览 — GET /admin/graph */
export interface AdminGraphCourse {
  id: number
  name: string
  source: string | null
}

export interface AdminGraphData {
  courses: AdminGraphCourse[]
  courseId: number | null
  courseName: string | null
  source: string | null
  kpCount: number
  subTopicCount: number
  areaCount: number
  prerequisiteCount: number
  levelStat: Record<string, number>
  areas: Array<Record<string, any>>
  subTopics: Array<Record<string, any>>
  knowledgePoints: Array<Record<string, any>>
}

export const getAdminGraph = (courseId?: number) => {
  return request.get<AdminGraphData, AdminGraphData>('/admin/graph', {
    params: courseId ? { courseId } : {}
  })
}

/** 资源管理 — GET /admin/resources */
export interface AdminResourceRow {
  id: number
  type: string
  typeName: string
  title: string
  courseId: number | null
  courseName: string | null
  knowledgePointId: string | null
  fileType: string | null
  duration: number | null
  createTime: string | null
}

export interface AdminResourcePage {
  total: number
  page: number
  size: number
  records: AdminResourceRow[]
  typeStat: Record<string, number>
  courses: Array<{ id: number; name: string }>
}

export const getAdminResources = (params: {
  type?: string
  courseId?: number
  keyword?: string
  page?: number
  size?: number
}) => {
  return request.get<AdminResourcePage, AdminResourcePage>('/admin/resources', { params })
}

/** 学情分析 — GET /admin/analysis */
export interface AdminAnalysisData {
  masteryRecords: number
  learnedRecords: number
  untouchedRecords: number
  masteryAvg: number
  masteryDist: Record<string, number>
  answerTotal: number
  correctTotal: number
  accuracy: number
  studyRecords: number
  studyDays: number
  activeStudents: number
  courseAnalysis: Array<{
    courseId: number
    courseName: string
    masteryRecords: number
    masteryAvg: number
    answerTotal: number
    correctRate: number
  }>
}

export const getAdminAnalysis = () => {
  return request.get<AdminAnalysisData, AdminAnalysisData>('/admin/analysis')
}

/** 系统信息 — GET /admin/system */
export interface AdminSystemData {
  activeProfiles: string
  javaVersion: string
  osName: string
  osArch: string
  cpuCores: number
  heapMaxMb: number
  heapUsedMb: number
  uptimeHours: number
  startTime: string
  serverTime: string
  database: Record<string, any>
  tableRows: Record<string, number>
}

export const getAdminSystem = () => {
  return request.get<AdminSystemData, AdminSystemData>('/admin/system')
}

/** 推荐策略配置 — GET /admin/strategy */
export interface AdminStrategyItem {
  key: string
  name: string
  weight: number
  enabled: boolean
  remark: string | null
  updateTime: string | null
}

export interface AdminStrategyData {
  items: AdminStrategyItem[]
  totalWeight: number
  enabledCount: number
  balanced: boolean
}

export const getAdminStrategy = () => {
  return request.get<AdminStrategyData, AdminStrategyData>('/admin/strategy')
}

export const updateAdminStrategy = (items: Array<{ key: string; weight: number; enabled: boolean }>) => {
  return request.put<void, void>('/admin/strategy', { items })
}
