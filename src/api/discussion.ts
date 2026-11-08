import request from './request'

// ---- 类型定义 ----

export interface DiscussionReply {
  id: number
  discussionId: number
  userId: number
  username: string
  nickname?: string
  role: string
  replyToId?: number
  replyToUsername?: string
  content: string
  createTime?: string
}

export interface Discussion {
  id: number
  courseId?: number
  videoId?: number
  knowledgePointId?: string
  userId: number
  username: string
  nickname?: string
  role: string
  title: string
  content: string
  replyCount: number
  createTime?: string
  replies?: DiscussionReply[]
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface CreateDiscussionParams {
  courseId?: number
  videoId?: number
  knowledgePointId?: string
  title: string
  content: string
}

export interface CreateReplyParams {
  content: string
  replyToId?: number
}

// ---- API ----

/** 发帖 */
export function createDiscussion(data: CreateDiscussionParams) {
  return request.post<Discussion, Discussion>('/discussions', data)
}

/** 讨论列表 */
export function listDiscussions(params: {
  courseId?: number
  videoId?: number
  page?: number
  size?: number
}) {
  return request.get<PageResult<Discussion>, PageResult<Discussion>>('/discussions', { params })
}

/** 讨论详情 */
export function getDiscussion(id: number) {
  return request.get<Discussion, Discussion>(`/discussions/${id}`)
}

/** 删帖 */
export function deleteDiscussion(id: number) {
  return request.delete<null, null>(`/discussions/${id}`)
}

/** 回复 */
export function replyDiscussion(id: number, data: CreateReplyParams) {
  return request.post<DiscussionReply, DiscussionReply>(`/discussions/${id}/reply`, data)
}

/** 删回复 */
export function deleteReply(replyId: number) {
  return request.delete<null, null>(`/discussions/reply/${replyId}`)
}
