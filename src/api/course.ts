import request from './request'
import { mockGetAllCourses, mockGetMyCourses, mockEnrollCourse, mockSwitchCourse, mockUnenrollCourse } from './mock-course'
import type { Course, MyCourse } from '@/types/course'

// 使用 Mock 数据（开发环境）
const USE_MOCK = false

export const getCourses = async () => {
  if (USE_MOCK) {
    const res = await mockGetAllCourses()
    return res.courses
  }
  return request.get<Course[], Course[]>('/courses')
}

export const getMyCourses = async () => {
  if (USE_MOCK) {
    const res = await mockGetMyCourses()
    return res.courses
  }
  return request.get<MyCourse[], MyCourse[]>('/courses/my')
}

export const enrollCourse = (courseId: number) => {
  if (USE_MOCK) {
    return mockEnrollCourse(courseId)
  }
  return request.post<void, void>('/courses/enroll', { courseId })
}

export const switchCurrentCourse = (courseId: number) => {
  if (USE_MOCK) {
    return mockSwitchCourse(courseId)
  }
  return request.put<void, void>('/courses/current', { courseId })
}

export const unenrollCourse = (courseId: number) => {
  if (USE_MOCK) {
    return mockUnenrollCourse(courseId)
  }
  return request.delete<void, void>(`/courses/enroll/${courseId}`)
}

// ---- 教师端课程管理 ----

export interface CoursePayload {
  name: string
  description?: string
  cover?: string
  source?: string
}

/** 添加课程 — POST /courses/add */
export const addCourse = (data: CoursePayload) => {
  return request.post<Course, Course>('/courses/add', data)
}

/** 编辑课程 — PUT /courses/{id} */
export const updateCourse = (id: number, data: CoursePayload) => {
  return request.put<Course, Course>(`/courses/${id}`, data)
}

/** 删除课程（软删除）— DELETE /courses/{id} */
export const deleteCourse = (id: number) => {
  return request.delete<void, void>(`/courses/${id}`)
}
