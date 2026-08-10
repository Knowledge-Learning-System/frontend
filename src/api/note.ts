import request from './request'

// 笔记接口
export interface Note {
  id: number
  userId: number
  videoId: number
  knowledgePointId: string
  timestamp: number // 秒
  content: string
  createTime: string
  updateTime: string
}

export interface CreateNoteParams {
  videoId: number
  knowledgePointId: string
  timestamp: number
  content: string
}

export interface UpdateNoteParams {
  id: number
  content: string
  timestamp?: number
}

export interface NoteQueryParams {
  videoId?: number
  knowledgePointId?: string
  page?: number
  pageSize?: number
}

// 创建笔记
export const createNote = (params: CreateNoteParams) => {
  return request.post<Note, Note>('/notes', params)
}

// 更新笔记
export const updateNote = (params: UpdateNoteParams) => {
  return request.put<Note, Note>(`/notes/${params.id}`, params)
}

// 删除笔记
export const deleteNote = (id: number) => {
  return request.delete<void, void>(`/notes/${id}`)
}

// 获取笔记列表
export const getNotes = (params: NoteQueryParams) => {
  return request.get<Note[], Note[]>('/notes', { params })
}

// 获取单个笔记
export const getNote = (id: number) => {
  return request.get<Note, Note>(`/notes/${id}`)
}

// 获取视频的所有笔记
export const getVideoNotes = (videoId: number) => {
  return request.get<Note[], Note[]>('/notes', { params: { videoId } })
}

// 获取知识点的所有笔记
export const getKnowledgePointNotes = (knowledgePointId: string) => {
  return request.get<Note[], Note[]>('/notes', { params: { knowledgePointId } })
}