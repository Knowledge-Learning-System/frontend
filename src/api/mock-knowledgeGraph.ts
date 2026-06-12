// Mock 知识图谱数据
import type { GraphData, LearningPathItem, RecommendationItem, QASearchResult } from '@/types/knowledgeGraph'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 知识图谱数据
export const mockGetKnowledgeGraph = async (courseId: number): Promise<GraphData> => {
  await delay(500)
  
  return {
    nodes: [
      { id: 'kp-1-1', name: '软件工程概述', group: 0, description: '软件工程的基本概念和发展历程' },
      { id: 'kp-1-2', name: '需求分析', group: 0, description: '需求获取、分析和规格说明' },
      { id: 'kp-2-1', name: '系统设计', group: 1, description: '系统架构设计和模块划分' },
      { id: 'kp-2-2', name: '数据库设计', group: 1, description: 'ER图设计和数据库规范化' },
      { id: 'kp-3-1', name: '编码实践', group: 2, description: '编码规范和代码审查' },
      { id: 'kp-3-2', name: '单元测试', group: 2, description: 'JUnit测试框架使用' },
      { id: 'kp-4-1', name: '集成测试', group: 2, description: '系统集成和测试策略' },
      { id: 'kp-4-2', name: '项目管理', group: 3, description: '项目规划和进度控制' },
    ],
    links: [
      { source: 'kp-1-1', target: 'kp-1-2', type: 'PARENT_KP' },
      { source: 'kp-1-2', target: 'kp-2-1', type: 'PARENT_KP' },
      { source: 'kp-2-1', target: 'kp-2-2', type: 'PARENT_KP' },
      { source: 'kp-2-1', target: 'kp-3-1', type: 'PARENT_KP' },
      { source: 'kp-3-1', target: 'kp-3-2', type: 'PARENT_KP' },
      { source: 'kp-3-2', target: 'kp-4-1', type: 'PARENT_KP' },
      { source: 'kp-4-1', target: 'kp-4-2', type: 'PARENT_KP' },
    ],
  }
}

// Mock 学习路径
export const mockGetLearningPath = async (courseId: number): Promise<LearningPathItem[]> => {
  await delay(400)
  
  return [
    { id: 'kp-1-1', name: '软件工程概述', description: '软件工程的基本概念和发展历程', order: 1, prerequisites: [], courseId, group: 0 },
    { id: 'kp-1-2', name: '需求分析', description: '需求获取、分析和规格说明', order: 2, prerequisites: ['kp-1-1'], courseId, group: 0 },
    { id: 'kp-2-1', name: '系统设计', description: '系统架构设计和模块划分', order: 3, prerequisites: ['kp-1-2'], courseId, group: 1 },
    { id: 'kp-2-2', name: '数据库设计', description: 'ER图设计和数据库规范化', order: 4, prerequisites: ['kp-2-1'], courseId, group: 1 },
    { id: 'kp-3-1', name: '编码实践', description: '编码规范和代码审查', order: 5, prerequisites: ['kp-2-1'], courseId, group: 2 },
    { id: 'kp-3-2', name: '单元测试', description: 'JUnit测试框架使用', order: 6, prerequisites: ['kp-3-1'], courseId, group: 2 },
    { id: 'kp-4-1', name: '集成测试', description: '系统集成和测试策略', order: 7, prerequisites: ['kp-3-2'], courseId, group: 2 },
    { id: 'kp-4-2', name: '项目管理', description: '项目规划和进度控制', order: 8, prerequisites: ['kp-4-1'], courseId, group: 3 },
  ]
}

// Mock 推荐列表
export const mockGetRecommendation = async (courseId: number): Promise<RecommendationItem[]> => {
  await delay(400)
  
  return [
    { id: 'kp-1-2', name: '需求分析', description: '需求获取、分析和规格说明', courseId, order: 2, masteryPercent: 20 },
    { id: 'kp-2-1', name: '系统设计', description: '系统架构设计和模块划分', courseId, order: 3, masteryPercent: 15 },
    { id: 'kp-3-2', name: '单元测试', description: 'JUnit测试框架使用', courseId, order: 6, masteryPercent: 10 },
  ]
}

// Mock 智能问答搜索
export const mockSearchQA = async (query: string): Promise<QASearchResult[]> => {
  await delay(600)
  
  const allResults: QASearchResult[] = [
    { id: 'kp-1-1', name: '软件工程概述', description: '软件工程的基本概念和发展历程', relevanceScore: 0.95 },
    { id: 'kp-1-2', name: '需求分析', description: '需求获取、分析和规格说明', relevanceScore: 0.88 },
    { id: 'kp-2-1', name: '系统设计', description: '系统架构设计和模块划分', relevanceScore: 0.75 },
    { id: 'kp-3-1', name: '编码实践', description: '编码规范和代码审查', relevanceScore: 0.65 },
  ]
  
  // 简单的模糊匹配
  return allResults.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  )
}

// Mock 标记为已掌握
export const mockMarkAsMastered = async (kpId: string): Promise<void> => {
  await delay(300)
  console.log(`知识点 ${kpId} 已标记为已掌握`)
}