export interface UserInfo {
  id: number
  username: string
  role: string
  avatar?: string
  currentCourseId?: number
  studentId?: string
  email?: string
  name?: string
  nickname?: string
  grade?: string
  age?: number
  major?: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  role?: string
  studentId: string
  email: string
  name?: string
  nickname?: string
  grade?: string
  age?: number
  major?: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}
