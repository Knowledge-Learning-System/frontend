import request from './request'
import { mockLogin, mockRegister, mockGetCurrentUser } from './mock'
import type { LoginParams, LoginResult, RegisterParams, UserInfo } from '@/types/user'

// 使用真实后端接口（不再使用 Mock 假数据，保证课程/用户信息真实）
const USE_MOCK = false

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
