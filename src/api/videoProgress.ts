import request from './request'

// 视频进度接口
export interface VideoProgress {
  id: number
  userId: number
  videoId: number
  currentTime: number // 秒
  duration: number // 秒
  playbackRate: number // 倍速
  lastWatchedAt: string
  completed: boolean
}

export interface UpdateProgressParams {
  videoId: number
  currentTime: number
  duration: number
  playbackRate: number
  completed?: boolean
  knowledgePointId?: string
  courseId?: number
}

export interface ProgressQueryParams {
  videoId: number
}

// 更新视频进度
export const updateVideoProgress = (params: UpdateProgressParams) => {
  return request.post<VideoProgress, VideoProgress>('/video-progress', params)
}

// 获取视频进度
export const getVideoProgress = (videoId: number) => {
  return request.get<VideoProgress, VideoProgress>(`/video-progress/${videoId}`)
}

// 获取用户所有视频进度
export const getAllVideoProgress = () => {
  return request.get<VideoProgress[], VideoProgress[]>('/video-progress')
}

// 删除视频进度
export const deleteVideoProgress = (videoId: number) => {
  return request.delete<void, void>(`/video-progress/${videoId}`)
}