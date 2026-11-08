import request from './request'

export interface VideoResource {
  id: number
  courseId: number
  knowledgePointId: string
  title: string
  filePath: string
  duration: string | null
}

export interface CoursewareResource {
  id: number
  courseId: number
  knowledgePointId: string
  title: string
  filePath: string
  fileType: string
}

export const getVideos = (courseId?: number, knowledgePointId?: string) => {
  return request.get<VideoResource[], VideoResource[]>('/resources/videos', {
    params: { courseId, knowledgePointId },
  })
}

export const getCourseware = (courseId?: number, knowledgePointId?: string) => {
  return request.get<CoursewareResource[], CoursewareResource[]>('/resources/courseware', {
    params: { courseId, knowledgePointId },
  })
}

export const trackCoursewareAccess = (params: { knowledgePointId: string; courseId: number }) => {
  return request.post('/resources/courseware/access', params)
}
