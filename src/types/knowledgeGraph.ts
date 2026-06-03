export interface GraphNode {
  id: string
  name: string
  courseId?: number
  group?: number
}

export interface GraphLink {
  source: string
  target: string
  type: string
}

export interface KnowledgeGraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface KnowledgePointDetail {
  id: string
  name: string
  description: string
  courseId: number
}

export interface LearningPathItem {
  id: string
  name: string
  description: string
  order: number
  prerequisites: string[]
  courseId: number
  group: number
}

export interface KnowledgeNode {
  id: string
  name: string
  group: number
  description?: string
}

export interface KnowledgeLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: KnowledgeNode[]
  links: KnowledgeLink[]
}

export interface RecommendationItem {
  id: string
  name: string
  description: string
  courseId: number
  order: number
  masteryPercent: number
}

export interface QASearchResult {
  id: string
  name: string
  description: string
  relevanceScore: number
}
