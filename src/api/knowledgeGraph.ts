import request from './request'
import type { KnowledgeGraphData, KnowledgePointDetail, LearningPathItem, RecommendationItem, QASearchResult } from '@/types/knowledgeGraph'

export const getKnowledgeGraph = (courseId: number) => {
  return request.get<KnowledgeGraphData, KnowledgeGraphData>(`/knowledge-graph/${courseId}`)
}

export const getKnowledgePointDetail = (id: string) => {
  return request.get<KnowledgePointDetail, KnowledgePointDetail>(`/knowledge-point/${id}`)
}

export const getLearningPath = (courseId: number) => {
  return request.get<LearningPathItem[], LearningPathItem[]>(`/courses/${courseId}/learning-path`)
}

export const getPrerequisites = (kpId: string) => {
  return request.get<KnowledgePointDetail[], KnowledgePointDetail[]>(`/knowledge-point/${kpId}/prerequisites`)
}

export const getRecommendation = (courseId: number) => {
  return request.get<RecommendationItem[], RecommendationItem[]>(`/courses/${courseId}/recommendation`)
}

export const searchQA = (query: string) => {
  return request.post<QASearchResult[], QASearchResult[]>('/qa/search', { query })
}

export const markAsMastered = (kpId: string) => {
  return request.post<void, void>(`/knowledge-point/${kpId}/master`)
}
