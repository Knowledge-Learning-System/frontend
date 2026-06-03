import request from './request'
import type { Course, MyCourse } from '@/types/course'

export const getCourses = () => {
  return request.get<Course[], Course[]>('/courses')
}

export const getMyCourses = () => {
  return request.get<MyCourse[], MyCourse[]>('/courses/my')
}

export const enrollCourse = (courseId: number) => {
  return request.post<void, void>('/courses/enroll', { courseId })
}

export const switchCurrentCourse = (courseId: number) => {
  return request.put<void, void>('/courses/current', { courseId })
}
