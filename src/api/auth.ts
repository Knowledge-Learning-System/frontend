import request from './request'
import type { LoginParams, LoginResult, RegisterParams, UserInfo } from '@/types/user'

export const login = (params: LoginParams) => {
  return request.post<LoginResult, LoginResult>('/auth/login', params)
}

export const register = (params: RegisterParams) => {
  return request.post<void, void>('/auth/register', params)
}

export const getCurrentUser = () => {
  return request.get<UserInfo, UserInfo>('/auth/me')
}
