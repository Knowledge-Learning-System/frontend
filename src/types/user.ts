export interface UserInfo {
  id: number
  username: string
  role: string
  avatar?: string
  currentCourseId?: number
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}
