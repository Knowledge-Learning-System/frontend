import request from './request'

// 搜索结果接口
export interface SearchResult {
  id: number
  type: 'video' | 'document' | 'link'
  title: string
  description: string
  url: string
  highlight: string
  knowledgePointId?: string
  knowledgePointName?: string
  courseId?: number
  courseName?: string
  timestamp?: number
  createdAt?: string
}

export interface SearchParams {
  keyword: string
  type?: 'video' | 'document' | 'link' | 'all'
  courseId?: number
  page?: number
  pageSize?: number
}

export interface SearchResponse {
  videos: SearchResult[]
  documents: SearchResult[]
  links: SearchResult[]
  total: {
    videos: number
    documents: number
    links: number
  }
}

// 后端 ResourceItem
interface BackendItem {
  id: number
  type: string
  title: string
  courseId: number
  knowledgePointId: string
}

interface BackendResponse {
  list: BackendItem[]
  total: number
  page: number
  pageSize: number
}

// 全文检索
export const search = async (params: SearchParams): Promise<SearchResponse> => {
  const data = await request.get<BackendResponse, BackendResponse>('/resources/search', { params })

  const videos: SearchResult[] = []
  const documents: SearchResult[] = []
  const links: SearchResult[] = []

  for (const item of data.list) {
    const result: SearchResult = {
      id: item.id,
      type: item.type === 'video' ? 'video' : 'document',
      title: item.title,
      description: '',
      url: '',
      highlight: '',
      courseId: item.courseId,
      knowledgePointId: item.knowledgePointId,
    }
    if (item.type === 'video') {
      videos.push(result)
    } else {
      documents.push(result)
    }
  }

  return {
    videos,
    documents,
    links,
    total: {
      videos: videos.length,
      documents: documents.length,
      links: 0,
    },
  }
}