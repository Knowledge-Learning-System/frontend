import request from './request'
import { mockLogin, mockRegister, mockGetCurrentUser } from './mock'
import type { LoginParams, LoginResult, RegisterParams, UserInfo } from '@/types/user'

// 使用 Mock 数据（开发环境）
const USE_MOCK = true

export const login = (params: LoginParams) => {
  if (USE_MOCK) {
    return mockLogin(params)
  }
  return request.post<LoginResult, LoginResult>('/auth/login', {
    username: params.username,
    password: params.password,
  })
}

export const register = (params: RegisterParams) => {
  if (USE_MOCK) {
    return mockRegister(params)
  }
  return request.post<void, void>('/auth/register', params)
}

export const getCurrentUser = () => {
  if (USE_MOCK) {
    return mockGetCurrentUser()
  }
  return request.get<UserInfo, UserInfo>('/auth/me')
}
