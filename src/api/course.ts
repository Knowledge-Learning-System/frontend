import request from './request'
import { mockGetAllCourses, mockGetMyCourses, mockEnrollCourse, mockSwitchCourse } from './mock-course'
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
