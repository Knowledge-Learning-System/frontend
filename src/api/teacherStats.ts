import request from './request'

// ---- 教师端教学洞察（5 项功能）类型与 API ----
// 后端路由：/teacher/courses/{courseId}/...

export interface TeacherCourseStudent {
  studentId: number
  username: string
  nickname: string
  progress: number
  selectedAt: string
}

export interface ClassOverview {
  courseId: number
  courseName: string
  studentCount: number
  avgProgress: number
  excellentCount: number
  goodCount: number
  weakCount: number
  students: TeacherCourseStudent[]
}

export interface DailyTrendItem {
  date: string
  answerCount: number
  accuracy: number
  behaviorCount: number
}

export interface MasteryTrendItem {
  date: string
  avgMastery: number
}

export interface StudentLearningData {
  courseId: number
  studentId: number
  studentName: string
  totalAnswers: number
  correctAnswers: number
  accuracy: number
  behaviorCount: number
  masteredKpCount: number
  totalKpCount: number
  avgMastery: number
  dailyTrend: DailyTrendItem[]
  masteryTrend: MasteryTrendItem[]
}

export interface WarningStudent {
  studentId: number
  username: string
  nickname: string
  progress: number
  weakPointCount: number
  reasons: string[]
}

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

export interface StudentDiagnosis {
  courseId: number
  studentId: number
  studentName: string
  overallScore: number
  radar: RadarItem[]
  weakPoints: WeakPointItem[]
  suggestions: string[]
}

/** 功能1：查看选课学生 — GET /teacher/courses/{courseId}/students */
export const getCourseStudents = (courseId: number) => {
  return request.get<TeacherCourseStudent[], TeacherCourseStudent[]>(
    `/teacher/courses/${courseId}/students`,
  )
}

/** 功能2：班级学情统计 — GET /teacher/courses/{courseId}/overview */
export const getClassOverview = (courseId: number) => {
  return request.get<ClassOverview, ClassOverview>(`/teacher/courses/${courseId}/overview`)
}

/** 功能3：学生学习数据 — GET /teacher/courses/{courseId}/students/{studentId}/learning-data */
export const getStudentLearningData = (courseId: number, studentId: number) => {
  return request.get<StudentLearningData, StudentLearningData>(
    `/teacher/courses/${courseId}/students/${studentId}/learning-data`,
  )
}

/** 功能4：预警学生识别 — GET /teacher/courses/{courseId}/warnings */
export const getWarningStudents = (courseId: number) => {
  return request.get<WarningStudent[], WarningStudent[]>(`/teacher/courses/${courseId}/warnings`)
}

/** 功能5：学生诊断报告 — GET /teacher/courses/{courseId}/students/{studentId}/diagnosis */
export const getStudentDiagnosis = (courseId: number, studentId: number) => {
  return request.get<StudentDiagnosis, StudentDiagnosis>(
    `/teacher/courses/${courseId}/students/${studentId}/diagnosis`,
  )
}
