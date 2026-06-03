import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'
import { getCurrentUser, login as loginApi } from '@/api/auth'
import type { LoginParams } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const currentCourseId = computed(() => userInfo.value?.currentCourseId ?? null)

  const setToken = (value: string) => {
    token.value = value
    localStorage.setItem('token', value)
  }

  const clearAuth = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  const fetchUserInfo = async () => {
    if (!token.value) return null
    userInfo.value = await getCurrentUser()
    return userInfo.value
  }

  const login = async (params: LoginParams) => {
    const result = await loginApi(params)
    setToken(result.token)
    userInfo.value = result.user
    return result
  }

  const setCurrentCourseId = (courseId: number) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, currentCourseId: courseId }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    currentCourseId,
    setToken,
    clearAuth,
    fetchUserInfo,
    login,
    setCurrentCourseId,
  }
})
