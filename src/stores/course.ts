import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Course, MyCourse } from '@/types/course'
import {
  enrollCourse as enrollCourseApi,
  getCourses,
  getMyCourses,
  switchCurrentCourse,
  unenrollCourse as unenrollCourseApi,
} from '@/api/course'
import { useUserStore } from './user'

export const useCourseStore = defineStore('course', () => {
  const allCourses = ref<Course[]>([])
  const myCourses = ref<MyCourse[]>([])

  const fetchAllCourses = async () => {
    allCourses.value = await getCourses()
    return allCourses.value
  }

  const fetchMyCourses = async () => {
    myCourses.value = await getMyCourses()
    return myCourses.value
  }

  const enrollCourse = async (courseId: number) => {
    await enrollCourseApi(courseId)
    await fetchMyCourses()
  }

  const switchCourse = async (courseId: number) => {
    await switchCurrentCourse(courseId)
    const userStore = useUserStore()
    userStore.setCurrentCourseId(courseId)
  }

  const unenrollCourse = async (courseId: number) => {
    await unenrollCourseApi(courseId)
    await fetchMyCourses()
  }

  const getCurrentCourse = () => {
    const userStore = useUserStore()
    const courseId = userStore.currentCourseId
    if (!courseId) return null
    return myCourses.value.find((course) => course.id === courseId) ?? null
  }

  return {
    allCourses,
    myCourses,
    fetchAllCourses,
    fetchMyCourses,
    enrollCourse,
    switchCourse,
    unenrollCourse,
    getCurrentCourse,
  }
})
