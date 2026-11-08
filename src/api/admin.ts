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
