/**
 * 问答模块 API — 基于后端 GraphRAG 服务的调用封装
 *
 * 用户问题
 *   → POST /qa/graphrag（后端：课程定位 → 知识点定位 → 知识子图检索 → 资源召回 → 千问生成）
 *   → { answer, sources, thinking, promptBuilt } : 结构化响应
 *
 * 该问答功能使用「知识图谱 GraphRAG 检索增强」，与侧边栏 /ai/chat 智能伴学对话相互独立。
 */
import request from './request'

// ═══════════════════════════════════════════════════════════════
// 类型定义（对外保持兼容）
// ═══════════════════════════════════════════════════════════════

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** 回答引用来源（后端 GraphRagSourceVO） */
export interface QASource {
  id: string
  name: string
  chapter: string
  /** 该知识点在回答中的角色（命中知识点/前置知识等） */
  relation?: string
  /** 匹配分数 0~100 */
  score?: number
}

/** 问答响应（后端 GraphRagResponseVO） */
export interface QAAnswerResponse {
  answer: string
  sources: QASource[]
  thinking: string
  /** 构建的 Prompt 全文（调试用） */
  promptBuilt: string
}

// ═══════════════════════════════════════════════════════════════
// 对外接口
// ═══════════════════════════════════════════════════════════════

/**
 * 问答主函数 — 调用后端 GraphRAG 服务
 *
 * @param question  用户问题
 * @param history   对话历史（不含当前问题）
 * @param courseId  课程 ID（可选；为空时后端自动识别课程）
 */
export async function askQuestion(
  question: string,
  history: ChatMessage[] = [],
  courseId?: number
): Promise<QAAnswerResponse> {
  const data = await request.post('/qa/graphrag', {
    question,
    history,
    courseId: courseId ?? null,
  })
  return data as QAAnswerResponse
}

// ═══════════════════════════════════════════════════════════════
// 兼容旧接口（带 ChatMessage(id/timestamp) 的格式）
// ═══════════════════════════════════════════════════════════════

export interface LegacyChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/** 兼容包装：将旧格式 history 传给管道 */
export async function askQuestionLegacy(
  question: string,
  history: LegacyChatMessage[]
): Promise<QAAnswerResponse> {
  const simplifiedHistory: ChatMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))
  return askQuestion(question, simplifiedHistory)
}
