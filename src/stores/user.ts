import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'
import { getCurrentUser, login as loginApi } from '@/api/auth'
import type { LoginParams } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')

  const loadUserInfo = (): UserInfo | null => {
    try {
      const raw = localStorage.getItem('userInfo')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const userInfo = ref<UserInfo | null>(loadUserInfo())

  const isLoggedIn = computed(() => !!token.value)
  const currentCourseId = computed(() => userInfo.value?.currentCourseId ?? null)

  const persistUserInfo = () => {
    if (userInfo.value) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  const setToken = (value: string) => {
    token.value = value
    localStorage.setItem('token', value)
  }

  const clearAuth = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const fetchUserInfo = async () => {
    if (!token.value) return null
    userInfo.value = await getCurrentUser()
    persistUserInfo()
    return userInfo.value
  }

  const login = async (params: LoginParams) => {
    const result = await loginApi(params)
    setToken(result.token)
    userInfo.value = result.user
    persistUserInfo()
    return result
  }

  const setCurrentCourseId = (courseId: number) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, currentCourseId: courseId }
      persistUserInfo()
    }
  }

  const persistProfile = () => {
    persistUserInfo()
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
    persistProfile,
  }
})
